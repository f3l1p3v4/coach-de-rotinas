export const DEFAULT_CATEGORIES = [
  { id: 'trabalho', name: 'Trabalho', color: '#3b82f6', emoji: '💼', appliesTo: 'both' },
  { id: 'estudos', name: 'Estudos', color: '#8b5cf6', emoji: '📚', appliesTo: 'both' },
  { id: 'pessoal', name: 'Pessoal', color: '#10b981', emoji: '👤', appliesTo: 'both' },
  { id: 'saude', name: 'Saúde / Treino', color: '#f97316', emoji: '🏃', appliesTo: 'both' },
  { id: 'espiritual', name: 'Espiritual', color: '#eab308', emoji: '🙏', appliesTo: 'both' },
  { id: 'financas', name: 'Finanças', color: '#059669', emoji: '💰', appliesTo: 'both' },
  { id: 'casa', name: 'Casa', color: '#ec4899', emoji: '🧹', appliesTo: 'both' },
  { id: 'foco', name: 'Foco Geral', color: '#ef4444', emoji: '🎯', appliesTo: 'both' },
];

export const CATEGORY_COLORS = [
  '#3b82f6', // Azul
  '#8b5cf6', // Roxo
  '#10b981', // Verde
  '#f97316', // Laranja
  '#eab308', // Amarelo
  '#ef4444', // Vermelho
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#64748b', // Cinza
];

export function getStoredCategories(filterAppliesTo = null) {
  let list = DEFAULT_CATEGORIES;
  try {
    const saved = localStorage.getItem('coach_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch (e) {}

  if (!filterAppliesTo) return list;

  return list.filter(cat => {
    const applies = cat.appliesTo || 'both';
    if (applies === 'both') return true;
    return applies === filterAppliesTo;
  });
}

export function notifyCategoriesChanged(updated) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('coach-categories-changed', { detail: updated }));
  }
}

export function saveStoredCategories(categories) {
  try {
    localStorage.setItem('coach_categories', JSON.stringify(categories));
    notifyCategoriesChanged(categories);
  } catch (e) {}
}

export function getCategoryColor(categoryName, defaultColor = '#3b82f6') {
  if (!categoryName) return null;
  const categories = getStoredCategories();
  const match = categories.find(c => c.name.toLowerCase() === categoryName.trim().toLowerCase());
  return match ? match.color : defaultColor;
}

export function addStoredCategory(name, color = '#3b82f6', emoji = '🏷️', appliesTo = 'both') {
  if (!name || !name.trim()) return;
  const categories = getStoredCategories();
  const exists = categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase());
  if (!exists) {
    const updated = [...categories, {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      color: color || '#3b82f6',
      emoji: emoji || '🏷️',
      appliesTo: appliesTo || 'both'
    }];
    saveStoredCategories(updated);
    return updated;
  }
  return categories;
}

export function updateStoredCategory(id, updatedFields) {
  if (!id) return;
  const categories = getStoredCategories();
  const updated = categories.map(cat => {
    if (cat.id === id || cat.name.toLowerCase() === String(id).toLowerCase()) {
      return {
        ...cat,
        ...updatedFields,
        name: updatedFields.name ? updatedFields.name.trim() : cat.name
      };
    }
    return cat;
  });
  saveStoredCategories(updated);
  return updated;
}

export function deleteStoredCategory(id) {
  if (!id) return;
  const categories = getStoredCategories();
  const updated = categories.filter(cat => cat.id !== id && cat.name.toLowerCase() !== String(id).toLowerCase());
  saveStoredCategories(updated);
  return updated;
}
