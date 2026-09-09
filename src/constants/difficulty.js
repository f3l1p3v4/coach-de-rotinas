export const DIFFICULTY_LEVELS = [
  { 
    id: 'easy', 
    label: 'Fácil (Easy)', 
    shortLabel: 'Fácil', 
    color: '#10b981', 
    emoji: '🟢',
    description: 'Tarefas simples, rotineiras ou rápidas'
  },
  { 
    id: 'medium', 
    label: 'Médio (Medium)', 
    shortLabel: 'Médio', 
    color: '#eab308', 
    emoji: '🟡',
    description: 'Tarefas de esforço intermediário'
  },
  { 
    id: 'hard', 
    label: 'Difícil (Hard)', 
    shortLabel: 'Difícil', 
    color: '#ef4444', 
    emoji: '🔴',
    description: 'Tarefas complexas, pesadas ou de alta prioridade'
  },
];

export function getDifficultyByColor(color) {
  if (!color) return DIFFICULTY_LEVELS[0]; // Padrão: Fácil
  const lower = String(color).toLowerCase().trim();
  
  if (
    lower === '#10b981' || 
    lower === '#22c55e' || 
    lower === '#059669' || 
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
    lower === 'medio' || 
    lower === 'médio'
  ) {
    return DIFFICULTY_LEVELS[1];
  }

  if (
    lower === '#ef4444' || 
    lower === '#e63946' || 
    lower === '#dc2626' || 
    lower === 'hard' || 
    lower === 'dificil' || 
    lower === 'difícil'
  ) {
    return DIFFICULTY_LEVELS[2];
  }

  return DIFFICULTY_LEVELS[0];
}
