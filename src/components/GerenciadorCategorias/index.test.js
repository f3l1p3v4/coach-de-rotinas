import { workspaceStore } from '../../services/workspaceStore';
import { supabase } from '../../lib/supabaseClient';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GerenciadorCategorias from '.';
import { getStoredCategories } from '../../constants/categories';

jest.mock('../../lib/supabaseClient', () => ({ supabase: { rpc: jest.fn() } }));
beforeEach(async () => {
  workspaceStore.reset();
  Object.defineProperty(global.crypto, 'randomUUID', { configurable: true, value: () => '00000000-0000-4000-8000-000000000001' });
  supabase.rpc.mockResolvedValue({ data: { user_id: 'account', version: 0, data: {} }, error: null });
  await workspaceStore.load('account');
  supabase.rpc.mockResolvedValue({ data: { user_id: 'account', version: 1 }, error: null });
});
afterEach(async () => { await workspaceStore.flush(); });

test('lets the user choose an icon, persists it and shows it again while editing', () => {
  render(<GerenciadorCategorias />);
  fireEvent.click(screen.getByRole('button', { name: 'Nova Categoria' }));
  fireEvent.change(screen.getByLabelText('Nome da Categoria'), { target: { value: 'Leitura' } });
  fireEvent.click(screen.getByRole('combobox', { name: 'Ícone' }));
  fireEvent.click(screen.getByRole('option', { name: 'Estudos' }));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar Categoria' }));
  expect(getStoredCategories().find(cat => cat.name === 'Leitura').icon).toBe('book');
  const editButtons = screen.getAllByRole('button', { name: 'Editar categoria' });
  fireEvent.click(editButtons[editButtons.length - 1]);
  expect(screen.getByRole('combobox', { name: 'Ícone' }).textContent).toContain('Estudos');
  expect(screen.getByLabelText('Nome da Categoria').value).toBe('Leitura');
});
