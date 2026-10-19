# Orientações do projeto

## Contexto e comandos

Focus Task é um planejador em português brasileiro, feito com React 19 e Create React App. A interface usa CSS por componente, Phosphor Icons e Sonner. Supabase é opcional; o app também funciona com armazenamento local.

- `npm start`: desenvolvimento.
- `CI=true npm test -- --watch=false --runInBand`: testes sem modo interativo.
- `npm run build`: compilação de produção.
- `npx eslint src --ext .js`: análise estática.

Não versionar `.env.local`, tokens, `node_modules` ou arquivos gerados em `build`. Consultar `.env.example` para nomes de variáveis, sem imprimir credenciais.

## Onde trabalhar

- `src/App.js`: sessão, tema, modelos e integração dos painéis.
- `src/components/DailyPlanner`: tarefas, filtros, recorrência, histórico diário e cronômetro.
- `src/services/supabaseService.js`: persistência local e remota.
- `src/services/googleCalendarService.js`: OAuth e eventos da Google Agenda.
- `src/constants/categories.js`: categorias e eventos de atualização.
- `src/components/AppIcon`: catálogo de ícones coloridos da interface.
- `supabase_schema.sql`: referência do schema; editar o arquivo não aplica uma migração ao banco.

## Regras do produto

- Usar ícones SVG do catálogo existente, sem emojis decorativos em textos, notificações ou controles. Conteúdo livre escrito pelo usuário não deve ser apagado ou sanitizado para remover emojis.
- Manter suporte aos temas claro/escuro e ao uso mobile. Os períodos ficam em coluna também no desktop.
- O layout é plano, sem brilhos ou sombras.
- Formulários usam destaque branco no dark e preto no light; ícones semânticos e prioridade podem ter cores próprias.
- Novos usuários começam sem modelos, com perfis Pessoal e Trabalho e categorias Música e Casa. Perfis filtram o planejador; categorias classificam as tarefas. Respeitar listas vazias e personalizações existentes.
- Datas de planejamento usam o dia local do usuário. Pendências vencidas passam ao dia atual; tarefas encerradas e recorrentes preservam suas regras.
- Eventos da Agenda exigem gravação remota confirmada antes de mostrar sucesso. Preservar horário, duração e semântica de eventos de dia inteiro.
- Carregar os dados da conta antes de sincronizar. Não misturar dados de usuários nem substituir dados válidos por defaults.

## Skills locais

- [coach-ui](.agents/skills/coach-ui/SKILL.md): interface, ícones, categorias e formulários.
- [coach-task-sync](.agents/skills/coach-task-sync/SKILL.md): datas, recorrência, persistência e Google Agenda.

Leia a skill pertinente à alteração. Valide comportamento afetado com testes quando houver regras de dados, e rode build e ESLint para alterações de código. Para mudanças visuais, confira ambos os temas e larguras mobile/desktop quando houver um navegador disponível. Informe quando a inspeção visual ou a integração real não puderem ser verificadas.
