import { loadUserTasks, syncUserTasks } from './supabaseService';
import { workspaceStore } from './workspaceStore';
import { supabase } from '../lib/supabaseClient';

jest.mock('../lib/supabaseClient', () => ({ supabase: { rpc: jest.fn() } }));
beforeEach(async () => {
  jest.clearAllMocks(); workspaceStore.reset();
  Object.defineProperty(global.crypto, 'randomUUID', { configurable: true, value: () => '00000000-0000-4000-8000-000000000001' });
  supabase.rpc.mockResolvedValue({ data: { user_id: 'account', version: 0, data: {} }, error: null });
  await workspaceStore.load('account');
  supabase.rpc.mockResolvedValue({ data: { user_id: 'account', version: 1 }, error: null });
});

test('saves profiles, recurrence exclusions and categories together in Supabase', async () => {
  await syncUserTasks('account', [{ id: 'a', profile: 'Estúdio', category: 'Música', deletedDates: ['2026-10-20'], recurringUntil: '2026-11-01' }]);
  const payload = supabase.rpc.mock.calls.find(([name]) => name === 'save_workspace')[1].p_patch;
  expect(payload.daily_tasks[0]).toMatchObject({ profile: 'Estúdio', category: 'Música', deletedDates: ['2026-10-20'], recurringUntil: '2026-11-01' });
  expect(await loadUserTasks('account')).toEqual(payload.daily_tasks);
});

test('database errors propagate instead of claiming a local save succeeded', async () => {
  supabase.rpc.mockResolvedValue({ error: { message: 'permission denied' } });
  await expect(syncUserTasks('account', [{ id: 'a', profile: 'Trabalho' }])).rejects.toThrow('permission denied');
  expect(workspaceStore.getSnapshot().status).toBe('error');
});
