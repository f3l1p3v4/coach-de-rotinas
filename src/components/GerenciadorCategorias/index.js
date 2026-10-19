import IconSelect from '../IconSelect';
import AppIcon, { ICON_OPTIONS } from '../AppIcon';
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
import { getStoredProfiles, saveStoredProfiles } from '../../constants/profiles';
import './styles.css';

function GerenciadorCategorias({ entity = 'category' }) {
  const isProfile = entity === 'profile';
  const entityName = isProfile ? 'Perfil' : 'Categoria';
  const [categories, setCategories] = useState(() => (isProfile ? getStoredProfiles() : getStoredCategories()));
  const [filterType, setFilterType] = useState('all'); // 'all', 'task', 'note'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');
  const [color, setColor] = useState('#3b82f6');
  const [appliesTo, setAppliesTo] = useState('both'); // 'both', 'task', 'note'

  const refreshList = () => {
    setCategories((isProfile ? getStoredProfiles() : getStoredCategories()));
  };

  useEffect(() => {
    refreshList();
    window.addEventListener('coach-categories-changed', refreshList);
    window.addEventListener('coach-profiles-changed', refreshList);
    return () => { window.removeEventListener('coach-categories-changed', refreshList); window.removeEventListener('coach-profiles-changed', refreshList); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setIcon('tag');
    setColor('#3b82f6');
    setAppliesTo(filterType === 'all' ? 'both' : filterType);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setIcon(cat.icon || 'tag');
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

    if (isProfile) {
      const duplicate = categories.some(item => item.id !== editingCategory?.id && item.name.toLowerCase() === name.trim().toLowerCase());
      if (duplicate) { toast.warning('Já existe um perfil com esse nome.'); return; }
      const item = { id: editingCategory?.id || `profile_${Date.now()}`, name: name.trim(), icon, color };
      saveStoredProfiles(editingCategory ? categories.map(cat => cat.id === item.id ? item : cat) : [...categories, item]);
      if (editingCategory && editingCategory.name !== item.name) window.dispatchEvent(new CustomEvent('coach-profile-renamed', { detail: { previous: editingCategory.name, next: item.name } }));
      toast.success('Perfil salvo com sucesso!');
    } else if (editingCategory) {
      updateStoredCategory(editingCategory.id, {
        name: name.trim(),
        icon: icon || 'tag',
        color: color || '#3b82f6',
        appliesTo: appliesTo || 'both'
      });
      toast.success('Categoria atualizada com sucesso!');
    } else {
      addStoredCategory(name.trim(), color || '#3b82f6', icon || 'tag', appliesTo || 'both');
      toast.success('Categoria criada com sucesso!');
    }

    refreshList();
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = (cat) => {
    if (window.confirm(`Deseja realmente excluir ${isProfile ? 'o perfil' : 'a categoria'} "${cat.name}"?`)) {
      if (isProfile) {
        saveStoredProfiles(categories.filter(item => item.id !== cat.id));
        window.dispatchEvent(new CustomEvent('coach-profile-renamed', { detail: { previous: cat.name, next: null } }));
      }
      else deleteStoredCategory(cat.id);
      toast.success(`${entityName} "${cat.name}" excluído(a).`);
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
    if (scope === 'task') return 'Tarefas';
    if (scope === 'note') return 'Bloco de Notas';
    return 'Ambos (Tarefas e Notas)';
  };

  return (
    <div className="gerenciador-categorias-wrapper">
      {!isFormOpen ? (
        <div className="categorias-list-section">
          <div className="categorias-toolbar">
            {!isProfile && <div className="scope-filter-chips">
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
                <AppIcon name="target" color="currentColor" /> Tarefas
              </button>
              <button 
                type="button" 
                className={`scope-chip ${filterType === 'note' ? 'active' : ''}`}
                onClick={() => setFilterType('note')}
              >
                <AppIcon name="note" color="currentColor" /> Bloco de Notas
              </button>
            </div>}

            <button type="button" className="add-cat-main-btn" onClick={handleOpenCreate}>
              <PlusCircle size={18} />
              <span>{isProfile ? 'Novo Perfil' : 'Nova Categoria'}</span>
            </button>
          </div>

          <div className="categorias-scroll-list">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(cat => (
                <div key={cat.id} className="categoria-card-item">
                  <div className="categoria-left">
                    <AppIcon name={cat.icon} color={cat.color} size={26} />
                    <div className="categoria-info">
                      <h4 className="categoria-name">{cat.name}</h4>
                      {!isProfile && <span className="categoria-scope-tag">
                        {getScopeLabel(cat.appliesTo)}
                      </span>}
                    </div>
                  </div>

                  <div className="categoria-actions">
                    <button 
                      type="button" 
                      className="cat-action-btn edit-cat-btn"
                      onClick={() => handleOpenEdit(cat)}
                      title={isProfile ? 'Editar perfil' : 'Editar categoria'}
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      type="button" 
                      className="cat-action-btn delete-cat-btn"
                      onClick={() => handleDelete(cat)}
                      title={isProfile ? 'Excluir perfil' : 'Excluir categoria'}
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
            <h4><AppIcon name={editingCategory ? "pencil" : "plus"} /> {editingCategory ? `Editar ${entityName}` : isProfile ? 'Novo Perfil' : 'Nova Categoria'}</h4>
          </div>

          <div className="form-row-duo">
            <div className="form-field field-name">
              <label htmlFor="category-name">Nome {isProfile ? 'do Perfil' : 'da Categoria'}</label>
              <input 
                type="text" 
                id="category-name"
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Ex: Trabalho, Estudos, Finanças..."
                required
                autoFocus
              />
            </div>
            <div className="form-field field-icon">
              <label htmlFor="category-icon">Ícone</label>
              <IconSelect id="category-icon" label="Ícone" value={icon} onChange={setIcon}
                options={ICON_OPTIONS.map(([value, label]) => ({ value, label, icon: value, color }))} />
            </div>
          </div>

          {!isProfile && <div className="form-field">
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
                <span>Tarefas e Bloco de Notas (Ambos)</span>
              </label>
              <label className={`scope-radio-btn ${appliesTo === 'task' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="appliesTo" 
                  value="task" 
                  checked={appliesTo === 'task'} 
                  onChange={() => setAppliesTo('task')} 
                />
                <span><AppIcon name="target" /> Apenas Tarefas</span>
              </label>
              <label className={`scope-radio-btn ${appliesTo === 'note' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="appliesTo" 
                  value="note" 
                  checked={appliesTo === 'note'} 
                  onChange={() => setAppliesTo('note')} 
                />
                <span><AppIcon name="note" /> Apenas Bloco de Notas</span>
              </label>
            </div>
          </div>}

          <div className="form-field">
            <label>Cor de Identificação {isProfile ? 'do Perfil' : 'da Categoria'}</label>
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
              <span>Salvar {entityName}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default GerenciadorCategorias;
