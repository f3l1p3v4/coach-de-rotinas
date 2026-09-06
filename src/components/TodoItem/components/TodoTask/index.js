import React from 'react';

import './styles.css';

function TodoTask({ task, onOpenDetails }) {
  return (
    <div className="task-details">
      <p 
        className={`todo-paragraph ${task.completed ? 'paragraph-checked' : ''}`}
        onClick={onOpenDetails}
      >
        <span style={{ marginRight: '0.8rem' }}>{task.emoji}</span>
        {task.text}
      </p>
      {task.completed && task.completedAt && (
        <span className="completion-time">
          Finalizado às {new Date(task.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

export default TodoTask;