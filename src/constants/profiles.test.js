import { DEFAULT_PROFILES, getStoredProfiles, saveStoredProfiles, migrateTaskProfile } from './profiles';

beforeEach(() => localStorage.clear());

test('profiles start independent of categories and respect an empty customized list', () => {
  expect(getStoredProfiles()).toEqual(DEFAULT_PROFILES);
  saveStoredProfiles([]);
  expect(getStoredProfiles()).toEqual([]);
});

test('migrates old personal/work grouping to profiles and preserves real categories', () => {
  expect(migrateTaskProfile({ id: 'a', category: 'Trabalho' })).toEqual({ id: 'a', profile: 'Trabalho', category: null });
  expect(migrateTaskProfile({ category: 'Música' })).toEqual({ profile: 'Pessoal', category: 'Música' });
  const custom = { category: 'Casa', profile: null };
  expect(migrateTaskProfile(custom)).toBe(custom);
});
