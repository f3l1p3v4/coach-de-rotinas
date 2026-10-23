-- Somente para um PostgreSQL local descartável; nunca executar em produção.
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth TO authenticated;
INSERT INTO auth.users VALUES ('00000000-0000-4000-8000-000000000001'), ('00000000-0000-4000-8000-000000000002');
CREATE TABLE public.tasks(id text PRIMARY KEY, user_id uuid, category text);
INSERT INTO public.tasks VALUES ('legacy-task','00000000-0000-4000-8000-000000000001','Trabalho');
CREATE TABLE public.notes(id text PRIMARY KEY, user_id uuid, title text);
INSERT INTO public.notes VALUES ('legacy-note','00000000-0000-4000-8000-000000000001','Nota de teste');
