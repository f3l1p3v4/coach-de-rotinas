import React, { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash, CheckCircle, Tag, Check } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { 
  getStoredCategories, 
  addStoredCategory, 
  updateStoredCategory, 
  deleteStoredCategory,
  CATEGORY_COLORS 
} from '../../constants/categories';
import './styles.css';

function GerenciadorCategorias() {
  const [categories, setCategories] = useState(() => getStoredCategories());
  const [filterType, setFilterType] = useState('all'); // 'all', 'task', 'note'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏷️');
  const [color, setColor] = useState('#3b82f6');
  const [appliesTo, setAppliesTo] = useState('both'); // 'both', 'task', 'note'

  const refreshList = () => {
    setCategories(getStoredCategories());
  };

  useEffect(() => {
    refreshList();
    window.addEventListener('coach-categories-changed', refreshList);
    return () => {
      window.removeEventListener('coach-categories-changed', refreshList);
    };
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setEmoji('🏷️');
    setColor('#3b82f6');
    setAppliesTo(filterType === 'all' ? 'both' : filterType);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setEmoji(cat.emoji || '🏷️');
    setColor(cat.color || '#3b82f6');
    setAppliesTo(cat.appliesTo || 'both');
    setIsFormOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Por favor, digite o nome da categoria.');
      return;
    }

    if (editingCategory) {
      updateStoredCategory(editingCategory.id, {
        name: name.trim(),
        emoji: emoji.trim() || '🏷️',
        color: color || '#3b82f6',
        appliesTo: appliesTo || 'both'
      });
      toast.success('Categoria atualizada com sucesso!');
    } else {
      addStoredCategory(name.trim(), color || '#3b82f6', emoji.trim() || '🏷️', appliesTo || 'both');
      toast.success('Categoria criada com sucesso!');
    }

    refreshList();
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = (cat) => {
    if (window.confirm(`Deseja realmente excluir a categoria "${cat.name}"?`)) {
      deleteStoredCategory(cat.id);
      toast.success(`Categoria "${cat.name}" excluída.`);
      refreshList();
    }
  };

  const filteredCategories = categories.filter(cat => {
    if (filterType === 'all') return true;
    const catApplies = cat.appliesTo || 'both';
    if (catApplies === 'both') return true;
    return catApplies === filterType;
  });

  const getScopeLabel = (scope) => {
    if (scope === 'task') return '🎯 Tarefas';
    if (scope === 'note') return '📝 Bloco de Notas';
    return '🔄 Ambos (Tarefas e Notas)';
  };

  return (
    <div className="gerenciador-categorias-wrapper">
      {!isFormOpen ? (
        <div className="categorias-list-section">
          <div className="categorias-toolbar">
            <div className="scope-filter-chips">
              <button 
                type="button" 
                className={`scope-chip ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                Todas ({categories.length})
              </button>
              <button 
                type="button" 
                className={`scope-chip ${filterType === 'task' ? 'active' : ''}`}
                onClick={() => setFilterType('task')}
              >
                🎯 Tarefas
              </button>
              <button 
                type="button" 
                className={`scope-chip ${filterType === 'note' ? 'active' : ''}`}
                onClick={() => setFilterType('note')}
              >
                📝 Bloco de Notas
              </button>
            </div>

            <button type="button" className="add-cat-main-btn" onClick={handleOpenCreate}>
              <PlusCircle size={18} />
              <span>Nova Categoria</span>
            </button>
          </div>

          <div className="categorias-scroll-list">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(cat => (
                <div key={cat.id} className="categoria-card-item">
                  <div className="categoria-left">
                    <span 
                      className="categoria-color-indicator" 
                      style={{ backgroundColor: cat.color || '#3b82f6' }} 
                    />
                    <span className="categoria-emoji">{cat.emoji || '🏷️'}</span>
                    <div className="categoria-info">
                      <h4 className="categoria-name">{cat.name}</h4>
                      <span className="categoria-scope-tag">
                        {getScopeLabel(cat.appliesTo)}
                      </span>
                    </div>
                  </div>

                  <div className="categoria-actions">
                    <button 
                      type="button" 
                      className="cat-action-btn edit-cat-btn"
                      onClick={() => handleOpenEdit(cat)}
                      title="Editar categoria"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      type="button" 
                      className="cat-action-btn delete-cat-btn"
                      onClick={() => handleDelete(cat)}
                      title="Excluir categoria"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-categories-state">
                <Tag size={32} />
                <p>Nenhuma categoria encontrada para este filtro.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="categoria-form">
          <div className="form-header-row">
            <h4>{editingCategory ? '✏️ Editar Categoria' : '➕ Nova Categoria'}</h4>
          </div>

          <div className="form-row-duo">
            <div className="form-field field-name">
              <label>Nome da Categoria</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Ex: Trabalho, Estudos, Finanças..."
                required
                autoFocus
              />
            </div>
            <div className="form-field field-emoji">
              <label>Emoji</label>
              <input 
                type="text" 
                value={emoji} 
                onChange={e => setEmoji(e.target.value)} 
                className="emoji-input-center"
              />
            </div>
          </div>

          <div className="form-field">
            <label>Onde esta categoria será usada?</label>
            <div className="scope-radio-options">
              <label className={`scope-radio-btn ${appliesTo === 'both' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="appliesTo" 
                  value="both" 
                  checked={appliesTo === 'both'} 
                  onChange={() => setAppliesTo('both')} 
                />
                <span>🔄 Tarefas e Bloco de Notas (Ambos)</span>
              </label>
              <label className={`scope-radio-btn ${appliesTo === 'task' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="appliesTo" 
                  value="task" 
                  checked={appliesTo === 'task'} 
                  onChange={() => setAppliesTo('task')} 
                />
                <span>🎯 Apenas Tarefas</span>
              </label>
              <label className={`scope-radio-btn ${appliesTo === 'note' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="appliesTo" 
                  value="note" 
                  checked={appliesTo === 'note'} 
                  onChange={() => setAppliesTo('note')} 
                />
                <span>📝 Apenas Bloco de Notas</span>
              </label>
            </div>
          </div>

          <div className="form-field">
            <label>Cor de Identificação da Categoria</label>
            <div className="color-palette-picker">
              {CATEGORY_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-choice-btn ${color.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  title={c}
                >
                  {color.toLowerCase() === c.toLowerCase() && <Check size={14} color="#fff" />}
                </button>
              ))}
              <label className="native-color-label" title="Cor personalizada">
                <input 
                  type="color" 
                  value={color.startsWith('#') ? color : '#3b82f6'} 
                  onChange={e => setColor(e.target.value)} 
                />
                <span className="native-color-preview" style={{ backgroundColor: color }} />
              </label>
            </div>
          </div>

          <div className="form-buttons-row">
            <button 
              type="button" 
              className="cat-cancel-btn" 
              onClick={() => { setIsFormOpen(false); setEditingCategory(null); }}
            >
              Cancelar
            </button>
            <button type="submit" className="cat-save-btn">
              <CheckCircle size={18} />
              <span>Salvar Categoria</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default GerenciadorCategorias;
