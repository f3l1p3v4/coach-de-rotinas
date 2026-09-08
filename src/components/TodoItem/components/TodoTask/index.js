import React from 'react';
import { getRecurrenceLabel } from '../../../../constants/recurrence';

import './styles.css';

const formatTimeStr = (isoDate) => {
  if (!isoDate) return null;
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return null;
  }
};

function TodoTask({ task, onOpenDetails }) {
  const startTime = formatTimeStr(task.startedAt);
  const endTime = formatTimeStr(task.completedAt);

  let executionTimeText = null;
  if (startTime && endTime) {
    executionTimeText = `Iniciado ${startTime} - Finalizado ${endTime}`;
  } else if (startTime && !task.completed) {
    executionTimeText = `Iniciado ${startTime}`;
  } else if (endTime) {
    executionTimeText = `Finalizado às ${endTime}`;
  }

  const recurrenceLabel = task.isRecurring ? getRecurrenceLabel(task.recurringDays) : null;

  return (
    <div className="task-details">
      <div className="task-title-line">
        <p 
          className={`todo-paragraph ${task.completed ? 'paragraph-checked' : ''}`}
          onClick={onOpenDetails}
        >
          {task.emoji && <span className="task-emoji">{task.emoji}</span>}
          <span className="task-text-content">{task.text}</span>
        </p>
        {recurrenceLabel && (
          <span 
            className="task-recurrence-badge" 
            title={`Recorrência: ${recurrenceLabel}`}
            onClick={onOpenDetails}
          >
            🔁 {recurrenceLabel}
          </span>
        )}
      </div>
      {executionTimeText && (
        <span className="task-execution-time">
          {executionTimeText}
        </span>
      )}
    </div>
  );
}

export default TodoTask;