import React, { useState } from 'react';
import { Clock, Trash, XCircle, PlayCircle, PauseCircle } from '@phosphor-icons/react';

import { POMODORO_CONFIG } from '../../../DailyPlanner';

import './styles.css';

function TodoActions({ task, activeTimer, onStartTimer, onPauseResume, onCancel, onRemove, openCustomModal }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isThisTaskActive = activeTimer.taskId === task.id;
  const isAnyTimerActive = activeTimer.taskId !== null;

  const handleStartPomodoro = () => {
    onStartTimer(task.id, POMODORO_CONFIG, 'pomodoro');
    setIsMenuOpen(false);
  };

  const handleOpenModal = () => {
    setIsMenuOpen(false);
    openCustomModal();
  }

  if (isThisTaskActive) {
    return (
      <div className="todo-actions">
        <button className="timer-action-btn" onClick={onPauseResume}>
          {activeTimer.isRunning ? <PauseCircle size={25} weight="fill" /> : <PlayCircle size={25} weight="fill" />}
        </button>
        <button className="timer-action-btn danger" onClick={onCancel}>
          <XCircle size={25} weight="fill" /> 
        </button>
      </div>
    );
  }

  return (
    <div className="todo-actions">
      <button className="menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)} disabled={isAnyTimerActive}>
        <Clock size={20} />
      </button>
      {isMenuOpen && (
        <div className="popover-menu">
          <button className="start-pomodoro-btn" onClick={handleStartPomodoro}>
            🍅 Iniciar Pomodoro
          </button>
          <button onClick={handleOpenModal}>
            ⏱️ Tempo Personalizado
          </button>
        </div>
      )}
      <button className="delete-button" onClick={() => onRemove(task.id)} disabled={isAnyTimerActive}>
        <Trash size={20} />
      </button>
    </div>
  );
}

export default TodoActions;