import React, { useState, useEffect } from 'react';
import { Check, X, ArrowCounterClockwise } from '@phosphor-icons/react';
import './styles.css';

function TaskCompletionModal({ task, onClose, onConfirm, onResetPending }) {
  const initialStatus = task?.status === 'failed' ? 'failed' : 'completed';
  const [status, setStatus] = useState(initialStatus);
  const [observation, setObservation] = useState(task?.observation || '');

  useEffect(() => {
    if (task) {
      setStatus(task.status === 'failed' ? 'failed' : 'completed');
      setObservation(task.observation || '');
    }
  }, [task]);

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

  const isAlreadyMarked = task.status === 'completed' || task.status === 'failed' || Boolean(task.completed);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      status,
      observation: observation.trim()
    });
  };

  const handleReset = (e) => {
    e.preventDefault();
    if (onResetPending) {
      onResetPending();
    }
  };

  return (
    <div className="task-completion-modal-overlay" onClick={onClose}>
      <div 
        className="task-completion-modal-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="completion-modal-title"
      >
        <div className="task-completion-modal-header">
          <div className="header-title-wrapper">
            <h3 id="completion-modal-title">Conclusão da Tarefa</h3>
            <p className="task-reference-title">
              {task.emoji && <span className="task-emoji">{task.emoji}</span>}
              <span className="task-name-text">{task.text}</span>
            </p>
          </div>
          <button 
            type="button" 
            className="completion-modal-close-btn" 
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-completion-modal-body">
          <div className="status-selector-group">
            <label className="section-label">Como foi o andamento?</label>
            
            <div className="status-options-grid">
              <button
                type="button"
                className={`status-option-card success ${status === 'completed' ? 'selected' : ''}`}
                onClick={() => setStatus('completed')}
              >
                <div className="status-option-icon-wrap success">
                  <Check size={24} weight="bold" />
                </div>
                <div className="status-option-text">
                  <span className="status-option-title">Finalizada</span>
                  <span className="status-option-desc">Concluída com sucesso</span>
                </div>
              </button>

              <button
                type="button"
                className={`status-option-card danger ${status === 'failed' ? 'selected' : ''}`}
                onClick={() => setStatus('failed')}
              >
                <div className="status-option-icon-wrap danger">
                  <X size={24} weight="bold" />
                </div>
                <div className="status-option-text">
                  <span className="status-option-title">Não Concluída</span>
                  <span className="status-option-desc">Não deu para finalizar</span>
                </div>
              </button>
            </div>
          </div>

          <div className="observation-input-group">
            <label htmlFor="task-observation-field" className="section-label">
              Observação <span className="optional-tag">(opcional)</span>
            </label>
            <textarea
              id="task-observation-field"
              className="task-observation-textarea"
              placeholder="Escreva uma observação (ex: motivo de não ter concluído, detalhes da entrega, etc.)..."
              rows={3}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
            />
          </div>

          <div className="task-completion-modal-footer">
            <div className="footer-left-actions">
              {isAlreadyMarked && onResetPending && (
                <button
                  type="button"
                  className="btn-reset-pending"
                  onClick={handleReset}
                  title="Voltar tarefa para o estado pendente"
                >
                  <ArrowCounterClockwise size={16} weight="bold" />
                  <span>Voltar para Pendente</span>
                </button>
              )}
            </div>

            <div className="footer-right-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`btn-confirm ${status === 'completed' ? 'confirm-success' : 'confirm-danger'}`}
              >
                {status === 'completed' ? 'Confirmar Conclusão' : 'Marcar Não Concluída'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskCompletionModal;
