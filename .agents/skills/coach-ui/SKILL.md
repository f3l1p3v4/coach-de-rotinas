---
name: coach-ui
description: Alterar a interface do Focus Task, incluindo ícones coloridos, categorias, formulários e temas claro e escuro neste repositório.
---

# Interface do Focus Task

Leia o `AGENTS.md` da raiz e os componentes envolvidos. Reutilize `src/components/AppIcon` para decorações e `ICON_OPTIONS` para escolhas de categoria. O catálogo usa Phosphor Icons; acrescente entradas sem importar toda a biblioteca dinamicamente.

- Ícones decorativos ficam ocultos de leitores de tela. Ícones sem texto precisam de um nome acessível no controle ou da propriedade `label`.
- Categorias persistem o nome estável em `icon` e uma cor em `color`. Leia categorias por `getStoredCategories` e grave pelos helpers para emitir `coach-categories-changed`.
- Use `IconSelect` quando as opções precisarem mostrar ícones. Preserve navegação por teclado, nomes acessíveis e indicação da seleção.
- Não colocar SVG dentro de `<option>` de selects nativos: usar texto nas opções e uma prévia ao lado do select.
- Preservar cores de prioridade e identificação; usar variáveis de tema para fundos, textos, bordas e foco. Verificar contraste em ambos os temas.
- Não alterar o conteúdo livre de tarefas, notas ou eventos para retirar símbolos escritos pelo usuário.

Conferir formulários de criação/edição, filtros e estados vazios afetados em mobile e desktop. Rodar ESLint e build; testes adicionais devem verificar comportamento relevante, como persistir o ícone escolhido ou apresentar o fallback de dados antigos.
