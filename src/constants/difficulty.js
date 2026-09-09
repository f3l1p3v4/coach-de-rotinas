export const DIFFICULTY_LEVELS = [
  { 
    id: 'low', 
    label: 'Baixa', 
    shortLabel: 'Baixa', 
    color: '#10b981', 
    emoji: '🟢',
    description: 'Urgência / prioridade baixa'
  },
  { 
    id: 'medium', 
    label: 'Média', 
    shortLabel: 'Média', 
    color: '#eab308', 
    emoji: '🟡',
    description: 'Urgência / prioridade média'
  },
  { 
    id: 'high', 
    label: 'Alta', 
    shortLabel: 'Alta', 
    color: '#ef4444', 
    emoji: '🔴',
    description: 'Urgência / prioridade alta'
  },
];

export function getDifficultyByColor(color) {
  if (!color) return DIFFICULTY_LEVELS[0]; // Padrão: Baixa
  const lower = String(color).toLowerCase().trim();
  
  if (
    lower === '#10b981' || 
    lower === '#22c55e' || 
    lower === '#059669' || 
    lower === 'low' || 
    lower === 'baixa' || 
    lower === 'easy' || 
    lower === 'facil' || 
    lower === 'fácil'
  ) {
    return DIFFICULTY_LEVELS[0];
  }

  if (
    lower === '#eab308' || 
    lower === '#f59e0b' || 
    lower === '#f97316' || 
    lower === 'medium' || 
    lower === 'média' || 
    lower === 'media' || 
    lower === 'medio' || 
    lower === 'médio'
  ) {
    return DIFFICULTY_LEVELS[1];
  }

  if (
    lower === '#ef4444' || 
    lower === '#e63946' || 
    lower === '#dc2626' || 
    lower === 'high' || 
    lower === 'alta' || 
    lower === 'hard' || 
    lower === 'dificil' || 
    lower === 'difícil'
  ) {
    return DIFFICULTY_LEVELS[2];
  }

  return DIFFICULTY_LEVELS[0];
}
