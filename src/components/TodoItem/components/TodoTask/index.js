import React from 'react';

import './styles.css';

function TodoTask({ task, onOpenDetails }) {
  const displayTitle = task.time && !task.text.includes(task.time) 
    ? `${task.text} - ${task.time}` 
    : task.text;

  return (
    <div className="task-details">
      <p 
        className={`todo-paragraph ${task.completed ? 'paragraph-checked' : ''}`}
        onClick={onOpenDetails}
      >
        {task.emoji && <span className="task-emoji">{task.emoji}</span>}
        <span className="task-text-content">{displayTitle}</span>
      </p>
      {task.completed && (
        <span className="completion-time">
          Finalizado às {task.completedAt 
            ? new Date(task.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
            : (task.time ? task.time.split('-')[0].trim() : '07:00')}
        </span>
      )}
    </div>
  );
}

export default TodoTask;