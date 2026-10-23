import { createWorkspaceStore } from './workspaceStore';
import { defaultWorkspace } from '../utils/workspaceData';

jest.mock('../lib/supabaseClient', () => ({ supabase: null }));
let requestCounter = 0;
beforeEach(() => Object.defineProperty(global.crypto, 'randomUUID', { configurable: true, value: () => `00000000-0000-4000-8000-${String(++requestCounter).padStart(12, '0')}` }));
const row = (userId = 'a', version = 0, data = defaultWorkspace()) => ({ user_id: userId, version, data });

test('requires account hydration and does not expose data across users', async () => {
  const client = { rpc: jest.fn().mockResolvedValue({ data: row(), error: null }) };
  const store = createWorkspaceStore(client);
  expect(() => store.write('theme', 'dark')).toThrow('Entre');
  await store.load('a');
  expect(() => store.read('daily_tasks', 'b')).toThrow('Entre');
  store.reset();
  expect(store.getSnapshot().data).toEqual({});
  expect(() => store.read('daily_tasks', 'a')).toThrow('Entre');
});

test('persists empty lists as valid data, batches distinct collections and awaits acknowledgement', async () => {
  let confirm;
  const client = { rpc: jest.fn().mockResolvedValueOnce({ data: row(), error: null }).mockImplementationOnce(() => new Promise(resolve => { confirm = resolve; })) };
  const store = createWorkspaceStore(client);
  await store.load('a');
  store.write('coach_categories', []);
  store.write('theme', 'dark');
  const saving = store.flush();
  expect(store.getSnapshot().status).toBe('saving');
  expect(client.rpc.mock.calls[1][1].p_patch).toEqual({ coach_categories: [], theme: 'dark' });
  confirm({ data: { user_id: 'a', version: 1 }, error: null });
  await saving;
  expect(store.getSnapshot().status).toBe('saved');
  expect(store.read('coach_categories')).toEqual([]);
});

test('preserves pending work on failure and retries with the same idempotency key', async () => {
  const client = { rpc: jest.fn().mockResolvedValueOnce({ data: row(), error: null }).mockResolvedValueOnce({ error: { message: 'offline' } }).mockResolvedValueOnce({ data: { user_id: 'a', version: 1 }, error: null }) };
  const store = createWorkspaceStore(client);
  await store.load('a');
  store.write('theme', 'dark');
  await expect(store.flush()).rejects.toThrow('offline');
  expect(store.getSnapshot().status).toBe('error');
  expect(store.exportPending().theme).toBe('dark');
  await store.retry();
  expect(client.rpc.mock.calls[2][1].p_request_id).toBe(client.rpc.mock.calls[1][1].p_request_id);
  expect(store.getSnapshot().status).toBe('saved');
});

test('blocks conflicting writes rather than overwriting a newer device version', async () => {
  const client = { rpc: jest.fn().mockResolvedValueOnce({ data: row(), error: null }).mockResolvedValueOnce({ error: { code: '40001' } }) };
  const store = createWorkspaceStore(client);
  await store.load('a');
  store.write('theme', 'dark');
  await expect(store.flush()).rejects.toThrow('outro dispositivo');
  expect(() => store.write('theme', 'light')).toThrow('outro dispositivo');
});

test('a failed load can be retried and a late response cannot repopulate a logged-out account', async () => {
  let respond;
  const client = { rpc: jest.fn().mockResolvedValueOnce({ error: { message: 'schema missing' } }).mockImplementationOnce(() => new Promise(resolve => { respond = resolve; })) };
  const store = createWorkspaceStore(client);
  await expect(store.load('a')).rejects.toThrow('schema missing');
  const loading = store.load('a');
  store.reset();
  respond({ data: row() });
  await loading;
  expect(store.getSnapshot().ready).toBe(false);
});

test('a late save response cannot change the newly authenticated account', async () => {
  let acknowledge;
  const client = { rpc: jest.fn().mockResolvedValueOnce({ data: row('a'), error: null })
    .mockImplementationOnce(() => new Promise(resolve => { acknowledge = resolve; }))
    .mockResolvedValueOnce({ data: row('b'), error: null }) };
  const store = createWorkspaceStore(client);
  await store.load('a');
  store.write('theme', 'dark');
  const saving = store.flush();
  await store.load('b');
  acknowledge({ data: { user_id: 'a', version: 1 }, error: null });
  await saving;
  expect(store.getSnapshot().userId).toBe('b');
  expect(store.read('theme')).toBe('light');
});

test('persists a derived default if the database row did not yet contain that preference', async () => {
  const client = { rpc: jest.fn().mockResolvedValueOnce({ data: row('a', 0, {}), error: null }).mockResolvedValueOnce({ data: { user_id: 'a', version: 1 }, error: null }) };
  const store = createWorkspaceStore(client);
  await store.load('a');
  store.write('theme', 'light');
  await store.flush();
  expect(client.rpc.mock.calls[1][1].p_patch).toEqual({ theme: 'light' });
  const calls = client.rpc.mock.calls.length;
  store.write('theme', 'light');
  await store.flush();
  expect(client.rpc.mock.calls).toHaveLength(calls);
});

test('a rejected network request while loading exposes an error instead of an endless loading screen', async () => {
  const store = createWorkspaceStore({ rpc: jest.fn().mockRejectedValue(new Error('Network unavailable')) });
  await expect(store.load('a')).rejects.toThrow('Network unavailable');
  expect(store.getSnapshot().status).toBe('error');
  expect(store.getSnapshot().ready).toBe(false);
});

test('a response without a valid server version is never treated as a successful save', async () => {
  const client = { rpc: jest.fn().mockResolvedValueOnce({ data: row(), error: null }).mockResolvedValueOnce({ data: { user_id: 'a' }, error: null }) };
  const store = createWorkspaceStore(client);
  await store.load('a');
  store.write('theme', 'dark');
  await expect(store.flush()).rejects.toThrow('não confirmou');
  expect(store.getSnapshot().status).toBe('error');
});
