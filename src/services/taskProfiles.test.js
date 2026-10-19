import { loadUserTasks, syncUserTasks } from './supabaseService';
import { supabase } from '../lib/supabaseClient';

jest.mock('../lib/supabaseClient', () => ({ supabase: { from: jest.fn() }, isSupabaseConfigured: true }));
beforeEach(() => { localStorage.clear(); jest.clearAllMocks(); });

test('retains a locally assigned profile while loading a server with the old schema', async () => {
  localStorage.setItem('task_profiles_account', JSON.stringify({ a: 'Estúdio' }));
  supabase.from.mockReturnValue({ select: () => ({ eq: () => ({ order: async () => ({ data: [{ id: 'a', category: 'Música' }], error: null }) }) }) });
  const tasks = await loadUserTasks('account');
  expect(tasks[0]).toMatchObject({ profile: 'Estúdio', category: 'Música' });
});

test('sends profile separately and falls back without breaking task saves on an old schema', async () => {
  const upsert = jest.fn().mockResolvedValueOnce({ error: { message: 'column profile does not exist' } }).mockResolvedValueOnce({ error: null });
  supabase.from.mockReturnValue({ upsert, select: () => ({ eq: async () => ({ data: [{ id: 'a' }] }) }) });
  await syncUserTasks('account', [{ id: 'a', profile: 'Trabalho', category: 'Música' }]);
  expect(upsert.mock.calls[0][0][0]).toMatchObject({ profile: 'Trabalho', category: 'Música' });
  expect(upsert.mock.calls[1][0][0]).not.toHaveProperty('profile');
  expect(JSON.parse(localStorage.getItem('task_profiles_account'))).toEqual({ a: 'Trabalho' });
});
