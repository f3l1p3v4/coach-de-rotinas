// src/components/Sidebar.js
import React from 'react';
import GuiaMetodos from './GuiaMetodos';
import CoachingDiasDificeis from './CoachingDiasDificeis';
import { X } from '@phosphor-icons/react'; // Ícone de fechar

// Recebe as novas propriedades: isOpen e onClose
function Sidebar({ isOpen, onClose }) {
  return (
    // Aplica a classe 'sidebar-open' dinamicamente
    <aside className={`sidebar-content ${isOpen ? 'sidebar-open' : ''}`}>
      
      {/* Botão para fechar a sidebar no celular */}
      <button className="sidebar-close-button" onClick={onClose}>
        <X size={24} />
      </button>

      <GuiaMetodos />
      <CoachingDiasDificeis />
    </aside>
  );
}

export default Sidebar;