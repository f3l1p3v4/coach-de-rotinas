import React, { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash, XCircle, CheckCircle, ArrowLeft } from '@phosphor-icons/react';
import { loadUserNotes, syncUserNotes } from '../../services/supabaseService';

import './styles.css';

function BlocoDeNotas({ onClose, user }) {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null); // Note sendo editada ou visualizada
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('#fff9c4');

  useEffect(() => {
    async function initNotes() {
      const userNotes = await loadUserNotes(user?.id);
      if (userNotes.length === 0 && !user) {
        setNotes([
          {
            id: '1',
            title: 'Bem-vindo ao seu Bloco de Notas! 📝',
            content: 'Use este espaço para anotações rápidas, ideias do dia, lembretes de rotina ou pensamentos importantes.',
            date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
            color: '#fff9c4'
          }
        ]);
      } else {
        setNotes(userNotes);
      }
    }
    initNotes();
  }, [user]);

  useEffect(() => {
    syncUserNotes(user?.id, notes);
  }, [notes, user]);

  const handleOpenCreate = () => {
    setActiveNote(null);
    setTitle('');
    setContent('');
    setSelectedColor('#fff9c4');
    setIsEditing(true);
  };

  const handleOpenEdit = (note) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSelectedColor(note.color || '#fff9c4');
    setIsEditing(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      alert('Escreva pelo menos um título ou conteúdo para a nota.');
      return;
    }

    const nowFormatted = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });

    if (activeNote) {
      // Editar
      setNotes(prev => prev.map(n => n.id === activeNote.id ? {
        ...n,
        title: title.trim() || 'Sem Título',
        content: content.trim(),
        color: selectedColor,
        date: nowFormatted
      } : n));
    } else {
      // Criar nova
      const newNote = {
        id: Date.now().toString(),
        title: title.trim() || 'Sem Título',
        content: content.trim(),
        color: selectedColor,
        date: nowFormatted
      };
      setNotes(prev => [newNote, ...prev]);
    }

    setIsEditing(false);
    setActiveNote(null);
  };

  const handleDelete = (id, noteTitle) => {
    if (window.confirm(`Deseja realmente apagar a anotação "${noteTitle}"?`)) {
      setNotes(prev => prev.filter(n => n.id !== id));
      if (activeNote && activeNote.id === id) {
        setIsEditing(false);
        setActiveNote(null);
      }
    }
  };

  const colorOptions = [
    { label: 'Amarelo', hex: '#fff9c4' },
    { label: 'Rosa', hex: '#ffcdd2' },
    { label: 'Verde', hex: '#c8e6c9' },
    { label: 'Azul', hex: '#bbdefb' },
    { label: 'Roxo', hex: '#e1bee7' },
  ];

  return (
    <div className="bloco-notas-container">
      {/* Faixa superior estilo topo de bloco de notas */}
      <div className="notepad-header-tape">
        <div className="notepad-holes">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>

      <div className="notepad-main-content">
        <div className="bloco-header">
          <div className="header-left">
            {isEditing && (
              <button className="back-btn" onClick={() => setIsEditing(false)} title="Voltar à lista">
                <ArrowLeft size={20} />
              </button>
            )}
            <h3>📌 Bloco de Notas</h3>
          </div>
          {onClose && (
            <button className="close-btn" onClick={onClose} aria-label="Fechar">
              <XCircle size={24} />
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="notepad-list-view">
            <button className="new-note-btn" onClick={handleOpenCreate}>
              <PlusCircle size={20} />
              <span>Nova Anotação</span>
            </button>

            <div className="notes-list">
              {notes.length > 0 ? (
                notes.map(note => (
                  <div 
                    key={note.id} 
                    className="note-paper-item"
                    style={{ backgroundColor: note.color || '#fff9c4' }}
                    onClick={() => handleOpenEdit(note)}
                  >
                    <div className="note-paper-top">
                      <h4 className="note-title">{note.title}</h4>
                      <div className="note-actions" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleOpenEdit(note)} className="icon-btn edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(note.id, note.title)} className="icon-btn delete">
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="note-preview">{note.content}</p>
                    <span className="note-date">{note.date}</span>
                  </div>
                ))
              ) : (
                <div className="empty-notes">
                  <p>Sua caderneta está vazia.</p>
                  <p className="empty-sub">Clique acima para escrever sua primeira anotação!</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="notepad-edit-form" style={{ backgroundColor: selectedColor }}>
            <div className="form-top-row">
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Título da anotação..." 
                className="note-title-input"
                autoFocus
              />
            </div>

            <div className="color-selector">
              <span className="color-label">Cor:</span>
              {colorOptions.map(c => (
                <button
                  type="button"
                  key={c.hex}
                  className={`color-dot ${selectedColor === c.hex ? 'active' : ''}`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => setSelectedColor(c.hex)}
                  title={c.label}
                />
              ))}
            </div>

            <div className="lined-paper-textarea-wrapper">
              <textarea 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                placeholder="Escreva aqui suas notas..."
                className="note-content-textarea"
              />
            </div>

            <div className="form-actions-row">
              <button type="button" className="cancel-note-btn" onClick={() => setIsEditing(false)}>
                Cancelar
              </button>
              <button type="submit" className="save-note-btn">
                <CheckCircle size={20} />
                <span>Salvar</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default BlocoDeNotas;
