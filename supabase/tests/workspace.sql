SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
DO $$
DECLARE result jsonb; rejected boolean;
BEGIN
  result := public.open_workspace(auth.uid());
  IF result->'data'->'daily_tasks'->0->>'id' <> 'legacy-task' THEN RAISE EXCEPTION 'Tarefas antigas não foram preservadas'; END IF;
  IF result->'data'->'coach_anotacoes'->0->>'id' <> 'legacy-note' THEN RAISE EXCEPTION 'Notas antigas não foram preservadas'; END IF;
  IF (SELECT count(*) FROM public.user_workspaces) <> 1 THEN RAISE EXCEPTION 'RLS expõe outra conta'; END IF;
  rejected := false;
  BEGIN
    PERFORM public.open_workspace('00000000-0000-4000-8000-000000000002');
  EXCEPTION WHEN insufficient_privilege THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Leitura de outra conta permitida'; END IF;
  result := public.save_workspace(auth.uid(), '{"coach_categories":[],"theme":"dark"}', 0, '10000000-0000-4000-8000-000000000001');
  IF (result->>'version')::int <> 1 THEN RAISE EXCEPTION 'Versão incorreta após escrita'; END IF;
  result := public.save_workspace(auth.uid(), '{"coach_categories":[],"theme":"dark"}', 0, '10000000-0000-4000-8000-000000000001');
  IF (result->>'version')::int <> 1 THEN RAISE EXCEPTION 'Retry duplicou a escrita'; END IF;
  rejected := false;
  BEGIN
    PERFORM public.save_workspace(auth.uid(), '{"theme":"light"}', 0, '10000000-0000-4000-8000-000000000002');
  EXCEPTION WHEN serialization_failure THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Conflito entre dispositivos não detectado'; END IF;
  IF (SELECT data->'coach_categories' FROM public.user_workspaces WHERE user_id = auth.uid()) <> '[]'::jsonb THEN RAISE EXCEPTION 'Lista vazia não preservada'; END IF;
  rejected := false;
  BEGIN
    PERFORM public.save_workspace('00000000-0000-4000-8000-000000000002', '{"theme":"light"}', 0, '10000000-0000-4000-8000-000000000003');
  EXCEPTION WHEN insufficient_privilege THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Escrita em outra conta permitida'; END IF;
  rejected := false;
  BEGIN
    PERFORM public.save_workspace(auth.uid(), '{"access_token":"secret"}', 1, '10000000-0000-4000-8000-000000000004');
  EXCEPTION WHEN invalid_parameter_value THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Chave desconhecida aceita'; END IF;
  rejected := false;
  BEGIN
    UPDATE public.user_workspaces SET data = '{}'::jsonb;
  EXCEPTION WHEN insufficient_privilege THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Escrita direta ignorou controle de versão'; END IF;
END $$;
RESET ROLE;
