import { rollOverPendingTasks } from './tasks';

const now = new Date(2026, 9, 18, 0, 1);

test('moves only overdue pending tasks to the current local day and removes old emojis', () => {
  const tasks = [
    { id: 'pending', date: '2026-10-10', emoji: '✨' },
    { id: 'done', date: '2026-10-17', completed: true },
    { id: 'failed', date: '2026-10-17', status: 'failed' },
    { id: 'history', date: '2026-10-17' },
    { id: 'recurring', date: '2026-10-17', isRecurring: true },
    { id: 'future', date: '2026-10-19' }
  ];
  const result = rollOverPendingTasks(tasks, { 'history_2026-10-17': { status: 'failed' } }, now);
  expect(result[0]).toEqual({ id: 'pending', date: '2026-10-18' });
  expect(result.slice(1)).toEqual(tasks.slice(1));
  expect(rollOverPendingTasks(result, { 'history_2026-10-17': { status: 'failed' } }, now)).toBe(result);
});
