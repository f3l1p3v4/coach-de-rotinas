import { workspaceStore } from './workspaceStore';
import { normalizeTask, todayString } from '../utils/workspaceData';

// Data is hydrated by CloudGate before any planner component can mount.
export async function loadUserTasks(userId) { return workspaceStore.read('daily_tasks', userId).map(normalizeTask); }
export async function syncUserTasks(userId, tasks) {
  workspaceStore.write('daily_tasks', tasks.map(normalizeTask), userId);
  await workspaceStore.flush();
}
export async function deleteUserTask(userId, taskId) {
  const tasks = workspaceStore.read('daily_tasks', userId);
  workspaceStore.write('daily_tasks', tasks.filter(task => String(task.id) !== String(taskId)), userId);
  await workspaceStore.flush();
}
export async function loadUserTemplates(userId) { return workspaceStore.read('custom_task_templates', userId).map(normalizeTask); }
export async function syncUserTemplates(userId, templates) {
  workspaceStore.write('custom_task_templates', templates.map(normalizeTask), userId);
  await workspaceStore.flush();
}
export async function loadUserNotes(userId) { return workspaceStore.read('coach_anotacoes', userId); }
export async function syncUserNotes(userId, notes) {
  workspaceStore.write('coach_anotacoes', notes, userId);
  await workspaceStore.flush();
}
export async function loadUserFocusScore(userId) { return workspaceStore.read('focus_scores', userId)[todayString()] || 0; }
export async function syncUserFocusScore(userId, count) {
  const scores = workspaceStore.read('focus_scores', userId);
  workspaceStore.write('focus_scores', { ...scores, [todayString()]: count }, userId);
  await workspaceStore.flush();
}
export async function loadUserTaskHistory(userId) { return workspaceStore.read('daily_task_history', userId); }
export async function syncUserTaskHistory(userId, history) {
  workspaceStore.write('daily_task_history', history, userId);
  await workspaceStore.flush();
}
