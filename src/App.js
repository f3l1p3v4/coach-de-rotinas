import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import DailyPlanner, { initialTaskTemplates } from './components/DailyPlanner';
import FloatingMenuMobile from './components/FloatingMenuMobile';
import AjustesModal from './components/AjustesModal';
import BlocoDeNotas from './components/BlocoDeNotas';
import AuthModal from './components/AuthModal';
import GoogleCalendarCard from './components/GoogleCalendarCard';
import { DEFAULT_CATEGORIES, saveStoredCategories } from './constants/categories';
import { Toaster } from 'sonner';

import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { loadUserTemplates, syncUserTemplates, loadUserFocusScore, syncUserFocusScore } from './services/supabaseService';

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function App() {
  const [mobileCard, setMobileCard] = useState(null);
  const [, setPomodoroCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [calendarTaskToAdd, setCalendarTaskToAdd] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const saved = localStorage.getItem('selected_planner_date');
    if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) {
      return saved;
    }
    return getTodayString();
  });

  useEffect(() => {
    localStorage.setItem('selected_planner_date', selectedDate);
  }, [selectedDate]);

  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('custom_task_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return initialTaskTemplates;
  });

  // Escutar autenticação do Supabase
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const u = session?.user ?? null;
        setUser(u);
        const avatar = u?.user_metadata?.avatar_url || u?.user_metadata?.picture;
        if (avatar) localStorage.setItem('google_user_avatar', avatar);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        const avatar = u?.user_metadata?.avatar_url || u?.user_metadata?.picture;
        if (avatar) localStorage.setItem('google_user_avatar', avatar);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const [isTemplatesLoaded, setIsTemplatesLoaded] = useState(false);
  const hasTemplatesLoadedRef = useRef(false);
  const templatesUserRef = useRef(null);

  // Carregar modelos de tarefa ao mudar usuário
  useEffect(() => {
    let isMounted = true;
    async function initTemplates() {
      if (user?.id) {
        hasTemplatesLoadedRef.current = false;
        const tmpls = await loadUserTemplates(user.id, initialTaskTemplates);
        if (isMounted) {
          if (Array.isArray(tmpls)) {
            setTemplates(tmpls);
          }
          templatesUserRef.current = user.id;
          hasTemplatesLoadedRef.current = true;
          setIsTemplatesLoaded(true);
        }
      } else {
        hasTemplatesLoadedRef.current = true;
        setIsTemplatesLoaded(true);
      }
    }
    initTemplates();
    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    const key = `coach_categories_${user?.id || 'guest'}`;
    const previousKey = localStorage.getItem('coach_categories_owner');
    if (previousKey && previousKey !== key) {
      const previous = localStorage.getItem('coach_categories');
      if (previous) localStorage.setItem(previousKey, previous);
    }
    let categories = DEFAULT_CATEGORIES;
    try {
      const existingAccount = user?.created_at && Date.now() - new Date(user.created_at).getTime() > 86400000;
      const saved = localStorage.getItem(key) || (!previousKey && (!user?.id || existingAccount) ? localStorage.getItem('coach_categories') : null);
      if (saved && Array.isArray(JSON.parse(saved))) categories = JSON.parse(saved);
    } catch (e) {}
    localStorage.setItem('coach_categories_owner', key);
    saveStoredCategories(categories);
    const persist = (event) => localStorage.setItem(key, JSON.stringify(event.detail));
    window.addEventListener('coach-categories-changed', persist);
    return () => window.removeEventListener('coach-categories-changed', persist);
  }, [user?.id, user?.created_at]);

  // Sincronizar modelos ao alterar (apenas após inicialização)
  useEffect(() => {
    if (isTemplatesLoaded && hasTemplatesLoadedRef.current && (!user?.id || templatesUserRef.current === user.id)) {
      syncUserTemplates(user?.id, templates);
    }
  }, [templates, user, isTemplatesLoaded]);

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

  // Carregar placar de foco
  useEffect(() => {
    async function initFocusScore() {
      const score = await loadUserFocusScore(user?.id);
      setPomodoroCount(score);
    }
    initFocusScore();
  }, [user]);

  const handlePomodoroComplete = () => {
    setPomodoroCount(currentCount => {
      const newCount = currentCount + 1;
      syncUserFocusScore(user?.id, newCount);
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
          onAuthSuccess={(u) => setUser(u)}
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

export default App;