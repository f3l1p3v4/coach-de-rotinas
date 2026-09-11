import React from 'react';
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

  const isChecked = !task.isBirthday && (task.status === 'completed' || (task.completed && task.status !== 'failed'));
  const isFailed = !task.isBirthday && task.status === 'failed';
  const hasObservation = Boolean(task.observation && task.observation.trim().length > 0);

  let paragraphStateClass = '';
  if (isChecked) paragraphStateClass = 'paragraph-checked';
  else if (isFailed) paragraphStateClass = 'paragraph-failed';

  return (
    <div className="task-details">
      <div className="task-title-line">
        <p 
          className={`todo-paragraph ${paragraphStateClass}`}
          onClick={onOpenDetails}
        >
          {task.emoji && <span className="task-emoji">{task.emoji}</span>}
          <span className="task-text-content">{task.text}</span>
          {hasObservation && (
            <span 
              className="task-has-observation-badge" 
              title={`Observação: ${task.observation}`}
            >
              💬
            </span>
          )}
        </p>
      </div>
      {executionTimeText && (
        <span className={`task-execution-time ${task.emoji ? 'with-emoji' : ''}`}>
          {executionTimeText}
        </span>
      )}
    </div>
  );
}

export default TodoTask;