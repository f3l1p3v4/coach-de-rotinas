import React, { useState } from 'react';
// Importações corretas da @dnd-kit
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Clock, Trash, XCircle, PlayCircle, PauseCircle } from '@phosphor-icons/react';

const POMODORO_CONFIG = { Focus: 25 };

function TodoItem({ task, onToggle, onRemove, onStartTimer, onPauseResume, onCancel, activeTimer, currentTimeDisplay }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCustomTimeModalOpen, setIsCustomTimeModalOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(POMODORO_CONFIG.Focus);
  
  const isThisTaskActive = activeTimer.taskId === task.id;
  const isAnyTimerActive = activeTimer.taskId !== null;
  const checkboxClassName = task.completed ? 'checkbox-checked' : 'checkbox-unchecked';

  const handleStartPomodoro = () => {
    onStartTimer(task.id, POMODORO_CONFIG.Focus, 'pomodoro');
    setIsMenuOpen(false);
  };

  const handleOpenCustomModal = () => {
    setIsMenuOpen(false);
    setIsCustomTimeModalOpen(true);
  };

  const handleStartCustom = () => {
    onStartTimer(task.id, customMinutes, 'custom');
    setIsCustomTimeModalOpen(false);
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
        <div className="task-details">
          <p className={`todo-paragraph ${task.completed ? 'paragraph-checked' : ''}`}>
            <span style={{ marginRight: '0.5rem' }}>{task.emoji}</span>
            {task.text}
          </p>
          {task.completed && task.completedAt && (
            <span className="completion-time">
              Finalizado às {new Date(task.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
      
      <span className="timer-display">
        {isThisTaskActive ? currentTimeDisplay : ''}
      </span>
      
      <div className="todo-actions">
        {isThisTaskActive ? (
          <>
            <button className="timer-action-btn" onClick={onPauseResume}>
              {activeTimer.isRunning ? <PauseCircle size={25} weight="fill" /> : <PlayCircle size={25} weight="fill" />}
            </button>
            <button className="timer-action-btn danger" onClick={onCancel}>
              <XCircle size={25} weight="fill" /> 
            </button>
          </>
        ) : (
          <>
            <button className="menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)} disabled={isAnyTimerActive}>
                <Clock size={20} />
            </button>

            {isMenuOpen && (
              <div className="popover-menu">
                <button className="start-pomodoro-btn" onClick={handleStartPomodoro}>
                  🍅 Iniciar Pomodoro
                </button>
                <button onClick={handleOpenCustomModal}>
                  ⏱️ Tempo Personalizado
                </button>
              </div>
            )}
            
            <button className="delete-button" onClick={() => onRemove(task.id)} disabled={isThisTaskActive}>
                <Trash size={20} />
            </button>
          </>
        )}
      </div>

      {isCustomTimeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Definir Tempo Personalizado</h3>
            <button className="modal-close-button" onClick={() => setIsCustomTimeModalOpen(false)}>
              <XCircle size={24} />
            </button>
            <div className="custom-time-adjuster">
              <label>Minutos:</label>
              <div className="adjuster-buttons">
                <button onClick={() => setCustomMinutes(m => Math.max(5, m - 5))}>-</button>
                <span>{customMinutes}</span>
                <button onClick={() => setCustomMinutes(m => m + 5)}>+</button>
              </div>
            </div>
            <button className="start-custom-btn" onClick={handleStartCustom}>
              Iniciar Timer
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default TodoItem;