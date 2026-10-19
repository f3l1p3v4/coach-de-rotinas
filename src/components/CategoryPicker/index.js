import AppIcon from '../AppIcon';
import IconSelect from '../IconSelect';
import React, { useState, useEffect } from 'react';
import { 
  getStoredCategories, 
  addStoredCategory
} from '../../constants/categories';
import { DIFFICULTY_LEVELS, getDifficultyByColor } from '../../constants/difficulty';
import './styles.css';

function CategoryPicker({ 
  category, 
  onChangeCategory, 
  color, 
  onChangeColor, 
  difficulty, 
  onChangeDifficulty, 
  appliesTo = 'task',
  showCategory = true,
  showDifficulty = true,
  className = ''
}) {
  const [categories, setCategories] = useState(() => getStoredCategories(appliesTo));
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    const refreshCategories = () => {
      setCategories(getStoredCategories(appliesTo));
    };

    refreshCategories();
    window.addEventListener('coach-categories-changed', refreshCategories);
    return () => {
      window.removeEventListener('coach-categories-changed', refreshCategories);
    };
  }, [appliesTo]);

  const handleSelectChange = (e) => {
    const val = e;
    if (val === '__NEW__') {
      setIsCreatingNew(true);
      setNewCatName('');
    } else {
      setIsCreatingNew(false);
      onChangeCategory(val);
    }
  };

  const handleAddNewCategory = (e) => {
    if (e) e.preventDefault();
    if (!newCatName.trim()) return;
    const name = newCatName.trim();
    const updated = addStoredCategory(name, '#3b82f6', 'tag', appliesTo);
    if (updated) {
      setCategories(getStoredCategories(appliesTo));
    }
    onChangeCategory(name);
    setIsCreatingNew(false);
  };

  const selectedDifficulty = getDifficultyByColor(color || difficulty);

  const handleSelectDifficulty = (level) => {
    if (onChangeColor) {
      onChangeColor(level.color);
    }
    if (onChangeDifficulty) {
      onChangeDifficulty(level.id);
    }
  };

  return (
    <div className={`category-picker-container ${className}`.trim()}>
      {showCategory && (
        <div className="category-field-group">
        <label className="picker-label">Categoria</label>
        {!isCreatingNew ? (
          <IconSelect label="Categoria" value={category || ''} onChange={handleSelectChange}
            options={[{ value: '', label: 'Sem Categoria', icon: 'tag' },
              ...categories.map(cat => ({ value: cat.name, label: cat.name, icon: cat.icon, color: cat.color })),
              { value: '__NEW__', label: 'Criar nova categoria...', icon: 'plus' }]} />
        ) : (
          <div className="new-category-inline-form">
            <input 
              type="text" 
              placeholder="Nome da categoria..." 
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddNewCategory(e); }}
              autoFocus
              className="new-cat-input"
            />
            <button 
              type="button" 
              onClick={handleAddNewCategory} 
              className="new-cat-confirm-btn"
            >
              Adicionar
            </button>
            <button 
              type="button" 
              onClick={() => setIsCreatingNew(false)} 
              className="new-cat-cancel-btn"
              aria-label="Cancelar nova categoria"
            >
              <AppIcon name="close" />
            </button>
          </div>
        )}
      </div>
      )}

      {showDifficulty && (
        <div className="difficulty-selector-group">
          <label className="picker-label">Nível de Urgência / Prioridade</label>
          <div className="difficulty-options">
            {DIFFICULTY_LEVELS.map(level => {
              const isSelected = selectedDifficulty.id === level.id;
              return (
                <button
                  key={level.id}
                  type="button"
                  className={`difficulty-option-btn ${isSelected ? 'selected' : ''}`}
                  style={{
                    borderColor: isSelected ? level.color : undefined,
                    color: isSelected ? 'var(--title-color, #111827)' : 'var(--secondary-text, #4b5563)',
                    fontWeight: isSelected ? 700 : 500,
                  }}
                  onClick={() => handleSelectDifficulty(level)}
                  title={level.description}
                >
                  <span 
                    className="diff-indicator-dot" 
                    style={{ backgroundColor: level.color }} 
                  />
                  <span className="diff-option-text">{level.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryPicker;
