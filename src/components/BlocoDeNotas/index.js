import React, { useState, useEffect } from 'react';
import { 
  Pencil, Trash, XCircle, CheckCircle, ArrowLeft, Funnel, 
  Circle, Plus, ListChecks, Article 
} from '@phosphor-icons/react';
import { loadUserNotes, syncUserNotes } from '../../services/supabaseService';
import { getStoredCategories, getCategoryColor } from '../../constants/categories';
import { toast } from 'sonner';

import './styles.css';

// Verifica se o conteúdo possui marcas explícitas de checklist (- [x], - [ ], [x], etc.)
export function isChecklistContent(content) {
  if (!content) return false;
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return false;
  return lines.some(line => /^[-*]?\s*\[[ xX]\]/.test(line) || /^~~.*~~$/.test(line));
}

// Determina se uma nota deve ser tratada como checklist ou como anotação de texto livre
export function isNoteChecklist(note) {
  if (!note) return false;
  if (note.type === 'checklist') return true;
  if (note.type === 'text') return false;
  // Para notas antigas/sem tipo explícito: apenas se tiver marcas explícitas de checklist
  return isChecklistContent(note.content);
}

// Converte texto em array de itens de checklist
export function parseContentToItems(content) {
  if (!content) return [];
  const lines = content.split('\n');
  const items = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Reconhece marcações de concluído (- [x], [x], - ~~texto~~, etc.)
    const isDone = /^[-*]\s*\[[xX]\]/.test(trimmed) || 
                   /^\[[xX]\]/.test(trimmed) || 
                   /^[-*]\s*~~.*~~$/.test(trimmed) ||
                   /^~~.*~~$/.test(trimmed);

    let text = trimmed
      .replace(/^[-*]\s*\[[ xX]\]\s*/, '')
      .replace(/^\[[ xX]\]\s*/, '')
      .replace(/^[-*]\s*/, '')
      .replace(/^~~(.*)~~$/, '$1')
      .trim();

    items.push({
      id: `it_${idx}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text: text || trimmed,
      completed: isDone
    });
  });

  return items;
}

// Converte array de itens de volta para string estruturada de checklist
export function serializeItemsToContent(items) {
  if (!items || items.length === 0) return '';
  return items.map(item => {
    const check = item.completed ? '[x]' : '[ ]';
    return `- ${check} ${item.text}`;
  }).join('\n');
}

// Converte array de itens em texto livre puro (sem colchetes nem traços)
export function serializeItemsToPlainText(items) {
  if (!items || items.length === 0) return '';
  return items.map(item => item.text).join('\n');
}

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
        color: '#fff9c4',
        type: 'text'
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
  const [editMode, setEditMode] = useState('text'); // 'text' (Anotação simples) ou 'list' (Checklist com risco)
  const [items, setItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [noteCategories, setNoteCategories] = useState(() => getStoredCategories('note'));

  useEffect(() => {
    const handleCatsChanged = () => setNoteCategories(getStoredCategories('note'));
    window.addEventListener('coach-categories-changed', handleCatsChanged);
    return () => window.removeEventListener('coach-categories-changed', handleCatsChanged);
  }, []);

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

  const handleOpenCreate = (initialMode = 'text') => {
    setActiveNote(null);
    setTitle('');
    setContent('');
    setCategory('');
    setSelectedColor('#fff9c4');
    setItems([]);
    setNewItemText('');
    setEditMode(initialMode);
    setIsEditing(true);
  };

  const handleOpenEdit = (note) => {
    setActiveNote(note);
    setTitle(note.title);
    const isCheck = isNoteChecklist(note);
    const noteContent = note.content || '';
    setContent(noteContent);
    const parsed = parseContentToItems(noteContent);
    setItems(parsed);
    setNewItemText('');
    setEditMode(isCheck ? 'list' : 'text');
    setCategory(note.category || '');
    setSelectedColor(note.color || '#fff9c4');
    setIsEditing(true);
  };

  // Manipulação de itens no modo lista
  const handleAddItem = (e) => {
    if (e) e.preventDefault();
    if (!newItemText.trim()) return;
    const newItem = {
      id: `it_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text: newItemText.trim(),
      completed: false
    };
    const updated = [...items, newItem];
    setItems(updated);
    setContent(serializeItemsToContent(updated));
    setNewItemText('');
  };

  const handleToggleItem = (itemId) => {
    const updated = items.map(it => it.id === itemId ? { ...it, completed: !it.completed } : it);
    setItems(updated);
    setContent(serializeItemsToContent(updated));
  };

  const handleDeleteItem = (itemId) => {
    const updated = items.filter(it => it.id !== itemId);
    setItems(updated);
    setContent(serializeItemsToContent(updated));
  };

  const handleUpdateItemText = (itemId, newText) => {
    const updated = items.map(it => it.id === itemId ? { ...it, text: newText } : it);
    setItems(updated);
    setContent(serializeItemsToContent(updated));
  };

  const handleSwitchToList = () => {
    if (editMode === 'list') return;
    const parsed = parseContentToItems(content);
    setItems(parsed);
    setEditMode('list');
  };

  const handleSwitchToText = () => {
    if (editMode === 'text') return;
    if (items.length > 0) {
      setContent(serializeItemsToPlainText(items));
    }
    setEditMode('text');
  };

  // Alternar conclusão de item diretamente no card da lista
  const handleToggleNoteItemInCard = (e, noteId, itemIndex) => {
    e.stopPropagation();
    setNotes(prev => prev.map(note => {
      if (note.id !== noteId) return note;
      const noteItems = parseContentToItems(note.content);
      if (noteItems[itemIndex]) {
        noteItems[itemIndex].completed = !noteItems[itemIndex].completed;
      }
      return {
        ...note,
        content: serializeItemsToContent(noteItems),
        type: 'checklist'
      };
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const isList = editMode === 'list';
    const finalContent = isList 
      ? serializeItemsToContent(items) 
      : content.trim();

    if (!title.trim() && !finalContent.trim()) {
      toast.warning('Escreva pelo menos um título ou conteúdo para a nota.');
      return;
    }

    const noteType = isList ? 'checklist' : 'text';
    const nowFormatted = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });

    if (activeNote) {
      // Editar
      setNotes(prev => prev.map(n => n.id === activeNote.id ? {
        ...n,
        title: title.trim() || (isList ? 'Lista de Itens' : 'Sem Título'),
        content: finalContent,
        category: category || null,
        color: selectedColor,
        date: nowFormatted,
        type: noteType
      } : n));
      toast.success('Anotação atualizada!');
    } else {
      // Criar nova
      const newNote = {
        id: Date.now().toString(),
        title: title.trim() || (isList ? 'Lista de Itens' : 'Sem Título'),
        content: finalContent,
        category: category || null,
        color: selectedColor,
        date: nowFormatted,
        type: noteType
      };
      setNotes(prev => [newNote, ...prev]);
      toast.success('Anotação criada com sucesso!');
    }

    setIsEditing(false);
    setActiveNote(null);
  };

  const handleDelete = (id, noteTitle) => {
    if (window.confirm(`Deseja realmente apagar a anotação "${noteTitle}"?`)) {
      setNotes(prev => prev.filter(n => n.id !== id));
      toast.success('Anotação excluída.');
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
            <div className="new-note-actions-row">
              <button 
                type="button" 
                className="new-note-action-btn primary-add-btn" 
                onClick={() => handleOpenCreate('text')}
                title="Adicionar nova nota"
              >
                <Plus size={20} weight="bold" />
                <span>Adicionar Nota</span>
              </button>
            </div>

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
                {noteCategories.map(cat => (
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
                        <div className="note-badges-row">
                          {isNoteChecklist(note) ? (
                            <span className="note-type-badge list-badge" title="Lista com risco de conclusão">
                              <ListChecks size={12} weight="bold" /> Lista
                            </span>
                          ) : (
                            <span className="note-type-badge text-badge" title="Anotação de texto livre">
                              <Article size={12} weight="bold" /> Anotação
                            </span>
                          )}
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

                    {isNoteChecklist(note) ? (
                      (() => {
                        const noteItems = parseContentToItems(note.content);
                        if (noteItems.length > 0) {
                          return (
                            <div className="note-card-items-list" onClick={e => e.stopPropagation()}>
                              {noteItems.slice(0, 6).map((item, idx) => (
                                <div 
                                  key={idx} 
                                  className={`note-card-item-row ${item.completed ? 'completed' : ''}`}
                                  onClick={(e) => handleToggleNoteItemInCard(e, note.id, idx)}
                                  title={item.completed ? 'Clique para desmarcar' : 'Clique para marcar como feito'}
                                >
                                  <span className="note-item-check-indicator">
                                    {item.completed ? '✓' : '–'}
                                  </span>
                                  <span className="note-item-text">{item.text}</span>
                                </div>
                              ))}
                              {noteItems.length > 6 && (
                                <span className="note-card-more-items">+{noteItems.length - 6} itens...</span>
                              )}
                            </div>
                          );
                        }
                        return <p className="note-preview-empty">Nenhum item na lista</p>;
                      })()
                    ) : (
                      <p className="note-preview">{note.content}</p>
                    )}

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
                  <p className="empty-sub">Clique em "Adicionar Nota" acima para criar sua primeira nota!</p>
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
                placeholder={editMode === 'list' ? 'Título da lista de tarefas...' : 'Título da anotação...'} 
                className="note-title-input"
                autoFocus
              />
            </div>

            {/* Seletor de 2 Opções de Bloco */}
            <div className="note-type-selector-banner">
              <span className="color-label">Tipo:</span>
              <div className="note-type-pills">
                <button
                  type="button"
                  className={`note-type-pill ${editMode === 'text' ? 'active' : ''}`}
                  onClick={handleSwitchToText}
                  title="Anotação simples de texto livre (como antes)"
                >
                  <Article size={16} weight={editMode === 'text' ? 'fill' : 'regular'} />
                  <span>📝 Anotação de Texto</span>
                </button>
                <button
                  type="button"
                  className={`note-type-pill ${editMode === 'list' ? 'active' : ''}`}
                  onClick={handleSwitchToList}
                  title="Lista com itens e risco ao marcar como feito"
                >
                  <ListChecks size={16} weight={editMode === 'list' ? 'fill' : 'regular'} />
                  <span>📋 Lista com Risco</span>
                </button>
              </div>
            </div>

            <div className="note-category-row">
              <span className="color-label">Categoria:</span>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="note-category-select"
              >
                <option value="">📝 Sem Categoria</option>
                {noteCategories.map(cat => (
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

            {editMode === 'list' ? (
              <div className="lined-paper-items-wrapper">
                <div className="notepad-items-list">
                  {items.map((item) => (
                    <div key={item.id} className={`notepad-item-row ${item.completed ? 'completed' : ''}`}>
                      <button
                        type="button"
                        className="item-toggle-btn"
                        onClick={() => handleToggleItem(item.id)}
                        title={item.completed ? 'Clique para desmarcar' : 'Marcar como feito (riscar)'}
                      >
                        {item.completed ? (
                          <CheckCircle size={20} weight="fill" className="item-icon-checked" />
                        ) : (
                          <Circle size={20} className="item-icon-unchecked" />
                        )}
                      </button>
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => handleUpdateItemText(item.id, e.target.value)}
                        className={`item-text-input ${item.completed ? 'completed' : ''}`}
                        placeholder="Item da anotação..."
                      />
                      <button
                        type="button"
                        className="item-delete-btn"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Apagar este item"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Linha para adicionar novo item rápido */}
                <div className="notepad-add-item-row">
                  <span className="add-item-icon"><Plus size={18} /></span>
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    placeholder="Adicionar item... (Pressione Enter)"
                    className="add-item-input"
                  />
                  {newItemText.trim() && (
                    <button
                      type="button"
                      className="add-item-confirm-btn"
                      onClick={handleAddItem}
                      title="Adicionar à lista"
                    >
                      Adicionar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="lined-paper-textarea-wrapper">
                <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  placeholder="Escreva aqui suas notas..."
                  className="note-content-textarea"
                />
              </div>
            )}

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
