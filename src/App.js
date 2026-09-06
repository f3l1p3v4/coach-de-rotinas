import React, { useState, useEffect } from 'react';
import './App.css';
import DailyPlanner, { initialTaskTemplates } from './components/DailyPlanner';
import BannerDinamico from './components/BannerDinamico';
import FloatingMenuMobile from './components/FloatingMenuMobile';
import PlacarFoco from './components/PlacarFoco';
import GerenciadorModelos from './components/GerenciadorModelos';

function App() {
  const [mobileCard, setMobileCard] = useState(null);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [templates, setTemplates] = useState(() => {
    const savedTemplates = localStorage.getItem('custom_task_templates');
    if (savedTemplates) {
      try {
        return JSON.parse(savedTemplates);
      } catch (e) {
        return initialTaskTemplates;
      }
    }
    return initialTaskTemplates;
  });

  useEffect(() => {
    localStorage.setItem('custom_task_templates', JSON.stringify(templates));
  }, [templates]);

  const handleAddTemplate = (newTemplate) => {
    setTemplates(prev => [...prev, newTemplate]);
  };

  const handleEditTemplate = (updatedTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  };

  const handleDeleteTemplate = (templateId) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      return !prev;
    });
  };

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
          <DailyPlanner 
            onPomodoroComplete={handlePomodoroComplete} 
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            templates={templates}
            setTemplates={setTemplates}
          />
        </main>
      </div>

      <div className="mobile-only">
        {mobileCard === 'placar' && (
          <div className="floating-card-container">
            <PlacarFoco count={pomodoroCount} />
          </div>
        )}
        {mobileCard === 'notepad' && (
          <div className="floating-card-container">
            <div style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--title-color)' }}>
              Em breve: Bloco de Notas
            </div>
          </div>
        )}
        {mobileCard === 'history' && (
          <div className="floating-card-container">
            <div style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--title-color)' }}>
              Em breve: Histórico
            </div>
          </div>
        )}
        {mobileCard === 'settings' && (
          <div className="floating-card-container">
            <GerenciadorModelos
              templates={templates}
              onAddTemplate={handleAddTemplate}
              onEditTemplate={handleEditTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onClose={() => setMobileCard(null)}
            />
          </div>
        )}
        <div className="floating-menu-container">
          <FloatingMenuMobile
            onNotepadClick={() => toggleMobileCard('notepad')}
            onPlacarClick={() => toggleMobileCard('placar')}
            onHistoryClick={() => toggleMobileCard('history')}
            onSettingsClick={() => toggleMobileCard('settings')}
          />
        </div>
      </div>
    </div>
  );
}

export default App;