import React, { useEffect } from 'react';
import { CalendarBlank, FastForward, Trash, X } from '@phosphor-icons/react';
import './styles.css';

function DeleteTaskModal({ 
  task, 
  dateFormatted, 
  onClose, 
  onDeleteSingleDay, 
  onDeleteFromDayForward, 
  onDeleteAll 
}) {
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

  return (
    <div className="delete-task-modal-overlay" onClick={onClose}>
      <div 
        className="delete-task-modal-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-task-modal-title"
      >
        <div className="delete-task-modal-header">
          <div className="delete-modal-title-wrapper">
            <h3 id="delete-task-modal-title">Excluir Tarefa Recorrente</h3>
            <p className="delete-task-subtitle">
              Esta é uma tarefa que se repete. Escolha como deseja excluí-la:
            </p>
          </div>
          <button 
            type="button" 
            className="delete-modal-close-btn" 
            onClick={onClose} 
            title="Fechar"
            aria-label="Fechar"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="delete-task-info-card">
          {task.emoji && <span className="delete-task-emoji">{task.emoji}</span>}
          <div className="delete-task-text-group">
            <span className="delete-task-name">{task.text}</span>
            {dateFormatted && (
              <span className="delete-task-current-date">Data selecionada: {dateFormatted}</span>
            )}
          </div>
        </div>

        <div className="delete-options-list">
          <button 
            type="button" 
            className="delete-option-btn option-single"
            onClick={onDeleteSingleDay}
          >
            <div className="delete-option-icon-wrapper icon-single">
              <CalendarBlank size={22} weight="bold" />
            </div>
            <div className="delete-option-texts">
              <span className="delete-option-title">Apenas desta data</span>
              <span className="delete-option-desc">
                Remove a tarefa apenas de {dateFormatted || 'hoje'}. Os dias passados e futuros continuam normais.
              </span>
            </div>
          </button>

          <button 
            type="button" 
            className="delete-option-btn option-forward"
            onClick={onDeleteFromDayForward}
          >
            <div className="delete-option-icon-wrapper icon-forward">
              <FastForward size={22} weight="bold" />
            </div>
            <div className="delete-option-texts">
              <span className="delete-option-title">Desta data em diante</span>
              <span className="delete-option-desc">
                Mantém o histórico dos dias anteriores e cancela as repetições a partir de {dateFormatted || 'hoje'}.
              </span>
            </div>
          </button>

          <button 
            type="button" 
            className="delete-option-btn option-all"
            onClick={onDeleteAll}
          >
            <div className="delete-option-icon-wrapper icon-all">
              <Trash size={22} weight="bold" />
            </div>
            <div className="delete-option-texts">
              <span className="delete-option-title">Todas as repetições</span>
              <span className="delete-option-desc">
                Exclui a tarefa de todos os dias (passados, presentes e futuros).
              </span>
            </div>
          </button>
        </div>

        <div className="delete-task-modal-footer">
          <button 
            type="button" 
            className="delete-modal-cancel-btn" 
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteTaskModal;
