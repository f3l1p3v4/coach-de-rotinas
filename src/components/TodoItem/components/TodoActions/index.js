import React, { useState, useEffect, useRef } from 'react';
import { Play, Trash, XCircle, PlayCircle, PauseCircle, CalendarPlus, ArrowSquareOut } from '@phosphor-icons/react';

import { POMODORO_CONFIG } from '../../../DailyPlanner';

import './styles.css';

function TodoActions({ 
  task, 
  activeTimer, 
  onStartTimer, 
  onPauseResume, 
  onCancel, 
  onRemove, 
  openCustomModal, 
  selectedDate, 
  todayStr, 
  onMoveToToday 
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  const isThisTaskActive = activeTimer.taskId === task.id;
  const isAnyTimerActive = activeTimer.taskId !== null;

  // Pode mover para hoje se:
  // - A tarefa não está concluída;
  // - Não é aniversário nem evento do Google Calendar;
  // - Não é uma tarefa com recorrência fixa semanal;
  // - A data da tarefa é anterior à data de hoje, OU o dia visualizado é anterior a hoje;
  // - Existe a função onMoveToToday.
  const taskDate = task.date || selectedDate;
  const canMoveToToday = !task.isBirthday &&
                         !task.isCalendarEvent &&
                         !task.completed && 
                         !task.isRecurring && 
                         Boolean(todayStr) && 
                         Boolean(taskDate && taskDate < todayStr) && 
                         Boolean(onMoveToToday);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleStartPomodoro = () => {
    onStartTimer(task.id, POMODORO_CONFIG, 'pomodoro');
    setIsMenuOpen(false);
  };

  const handleOpenModal = () => {
    setIsMenuOpen(false);
    openCustomModal();
  };

  if (isThisTaskActive) {
    return (
      <div className="todo-actions">
        <button className="timer-action-btn" onClick={onPauseResume} title={activeTimer.isRunning ? "Pausar" : "Continuar"}>
          {activeTimer.isRunning ? <PauseCircle size={25} weight="fill" /> : <PlayCircle size={25} weight="fill" />}
        </button>
        <button className="timer-action-btn danger" onClick={onCancel} title="Cancelar timer">
          <XCircle size={25} weight="fill" /> 
        </button>
      </div>
    );
  }

  return (
    <div className={`todo-actions ${isMenuOpen ? 'menu-is-open' : ''}`} ref={menuRef}>
      {!task.isBirthday && !task.completed && (
        <>
          <button 
            className="menu-button start-timer-trigger" 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            disabled={isAnyTimerActive}
            title="Iniciar Tarefa"
          >
            <Play size={18} weight="fill" />
          </button>
          {isMenuOpen && (
            <div className="popover-menu">
              <button className="start-pomodoro-btn" onClick={handleStartPomodoro}>
                <span>🍅</span>
                <span>Iniciar Pomodoro</span>
              </button>
              <button onClick={handleOpenModal}>
                <span>⏱️</span>
                <span>Tempo Personalizado</span>
              </button>
            </div>
          )}
        </>
      )}
      {task.htmlLink && (
        <a 
          href={task.htmlLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="calendar-external-link-btn" 
          title="Ver no Google Agenda"
        >
          <ArrowSquareOut size={16} />
        </a>
      )}
      {canMoveToToday && (
        <button 
          type="button"
          className="move-to-today-btn" 
          onClick={(e) => {
            e.stopPropagation();
            onMoveToToday(task.id);
          }}
          disabled={isAnyTimerActive}
          title="Passar esta tarefa para a data de hoje"
        >
          <CalendarPlus size={15} weight="bold" />
          <span className="move-to-today-label">Hoje</span>
        </button>
      )}
      <button 
        className="delete-button" 
        onClick={() => onRemove(task.id)} 
        disabled={isAnyTimerActive} 
        title={task.isCalendarEvent ? "Remover compromisso da lista do dia" : "Excluir tarefa"}
      >
        <Trash size={18} />
      </button>
    </div>
  );
}

export default TodoActions;