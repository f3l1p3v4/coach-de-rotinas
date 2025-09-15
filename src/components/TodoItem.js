import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Clock, Trash, XCircle, PlayCircle, PauseCircle } from '@phosphor-icons/react';
import { POMODORO_CONFIG } from './DailyPlanner';

function TodoItem({ task, onToggle, onRemove, onStartTimer, onPauseResume, onCancel, activeTimer, currentTimeDisplay }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCustomTimeModalOpen, setIsCustomTimeModalOpen] = useState(false);
  
  const [customFocus, setCustomFocus] = useState(50);
  const [customBreak, setCustomBreak] = useState(10);
  const [isCycle, setIsCycle] = useState(true);

  const isThisTaskActive = activeTimer.taskId === task.id;
  const isAnyTimerActive = activeTimer.taskId !== null;
  const checkboxClassName = task.completed ? 'checkbox-checked' : 'checkbox-unchecked';

  const handleStartPomodoro = () => {
    onStartTimer(task.id, POMODORO_CONFIG, 'pomodoro');
    setIsMenuOpen(false);
  };

  const handleOpenCustomModal = () => {
    setIsMenuOpen(false);
    setIsCustomTimeModalOpen(true);
  };

  const handleStartCustom = () => {
    let config;
    if (isCycle) {
      config = { Focus: customFocus, ShortBreak: customBreak, cycles: 100 };
    } else {
      config = { Focus: customFocus };
    }
    onStartTimer(task.id, config, isCycle ? 'customCycle' : 'customSimple');
    setIsCustomTimeModalOpen(false);
  };
  
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
    
  return (
    <li className="todo-item" ref={setNodeRef} style={style}>
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
            <h3>Definir Timer Personalizado</h3>
            <button className="modal-close-button" onClick={() => setIsCustomTimeModalOpen(false)}>
              <XCircle size={24} />
            </button>
            
            <div className="toggle-cycle-container">
              <label>Ciclo com Pausas?</label>
              <label className="switch">
                <input type="checkbox" checked={isCycle} onChange={() => setIsCycle(!isCycle)} />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="custom-time-adjuster">
              <label>Foco (min):</label>
              <div className="adjuster-buttons">
                <button onClick={() => setCustomFocus(m => Math.max(5, m - 5))}>-</button>
                <span>{customFocus}</span>
                <button onClick={() => setCustomFocus(m => m + 5)}>+</button>
              </div>
            </div>

            {isCycle && (
              <div className="custom-time-adjuster">
                <label>Pausa (min):</label>
                <div className="adjuster-buttons">
                  <button onClick={() => setCustomBreak(m => Math.max(5, m - 5))}>-</button>
                  <span>{customBreak}</span>
                  <button onClick={() => setCustomBreak(m => m + 5)}>+</button>
                </div>
              </div>
            )}

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