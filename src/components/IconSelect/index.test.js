import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import IconSelect from '.';

function Picker() {
  const [value, onChange] = useState('music');
  return <IconSelect label="Categoria" value={value} onChange={onChange} options={[
    { value: 'music', label: 'Música', icon: 'music' }, { value: 'house', label: 'Casa', icon: 'house' }
  ]} />;
}

test('opens options with accessible labels and selects using the keyboard', () => {
  render(<Picker />);
  const control = screen.getByRole('combobox', { name: 'Categoria' });
  fireEvent.click(control);
  expect(screen.getAllByRole('option')).toHaveLength(2);
  fireEvent.keyDown(control, { key: 'ArrowDown' });
  fireEvent.keyDown(control, { key: 'Enter' });
  expect(control.textContent).toBe('Casa');
  expect(control.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(control);
  fireEvent.keyDown(control, { key: 'Escape' });
  expect(control.getAttribute('aria-expanded')).toBe('false');
});
