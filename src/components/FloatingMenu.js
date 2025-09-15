import React, { useState } from 'react';
import { Plus, X, Notepad, TestTube } from '@phosphor-icons/react';
import BlocoDeNotas from './BlocoDeNotas';

function FloatingMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const openNotepad = () => {
    setIsNotepadOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className="fab-container">
        <div className={`fab-menu ${isMenuOpen ? 'open' : ''}`}>
          <button className="fab-menu-item" onClick={openNotepad}>
            <span className="fab-menu-label">Bloco de Notas</span>
            <Notepad size={24} weight="light" />
          </button>
          <button className="fab-menu-item">
            <span className="fab-menu-label">Test</span>
            <TestTube size={24} weight="light" />
          </button>
        </div>
        <button className="fab-main" onClick={toggleMenu}>
          {isMenuOpen ? <X size={28} weight="light" /> : <Plus size={28} weight="light" />}
        </button>
      </div>

      {isNotepadOpen && (
        <div className="modal-overlay" onClick={() => setIsNotepadOpen(false)}>
          <div className="modal-content notepad-modal" onClick={(e) => e.stopPropagation()}>
            <BlocoDeNotas />
            <button className="modal-close-button" onClick={() => setIsNotepadOpen(false)}>
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingMenu;
