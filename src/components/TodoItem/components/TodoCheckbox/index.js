import React from 'react';
import { Check } from '@phosphor-icons/react';

import './styles.css';

function TodoCheckbox({ completed, onToggle, isBirthday }) {
  if (isBirthday) {
    return null;
  }

  const checkboxClassName = completed ? 'checkbox-checked' : 'checkbox-unchecked';

  return (
    <div className={`todo-checkbox ${checkboxClassName}`} onClick={onToggle}>
      {completed && <Check size={14} weight="bold" />}
    </div>
  );
}

export default TodoCheckbox;