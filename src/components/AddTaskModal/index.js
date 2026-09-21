import React, { useState, useEffect } from 'react';
import { XCircle, Trash, PlusCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import CategoryPicker from '../CategoryPicker';
import RecurrenceSelector from '../RecurrenceSelector';

import './styles.css';

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function AddTaskModal({ isOpen, onClose, onAddTask, taskTemplates, selectedDate }) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState('Manhã');
  const [taskDate, setTaskDate] = useState(selectedDate || getTodayString());
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('#10b981');
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
      setTaskDate(selectedDate || getTodayString());
      setCategory('');
      setColor('#10b981');
      setIsRecurring(false);
      setRecurringDays([]);
      setSubtasks([]);
      setNewSubtaskText('');
      setSaveAsTemplate(false);
    }
  }, [isOpen, selectedDate]);

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    if (!templateId) {
      // Se selecionar a opção "Nova Tarefa em Branco", limpa tudo
      setText('');
      setEmoji('✨');
      setDescription('');
      setPeriod('Manhã');
      setCategory('');
      setColor('#10b981');
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
      setColor(template.color || '#10b981');
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
      toast.warning('Por favor, dê um nome à tarefa.');
      return;
    }
    const newTask = {
      id: Date.now().toString(),
      text,
      emoji,
      description,
      period: period || 'Manhã',
      date: isRecurring ? (selectedDate || getTodayString()) : (taskDate || selectedDate || getTodayString()),
      category: category || null,
      color: color || '#10b981',

      isRecurring: Boolean(isRecurring && recurringDays && recurringDays.length > 0),
      recurringDays: isRecurring ? (recurringDays || []).map(Number).filter(n => !isNaN(n)) : [],
      completedDates: [],
      subtasks,
      completed: false,
      completedAt: null,
      startedAt: null,
    };
    onAddTask(newTask, saveAsTemplate);
    toast.success(saveAsTemplate ? 'Tarefa e modelo criados com sucesso!' : 'Tarefa criada com sucesso!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-task-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}><XCircle size={28} /></button>
        <h3>Criar Nova Tarefa</h3>
        
        <form onSubmit={handleSubmit}>
          {/* Linha 1: Usar Modelo (3/4) e Emoji (20%) */}
          <div className="form-row-model-emoji">
            <div className="form-group form-col-model">
              <label>Usar um modelo?</label>
              <select onChange={handleTemplateChange}>
                <option value="">Selecione um modelo</option>
                {taskTemplates.map(template => (
                  <option key={template.id} value={template.id}>{template.emoji} {template.text}</option>
                ))}
              </select>
            </div>
            <div className="form-group form-col-emoji">
              <label>Emoji</label>
              <input 
                type="text" 
                value={emoji} 
                onChange={e => setEmoji(e.target.value)} 
                className="emoji-input" 
              />
            </div>
          </div>
          
          {/* Linha 2: Nome da Tarefa (3/4) e Categoria (1/4) */}
          <div className="form-row-name-category">
            <div className="form-group form-col-name">
              <label>Nome da Tarefa</label>
              <input 
                type="text" 
                value={text} 
                onChange={e => setText(e.target.value)} 
                required 
                placeholder="Nome da tarefa..."
              />
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

          {/* Linha 3: Período (2/4) e Data (2/4) */}
          <div className="form-row-period-date">
            <div className="form-group form-col-half">
              <label>Período</label>
              <select 
                value={period} 
                onChange={e => setPeriod(e.target.value)}
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
              </select>
            </div>
            {!isRecurring && (
              <div className="form-group form-col-half">
                <label>Data</label>
                <input 
                  type="date" 
                  value={taskDate} 
                  onChange={e => setTaskDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Nível de Urgência / Prioridade */}
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