import React, { useEffect } from 'react';
import { X, ChatText, CheckCircle, XCircle, PencilSimple } from '@phosphor-icons/react';
import './styles.css';

function TaskObservationModal({ task, onClose, onEditObservation }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!task) return null;

  const hasObservation = Boolean(task.observation && task.observation.trim().length > 0);
  const isCompleted = task.status === 'completed' || (task.completed && task.status !== 'failed');
  const isFailed = task.status === 'failed';

  const handleEditClick = () => {
    onClose();
    if (onEditObservation) {
      onEditObservation(task);
    }
  };

  return (
    <div className="task-observation-modal-overlay" onClick={onClose}>
      <div 
        className="task-observation-modal-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="observation-modal-title"
      >
        <div className="task-observation-modal-header">
          <div className="header-title-wrapper">
            <h3 id="observation-modal-title">Observação da Tarefa</h3>
            <p className="task-reference-title">
              {task.emoji && <span className="task-emoji">{task.emoji}</span>}
              <span className="task-name-text">{task.text}</span>
            </p>
          </div>
          <button 
            type="button" 
            className="observation-modal-close-btn" 
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="task-observation-modal-body">
          {hasObservation ? (
            <div className="observation-content-wrapper">
              <div className="observation-status-badge-row">
                <span className="status-label-caption">Status da Tarefa:</span>
                {isCompleted && (
                  <span className="task-status-badge success">
                    <CheckCircle size={15} weight="fill" />
                    <span>Concluída</span>
                  </span>
                )}
                {isFailed && (
                  <span className="task-status-badge danger">
                    <XCircle size={15} weight="fill" />
                    <span>Não Concluída</span>
                  </span>
                )}
                {!isCompleted && !isFailed && (
                  <span className="task-status-badge pending">
                    <span>Pendente</span>
                  </span>
                )}
              </div>

              <div className="observation-text-card">
                <p className="observation-text">{task.observation}</p>
              </div>
            </div>
          ) : (
            <div className="observation-empty-state">
              <div className="empty-state-icon">
                <ChatText size={38} weight="light" />
              </div>
              <h4 className="empty-state-title">Nenhuma observação</h4>
              <p className="empty-state-desc">
                Nenhuma anotação ou observação foi adicionada a esta tarefa.
              </p>
            </div>
          )}
        </div>

        <div className="task-observation-modal-footer">
          {onEditObservation && (
            <button 
              type="button" 
              className="btn-edit-observation" 
              onClick={handleEditClick}
            >
              <PencilSimple size={16} weight="bold" />
              <span>{hasObservation ? 'Editar Observação' : 'Adicionar Observação'}</span>
            </button>
          )}
          <button 
            type="button" 
            className="btn-close-modal" 
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskObservationModal;
