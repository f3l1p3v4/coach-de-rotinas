import { appData } from '../services/workspaceStore';
import { DEFAULT_PROFILES } from '../utils/workspaceData';
export { DEFAULT_PROFILES };

export function getStoredProfiles() {
  try {
    const saved = JSON.parse(appData.getItem('coach_profiles'));
    if (Array.isArray(saved)) return saved;
  } catch (error) {}
  return DEFAULT_PROFILES;
}

export function saveStoredProfiles(profiles) {
  appData.setItem('coach_profiles', JSON.stringify(profiles));
  window.dispatchEvent(new CustomEvent('coach-profiles-changed', { detail: profiles }));
}

export function getTaskProfile(task) {
  if (Object.prototype.hasOwnProperty.call(task, 'profile')) return task.profile;
  return ['Pessoal', 'Trabalho'].includes(task.category) ? task.category : 'Pessoal';
}

export function migrateTaskProfile(task) {
  if (Object.prototype.hasOwnProperty.call(task, 'profile')) return task;
  const legacy = ['Pessoal', 'Trabalho'].includes(task.category);
  return { ...task, profile: getTaskProfile(task), category: legacy ? null : task.category };
}
