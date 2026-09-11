import React, { useState, useEffect, useRef } from 'react';
import { 
  DotsThreeVertical, 
  Trash, 
  XCircle, 
  PlayCircle, 
  PauseCircle, 
  CalendarPlus, 
  ArrowSquareOut,
  Clock,
  ChatText
} from '@phosphor-icons/react';

import { POMODORO_CONFIG } from '../../../DailyPlanner';

import './styles.css';

function TomatoIcon({ size = 16, className = "popover-item-icon" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <path 
        d="M12 2.5V5.5M12 5.5C10 4 7.5 4.2 6.5 5.5C8 6.5 10 6.5 12 5.5ZM12 5.5C14 4 16.5 4.2 17.5 5.5C16 6.5 14 6.5 12 5.5Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M12 21.5C6.5 21.5 2.5 17.5 2.5 13C2.5 8.5 6.5 6 10 6C10.8 6 11.5 6.2 12 6.5C12.5 6.2 13.2 6 14 6C17.5 6 21.5 8.5 21.5 13C21.5 17.5 17.5 21.5 12 21.5Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

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
  onMoveToToday,
  onOpenObservation
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
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleStartPomodoro = (e) => {
    e.stopPropagation();
    onStartTimer(task.id, POMODORO_CONFIG, 'pomodoro');
    setIsMenuOpen(false);
  };

  const handleOpenModal = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    openCustomModal();
  };

  const handleOpenCalendarLink = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (task.htmlLink) {
      window.open(task.htmlLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleMoveToTodayClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onMoveToToday(task.id);
  };

  const handleOpenObservation = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onOpenObservation) {
      onOpenObservation(task);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onRemove(task.id);
  };

  if (isThisTaskActive) {
    return (
      <div className="todo-actions">
        <button 
          className="timer-action-btn" 
          onClick={onPauseResume} 
          title={activeTimer.isRunning ? "Pausar" : "Continuar"}
        >
          {activeTimer.isRunning ? <PauseCircle size={25} weight="fill" /> : <PlayCircle size={25} weight="fill" />}
        </button>
        <button 
          className="timer-action-btn danger" 
          onClick={onCancel} 
          title="Cancelar timer"
        >
          <XCircle size={25} weight="fill" /> 
        </button>
      </div>
    );
  }

  const canStartTimer = !task.isBirthday && !task.completed;

  return (
    <div className={`todo-actions ${isMenuOpen ? 'menu-is-open' : ''}`} ref={menuRef}>
      <button 
        type="button"
        className={`actions-menu-trigger ${isMenuOpen ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(prev => !prev);
        }}
        title="Mais opções da tarefa"
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
      >
        <DotsThreeVertical size={22} weight="bold" />
      </button>

      {isMenuOpen && (
        <div 
          className="shadcn-popover-menu" 
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          {canStartTimer && (
            <>
              <button 
                type="button"
                className="shadcn-popover-item" 
                onClick={handleStartPomodoro}
                disabled={isAnyTimerActive}
                role="menuitem"
              >
                <TomatoIcon size={16} className="popover-item-icon" />
                <span>Iniciar Pomodoro (25m)</span>
              </button>

              <button 
                type="button"
                className="shadcn-popover-item" 
                onClick={handleOpenModal}
                role="menuitem"
              >
                <Clock size={16} weight="bold" className="popover-item-icon" />
                <span>Tempo Personalizado</span>
              </button>
            </>
          )}

          {task.htmlLink && (
            <button 
              type="button"
              className="shadcn-popover-item" 
              onClick={handleOpenCalendarLink}
              role="menuitem"
            >
              <ArrowSquareOut size={16} weight="bold" className="popover-item-icon" />
              <span>Ver no Google Agenda</span>
            </button>
          )}

          {canMoveToToday && (
            <button 
              type="button"
              className="shadcn-popover-item" 
              onClick={handleMoveToTodayClick}
              disabled={isAnyTimerActive}
              role="menuitem"
            >
              <CalendarPlus size={16} weight="bold" className="popover-item-icon" />
              <span>Mover para Hoje</span>
            </button>
          )}

          <button 
            type="button"
            className="shadcn-popover-item" 
            onClick={handleOpenObservation}
            role="menuitem"
          >
            <ChatText size={16} weight="bold" className="popover-item-icon" />
            <span>Observação</span>
          </button>

          <div className="shadcn-popover-separator" />

          <button 
            type="button"
            className="shadcn-popover-item danger" 
            onClick={handleDeleteClick} 
            disabled={isAnyTimerActive} 
            role="menuitem"
          >
            <Trash size={16} weight="bold" className="popover-item-icon" />
            <span>{task.isCalendarEvent ? "Remover compromisso" : "Excluir Tarefa"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default TodoActions;