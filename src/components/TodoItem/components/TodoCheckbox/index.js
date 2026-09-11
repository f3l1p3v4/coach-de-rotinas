import React from 'react';
import { Check, X } from '@phosphor-icons/react';

import './styles.css';

function TodoCheckbox({ completed, status, onToggle, isBirthday }) {
  if (isBirthday) {
    return null;
  }

  const isFailed = status === 'failed';
  const isCompleted = status === 'completed' || (Boolean(completed) && !isFailed);

  let checkboxClassName = 'checkbox-unchecked';
  let title = 'Marcar conclusão da tarefa';

  if (isCompleted) {
    checkboxClassName = 'checkbox-checked';
    title = 'Concluída (clique para alterar)';
  } else if (isFailed) {
    checkboxClassName = 'checkbox-failed';
    title = 'Não concluída (clique para alterar)';
  }

  return (
    <div 
      className={`todo-checkbox ${checkboxClassName}`} 
      onClick={onToggle}
      title={title}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(e);
        }
      }}
    >
      {isCompleted && <Check size={14} weight="bold" />}
      {isFailed && <X size={14} weight="bold" />}
    </div>
  );
}

export default TodoCheckbox;