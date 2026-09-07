import React, { useState, useEffect } from 'react';
import { 
  XCircle, 
  Circle, 
  CheckCircle, 
  Trash, 
  Clock, 
  PlusCircle, 
  FloppyDisk, 
  Tag, 
  PencilSimple 
} from '@phosphor-icons/react';

import './styles.css';

function TaskDetailsModal({ task, onClose, onUpdateTask, onRemoveTask }) {
  const [text, setText] = useState(task?.text || '');
  const [emoji, setEmoji] = useState(task?.emoji || '✨');
  const [time, setTime] = useState(task?.time || '');
  const [period, setPeriod] = useState(task?.period || 'Manhã');
  const [description, setDescription] = useState(task?.description || '');
  const [subtasks, setSubtasks] = useState(task?.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  useEffect(() => {
    if (task) {
      setText(task.text || '');
      setEmoji(task.emoji || '✨');
      setTime(task.time || '');
      setPeriod(task.period || 'Manhã');
      setDescription(task.description || '');
      setSubtasks(task.subtasks || []);
    }
  }, [task]);

  // Se o horário for alterado, sugere o período automaticamente
  const handleTimeChange = (newTime) => {
    setTime(newTime);
    if (newTime) {
      const hour = parseInt(newTime.split(':')[0], 10);
      if (!isNaN(hour)) {
        if (hour >= 12 && hour < 18) setPeriod('Tarde');
        else if (hour >= 18) setPeriod('Noite');
        else setPeriod('Manhã');
      }
    }
  };

  const handleToggleSubtask = (subId) => {
    setSubtasks(prev => prev.map(sub => 
      sub.id === subId ? { ...sub, completed: !sub.completed } : sub
    ));
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    const newSubtask = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      text: newSubtaskText.trim(),
      completed: false
    };
    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (subId) => {
    setSubtasks(prev => prev.filter(sub => sub.id !== subId));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('Por favor, informe um título para a tarefa.');
      return;
    }
    if (onUpdateTask) {
      onUpdateTask({
        ...task,
        text: text.trim(),
        emoji,
        time,
        period,
        description: description.trim(),
        subtasks
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      if (onRemoveTask) {
        onRemoveTask(task.id);
      }
      onClose();
    }
  };

  if (!task) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content details-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose} title="Fechar">
          <XCircle size={28} />
        </button>

        <form onSubmit={handleSave} className="task-details-form">
          <div className="details-modal-header">
            <div className="title-edit-group">
              <input 
                type="text" 
                value={emoji} 
                onChange={e => setEmoji(e.target.value)} 
                className="emoji-input"
                maxLength={4}
                title="Alterar emoji"
              />
              <input 
                type="text" 
                value={text} 
                onChange={e => setText(e.target.value)} 
                className="task-title-input"
                placeholder="Título da Tarefa"
                required
              />
            </div>
          </div>

          <div className="details-grid-row">
            <div className="details-field">
              <label><Clock size={16} /> Horário</label>
              <input 
                type="time" 
                value={time} 
                onChange={e => handleTimeChange(e.target.value)}
                className="details-input"
              />
            </div>

            <div className="details-field">
              <label><Tag size={16} /> Período</label>
              <select 
                value={period} 
                onChange={e => setPeriod(e.target.value)}
                className="details-select"
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
              </select>
            </div>
          </div>

          <div className="details-modal-section">
            <label><PencilSimple size={16} /> Descrição / Notas</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Adicione detalhes ou observações..."
              className="details-textarea"
              rows={3}
            />
          </div>

          <div className="details-modal-section">
            <label>Sub-tarefas ({subtasks.filter(s => s.completed).length}/{subtasks.length})</label>
            <ul className="subtask-list-view">
              {subtasks.map(sub => (
                <li key={sub.id} className={sub.completed ? 'completed' : ''}>
                  <button 
                    type="button" 
                    className="subtask-toggle-btn"
                    onClick={() => handleToggleSubtask(sub.id)}
                  >
                    {sub.completed ? (
                      <CheckCircle size={22} weight="fill" className="subtask-icon-completed" />
                    ) : (
                      <Circle size={22} className="subtask-icon" />
                    )}
                  </button>
                  <span className="subtask-text-view">{sub.text}</span>
                  <button 
                    type="button" 
                    className="subtask-delete-btn"
                    onClick={() => handleRemoveSubtask(sub.id)}
                    title="Remover sub-tarefa"
                  >
                    <Trash size={16} />
                  </button>
                </li>
              ))}
            </ul>

            <div className="add-subtask-row">
              <input 
                type="text" 
                placeholder="Nova sub-tarefa..." 
                value={newSubtaskText}
                onChange={e => setNewSubtaskText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
                className="subtask-inline-input"
              />
              <button 
                type="button" 
                onClick={handleAddSubtask}
                className="add-subtask-inline-btn"
              >
                <PlusCircle size={20} />
                <span>Adicionar</span>
              </button>
            </div>
          </div>

          <div className="details-modal-footer">
            <button type="button" className="details-delete-btn" onClick={handleDelete}>
              <Trash size={18} />
              <span>Excluir</span>
            </button>
            <button type="submit" className="details-save-btn">
              <FloppyDisk size={18} />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskDetailsModal;