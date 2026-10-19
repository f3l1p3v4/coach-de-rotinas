-- Executar no SQL Editor do Supabase. Cada tabela só é migrada uma vez.
-- Perfis são independentes das categorias; nenhuma tarefa é apagada.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'profile') THEN
    ALTER TABLE public.tasks ADD COLUMN profile TEXT;
    UPDATE public.tasks
    SET profile = CASE WHEN category IN ('Pessoal', 'Trabalho') THEN category ELSE 'Pessoal' END,
        category = CASE WHEN category IN ('Pessoal', 'Trabalho') THEN NULL ELSE category END;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'task_templates' AND column_name = 'profile') THEN
    ALTER TABLE public.task_templates ADD COLUMN profile TEXT;
    UPDATE public.task_templates
    SET profile = CASE WHEN category IN ('Pessoal', 'Trabalho') THEN category ELSE 'Pessoal' END,
        category = CASE WHEN category IN ('Pessoal', 'Trabalho') THEN NULL ELSE category END;
  END IF;
END $$;
