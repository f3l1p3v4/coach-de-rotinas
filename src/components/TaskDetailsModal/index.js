// src/components/TaskDetailsModal.js
import React from 'react';
import { XCircle, Circle, CheckCircle } from '@phosphor-icons/react';

import './styles.css';

function TaskDetailsModal({ task, onClose }) {
  // Apenas recebe a tarefa e a função de fechar. Sem estados ou formulários.
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content details-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          <XCircle size={28} />
        </button>
        <div className="details-modal-header">
          <h2>{task.emoji} {task.text}</h2>
        </div>
        
        {/* Mostra a descrição apenas se ela existir */}
        {task.description && (
          <div className="details-modal-section">
            <label>Descrição / Notas</label>
            <p className="details-modal-description">{task.description}</p>
          </div>
        )}

        {/* Mostra a lista de sub-tarefas apenas se ela não estiver vazia */}
        {task.subtasks.length > 0 && (
          <div className="details-modal-section">
            <label>Sub-tarefas</label>
            <ul className="subtask-list-view">
              {task.subtasks.map(sub => (
                <li key={sub.id} className={sub.completed ? 'completed' : ''}>
                  {sub.completed 
                    ? <CheckCircle size={20} weight="fill" className="subtask-icon-completed" /> 
                    : <Circle size={20} className="subtask-icon" />
                  }
                  <span>{sub.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskDetailsModal;