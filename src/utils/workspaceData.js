export const DEFAULT_CATEGORIES = [
  { id: 'musica', name: 'Música', color: '#8b5cf6', icon: 'music', appliesTo: 'both' },
  { id: 'casa', name: 'Casa', color: '#10b981', icon: 'house', appliesTo: 'both' }
];
export const DEFAULT_PROFILES = [
  { id: 'pessoal', name: 'Pessoal', icon: 'user', color: '#10b981' },
  { id: 'trabalho', name: 'Trabalho', icon: 'briefcase', color: '#3b82f6' }
];
export const ARRAY_KEYS = ['daily_tasks', 'custom_task_templates', 'coach_anotacoes', 'coach_categories', 'coach_profiles', 'google_calendar_events', 'daily_tasks_order'];
export const MAP_KEYS = ['daily_task_history', 'calendar_completed_map', 'calendar_status_map', 'calendar_hidden_ids', 'calendar_priority_map', 'focus_scores'];
export const PREFERENCE_KEYS = ['theme', 'selected_planner_date', 'selected_planner_profile'];
export const WORKSPACE_KEYS = [...ARRAY_KEYS, ...MAP_KEYS, ...PREFERENCE_KEYS];
const clone = value => JSON.parse(JSON.stringify(value));
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
export const todayString = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDays = value => {
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { value = value.replace(/[{}]/g, '').split(','); }
  }
  return Array.isArray(value) ? value.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 6) : [];
};
export function normalizeTask(task) {
  const { emoji, user_id, ...item } = task;
  const legacyProfile = ['Pessoal', 'Trabalho'].includes(item.category);
  return { ...item, id: String(item.id),
    profile: own(item, 'profile') ? item.profile : legacyProfile ? item.category : 'Pessoal',
    category: !own(item, 'profile') && legacyProfile ? null : item.category || null,
    isRecurring: Boolean(item.isRecurring ?? item.is_recurring),
    recurringDays: parseDays(item.recurringDays ?? item.recurring_days),
    completedDates: item.completedDates ?? item.completed_dates ?? [],
    failedDates: item.failedDates ?? item.failed_dates ?? [],
    deletedDates: item.deletedDates ?? item.deleted_dates ?? [],
    recurringUntil: item.recurringUntil ?? item.recurring_until ?? null,
    completedAt: item.completedAt ?? item.completed_at ?? null,
    startedAt: item.startedAt ?? item.started_at ?? null,
    status: item.status || (item.completed ? 'completed' : 'pending'),
    subtasks: typeof item.subtasks === 'string' ? JSON.parse(item.subtasks) : item.subtasks || []
  };
}
export function defaultWorkspace() {
  return { daily_tasks: [], custom_task_templates: [], coach_anotacoes: [],
    coach_categories: clone(DEFAULT_CATEGORIES), coach_profiles: clone(DEFAULT_PROFILES),
    google_calendar_events: [], daily_tasks_order: [], daily_task_history: {},
    calendar_completed_map: {}, calendar_status_map: {}, calendar_hidden_ids: {}, calendar_priority_map: {},
    focus_scores: {}, theme: 'light', selected_planner_date: todayString(), selected_planner_profile: 'Trabalho' };
}
export function normalizeWorkspace(input = {}) {
  const result = defaultWorkspace();
  for (const key of ARRAY_KEYS) {
    if (own(input, key)) {
      if (!Array.isArray(input[key])) throw new Error(`O campo ${key} precisa ser uma lista.`);
      result[key] = clone(input[key]);
    }
  }
  for (const key of MAP_KEYS) {
    if (own(input, key)) {
      if (!input[key] || typeof input[key] !== 'object' || Array.isArray(input[key])) throw new Error(`O campo ${key} precisa ser um objeto.`);
      result[key] = clone(input[key]);
    }
  }
  for (const key of PREFERENCE_KEYS) if (typeof input[key] === 'string') result[key] = input[key];
  if (!['light', 'dark'].includes(result.theme)) result.theme = 'light';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result.selected_planner_date)) result.selected_planner_date = todayString();
  for (const key of ['daily_tasks', 'custom_task_templates', 'coach_anotacoes', 'coach_categories', 'coach_profiles', 'google_calendar_events']) {
    if (result[key].some(item => !item || typeof item !== 'object' || item.id == null)) throw new Error(`Há itens sem identificador em ${key}.`);
  }
  result.daily_tasks = result.daily_tasks.map(normalizeTask);
  if (result.daily_tasks_order.length) {
    const order = new Map(result.daily_tasks_order.map((id, index) => [String(id), index]));
    result.daily_tasks.sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity));
  }
  result.daily_task_history = Object.fromEntries(Object.entries(result.daily_task_history).map(([key, item]) => [key, {
    ...item, taskId: String(item.taskId ?? item.task_id), completedAt: item.completedAt ?? item.completed_at ?? null,
    startedAt: item.startedAt ?? item.started_at ?? null,
    subtasks: typeof item.subtasks === 'string' ? JSON.parse(item.subtasks) : item.subtasks || []
  }]));
  result.custom_task_templates = result.custom_task_templates.map(normalizeTask);
  result.coach_categories = result.coach_categories.map(({ emoji, ...item }) => ({ ...item, icon: item.icon || 'tag' }));
  return result;
}
