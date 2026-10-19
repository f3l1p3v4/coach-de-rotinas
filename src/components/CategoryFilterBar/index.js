import AppIcon from '../AppIcon';
import React from 'react';
import './styles.css';

function CategoryFilterBar({
  profiles = [],
  profileCounts = {},
  totalCount = 0,
  uncategorizedCount = 0,
  selectedProfile = '',
  selectedProfiles = [],
  onSelectProfile,
  onToggleProfile,
  weekday
}) {
  // Suporte a selectedProfile ou retrocompatibilidade com selectedProfiles
  const currentSelected = selectedProfile || (selectedProfiles.length > 0 ? selectedProfiles[0] : '');
  const handleSelect = onSelectProfile || onToggleProfile;

  const profilesToShow = profiles;

  // Categorias que existem nas tarefas mas não estavam na lista cadastrada
  const registeredNames = new Set(profiles.map(c => c.name.toLowerCase().trim()));
  const extraCategories = Object.keys(profileCounts)
    .filter(name => !registeredNames.has(name.toLowerCase().trim()) && profileCounts[name] > 0)
    .map(name => ({
      name,
      color: '#3b82f6',
      icon: 'tag'
    }));

  const allDisplayCategories = [...profilesToShow, ...extraCategories];

  return (
    <div className="category-filter-bar-container">
      <div className="category-filter-bar" role="tablist" aria-label="Perfis">
        {/* Categorias: seleção exclusiva (ou uma, ou outra) */}
        {allDisplayCategories.map(cat => {
          const isSelected = currentSelected?.toLowerCase().trim() === cat.name.toLowerCase().trim();
          const count = profileCounts[cat.name] || 0;

          return (
            <button
              key={cat.name}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`filter-pill-btn filter-pill-category ${isSelected ? 'active' : ''}`}
              onClick={() => handleSelect && handleSelect(cat.name)}
              title={`Filtrar perfil ${cat.name}`}
            >
              <AppIcon name={cat.icon} color="currentColor" size={18} />
              <span className="filter-name">{cat.name}</span>
              <span className="filter-count">({count})</span>
            </button>
          );
        })}

        {/* Sem Perfil (se houver tarefas sem perfil no dia) */}
        {uncategorizedCount > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={currentSelected === '__none__'}
            className={`filter-pill-btn filter-pill-category ${currentSelected === '__none__' ? 'active' : ''}`}
            onClick={() => handleSelect && handleSelect('__none__')}
            title="Filtrar tarefas sem perfil"
          >
            <span className="filter-name">Sem Perfil</span>
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