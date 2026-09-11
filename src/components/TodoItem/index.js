import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import TodoCheckbox from './components/TodoCheckbox';
import TodoTask from './components/TodoTask';
import TodoActions from './components/TodoActions';
import CustomTimerModal from './components/CustomTimerModal';
import { getDifficultyByColor } from '../../constants/difficulty';
import { getRecurrenceLabel } from '../../constants/recurrence';

import './styles.css';

function isLightColor(hexColor) {
  if (!hexColor) return false;
  let hex = String(hexColor).replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 155;
}

function TodoItem({ 
  task, 
  onToggle, 
  onRemove, 
  onStartTimer, 
  onPauseResume, 
  onCancel, 
  activeTimer, 
  currentTimeDisplay, 
  onOpenDetails,
  selectedDate,
  todayStr,
  onMoveToToday,
  onOpenObservation
}) {
  const [isCustomTimeModalOpen, setIsCustomTimeModalOpen] = useState(false);
  
  const isThisTaskActive = activeTimer.taskId === task.id;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
    
  const handleStartCustom = (config, type) => {
    onStartTimer(task.id, config, type);
    setIsCustomTimeModalOpen(false);
  };

  const isCalendar = task.isCalendarEvent && !task.isBirthday;
  const calendarBg = isCalendar ? (task.calendarColor || task.color || '#0284c7') : null;
  const isLight = isCalendar && isLightColor(calendarBg);

  const diffInfo = getDifficultyByColor(task.color || task.difficulty || '#10b981');
  const accentColor = task.isBirthday 
    ? '#c084fc' 
    : (diffInfo ? diffInfo.color : (task.color || '#10b981'));

  const recurrenceLabel = task.isRecurring ? getRecurrenceLabel(task.recurringDays) : null;
  const showCalendarBadge = task.isCalendarEvent && !task.isBirthday;
  const showTimeBadge = task.isCalendarEvent && !task.isBirthday && Boolean(task.time);
  const showRecurrenceBadge = Boolean(recurrenceLabel);
  const hasFloatingBadges = showCalendarBadge || showTimeBadge || showRecurrenceBadge;

  const itemClassNames = [
    'todo-item',
    hasFloatingBadges ? 'has-floating-badges' : '',
    task.isCalendarEvent ? 'calendar-event-item' : '',
    task.isBirthday ? 'birthday-item' : '',
    isLight ? 'light-calendar-item' : (isCalendar ? 'dark-calendar-item' : '')
  ].filter(Boolean).join(' ');

  const cardStyle = isCalendar ? {
    backgroundColor: calendarBg,
    background: calendarBg,
    backgroundImage: 'none',
    borderColor: isLight ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.3)',
    boxShadow: isLight ? '0 3px 10px rgba(0, 0, 0, 0.12)' : '0 3px 12px rgba(0, 0, 0, 0.35)'
  } : undefined;

  return (
    <>
      <div 
        className="todo-item-container" 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
      >
        <div className={itemClassNames} style={cardStyle}>
          {accentColor && !task.isBirthday && (
            <div 
              className="category-accent-strip" 
              style={{ backgroundColor: accentColor }}
              title={`Prioridade: ${diffInfo?.label || 'Baixa'}${task.category ? ` • Categoria: ${task.category}` : ''}`}
            />
          )}

          {hasFloatingBadges && (
            <div className="task-floating-badges">
              {showCalendarBadge && (
                <span className="calendar-badge-tag">
                  📅 Google Agenda
                </span>
              )}
              {showTimeBadge && (
                <span className="calendar-time-tag">
                  ⏰ {task.time}
                </span>
              )}
              {showRecurrenceBadge && (
                <span className="task-recurrence-badge">
                  {recurrenceLabel}
                </span>
              )}
            </div>
          )}
          <div className="task-wrapper">
            <TodoCheckbox 
              completed={task.completed} 
              status={task.status}
              onToggle={() => onToggle(task.id)} 
              isBirthday={task.isBirthday}
            />
            <TodoTask task={task} onOpenDetails={onOpenDetails} />
          </div>
          
          {isThisTaskActive && (
            <span className="timer-display">
              {currentTimeDisplay}
            </span>
          )}
          
          <TodoActions 
            task={task}
            activeTimer={activeTimer}
            onStartTimer={onStartTimer}
            onPauseResume={onPauseResume}
            onCancel={onCancel}
            onRemove={onRemove}
            openCustomModal={() => setIsCustomTimeModalOpen(true)}
            selectedDate={selectedDate}
            todayStr={todayStr}
            onMoveToToday={onMoveToToday}
            onOpenObservation={onOpenObservation}
          />
        </div>
      </div>

      {isCustomTimeModalOpen && (
        <CustomTimerModal 
          closeModal={() => setIsCustomTimeModalOpen(false)}
          onStartCustom={handleStartCustom}
        />
      )}
    </>
  );
}

export default TodoItem;