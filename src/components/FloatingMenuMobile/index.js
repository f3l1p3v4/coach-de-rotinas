import React from 'react';
import { Notepad, Trophy, ClockClockwise, Gear } from '@phosphor-icons/react';

import './styles.css';

function FloatingMenuMobile({ onNotepadClick, onPlacarClick, onHistoryClick, onSettingsClick }) {
  return (
    <div className="floating-menu-mobile">
      <button onClick={onNotepadClick}>
        <Notepad size={18} />
        <span>Anotações</span>
      </button>
      <button onClick={onPlacarClick}>
        <Trophy size={18} />
        <span>Placar</span>
      </button>
      <button onClick={onHistoryClick}>
        <ClockClockwise size={18} />
        <span>Histórico</span>
      </button>
      <button onClick={onSettingsClick}>
        <Gear size={18} />
      </button>
    </div>
  );
}

export default FloatingMenuMobile;