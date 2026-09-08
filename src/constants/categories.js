export const DEFAULT_CATEGORIES = [
  { id: 'trabalho', name: 'Trabalho', color: '#3b82f6', emoji: '💼' },
  { id: 'estudos', name: 'Estudos', color: '#8b5cf6', emoji: '📚' },
  { id: 'pessoal', name: 'Pessoal', color: '#10b981', emoji: '👤' },
  { id: 'saude', name: 'Saúde / Treino', color: '#f97316', emoji: '🏃' },
  { id: 'espiritual', name: 'Espiritual', color: '#eab308', emoji: '🙏' },
  { id: 'financas', name: 'Finanças', color: '#059669', emoji: '💰' },
  { id: 'casa', name: 'Casa', color: '#ec4899', emoji: '🧹' },
  { id: 'foco', name: 'Foco Geral', color: '#ef4444', emoji: '🎯' },
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

export function getStoredCategories() {
  try {
    const saved = localStorage.getItem('coach_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_CATEGORIES;
}

export function saveStoredCategories(categories) {
  try {
    localStorage.setItem('coach_categories', JSON.stringify(categories));
  } catch (e) {}
}

export function getCategoryColor(categoryName, defaultColor = '#3b82f6') {
  if (!categoryName) return null;
  const categories = getStoredCategories();
  const match = categories.find(c => c.name.toLowerCase() === categoryName.trim().toLowerCase());
  return match ? match.color : defaultColor;
}

export function addStoredCategory(name, color = '#3b82f6', emoji = '🏷️') {
  if (!name || !name.trim()) return;
  const categories = getStoredCategories();
  const exists = categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase());
  if (!exists) {
    const updated = [...categories, {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      color: color || '#3b82f6',
      emoji: emoji || '🏷️'
    }];
    saveStoredCategories(updated);
    return updated;
  }
  return categories;
}

