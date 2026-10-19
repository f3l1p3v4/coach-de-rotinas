export const DEFAULT_PROFILES = [
  { id: 'pessoal', name: 'Pessoal', icon: 'user', color: '#10b981' },
  { id: 'trabalho', name: 'Trabalho', icon: 'briefcase', color: '#3b82f6' }
];

export function getStoredProfiles() {
  try {
    const saved = JSON.parse(localStorage.getItem('coach_profiles'));
    if (Array.isArray(saved)) return saved;
  } catch (error) {}
  return DEFAULT_PROFILES;
}

export function saveStoredProfiles(profiles) {
  localStorage.setItem('coach_profiles', JSON.stringify(profiles));
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
