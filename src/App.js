import React, { useState, useEffect } from 'react';
import './App.css';
import DailyPlanner from './components/DailyPlanner';
import BannerDinamico from './components/BannerDinamico';
import BlocoDeNotas from './components/BlocoDeNotas';
import FloatingMenuMobile from './components/FloatingMenuMobile';
import PlacarFoco from './components/PlacarFoco'; // Verifique se esta linha está correta

function App() {
  const [showMobileNotepad, setShowMobileNotepad] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedData = JSON.parse(localStorage.getItem('placar_foco_data'));

    if (savedData && savedData.date === today) {
      setPomodoroCount(savedData.count);
    } else {
      localStorage.setItem('placar_foco_data', JSON.stringify({ count: 0, date: today }));
      setPomodoroCount(0); // Garante que o estado seja 0
    }
  }, []);

  const handlePomodoroComplete = () => {
    const today = new Date().toISOString().split('T')[0];
    // Usando uma função no setState para garantir que estamos a usar o valor mais recente
    setPomodoroCount(currentCount => {
      const newCount = currentCount + 1;
      localStorage.setItem('placar_foco_data', JSON.stringify({ count: newCount, date: today }));
      return newCount;
    });
  };

  const toggleMobileNotepad = () => {
    setShowMobileNotepad(prev => !prev);
  };

  return (
    <div className="App">
      <BannerDinamico />
      <div className="app-body">
        <main className="main-content">
          <DailyPlanner onPomodoroComplete={handlePomodoroComplete} />
        </main>
        <aside className="right-sidebar">
          <PlacarFoco count={pomodoroCount} />
          <BlocoDeNotas />
        </aside>
      </div>

      <div className="mobile-only">
        {showMobileNotepad && (
          <div className="floating-notepad-container">
            <BlocoDeNotas isMobileView={true} />
          </div>
        )}
        <div className="floating-menu-container">
          <FloatingMenuMobile
            onNotepadClick={toggleMobileNotepad}
            onTabataClick={() => alert('Tabata ainda não implementado!')}
          />
        </div>
      </div>
    </div>
  );
}

export default App;