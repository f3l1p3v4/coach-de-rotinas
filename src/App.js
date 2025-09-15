import React, { useState } from 'react';
import './App.css';
import DailyPlanner from './components/DailyPlanner';
import BannerDinamico from './components/BannerDinamico';
import BlocoDeNotas from './components/BlocoDeNotas';
import FloatingMenuMobile from './components/FloatingMenuMobile';
import PlacarFoco from './components/PlacarFoco';

function App() {
  const [mobileCard, setMobileCard] = useState(null); // null, 'notepad', or 'placar'

  const toggleMobileCard = (card) => {
    setMobileCard(prev => (prev === card ? null : card));
  };

  // Placeholder for pomodoro count
  const pomodoroCount = 5;

  return (
    <div className="App">
      <BannerDinamico />
      <div className="app-body">
        <main className="main-content">
          <DailyPlanner />
        </main>
        <aside className="right-sidebar">
          <PlacarFoco />
          <BlocoDeNotas />
        </aside>
      </div>

      {/* --- Mobile Only Elements --- */}
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