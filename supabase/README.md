# Persistência exclusiva no Supabase

A partir desta versão, o app exige login e lê/grava dados do produto em `public.user_workspaces`, protegido por RLS. A coluna JSONB `data` armazena tarefas, histórico, modelos, anotações, categorias, perfis, preferências, placar de foco e dados da agenda. Os RPCs `open_workspace` e `save_workspace` validam a conta e controlam versões para impedir sobrescritas entre dispositivos. Não há fallback para localStorage.

O SDK do Supabase continua mantendo a sessão de autenticação do usuário no navegador. Dados do produto só permanecem em memória enquanto a página estiver aberta. Tokens do Google não são gravados no documento de dados.

## Atualização do banco

1. No SQL Editor do projeto Supabase, execute `migrations/202610210001_supabase_only.sql`. Não use os arquivos em `tests/` em produção. A migração preserva tabelas antigas e copia dados remotos existentes uma única vez; ela pode ser reaplicada sem restaurar itens excluídos.
2. Publique/execute esta versão do app com `REACT_APP_SUPABASE_URL` e `REACT_APP_SUPABASE_ANON_KEY` configurados. Nunca coloque chave service_role no frontend.
3. Entre na sua conta. O app conclui a carga do Supabase antes de permitir alterações.

As tabelas antigas `tasks`, `notes`, `task_templates`, `task_history` e `focus_score` são preservadas para recuperação, mas deixam de ser a fonte de gravação desta versão. O erro anterior de `focus_score.single()` desaparece porque o placar passa a fazer parte dos dados da conta.

Sem conexão, o app bloqueia novas alterações e oferece tentar novamente ou baixar as alterações pendentes. Em conflitos entre dispositivos, baixe as alterações pendentes, recarregue a versão atual e use a cópia para conferir e refazer as alterações necessárias. Sair/recarregar sem salvar pode descartar alterações que estavam somente em memória.

## Validação local

- `CI=true npm test -- --watch=false --runInBand`
- `npx eslint src --ext .js`
- `npm run build`
- `bash scripts/test-supabase-sql.sh` (usa um PostgreSQL Docker descartável, sem publicar portas; não acessa o banco real)
