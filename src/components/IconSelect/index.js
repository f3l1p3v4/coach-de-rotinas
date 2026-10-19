import React, { useEffect, useId, useRef, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import AppIcon from '../AppIcon';
import './styles.css';

export default function IconSelect({ id, label, value, options, onChange, placeholder = 'Selecione', className = '' }) {
  const generatedId = useId();
  const listId = `${generatedId}-options`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const container = useRef(null);
  const trigger = useRef(null);
  const chosen = options.find(option => option.value === value);
  useEffect(() => {
    const close = event => { if (!container.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active, listId]);
  const select = option => {
    onChange(option.value);
    setOpen(false);
    trigger.current?.focus();
  };
  const handleKeyDown = event => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape', 'Enter', ' '].includes(event.key)) event.preventDefault();
    if (event.key === 'Escape' || event.key === 'Tab') { setOpen(false); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      setOpen(true);
      setActive(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key === 'Home') { setActive(0); }
    else if (event.key === 'End') { setActive(options.length - 1); }
    else if (event.key === 'Enter' || event.key === ' ') {
      if (open && options[active]) select(options[active]);
      else { setActive(Math.max(0, options.findIndex(option => option.value === value))); setOpen(true); }
    } else if (event.key.length === 1) {
      const index = options.findIndex(option => option.label.toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()));
      if (index >= 0) { setActive(index); setOpen(true); }
    }
  };
  return <div ref={container} className={`icon-select ${className}`}>
    <button id={id} ref={trigger} type="button" role="combobox" aria-label={label}
      aria-expanded={open} aria-controls={listId} aria-haspopup="listbox"
      aria-activedescendant={open ? `${listId}-${active}` : undefined}
      className="icon-select-trigger" onKeyDown={handleKeyDown}
      onClick={() => { setActive(Math.max(0, options.findIndex(option => option.value === value))); setOpen(!open); }}>
      {chosen?.icon && <AppIcon name={chosen.icon} color={chosen.color} />}
      <span>{chosen?.label || placeholder}</span><CaretDown size={16} />
    </button>
    {open && <ul id={listId} role="listbox" aria-label={label} className="icon-select-menu">
      {options.map((option, index) => <li key={option.value} id={`${listId}-${index}`} role="option"
        aria-selected={option.value === value} className={index === active ? 'highlighted' : ''}
        onMouseEnter={() => setActive(index)} onClick={() => select(option)}>
        {option.icon && <AppIcon name={option.icon} color={option.color} />}
        <span>{option.label}</span>{option.value === value && <AppIcon name="check" color="currentColor" size={16} />}
      </li>)}
    </ul>}
  </div>;
}
