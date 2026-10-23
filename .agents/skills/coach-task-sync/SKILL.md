---
name: coach-task-sync
description: Implementar ou corrigir datas, recorrência, histórico diário, persistência exclusiva no Supabase ou Google Agenda no Focus Task.
---

# Datas e sincronização do Focus Task

A conta deve estar hidratada por `CloudGate` antes de montar o planejador. `workspaceStore` é a única porta de persistência do produto: `appData` consulta apenas a visão em memória, nunca o armazenamento do navegador.

Comece pelo fluxo real em `src/components/DailyPlanner/index.js`, pelo serviço pertinente em `src/services` e pelos testes existentes. Consulte `supabase_schema.sql` ao alterar payloads, sem presumir que o banco remoto já recebeu a alteração.

- Identificadores `calendar-` representam eventos externos. `calendarOriginalId` identifica a instância do Google; não editar a série inteira sem um pedido específico.
- Histórico diário usa a chave `${taskId}_${date}` e os estados `pending`, `completed` e `failed`. Verifique o histórico carregado antes de transferir uma pendência vencida.
- Datas `YYYY-MM-DD` do planejador representam o dia local. Evite derivá-las de `toISOString()`; UTC pode trocar o dia. No Google, o fim de um evento de dia inteiro é exclusivo.
- `rollOverPendingTasks` preserva tarefas encerradas e recorrentes. Mantenha essa operação idempotente.
- A carga inicial de uma conta deve terminar antes de gravar nela. Listas vazias são resultados válidos, não sinal para restaurar modelos ou tarefas padrão.
- Gravações no Google devem aguardar a resposta, preservar duração e horário e manter o formulário disponível quando houver erro. Nunca afirmar sincronização remota com base apenas no cache.
- Use os RPCs `open_workspace` e `save_workspace` e preserve o controle de versão, a chave idempotente da requisição e o bloqueio de conflitos entre dispositivos. Não reintroduzir delete/insert de listas ou fallback local.
- Não versionar backups nem conteúdo privado.
- Nas mudanças de categorias, emitir o evento usado pelos componentes e preservar a separação por conta.

Criar testes com respostas remotas simuladas para as regras alteradas. Cobrir falhas e fronteiras de data pertinentes. Rodar a suíte, ESLint e build. Não chamar APIs de escrita em contas reais como parte de testes automáticos.
