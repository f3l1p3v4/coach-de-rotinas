import React from 'react';
import { Trophy, Notepad, Gear, CalendarBlank } from '@phosphor-icons/react';

import './styles.css';

function FloatingMenuMobile({ onNotepadClick, onPlacarClick, onCalendarClick, onSettingsClick }) {
  return (
    <div className="floating-menu-mobile">
      <button onClick={onNotepadClick}>
        <Notepad size={18} />
        <span>Anotações</span>
      </button>
      <button onClick={onCalendarClick}>
        <CalendarBlank size={18} />
        <span>Agenda</span>
      </button>
      <button onClick={onPlacarClick}>
        <Trophy size={18} />
        <span>Placar</span>
      </button>
      <button onClick={onSettingsClick} title="Ajustes" aria-label="Ajustes">
        <Gear size={22} />
      </button>
    </div>
  );
}

export default FloatingMenuMobile;