import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GerenciadorCategorias from '.';
import { getStoredCategories } from '../../constants/categories';

beforeEach(() => localStorage.clear());

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
