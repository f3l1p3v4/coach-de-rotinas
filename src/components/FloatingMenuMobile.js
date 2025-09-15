import React from 'react';
import { Notepad, Timer } from '@phosphor-icons/react';

function FloatingMenuMobile({ onNotepadClick, onTabataClick }) {
  return (
    <div className="floating-menu-mobile">
      <button onClick={onNotepadClick}>
        <Notepad size={22} />
        <span>Bloco de Notas</span>
      </button>
      <button onClick={onTabataClick}>
        <Timer size={22} />
        <span>Tabata</span>
      </button>
    </div>
  );
}

export default FloatingMenuMobile;
