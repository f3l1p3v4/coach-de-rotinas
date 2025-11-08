import React, { useState, useEffect } from 'react';
import './App.css';
import DailyPlanner from './components/DailyPlanner';
import BannerDinamico from './components/BannerDinamico';
import BlocoDeNotas from './components/BlocoDeNotas';
import FloatingMenuMobile from './components/FloatingMenuMobile';
import PlacarFoco from './components/PlacarFoco';

function App() {
  const [mobileCard, setMobileCard] = useState(null);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedData = JSON.parse(localStorage.getItem('placar_foco_data'));
    if (savedData && savedData.date === today) {
      setPomodoroCount(savedData.count);
    } else {
      localStorage.setItem('placar_foco_data', JSON.stringify({ count: 0, date: today }));
    }
  }, []);

  const handlePomodoroComplete = () => {
    const today = new Date().toISOString().split('T')[0];
    setPomodoroCount(currentCount => {
      const newCount = currentCount + 1;
      localStorage.setItem('placar_foco_data', JSON.stringify({ count: newCount, date: today }));
      return newCount;
    });
  };

  const toggleMobileCard = (card) => {
    setMobileCard(prev => (prev === card ? null : card));
  };

  return (
    <div className="App">
      <BannerDinamico />
      <div className="app-body">
        <main className="main-content">
          {/*<PlacarFoco count={pomodoroCount} />*/}
          <DailyPlanner onPomodoroComplete={handlePomodoroComplete} />
        </main>
        {/*<aside className="right-sidebar">
          <PlacarFoco count={pomodoroCount} />
          <BlocoDeNotas />
        </aside>*/}
      </div>

      <div className="mobile-only">
        {mobileCard === 'notepad' && (
          <div className="floating-card-container">
            <BlocoDeNotas isMobileView={true} />
          </div>
        )}
        {mobileCard === 'placar' && (
          <div className="floating-card-container">
            <PlacarFoco count={pomodoroCount} />
          </div>
        )}
        <div className="floating-menu-container">
          <FloatingMenuMobile
            onNotepadClick={() => toggleMobileCard('notepad')}
            onPlacarClick={() => toggleMobileCard('placar')}
          />
        </div>
      </div>
    </div>
  );
}

export default App;