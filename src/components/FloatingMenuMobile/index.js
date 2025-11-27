import React from 'react';
import { Trophy } from '@phosphor-icons/react';

import './styles.css';

function FloatingMenuMobile({ onPlacarClick, onHistoryClick, onSettingsClick }) {
  return (
    <div className="floating-menu-mobile">
      <button onClick={onPlacarClick}>
        <Trophy size={18} />
        <span>Placar</span>
      </button>
    </div>
  );
}

export default FloatingMenuMobile;