import React, { useState, useEffect } from 'react';
import { XCircle, Trash, Plus } from '@phosphor-icons/react';

import './styles.css';

function AddTaskModal({ isOpen, onClose, onAddTask, taskTemplates }) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [description, setDescription] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Efeito para resetar o formulário quando o modal é fechado/aberto
  useEffect(() => {
    if (isOpen) {
      setText('');
      setEmoji('✨');
      setDescription('');
      setSubtasks([]);
      setNewSubtaskText('');
    }
  }, [isOpen]);

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    if (!templateId) {
      // Se selecionar a opção "Nova Tarefa em Branco", limpa tudo
      setText('');
      setEmoji('✨');
      setDescription('');
      setSubtasks([]);
      return;
    }
    const template = taskTemplates.find(t => t.id === templateId);
    if (template) {
      setText(template.text);
      setEmoji(template.emoji);
      setDescription(template.description);
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
      subtasks,
      completed: false,
      completedAt: null,
    };
    onAddTask(newTask);
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
              <option value="">-- Nova Tarefa em Branco --</option>
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
            <div className="form-group">
              <label>Emoji</label>
              <input type="text" value={emoji} onChange={e => setEmoji(e.target.value)} className="emoji-input" />
            </div>
          </div>
          
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
                <button type="button" onClick={handleAddSubtask}><Plus size={18}/></button>
              </div>
            </div>
          </div>
          
          <button type="submit" className="start-custom-btn">Adicionar Tarefa à Lista</button>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;