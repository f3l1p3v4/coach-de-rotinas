import React, { useState, useEffect } from 'react';
import './App.css';
import DailyPlanner, { initialTaskTemplates } from './components/DailyPlanner';
import BannerDinamico from './components/BannerDinamico';
import FloatingMenuMobile from './components/FloatingMenuMobile';
import PlacarFoco from './components/PlacarFoco';
import GerenciadorModelos from './components/GerenciadorModelos';
import BlocoDeNotas from './components/BlocoDeNotas';
import AuthModal from './components/AuthModal';

import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { loadUserTemplates, syncUserTemplates, loadUserFocusScore, syncUserFocusScore } from './services/supabaseService';

function App() {
  const [mobileCard, setMobileCard] = useState(null);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [templates, setTemplates] = useState(initialTaskTemplates);

  // Escutar autenticação do Supabase
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const [isTemplatesLoaded, setIsTemplatesLoaded] = useState(false);

  // Carregar modelos de tarefa ao mudar usuário
  useEffect(() => {
    let isMounted = true;
    async function initTemplates() {
      if (user?.id) {
        const tmpls = await loadUserTemplates(user.id, initialTaskTemplates);
        if (isMounted) {
          setTemplates(tmpls);
          setIsTemplatesLoaded(true);
        }
      } else {
        setIsTemplatesLoaded(true);
      }
    }
    initTemplates();
    return () => { isMounted = false; };
  }, [user]);

  // Sincronizar modelos ao alterar
  useEffect(() => {
    if (isTemplatesLoaded) {
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
      <BannerDinamico />
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

        {mobileCard === 'placar' && (
          <div 
            className="floating-card-container"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
          >
            <PlacarFoco count={pomodoroCount} />
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
            onSettingsClick={() => toggleMobileCard('settings')}
          />
        </div>
      </div>
    </div>
  );
}

export default App;