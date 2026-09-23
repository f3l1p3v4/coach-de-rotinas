import React, { useState, useEffect } from 'react';
import { 
  XCircle, 
  Circle, 
  CheckCircle, 
  Trash, 
  PlusCircle, 
  FloppyDisk, 
  Tag, 
  PencilSimple,
  CalendarBlank
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import CategoryPicker from '../CategoryPicker';
import RecurrenceSelector from '../RecurrenceSelector';

import './styles.css';

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getTomorrowString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function TaskDetailsModal({ task, onClose, onUpdateTask, onRemoveTask, selectedDate }) {
  const [text, setText] = useState(task?.text || '');
  const [emoji, setEmoji] = useState(task?.emoji || '✨');
  const [period, setPeriod] = useState(task?.period || 'Manhã');
  const [date, setDate] = useState(task?.date || selectedDate || getTodayString());
  const [category, setCategory] = useState(task?.category || '');
  const [color, setColor] = useState(task?.color || '#10b981');
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring || false);
  const [recurringDays, setRecurringDays] = useState(task?.recurringDays || []);
  const [description, setDescription] = useState(task?.description || '');
  const [subtasks, setSubtasks] = useState(task?.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  useEffect(() => {
    if (task) {
      setText(task.text || '');
      setEmoji(task.emoji || '✨');
      setPeriod(task.period || 'Manhã');
      setDate(task.date || selectedDate || getTodayString());
      setCategory(task.category || '');
      setColor(task.color || '#10b981');
      setIsRecurring(task.isRecurring || false);
      setRecurringDays(task.recurringDays || []);
      setDescription(task.description || '');
      setSubtasks(task.subtasks || []);
    }
  }, [task, selectedDate]);

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
      toast.warning('Por favor, informe um título para a tarefa.');
      return;
    }
    if (onUpdateTask) {
      onUpdateTask({
        ...task,
        text: text.trim(),
        emoji,
        period,
        date: date || task?.date || null,
        category: category || null,
        color: color || '#10b981',

        isRecurring: Boolean(isRecurring && recurringDays && recurringDays.length > 0),
        recurringDays: isRecurring ? (recurringDays || []).map(Number).filter(n => !isNaN(n)) : [],
        description: description.trim(),
        subtasks
      });
      toast.success('Tarefa atualizada com sucesso!');
    }
    onClose();
  };

  const handleDelete = () => {
    if (task.isRecurring) {
      if (onRemoveTask) {
        onRemoveTask(task.id);
      }
      onClose();
      return;
    }

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
          {!isRecurring ? (
            <>
              {/* Linha 1: Nome da Tarefa (3/4) e Categoria (1/4) */}
              <div className="form-row-name-category">
                <div className="form-group form-col-name">
                  <label>Nome da Tarefa</label>
                  <div className="title-with-emoji-container">
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
                      className="details-input task-name-input"
                      placeholder="Nome da tarefa..."
                      required
                    />
                  </div>
                </div>
                <div className="form-group form-col-category">
                  <CategoryPicker 
                    category={category}
                    onChangeCategory={setCategory}
                    showCategory={true}
                    showDifficulty={false}
                    className="category-picker-compact"
                    appliesTo="task"
                  />
                </div>
              </div>

              {/* Linha 2: Período (2/4) e Data da Tarefa (2/4) */}
              <div className="details-grid-row">
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

                <div className="details-field">
                  <label><CalendarBlank size={16} /> Data da Tarefa</label>
                  <div className="task-date-input-group">
                    <input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)}
                      className="details-input task-date-input"
                    />
                    <div className="task-date-shortcuts">
                      <button 
                        type="button" 
                        className={`task-date-btn ${date === getTodayString() ? 'active' : ''}`}
                        onClick={() => setDate(getTodayString())}
                        title="Mover para Hoje"
                      >
                        Hoje
                      </button>
                      <button 
                        type="button" 
                        className={`task-date-btn ${date === getTomorrowString() ? 'active' : ''}`}
                        onClick={() => setDate(getTomorrowString())}
                        title="Mover para Amanhã"
                      >
                        Amanhã
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Tarefa baseada em modelo (recorrente) */}
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

                <div className="details-field">
                  <CategoryPicker 
                    category={category}
                    onChangeCategory={setCategory}
                    showCategory={true}
                    showDifficulty={false}
                    className="category-picker-compact"
                    appliesTo="task"
                  />
                </div>
              </div>
            </>
          )}

          <CategoryPicker 
            color={color}
            onChangeColor={setColor}
            showCategory={false}
            showDifficulty={true}
            appliesTo="task"
          />

          <RecurrenceSelector
            isRecurring={isRecurring}
            onChangeIsRecurring={setIsRecurring}
            recurringDays={recurringDays}
            onChangeRecurringDays={setRecurringDays}
          />

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
                title="Adicionar sub-tarefa"
              >
                <PlusCircle size={24} />
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