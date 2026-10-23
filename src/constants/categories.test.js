import { workspaceStore, appData } from '../services/workspaceStore';
import { supabase } from '../lib/supabaseClient';
import { getStoredCategories, saveStoredCategories, addStoredCategory, updateStoredCategory, deleteStoredCategory } from './categories';

jest.mock('../lib/supabaseClient', () => ({ supabase: { rpc: jest.fn() } }));
beforeEach(async () => {
  workspaceStore.reset();
  Object.defineProperty(global.crypto, 'randomUUID', { configurable: true, value: () => '00000000-0000-4000-8000-000000000001' });
  supabase.rpc.mockResolvedValue({ data: { user_id: 'account', version: 0, data: {} }, error: null });
  await workspaceStore.load('account');
  supabase.rpc.mockResolvedValue({ data: { user_id: 'account', version: 1 }, error: null });
});
afterEach(async () => { await workspaceStore.flush(); });

test('reads legacy categories without losing their data and replaces the old decoration', () => {
  appData.setItem('coach_categories', JSON.stringify([
    { id: 'custom', name: 'Leitura', color: '#123456', emoji: 'legacy', appliesTo: 'note' }
  ]));
  expect(getStoredCategories('note')).toEqual([
    { id: 'custom', name: 'Leitura', color: '#123456', icon: 'tag', appliesTo: 'note' }
  ]);
  expect(getStoredCategories('task')).toEqual([]);
});

test('preserves the chosen icon and color through edits and reloads, including an empty list', () => {
  saveStoredCategories([]);
  addStoredCategory('Projeto', '#ef4444', 'rocket', 'both');
  const [category] = getStoredCategories();
  expect(category.icon).toBe('rocket');
  updateStoredCategory(category.id, { icon: 'book', color: '#8b5cf6' });
  expect(getStoredCategories()[0]).toMatchObject({ name: 'Projeto', icon: 'book', color: '#8b5cf6' });
  deleteStoredCategory(category.id);
  expect(getStoredCategories()).toEqual([]);
});

test('replaces old default categories while keeping custom categories', () => {
  appData.setItem('coach_categories', JSON.stringify([
    { id: 'trabalho', name: 'Trabalho' }, { id: 'pessoal', name: 'Pessoal' },
    { id: 'custom', name: 'Leitura', icon: 'book', color: '#123456' }
  ]));
  expect(getStoredCategories().map(item => item.name)).toEqual(['Música', 'Casa', 'Leitura']);
});
