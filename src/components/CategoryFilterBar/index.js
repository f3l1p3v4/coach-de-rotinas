import React from 'react';
import './styles.css';

function CategoryFilterBar({
  categories = [],
  categoryCounts = {},
  totalCount = 0,
  uncategorizedCount = 0,
  selectedCategories = [],
  onToggleCategory,
  onSelectAll,
  weekday
}) {
  const isAllSelected = selectedCategories.length === 0;

  // Filtrar categorias cadastradas que possuem tarefas no dia ou estão selecionadas
  const categoriesToShow = categories.filter(cat => {
    const count = categoryCounts[cat.name] || 0;
    const isSelected = selectedCategories.includes(cat.name);
    return count > 0 || isSelected;
  });

  // Categorias que existem nas tarefas mas não estavam na lista cadastrada
  const registeredNames = new Set(categories.map(c => c.name.toLowerCase()));
  const extraCategories = Object.keys(categoryCounts)
    .filter(name => !registeredNames.has(name.toLowerCase()) && categoryCounts[name] > 0)
    .map(name => ({
      name,
      color: '#3b82f6',
      emoji: '🏷️'
    }));

  const allDisplayCategories = [...categoriesToShow, ...extraCategories];

  return (
    <div className="category-filter-bar-container">
      <div className="category-filter-bar" role="tablist">
        {/* Botão Todos */}
        <button
          type="button"
          role="tab"
          aria-selected={isAllSelected}
          className={`filter-pill-btn filter-pill-all ${isAllSelected ? 'active' : ''}`}
          onClick={onSelectAll}
          title="Exibir todas as tarefas"
        >
          <span className="filter-name">Todos</span>
          <span className="filter-count">({totalCount})</span>
        </button>

        {/* Categorias */}
        {allDisplayCategories.map(cat => {
          const isSelected = selectedCategories.includes(cat.name);
          const count = categoryCounts[cat.name] || 0;
          const catColor = cat.color || '#3b82f6';

          return (
            <button
              key={cat.name}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`filter-pill-btn filter-pill-category ${isSelected ? 'active' : ''}`}
              onClick={() => onToggleCategory(cat.name)}
              title={`Filtrar por ${cat.name} (seleção múltipla permitida)`}
              style={
                isSelected
                  ? {
                      borderColor: catColor,
                      backgroundColor: `${catColor}24`,
                    }
                  : undefined
              }
            >
              <span
                className="filter-dot"
                style={{ backgroundColor: catColor }}
              />
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
            aria-selected={selectedCategories.includes('__none__')}
            className={`filter-pill-btn filter-pill-category ${selectedCategories.includes('__none__') ? 'active' : ''}`}
            onClick={() => onToggleCategory('__none__')}
            title="Filtrar tarefas sem categoria"
            style={
              selectedCategories.includes('__none__')
                ? {
                    borderColor: '#6b7280',
                    backgroundColor: 'rgba(107, 114, 128, 0.18)',
                  }
                : undefined
            }
          >
            <span className="filter-dot uncategorized-dot" />
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