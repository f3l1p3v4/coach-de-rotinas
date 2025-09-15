import React, { useState } from 'react';
import './App.css';
import DailyPlanner from './components/DailyPlanner';
import CoachingDiasDificeis from './components/CoachingDiasDificeis';
import BlocoDeNotas from './components/BlocoDeNotas';
import GuiaMetodos from './components/GuiaMetodos';
import FloatingMenuMobile from './components/FloatingMenuMobile';
import { X } from '@phosphor-icons/react';


function App() {
  const [showMobileNotepad, setShowMobileNotepad] = useState(false);

  return (
    <div className="App">
      <CoachingDiasDificeis />
      <div className="app-body">
        <main className="main-content">
          <DailyPlanner />
        </main>
        <aside className="right-sidebar">
          <BlocoDeNotas />
          <GuiaMetodos />
        </aside>
      </div>

      {/* --- Mobile Only Elements --- */}
      <div className="mobile-only">
        {!showMobileNotepad && (
          <div className="floating-menu-container">
            <FloatingMenuMobile
              onNotepadClick={() => setShowMobileNotepad(true)}
              onTabataClick={() => alert('Tabata ainda não implementado!')}
            />
          </div>
        )}

        {showMobileNotepad && (
          <div className="mobile-card-overlay" onClick={() => setShowMobileNotepad(false)}>
            <div className="mobile-card-content" onClick={(e) => e.stopPropagation()}>
              <button className="mobile-card-close" onClick={() => setShowMobileNotepad(false)}>
                <X size={20} />
              </button>
              <BlocoDeNotas />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;