import React, { useState, useEffect } from 'react';
import { 
  getStoredCategories, 
  CATEGORY_COLORS, 
  addStoredCategory,
  getCategoryColor
} from '../../constants/categories';
import './styles.css';

function CategoryPicker({ category, onChangeCategory, color, onChangeColor }) {
  const [categories, setCategories] = useState(getStoredCategories());
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    setCategories(getStoredCategories());
  }, []);

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__NEW__') {
      setIsCreatingNew(true);
      setNewCatName('');
    } else {
      setIsCreatingNew(false);
      onChangeCategory(val);
      if (val) {
        const found = categories.find(c => c.name.toLowerCase() === val.toLowerCase());
        if (found) {
          onChangeColor(found.color);
        } else {
          const autoColor = getCategoryColor(val);
          if (autoColor) onChangeColor(autoColor);
        }
      }
    }
  };

  const handleAddNewCategory = (e) => {
    if (e) e.preventDefault();
    if (!newCatName.trim()) return;
    const name = newCatName.trim();
    const updated = addStoredCategory(name, color || '#3b82f6');
    if (updated) setCategories(updated);
    onChangeCategory(name);
    setIsCreatingNew(false);
  };

  const currentColor = color || (category ? getCategoryColor(category) : '#3b82f6');

  return (
    <div className="category-picker-container">
      <div className="category-field-group">
        <label className="picker-label">Categoria</label>
        {!isCreatingNew ? (
          <select 
            value={category || ''} 
            onChange={handleSelectChange}
            className="category-dropdown"
          >
            <option value="">📝 Sem Categoria</option>
            {categories.map(cat => (
              <option key={cat.id || cat.name} value={cat.name}>
                {cat.emoji || '🏷️'} {cat.name}
              </option>
            ))}
            <option value="__NEW__">➕ Criar nova categoria...</option>
          </select>
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
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="color-palette-group">
        <label className="picker-label">Cor da Categoria / Card</label>
        <div className="color-swatches">
          {CATEGORY_COLORS.map(swatchColor => (
            <button
              key={swatchColor}
              type="button"
              className={`color-swatch-btn ${currentColor?.toLowerCase() === swatchColor.toLowerCase() ? 'active' : ''}`}
              style={{ backgroundColor: swatchColor }}
              onClick={() => onChangeColor(swatchColor)}
              title={swatchColor}
            />
          ))}
          <label className="custom-color-picker-label" title="Cor personalizada">
            <input 
              type="color" 
              value={currentColor?.startsWith('#') ? currentColor : '#3b82f6'} 
              onChange={e => onChangeColor(e.target.value)} 
              className="native-color-input"
            />
            <span 
              className="custom-color-circle" 
              style={{ backgroundColor: currentColor || '#3b82f6' }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default CategoryPicker;
