import { appData } from './services/workspaceStore';
import React, { useState, useEffect } from 'react';
import './App.css';
import DailyPlanner, { initialTaskTemplates } from './components/DailyPlanner';
import FloatingMenuMobile from './components/FloatingMenuMobile';
import AjustesModal from './components/AjustesModal';
import BlocoDeNotas from './components/BlocoDeNotas';
import AuthModal from './components/AuthModal';
import GoogleCalendarCard from './components/GoogleCalendarCard';
import { migrateTaskProfile, getTaskProfile } from './constants/profiles';
import { Toaster } from 'sonner';

import CloudGate from './components/CloudGate';
import { syncUserTemplates, syncUserFocusScore } from './services/supabaseService';

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function WorkspaceApp({ user }) {
  const [mobileCard, setMobileCard] = useState(null);
  const [, setPomodoroCount] = useState(() => JSON.parse(appData.getItem('focus_scores') || '{}')[getTodayString()] || 0);
  const [isDarkMode, setIsDarkMode] = useState(() => appData.getItem('theme') === 'dark');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [calendarTaskToAdd, setCalendarTaskToAdd] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const saved = appData.getItem('selected_planner_date');
    if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) {
      return saved;
    }
    return getTodayString();
  });

  useEffect(() => {
    appData.setItem('selected_planner_date', selectedDate);
  }, [selectedDate]);

  const [templates, setTemplates] = useState(() => {
    try {
      const saved = appData.getItem('custom_task_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(migrateTaskProfile);
      }
    } catch (e) {}
    return initialTaskTemplates;
  });

  useEffect(() => {
    const rename = ({ detail: { previous, next } }) => setTemplates(items => items.map(item => getTaskProfile(item) === previous ? { ...item, profile: next } : item));
    window.addEventListener('coach-profile-renamed', rename);
    return () => window.removeEventListener('coach-profile-renamed', rename);
  }, []);

  useEffect(() => {
    syncUserTemplates(user.id, templates).catch(() => {});
  }, [templates, user.id]);

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
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev ? 'dark' : 'light';
      appData.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      return !prev;
    });
  };

  const handlePomodoroComplete = () => {
    setPomodoroCount(currentCount => {
      const newCount = currentCount + 1;
      syncUserFocusScore(user.id, newCount).catch(() => {});
      return newCount;
    });
  };

  const toggleMobileCard = (card) => {
    setMobileCard(prev => (prev === card ? null : card));
  };

  return (
    <div className="App">
      <Toaster position="top-right" richColors theme={isDarkMode ? 'dark' : 'light'} closeButton />
      <div className="app-body">
        <main className="main-content">
          <DailyPlanner 
            onPomodoroComplete={handlePomodoroComplete} 
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            templates={templates}
            setTemplates={setTemplates}
            user={user}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            calendarTaskToAdd={calendarTaskToAdd}
            onClearCalendarTaskToAdd={() => setCalendarTaskToAdd(null)}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </main>
      </div>

      {isAuthModalOpen && (
        <AuthModal 
          user={user} 
          onClose={() => setIsAuthModalOpen(false)} 
          onAuthSuccess={() => {}}
        />
      )}

      <div className="mobile-only">
        {mobileCard !== null && (
          <div className="floating-card-backdrop" onClick={() => setMobileCard(null)} />
        )}

        {mobileCard === 'calendar' && (
          <div 
            className="floating-card-container"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
          >
            <GoogleCalendarCard 
              onClose={() => setMobileCard(null)}
              selectedDate={selectedDate}
              onAddTaskFromCalendar={(taskData) => {
                setCalendarTaskToAdd(taskData);
                setMobileCard(null);
              }}
            />
          </div>
        )}
        {mobileCard === 'notepad' && (
          <div 
            className="floating-card-container"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
          >
            <BlocoDeNotas onClose={() => setMobileCard(null)} user={user} />
          </div>
        )}
        {mobileCard === 'settings' && (
          <div 
            className="floating-card-container"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
          >
            <AjustesModal
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
            activeCard={mobileCard}
            onNotepadClick={() => toggleMobileCard('notepad')}
            onCalendarClick={() => toggleMobileCard('calendar')}
            onSettingsClick={() => toggleMobileCard('settings')}
          />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <CloudGate>{user => <WorkspaceApp key={user.id} user={user} />}</CloudGate>;
}