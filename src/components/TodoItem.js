// src/components/TodoItem.js
import React, { useState } from 'react';
import { Check, DotsThreeVertical, Trash } from '@phosphor-icons/react';

function TodoItem({ task, onToggle, onRemove, onStartTimer, activeTimerId, currentTimeDisplay }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(10);
  
  const checkboxClassName = task.completed ? 'checkbox-checked' : 'checkbox-unchecked';
  const paragraphClassName = task.completed ? 'paragraph-checked' : '';

  const handleStartTimer = (minutes) => {
    onStartTimer(task.id, minutes);
    setIsMenuOpen(false);
  };
    
  return (
    <li className="todo-item">
      <div className="task-wrapper">
        <label>
          <input readOnly type="checkbox" checked={task.completed} onClick={() => onToggle(task.id)} />
          <span className={`todo-checkbox ${checkboxClassName}`}>
            {task.completed && <Check size={14} weight="bold" />}
          </span>
          {/* Exibindo o emoji aqui! */}
          <p className={`todo-paragraph ${paragraphClassName}`}>
            <span style={{ marginRight: '0.5rem' }}>{task.emoji}</span>
            {task.text}
          </p>
        </label>
      </div>
      
      <span className="timer-display">
        {activeTimerId === task.id ? currentTimeDisplay : '00:00'}
      </span>

      <div className="todo-actions">
        <button className="menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <DotsThreeVertical size={20} />
        </button>
        {isMenuOpen && (
          <div className="popover-menu">
            <button onClick={() => handleStartTimer(25)}>🍅 Pomodoro (25 min)</button>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem' }}>
              <input 
                type="number"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Number(e.target.value))}
                style={{width: '40px', marginRight: '5px', padding: '4px'}}
              />
              <button onClick={() => handleStartTimer(customMinutes)}>⏱️ Personalizado</button>
            </div>
          </div>
        )}
        <button className="delete-button" onClick={() => onRemove(task.id)}>
            <Trash size={20} />
        </button>
      </div>
    </li>
  );
}

export default TodoItem;