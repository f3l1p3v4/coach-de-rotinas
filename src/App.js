// src/App.js
import React, { useState } from 'react';
import './App.css';
import DailyPlanner from './components/DailyPlanner';
import Sidebar from './components/Sidebar';
import { List } from '@phosphor-icons/react'; // Importando o ícone de menu

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="App">
      {/* O overlay só aparece quando o menu está aberto */}
      {isMenuOpen && <div className="overlay" onClick={toggleMenu} />}

      <main className={`main-content ${isMenuOpen ? 'menu-open' : ''}`}>
        <DailyPlanner />
      </main>

      {/* O botão de menu (hambúrguer) */}
      <button className="mobile-menu-button" onClick={toggleMenu}>
        <List size={24} />
      </button>

      {/* Passamos o estado e a função de fechar para a Sidebar */}
      <Sidebar isOpen={isMenuOpen} onClose={toggleMenu} />
    </div>
  );
}

export default App;