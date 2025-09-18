import React from 'react';
import { Notepad, Trophy } from '@phosphor-icons/react';

import './styles.css';

function FloatingMenuMobile({ onNotepadClick, onPlacarClick }) {
  return (
    <div className="floating-menu-mobile">
      <button onClick={onNotepadClick}>
        <Notepad size={22} />
        <span>Bloco de Notas</span>
      </button>
      <button onClick={onPlacarClick}>
        <Trophy size={22} />
        <span>Placar</span>
      </button>
    </div>
  );
}

export default FloatingMenuMobile;