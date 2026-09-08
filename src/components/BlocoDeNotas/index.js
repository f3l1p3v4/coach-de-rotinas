import React, { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash, XCircle, CheckCircle, ArrowLeft, Funnel } from '@phosphor-icons/react';
import { loadUserNotes, syncUserNotes } from '../../services/supabaseService';
import { getStoredCategories, getCategoryColor } from '../../constants/categories';

import './styles.css';

function BlocoDeNotas({ onClose, user }) {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('coach_anotacoes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const backup = localStorage.getItem('coach_anotacoes_backup');
      if (backup) {
        const parsedBackup = JSON.parse(backup);
        if (Array.isArray(parsedBackup) && parsedBackup.length > 0) return parsedBackup;
      }
    } catch (e) {}
    return [
      {
        id: '1',
        title: 'Bem-vindo ao seu Bloco de Notas! 📝',
        content: 'Use este espaço para anotações rápidas, ideias do dia, lembretes de rotina ou pensamentos importantes.',
        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        color: '#fff9c4'
      }
    ];
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeNote, setActiveNote] = useState(null); // Note sendo editada ou visualizada
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all'); // Padrão: 'all' (Todas)

  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [selectedColor, setSelectedColor] = useState('#fff9c4');

  useEffect(() => {
    let isMounted = true;
    async function initNotes() {
      if (user?.id) {
        const userNotes = await loadUserNotes(user.id);
        if (isMounted) {
          setNotes(userNotes);
          setIsLoaded(true);
        }
      } else {
        setIsLoaded(true);
      }
    }
    initNotes();
    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    if (isLoaded) {
      syncUserNotes(user?.id, notes);
    }
  }, [notes, user, isLoaded]);

  const handleOpenCreate = () => {
    setActiveNote(null);
    setTitle('');
    setContent('');
    setCategory('');
    setSelectedColor('#fff9c4');
    setIsEditing(true);
  };

  const handleOpenEdit = (note) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category || '');
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
        category: category || null,
        color: selectedColor,
        date: nowFormatted
      } : n));
    } else {
      // Criar nova
      const newNote = {
        id: Date.now().toString(),
        title: title.trim() || 'Sem Título',
        content: content.trim(),
        category: category || null,
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
    { label: 'Pêssego', hex: '#ffe0b2' },
    { label: 'Vermelho', hex: '#ff8a80' },
    { label: 'Rosa', hex: '#ffcdd2' },
    { label: 'Roxo', hex: '#e1bee7' },
    { label: 'Azul', hex: '#bbdefb' },
    { label: 'Verde', hex: '#c8e6c9' },
  ];

  // Contagem por categorias nas anotações
  const categoryCounts = {};
  let uncategorizedCount = 0;
  notes.forEach(n => {
    if (n.category) {
      categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1;
    } else {
      uncategorizedCount += 1;
    }
  });

  // Filtragem das anotações
  const filteredNotes = notes.filter(n => {
    if (!selectedCategory || selectedCategory === 'all') return true;
    if (selectedCategory === '__none__') return !n.category;
    return n.category === selectedCategory;
  });

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

            <div className="notepad-filter-row">
              <label htmlFor="notepad-category-filter" className="notepad-filter-label">
                <Funnel size={14} weight="bold" />
                <span>Filtrar por:</span>
              </label>
              <select
                id="notepad-category-filter"
                className="notepad-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">📁 Todas as Categorias ({notes.length})</option>
                {getStoredCategories().map(cat => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.emoji || '🏷️'} {cat.name} ({categoryCounts[cat.name] || 0})
                  </option>
                ))}
                <option value="__none__">📝 Sem Categoria ({uncategorizedCount})</option>
              </select>
            </div>

            <div className="notes-list">
              {filteredNotes.length > 0 ? (
                filteredNotes.map(note => (
                  <div 
                    key={note.id} 
                    className="note-paper-item"
                    style={{ backgroundColor: note.color || '#fff9c4' }}
                    onClick={() => handleOpenEdit(note)}
                  >
                    <div className="note-paper-top">
                      <div className="note-title-wrapper">
                        <h4 className="note-title">{note.title}</h4>
                        {note.category && (
                          <span 
                            className="note-category-tag"
                            style={{
                              backgroundColor: `${getCategoryColor(note.category)}24`,
                              color: getCategoryColor(note.category),
                              borderColor: `${getCategoryColor(note.category)}55`
                            }}
                          >
                            {note.category}
                          </span>
                        )}
                      </div>
                      <div className="note-actions" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleOpenEdit(note)} className="icon-btn edit" title="Editar anotação">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(note.id, note.title)} className="icon-btn delete" title="Excluir anotação">
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="note-preview">{note.content}</p>
                    <span className="note-date">{note.date}</span>
                  </div>
                ))
              ) : notes.length > 0 ? (
                <div className="empty-notes">
                  <p>Nenhuma anotação com os filtros selecionados.</p>
                  <button 
                    type="button" 
                    onClick={() => setSelectedCategory('all')}
                    className="reset-filter-notes-btn"
                  >
                    Mostrar todas
                  </button>
                </div>
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

            <div className="note-category-row">
              <span className="color-label">Categoria:</span>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="note-category-select"
              >
                <option value="">📝 Sem Categoria</option>
                {getStoredCategories().map(cat => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.emoji || '🏷️'} {cat.name}
                  </option>
                ))}
              </select>
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
