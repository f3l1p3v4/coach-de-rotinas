export const DAYS_OF_WEEK = [
  { id: 0, label: 'Dom', fullName: 'Domingo' },
  { id: 1, label: 'Seg', fullName: 'Segunda-feira' },
  { id: 2, label: 'Ter', fullName: 'Terça-feira' },
  { id: 3, label: 'Qua', fullName: 'Quarta-feira' },
  { id: 4, label: 'Qui', fullName: 'Quinta-feira' },
  { id: 5, label: 'Sex', fullName: 'Sexta-feira' },
  { id: 6, label: 'Sáb', fullName: 'Sábado' },
];

export function getRecurrenceLabel(recurringDays = []) {
  if (!recurringDays || recurringDays.length === 0) return null;
  if (recurringDays.length === 7) return 'Todos os dias';
  
  const sorted = [...recurringDays].sort((a, b) => a - b);
  const isWeekdays = sorted.length === 5 && sorted.every((d, i) => d === i + 1);
  if (isWeekdays) return 'Seg a Sex';

  const isWeekend = sorted.length === 2 && sorted.includes(0) && sorted.includes(6);
  if (isWeekend) return 'Fins de semana';

  return sorted.map(d => DAYS_OF_WEEK.find(item => item.id === d)?.label).filter(Boolean).join(', ');
}