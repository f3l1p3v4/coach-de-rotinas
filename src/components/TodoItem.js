import React, { useState } from 'react';
// Importações corretas da @dnd-kit
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, DotsThreeVertical, Trash } from '@phosphor-icons/react';
import TimerControl from './TimerControl';

const POMODORO_CONFIG = { Focus: 25 };

function TodoItem({ task, onToggle, onRemove, onStartTimer, onPauseResume, onCancel, activeTimer, currentTimeDisplay }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(POMODORO_CONFIG.Focus);
  
  const isThisTaskActive = activeTimer.taskId === task.id;
  const isAnyTimerActive = activeTimer.taskId !== null;
  const checkboxClassName = task.completed ? 'checkbox-checked' : 'checkbox-unchecked';

  const handleStart = (minutes) => {
    onStartTimer(task.id, minutes);
    setIsMenuOpen(false);
  };
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
    
  return (
    <li 
      className="todo-item"
      ref={setNodeRef}
      style={style}
    >
      <div className="task-wrapper" {...attributes} {...listeners}>
        <div className={`todo-checkbox ${checkboxClassName}`} onClick={() => onToggle(task.id)}>
          {task.completed && <Check size={14} weight="bold" />}
        </div>
        <p className={`todo-paragraph ${task.completed ? 'paragraph-checked' : ''}`}>
          <span style={{ marginRight: '0.5rem' }}>{task.emoji}</span>
          {task.text}
        </p>
      </div>
      
      {isThisTaskActive ? (
        <TimerControl 
          activeTimer={activeTimer}
          onPauseResume={onPauseResume}
          onCancel={onCancel}
          currentTimeDisplay={currentTimeDisplay}
        />
      ) : (
        <span className="timer-display">--:--</span>
      )}
      
      <div className="todo-actions">
        <button className="menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)} disabled={isAnyTimerActive}>
            <DotsThreeVertical size={20} />
        </button>

        {isMenuOpen && (
          <div className="popover-menu">
            <div className="popover-menu-timer">
              <button className="start-pomodoro-btn" onClick={() => handleStart(POMODORO_CONFIG.Focus)}>
                🍅 Iniciar Pomodoro
              </button>
              <div className="custom-time-adjuster">
                <label>Tempo Foco:</label>
                <div className="adjuster-buttons">
                  <button onClick={() => setCustomMinutes(m => Math.max(1, m - 5))}>-</button>
                  <span>{customMinutes}</span>
                  <button onClick={() => setCustomMinutes(m => m + 5)}>+</button>
                </div>
              </div>
               <button onClick={() => handleStart(customMinutes)}>
                ⏱️ Iniciar Foco Manual
              </button>
            </div>
          </div>
        )}
        
        <button className="delete-button" onClick={() => onRemove(task.id)} disabled={isThisTaskActive}>
            <Trash size={20} />
        </button>
      </div>
    </li>
  );
}

export default TodoItem;