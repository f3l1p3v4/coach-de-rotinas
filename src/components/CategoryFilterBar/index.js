import React from 'react';
import './styles.css';

function CategoryFilterBar({
  categories = [],
  categoryCounts = {},
  totalCount = 0,
  uncategorizedCount = 0,
  selectedCategory = '',
  selectedCategories = [],
  onSelectCategory,
  onToggleCategory,
  weekday
}) {
  // Suporte a selectedCategory ou retrocompatibilidade com selectedCategories
  const currentSelected = selectedCategory || (selectedCategories.length > 0 ? selectedCategories[0] : '');
  const handleSelect = onSelectCategory || onToggleCategory;

  // Filtrar categorias cadastradas que possuem tarefas no dia ou estão selecionadas
  const categoriesToShow = categories.filter(cat => {
    const count = categoryCounts[cat.name] || 0;
    const isSelected = currentSelected?.toLowerCase().trim() === cat.name.toLowerCase().trim();
    return count > 0 || isSelected;
  });

  // Categorias que existem nas tarefas mas não estavam na lista cadastrada
  const registeredNames = new Set(categories.map(c => c.name.toLowerCase().trim()));
  const extraCategories = Object.keys(categoryCounts)
    .filter(name => !registeredNames.has(name.toLowerCase().trim()) && categoryCounts[name] > 0)
    .map(name => ({
      name,
      color: '#3b82f6',
      emoji: '🏷️'
    }));

  const allDisplayCategories = [...categoriesToShow, ...extraCategories];

  return (
    <div className="category-filter-bar-container">
      <div className="category-filter-bar" role="tablist">
        {/* Categorias: seleção exclusiva (ou uma, ou outra) */}
        {allDisplayCategories.map(cat => {
          const isSelected = currentSelected?.toLowerCase().trim() === cat.name.toLowerCase().trim();
          const count = categoryCounts[cat.name] || 0;

          return (
            <button
              key={cat.name}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`filter-pill-btn filter-pill-category ${isSelected ? 'active' : ''}`}
              onClick={() => handleSelect && handleSelect(cat.name)}
              title={`Filtrar por ${cat.name}`}
            >
              {/* Bolinha branca apenas quando selecionado! */}
              {isSelected && (
                <span className="filter-dot active-dot" />
              )}
              <span className="filter-name">{cat.name}</span>
              <span className="filter-count">({count})</span>
            </button>
          );
        })}

        {/* Sem Categoria (se houver tarefas sem categoria no dia) */}
        {uncategorizedCount > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={currentSelected === '__none__'}
            className={`filter-pill-btn filter-pill-category ${currentSelected === '__none__' ? 'active' : ''}`}
            onClick={() => handleSelect && handleSelect('__none__')}
            title="Filtrar tarefas sem categoria"
          >
            {currentSelected === '__none__' && (
              <span className="filter-dot active-dot" />
            )}
            <span className="filter-name">Sem Categoria</span>
            <span className="filter-count">({uncategorizedCount})</span>
          </button>
        )}
      </div>

      {weekday && (
        <div className="planner-weekday-display" title={`Dia da semana: ${weekday}`}>
          <span className="planner-weekday-text">{weekday}</span>
        </div>
      )}
    </div>
  );
}

export default CategoryFilterBar;