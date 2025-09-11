import React from 'react';
import './App.css';
import DailyPlanner from './components/DailyPlanner';
import Sidebar from './components/Sidebar';

function App() {
  return (
    <div className="App">
      <main className="main-content">
        <DailyPlanner />
      </main>
      <aside className="sidebar-content">
        <Sidebar />
      </aside>
    </div>
  );
}

export default App;