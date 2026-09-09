import React, { useState } from 'react';
import { PlusCircle, Pencil, Trash, XCircle, CheckCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import CategoryPicker from '../CategoryPicker';
import RecurrenceSelector from '../RecurrenceSelector';
import { getCategoryColor } from '../../constants/categories';
import { getRecurrenceLabel } from '../../constants/recurrence';
import { getDifficultyByColor } from '../../constants/difficulty';

import './styles.css';

function GerenciadorModelos({ templates, onAddTemplate, onEditTemplate, onDeleteTemplate, onClose, hideHeader = false }) {
  const [editingTemplate, setEditingTemplate] = useState(null); // null quando criando novo ou visualizando lista
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('#10b981');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState([]);
  const [description, setDescription] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setText('');
    setEmoji('✨');
    setCategory('');
    setColor('#10b981');
    setIsRecurring(false);
    setRecurringDays([]);
    setDescription('');
    setSubtasks([]);
    setNewSubtaskText('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (template) => {
    setEditingTemplate(template);
    setText(template.text || '');
    setEmoji(template.emoji || '✨');
    setCategory(template.category || '');
    setColor(template.color || '#10b981');

    setIsRecurring(template.isRecurring || false);
    setRecurringDays(template.recurringDays || []);
    setDescription(template.description || '');
    setSubtasks(template.subtasks ? template.subtasks.map(st => ({ ...st })) : []);
    setNewSubtaskText('');
    setIsFormOpen(true);
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    setSubtasks([...subtasks, { id: Date.now(), text: newSubtaskText.trim(), completed: false }]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (subtaskId) => {
    setSubtasks(subtasks.filter(st => st.id !== subtaskId));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.warning('Por favor, digite um nome para o modelo.');
      return;
    }

    const templateData = {
      id: editingTemplate ? editingTemplate.id : Date.now().toString(),
      text: text.trim(),
      emoji: emoji.trim() || '✨',
      category: category || null,
      color: color || '#10b981',
      isRecurring: Boolean(isRecurring && recurringDays && recurringDays.length > 0),
      recurringDays: isRecurring ? (recurringDays || []).map(Number).filter(n => !isNaN(n)) : [],
      description: description.trim(),
      subtasks: subtasks
    };

    if (editingTemplate) {
      onEditTemplate(templateData);
      toast.success('Modelo atualizado com sucesso!');
    } else {
      onAddTemplate(templateData);
      toast.success('Modelo criado com sucesso!');
    }

    setIsFormOpen(false);
    setEditingTemplate(null);
  };

  const handleDelete = (templateId, templateName) => {
    if (window.confirm(`Deseja realmente excluir o modelo "${templateName}"?`)) {
      onDeleteTemplate(templateId);
      toast.success(`Modelo "${templateName}" excluído.`);
    }
  };

  return (
    <div className={`gerenciador-modelos-container ${hideHeader ? 'no-header' : ''}`}>
      {!hideHeader && (
        <div className="gerenciador-header">
          <h3>⚙️ Modelos de Tarefa</h3>
          {onClose && (
            <button className="close-btn" onClick={onClose} aria-label="Fechar">
              <XCircle size={24} />
            </button>
          )}
        </div>
      )}

      {!isFormOpen ? (
        <div className="modelos-list-wrapper">
          <button className="add-template-btn" onClick={handleOpenCreate}>
            <PlusCircle size={20} />
            <span>Criar Novo Modelo</span>
          </button>

          <div className="modelos-list">
            {templates.length > 0 ? (
              templates.map((tmpl) => {
                const diff = getDifficultyByColor(tmpl.color);
                return (
                  <div key={tmpl.id} className="modelo-card-item">
                    <div className="modelo-info">
                      <span className="modelo-emoji">{tmpl.emoji || '✨'}</span>
                      <div className="modelo-details">
                        <div className="modelo-title-row">
                          <h4>{tmpl.text}</h4>
                          {tmpl.category && (
                            <span 
                              className="modelo-category-badge"
                              style={{ 
                                backgroundColor: `${getCategoryColor(tmpl.category)}22`,
                                color: getCategoryColor(tmpl.category),
                                borderColor: `${getCategoryColor(tmpl.category)}55`
                              }}
                            >
                              {tmpl.category}
                            </span>
                          )}
                          {diff && (
                            <span 
                              className="modelo-diff-badge"
                              style={{ 
                                backgroundColor: `${diff.color}22`,
                                color: diff.color,
                                borderColor: `${diff.color}55`
                              }}
                              title={`Dificuldade: ${diff.label}`}
                            >
                              {diff.emoji} {diff.shortLabel}
                            </span>
                          )}
                          {tmpl.isRecurring && (
                            <span 
                              className="modelo-recurrence-badge"
                              title={`Recorrência: ${getRecurrenceLabel(tmpl.recurringDays)}`}
                            >
                              🔁 {getRecurrenceLabel(tmpl.recurringDays)}
                            </span>
                          )}
                        </div>
                        {tmpl.description && <p className="modelo-desc">{tmpl.description}</p>}
                        {tmpl.subtasks && tmpl.subtasks.length > 0 && (
                          <span className="modelo-subtasks-count">
                            📋 {tmpl.subtasks.length} passo(s)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="modelo-actions">
                      <button onClick={() => handleOpenEdit(tmpl)} title="Editar Modelo" className="edit-btn">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(tmpl.id, tmpl.text)} title="Excluir Modelo" className="delete-btn">
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-templates-msg">Nenhum modelo cadastrado.</p>
            )}
          </div>
        </div>
      ) : (

        <form onSubmit={handleSubmitForm} className="modelo-form">
          <h4>{editingTemplate ? '✏️ Editar Modelo' : '➕ Novo Modelo'}</h4>

          <div className="form-group-inline">
            <div className="form-group">
              <label>Nome do Modelo</label>
              <input 
                type="text" 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                placeholder="Ex: Treino de Pernas" 
                required 
              />
            </div>
            <div className="form-group" style={{ flex: '0 0 auto', width: '80px' }}>
              <label>Emoji</label>
              <input 
                type="text" 
                value={emoji} 
                onChange={(e) => setEmoji(e.target.value)} 
                className="emoji-input"
              />
            </div>
          </div>

          <CategoryPicker 
            category={category}
            onChangeCategory={setCategory}
            color={color}
            onChangeColor={setColor}
          />

          <RecurrenceSelector
            isRecurring={isRecurring}
            onChangeIsRecurring={setIsRecurring}
            recurringDays={recurringDays}
            onChangeRecurringDays={setRecurringDays}
          />

          <div className="form-group">
            <label>Descrição</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Detalhes ou instrução do modelo..."
            />
          </div>

          <div className="form-group">
            <label>Sub-tarefas / Passos</label>
            <div className="subtask-editor">
              {subtasks.map((st) => (
                <div key={st.id} className="subtask-edit-item">
                  <span>{st.text}</span>
                  <button type="button" onClick={() => handleRemoveSubtask(st.id)}>
                    <Trash size={16} />
                  </button>
                </div>
              ))}
              <div className="subtask-input-form">
                <input 
                  type="text" 
                  value={newSubtaskText} 
                  onChange={(e) => setNewSubtaskText(e.target.value)} 
                  placeholder="Novo passo..."
                />
                <button type="button" onClick={handleAddSubtask} className="add-subtask-btn">
                  <PlusCircle size={22} />
                </button>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setIsFormOpen(false)} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" className="save-btn">
              <CheckCircle size={20} />
              <span>Salvar Modelo</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default GerenciadorModelos;
