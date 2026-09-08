import React, { useState, useEffect } from 'react';
import { XCircle, Trash, PlusCircle } from '@phosphor-icons/react';
import CategoryPicker from '../CategoryPicker';
import RecurrenceSelector from '../RecurrenceSelector';
import { getCategoryColor } from '../../constants/categories';

import './styles.css';

function AddTaskModal({ isOpen, onClose, onAddTask, taskTemplates }) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState('Manhã');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  // Efeito para resetar o formulário quando o modal é fechado/aberto
  useEffect(() => {
    if (isOpen) {
      setText('');
      setEmoji('✨');
      setDescription('');
      setPeriod('Manhã');
      setCategory('');
      setColor('#3b82f6');
      setIsRecurring(false);
      setRecurringDays([]);
      setSubtasks([]);
      setNewSubtaskText('');
      setSaveAsTemplate(false);
    }
  }, [isOpen]);

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    if (!templateId) {
      // Se selecionar a opção "Nova Tarefa em Branco", limpa tudo
      setText('');
      setEmoji('✨');
      setDescription('');
      setPeriod('Manhã');
      setCategory('');
      setColor('#3b82f6');
      setIsRecurring(false);
      setRecurringDays([]);
      setSubtasks([]);
      return;
    }
    const template = taskTemplates.find(t => t.id === templateId);
    if (template) {
      setText(template.text);
      setEmoji(template.emoji);
      setDescription(template.description);
      setPeriod(template.period || 'Manhã');
      setCategory(template.category || '');
      setColor(template.color || (template.category ? getCategoryColor(template.category) : '#3b82f6'));
      setIsRecurring(template.isRecurring || false);
      setRecurringDays(template.recurringDays || []);
      setSubtasks(template.subtasks.map(st => ({ ...st, id: Date.now() + Math.random() }))); // Cria novos IDs
    }
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (newSubtaskText.trim() === '') return;
    const newSubtask = { id: Date.now(), text: newSubtaskText, completed: false };
    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskText('');
  };
  
  const handleRemoveSubtask = (subtaskId) => {
    setSubtasks(subtasks.filter(sub => sub.id !== subtaskId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() === '') {
      alert('Por favor, dê um nome à tarefa.');
      return;
    }
    const newTask = {
      id: Date.now().toString(),
      text,
      emoji,
      description,
      period: period || 'Manhã',
      category: category || null,
      color: color || (category ? getCategoryColor(category) : null),
      isRecurring,
      recurringDays: isRecurring ? recurringDays : [],
      completedDates: [],
      subtasks,
      completed: false,
      completedAt: null,
      startedAt: null,
    };
    onAddTask(newTask, saveAsTemplate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-task-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}><XCircle size={28} /></button>
        <h3>Criar Nova Tarefa</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usar um modelo?</label>
            <select onChange={handleTemplateChange}>
              <option value="">Selecione um modelo</option>
              {taskTemplates.map(template => (
                <option key={template.id} value={template.id}>{template.emoji} {template.text}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group-inline">
            <div className="form-group">
              <label>Nome da Tarefa</label>
              <input type="text" value={text} onChange={e => setText(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: '0 0 auto' }}>
              <label>Emoji</label>
              <input type="text" value={emoji} onChange={e => setEmoji(e.target.value)} className="emoji-input" />
            </div>
            <div className="form-group" style={{ flex: '0 0 auto' }}>
              <label>Período</label>
              <select 
                value={period} 
                onChange={e => setPeriod(e.target.value)}
                style={{ height: '42px', borderRadius: '8px', padding: '0 10px', background: 'var(--input-bg, #2a2a2a)', color: 'var(--text-color, #fff)', border: '1px solid var(--border-color, #444)' }}
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
              </select>
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
            <label>Descrição / Notas</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Sub-tarefas</label>
            <div className="subtask-editor">
              {subtasks.map(sub => (
                <div key={sub.id} className="subtask-edit-item">
                  <span>{sub.text}</span>
                  <button type="button" onClick={() => handleRemoveSubtask(sub.id)}><Trash size={16}/></button>
                </div>
              ))}
              <div className="subtask-input-form">
                <input type="text" value={newSubtaskText} onChange={e => setNewSubtaskText(e.target.value)} placeholder="Adicionar passo..."/>
                <button type="button" onClick={handleAddSubtask} className='add-task-button'><PlusCircle size={28} /></button>
              </div>
            </div>
          </div>
          <div className="template-checkbox-group" onClick={() => setSaveAsTemplate(!saveAsTemplate)}>
            <input 
              type="checkbox" 
              id="saveAsTemplate" 
              checked={saveAsTemplate} 
              onChange={e => setSaveAsTemplate(e.target.checked)} 
              onClick={e => e.stopPropagation()}
            />
            <label htmlFor="saveAsTemplate">
              ⭐ Salvar como modelo para usar outras vezes
            </label>
          </div>
          
          <button type="submit" className="start-custom-btn">Adicionar Tarefa à Lista</button>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;