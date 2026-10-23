import { defaultWorkspace, normalizeWorkspace } from './workspaceData';

test('migrates task fields and history without changing dates, statuses, notes or deleted occurrences', () => {
  const result = normalizeWorkspace({ daily_tasks: [{ id: 1, category: 'Trabalho', is_recurring: true, recurring_days: [1, 3], deleted_dates: ['2026-10-20'] }], daily_task_history: { h: { id: 'h', task_id: 1, date: '2026-10-19', status: 'failed', observation: 'observação', completed_at: '2026-10-19T10:00:00Z' } } });
  expect(result.daily_tasks[0]).toMatchObject({ id: '1', profile: 'Trabalho', category: null, recurringDays: [1, 3], deletedDates: ['2026-10-20'] });
  expect(result.daily_task_history.h).toMatchObject({ taskId: '1', status: 'failed', observation: 'observação', date: '2026-10-19', completedAt: '2026-10-19T10:00:00Z' });
});

test('validates database data and preserves explicit empty lists', () => {
  expect(() => normalizeWorkspace({ daily_tasks: 'invalid' })).toThrow('lista');
  expect(() => normalizeWorkspace({ daily_tasks: [{}] })).toThrow('identificador');
  expect(normalizeWorkspace({ coach_categories: [], coach_profiles: [] })).toMatchObject({ coach_categories: [], coach_profiles: [] });
  expect(defaultWorkspace().daily_tasks).toEqual([]);
});
