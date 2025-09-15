import React from 'react';
import './App.css';
import DailyPlanner from './components/DailyPlanner';
import CoachingDiasDificeis from './components/CoachingDiasDificeis';
import BlocoDeNotas from './components/BlocoDeNotas';
import GuiaMetodos from './components/GuiaMetodos';

function App() {
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
    </div>
  );
}

export default App;
