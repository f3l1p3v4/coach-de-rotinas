import { getStoredCategories, saveStoredCategories, addStoredCategory, updateStoredCategory, deleteStoredCategory } from './categories';

beforeEach(() => localStorage.clear());

test('reads legacy categories without losing their data and replaces the old decoration', () => {
  localStorage.setItem('coach_categories', JSON.stringify([
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
  localStorage.setItem('coach_categories', JSON.stringify([
    { id: 'trabalho', name: 'Trabalho' }, { id: 'pessoal', name: 'Pessoal' },
    { id: 'custom', name: 'Leitura', icon: 'book', color: '#123456' }
  ]));
  expect(getStoredCategories().map(item => item.name)).toEqual(['Música', 'Casa', 'Leitura']);
});
