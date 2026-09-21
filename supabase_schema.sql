-- ==========================================================
-- SCRIPT DE ATUALIZAÇÃO / CRIAÇÃO DO BANCO NO SUPABASE
-- Pode rodar no SQL Editor do painel do Supabase.
-- É 100% seguro (usa IF NOT EXISTS e não apaga nada existente).
-- ==========================================================

-- 1. TABELA PRINCIPAL DE TAREFAS (tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    emoji TEXT DEFAULT '📝',
    description TEXT DEFAULT '',
    time TEXT DEFAULT '',
    period TEXT DEFAULT 'Manhã',
    category TEXT,
    color TEXT,
    date TEXT,
    status TEXT DEFAULT 'pending',
    completed BOOLEAN DEFAULT FALSE,
    completed_at TEXT,
    started_at TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_days JSONB DEFAULT '[]'::jsonb,
    completed_dates JSONB DEFAULT '[]'::jsonb,
    subtasks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garante colunas caso a tabela já existisse com estrutura antiga
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurring_days JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_dates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS period TEXT DEFAULT 'Manhã';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS started_at TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at TEXT;

-- Habilita RLS para tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can manage their own tasks') THEN
        CREATE POLICY "Users can manage their own tasks" ON public.tasks
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;


-- 2. TABELA DE HISTÓRICO ISOLADO POR DIA (task_history)
-- Permite que conclusões, anotações e horários de tarefas recorrentes
-- e da Google Agenda fiquem sincronizados entre dispositivos e isolados por data
CREATE TABLE IF NOT EXISTS public.task_history (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    observation TEXT DEFAULT '',
    completed_at TEXT,
    started_at TEXT,
    subtasks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilita RLS para task_history
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_history' AND policyname = 'Users can manage their own task history') THEN
        CREATE POLICY "Users can manage their own task history" ON public.task_history
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;


-- 3. TABELA DE MODELOS DE TAREFAS (task_templates)
CREATE TABLE IF NOT EXISTS public.task_templates (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    emoji TEXT DEFAULT '📋',
    category TEXT,
    color TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_days JSONB DEFAULT '[]'::jsonb,
    description TEXT DEFAULT '',
    subtasks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS recurring_days JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.task_templates ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_templates' AND policyname = 'Users can manage their own templates') THEN
        CREATE POLICY "Users can manage their own templates" ON public.task_templates
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;


-- 4. TABELA DE NOTAS (notes)
CREATE TABLE IF NOT EXISTS public.notes (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT '',
    content TEXT DEFAULT '',
    category TEXT,
    color TEXT DEFAULT '#fff9c4',
    date TEXT DEFAULT '',
    type TEXT DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can manage their own notes') THEN
        CREATE POLICY "Users can manage their own notes" ON public.notes
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;


-- 5. TABELA DE PLACAR DE FOCO (focus_score)
CREATE TABLE IF NOT EXISTS public.focus_score (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT focus_score_user_date_key UNIQUE (user_id, date)
);

ALTER TABLE public.focus_score ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'focus_score' AND policyname = 'Users can manage their own focus score') THEN
        CREATE POLICY "Users can manage their own focus score" ON public.focus_score
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
