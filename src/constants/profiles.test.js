import { workspaceStore } from '../services/workspaceStore';
import { supabase } from '../lib/supabaseClient';
import { DEFAULT_PROFILES, getStoredProfiles, saveStoredProfiles, migrateTaskProfile } from './profiles';

jest.mock('../lib/supabaseClient', () => ({ supabase: { rpc: jest.fn() } }));
beforeEach(async () => {
  workspaceStore.reset();
  Object.defineProperty(global.crypto, 'randomUUID', { configurable: true, value: () => '00000000-0000-4000-8000-000000000001' });
  supabase.rpc.mockResolvedValue({ data: { user_id: 'account', version: 0, data: {} }, error: null });
  await workspaceStore.load('account');
  supabase.rpc.mockResolvedValue({ data: { user_id: 'account', version: 1 }, error: null });
});
afterEach(async () => { await workspaceStore.flush(); });

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
