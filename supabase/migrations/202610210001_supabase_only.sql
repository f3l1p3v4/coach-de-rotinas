-- Fonte única de dados do Focus Task. Executar uma vez no SQL Editor do Supabase.
-- Não apaga tabelas antigas. Importa dados remotos existentes apenas na primeira criação da conta.
BEGIN;
CREATE TABLE IF NOT EXISTS public.user_workspaces (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object'),
  version bigint NOT NULL DEFAULT 0,
  last_request_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_workspaces ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_workspaces FROM anon, authenticated;
GRANT SELECT ON public.user_workspaces TO authenticated;
DROP POLICY IF EXISTS workspace_owner_read ON public.user_workspaces;
CREATE POLICY workspace_owner_read ON public.user_workspaces FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Preserva os registros que já estavam nas tabelas anteriores, mesmo com colunas opcionais ausentes.
DO $$
DECLARE owner_record record; table_name text; destination text; payload jsonb; rows_data jsonb; item jsonb; history_data jsonb; scores jsonb;
BEGIN
  FOR owner_record IN SELECT id FROM auth.users LOOP
    IF EXISTS (SELECT 1 FROM public.user_workspaces WHERE user_id = owner_record.id) THEN CONTINUE; END IF;
    payload := '{}'::jsonb;
    FOR table_name, destination IN SELECT * FROM (VALUES ('tasks','daily_tasks'),('task_templates','custom_task_templates'),('notes','coach_anotacoes')) AS collections(source_name,target_name) LOOP
      IF to_regclass('public.' || table_name) IS NOT NULL THEN
        EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(r) - ''user_id'' ORDER BY coalesce((to_jsonb(r)->>''order_index'')::int,0), to_jsonb(r)->>''created_at'', to_jsonb(r)->>''id''), ''[]''::jsonb) FROM public.%I r WHERE user_id = $1', table_name) INTO rows_data USING owner_record.id;
        payload := payload || jsonb_build_object(destination, rows_data);
      END IF;
    END LOOP;
    IF to_regclass('public.task_history') IS NOT NULL THEN
      EXECUTE 'SELECT coalesce(jsonb_agg(to_jsonb(r) - ''user_id''), ''[]''::jsonb) FROM public.task_history r WHERE user_id = $1' INTO rows_data USING owner_record.id;
      history_data := '{}'::jsonb;
      FOR item IN SELECT value FROM jsonb_array_elements(rows_data) LOOP
        history_data := history_data || jsonb_build_object(item->>'id', item);
      END LOOP;
      payload := payload || jsonb_build_object('daily_task_history', history_data);
    END IF;
    IF to_regclass('public.focus_score') IS NOT NULL THEN
      EXECUTE 'SELECT coalesce(jsonb_agg(to_jsonb(r)), ''[]''::jsonb) FROM public.focus_score r WHERE user_id = $1' INTO rows_data USING owner_record.id;
      scores := '{}'::jsonb;
      FOR item IN SELECT value FROM jsonb_array_elements(rows_data) LOOP
        IF item->>'date' IS NOT NULL THEN scores := scores || jsonb_build_object(item->>'date', coalesce((item->>'count')::integer,0)); END IF;
      END LOOP;
      payload := payload || jsonb_build_object('focus_scores', scores);
    END IF;
    INSERT INTO public.user_workspaces(user_id,data) VALUES (owner_record.id,payload) ON CONFLICT(user_id) DO NOTHING;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.open_workspace(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE workspace public.user_workspaces;
BEGIN
  IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'Conta não autorizada' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.user_workspaces(user_id) VALUES(p_user_id) ON CONFLICT(user_id) DO NOTHING;
  SELECT * INTO STRICT workspace FROM public.user_workspaces WHERE user_id = p_user_id FOR UPDATE;
  -- Defaults também ficam no banco. A data selecionada é enviada pelo cliente no fuso local.
  UPDATE public.user_workspaces SET data = '{
    "daily_tasks":[],"custom_task_templates":[],"coach_anotacoes":[],"daily_tasks_order":[],
    "coach_categories":[{"id":"musica","name":"Música","color":"#8b5cf6","icon":"music","appliesTo":"both"},{"id":"casa","name":"Casa","color":"#10b981","icon":"house","appliesTo":"both"}],
    "coach_profiles":[{"id":"pessoal","name":"Pessoal","icon":"user","color":"#10b981"},{"id":"trabalho","name":"Trabalho","icon":"briefcase","color":"#3b82f6"}],
    "google_calendar_events":[],"daily_task_history":{},"calendar_completed_map":{},"calendar_status_map":{},
    "calendar_hidden_ids":{},"calendar_priority_map":{},"focus_scores":{},"theme":"light","selected_planner_profile":"Trabalho"
  }'::jsonb || data WHERE user_id = p_user_id RETURNING * INTO workspace;
  RETURN jsonb_build_object('user_id',workspace.user_id,'data',workspace.data,'version',workspace.version);
END $$;

CREATE OR REPLACE FUNCTION public.save_workspace(p_user_id uuid, p_patch jsonb, p_expected_version bigint, p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE workspace public.user_workspaces; field text; value jsonb; expected_type text;
BEGIN
  IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'Conta não autorizada' USING ERRCODE = '42501'; END IF;
  IF p_request_id IS NULL OR p_expected_version IS NULL OR jsonb_typeof(p_patch) IS DISTINCT FROM 'object' OR octet_length(p_patch::text) > 16777216 THEN RAISE EXCEPTION 'Alteração inválida' USING ERRCODE = '22023'; END IF;
  FOR field, value IN SELECT * FROM jsonb_each(p_patch) LOOP
    expected_type := CASE
      WHEN field IN ('daily_tasks','custom_task_templates','coach_anotacoes','coach_categories','coach_profiles','google_calendar_events','daily_tasks_order') THEN 'array'
      WHEN field IN ('daily_task_history','calendar_completed_map','calendar_status_map','calendar_hidden_ids','calendar_priority_map','focus_scores') THEN 'object'
      WHEN field IN ('theme','selected_planner_date','selected_planner_profile') THEN 'string'
      ELSE NULL END;
    IF expected_type IS NULL OR jsonb_typeof(value) IS DISTINCT FROM expected_type THEN RAISE EXCEPTION 'Campo inválido: %',field USING ERRCODE = '22023'; END IF;
  END LOOP;
  SELECT * INTO STRICT workspace FROM public.user_workspaces WHERE user_id = p_user_id FOR UPDATE;
  IF workspace.last_request_id = p_request_id THEN
    RETURN jsonb_build_object('user_id',workspace.user_id,'version',workspace.version);
  END IF;
  IF workspace.version <> p_expected_version THEN RAISE EXCEPTION 'Dados alterados por outra sessão' USING ERRCODE = '40001'; END IF;
  UPDATE public.user_workspaces SET data = data || p_patch, version = version + 1, last_request_id = p_request_id, updated_at = now()
    WHERE user_id = p_user_id RETURNING * INTO workspace;
  RETURN jsonb_build_object('user_id',workspace.user_id,'version',workspace.version);
END $$;
REVOKE ALL ON FUNCTION public.open_workspace(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_workspace(uuid,jsonb,bigint,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_workspace(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_workspace(uuid,jsonb,bigint,uuid) TO authenticated;
COMMIT;
