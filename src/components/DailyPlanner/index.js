import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { PlusCircle, User, CaretLeft, CaretRight, CalendarBlank } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { loadUserTasks, syncUserTasks } from '../../services/supabaseService';

import TodoItem from '../TodoItem';
import TaskDetailsModal from '../TaskDetailsModal';
import AddTaskModal from '../AddTaskModal';
import CategoryFilterBar from '../CategoryFilterBar';
import { getStoredCategories } from '../../constants/categories';

import './styles.css';

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFormattedDateLabel = (dateStr) => {
  const today = getTodayString();
  if (dateStr === today) return 'Hoje';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const sortTasksChronologically = (taskList) => {
  return [...taskList].sort((a, b) => {
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    return timeA.localeCompare(timeB);
  });
};

const taskTemplates = [
  { id: '1', text: 'Treino', emoji: '💪', category: 'Saúde / Treino', color: '#f97316', description: 'Foco em peito e tríceps. Manter a boa forma e controlar a respiração.', subtasks: [{ id: 101, text: 'Aquecimento - 10 min', completed: false }, { id: 102, text: 'Supino Reto - 4x8', completed: false }] },
  { id: '2', text: 'Estudo Espiritual', emoji: '🙏', category: 'Espiritual', color: '#eab308', description: 'Leitura do capítulo de hoje e meditação. O objetivo é a reflexão.', subtasks: [] },
  { id: '3', text: 'Estudo de Órgão', emoji: '🎹', category: 'Estudos', color: '#8b5cf6', description: 'Praticar as escalas e a nova peça.', subtasks: [{ id: 301, text: 'Escalas - 15 min', completed: false }, { id: 302, text: 'Praticar nova música', completed: false }] },
  { id: '4', text: 'Faculdade / Concursos', emoji: '📚', category: 'Estudos', color: '#8b5cf6', description: 'Revisão da matéria e resolução de exercícios.', subtasks: [{ id: 401, text: 'Ler resumo do capítulo', completed: false }, { id: 402, text: 'Fazer 10 exercícios', completed: false }] },
  { id: '5', text: 'Limpeza Rápida da Casa', emoji: '🧹', category: 'Casa', color: '#ec4899', description: 'Foco num cómodo por 15 minutos.', subtasks: [] },
  { id: '6', text: 'Organização do Dia', emoji: '📋', category: 'Trabalho', color: '#3b82f6', description: 'Organizar manhã de trabalho por 30 min', subtasks: [{ id: 601, text: 'Verificar mensagens pessoais e profissionais no email e whatsapp', completed: false }, { id: 602, text: 'Processar todas as ULs', completed: false }, { id: 603, text: 'Organizar as tarefas pendentes no trello', completed: false }, { id: 604, text: 'Ler notícias', completed: false }] },
  { id: '7', text: 'Conferência de Serviços', emoji: '🔍', category: 'Trabalho', color: '#3b82f6', description: 'Verificar relatório de inconsistencia e fazer backup e ajustes se necessário', subtasks: [] },
  { id: '8', text: 'Estudo no Trabalho', emoji: '🧠', category: 'Trabalho', color: '#3b82f6', description: 'Estudar ferramentas para usar no meu trabalho', subtasks: [{ id: 801, text: 'Estudar SQL Server', completed: false }, { id: 802, text: 'Estudar Maker Softwell', completed: false },] },
  { id: '9', text: 'Suporte', emoji: '📞', category: 'Trabalho', color: '#3b82f6', description: 'Solução de problemas aleatórios relacionadas ao Suporte', subtasks: [{ id: 901, text: 'Conferência de inconsistencia de catraca se precisar', completed: false }, { id: 902, text: 'Estudar Maker Softwell', completed: false },] },
  { id: '10', text: 'Desenvolvimento de Software', emoji: '👨‍💻', category: 'Trabalho', color: '#3b82f6', description: 'Focar em projetos de desenvolvimento e implementação de novas funcionalidades.', subtasks: [{ id: 1001, text: 'Codificar e testar novas features', completed: false }, { id: 1002, text: 'Revisar código (Code Review)', completed: false }, { id: 1003, text: 'Corrigir bugs identificados', completed: false }, { id: 1004, text: 'Documentar a nova funcionalidade', completed: false }] },
];

export const initialTaskTemplates = taskTemplates;

export const POMODORO_CONFIG = { Focus: 25, ShortBreak: 5, LongBreak: 15, cycles: 4 };

function DailyPlanner({ 
  onPomodoroComplete, 
  isDarkMode, 
  toggleDarkMode, 
  templates: propTemplates, 
  setTemplates: propSetTemplates, 
  user, 
  onOpenAuthModal,
  calendarTaskToAdd,
  onClearCalendarTaskToAdd,
  selectedDate: propSelectedDate,
  setSelectedDate: propSetSelectedDate
}) {
  const [internalSelectedDate, setInternalSelectedDate] = useState(() => {
    const saved = localStorage.getItem('selected_planner_date');
    if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) {
      return saved;
    }
    return getTodayString();
  });

  const selectedDate = propSelectedDate || internalSelectedDate;
  const setSelectedDate = propSetSelectedDate || setInternalSelectedDate;

  useEffect(() => {
    localStorage.setItem('selected_planner_date', selectedDate);
  }, [selectedDate]);

  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('daily_tasks');
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const backup = localStorage.getItem('daily_tasks_backup');
    if (backup) {
      try {
        const parsedBackup = JSON.parse(backup);
        if (Array.isArray(parsedBackup)) return parsedBackup;
      } catch (e) {}
    }
    return [];
  });

  const [isTasksLoaded, setIsTasksLoaded] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [activeTimer, setActiveTimer] = useState({ taskId: null, totalSeconds: 0, phase: 'Focus', isRunning: false, pomodoroCycle: 0, type: null, config: null });
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState('00:00');
  const audioContextRef = useRef(null);
  const loadedUserIdRef = useRef(null);

  const [internalTemplates, setInternalTemplates] = useState(() => {
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

  const templates = propTemplates || internalTemplates;
  const setTemplates = propSetTemplates || setInternalTemplates;

  const [plannerCategories, setPlannerCategories] = useState(() => getStoredCategories('task'));

  useEffect(() => {
    const handleCatsChanged = () => setPlannerCategories(getStoredCategories('task'));
    window.addEventListener('coach-categories-changed', handleCatsChanged);
    return () => window.removeEventListener('coach-categories-changed', handleCatsChanged);
  }, []);

  // Efeito para adicionar tarefas vindas da Agenda
  useEffect(() => {
    if (calendarTaskToAdd) {
      const taskDate = calendarTaskToAdd.date || selectedDate;
      const newTask = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        text: calendarTaskToAdd.text,
        emoji: calendarTaskToAdd.emoji || '📅',
        description: calendarTaskToAdd.description || '',
        time: calendarTaskToAdd.time || '09:00',
        period: calendarTaskToAdd.period || 'Manhã',
        completed: false,
        subtasks: calendarTaskToAdd.subtasks || [],
        color: calendarTaskToAdd.color || null,
        date: taskDate
      };
      setTasks(prev => sortTasksChronologically([...prev, newTask]));
      if (onClearCalendarTaskToAdd) onClearCalendarTaskToAdd();
    }
  }, [calendarTaskToAdd, selectedDate, onClearCalendarTaskToAdd]);

  useEffect(() => {
    let isMounted = true;
    async function initTasks() {
      if (user?.id) {
        // Bloqueia sincronização enquanto carrega
        setIsTasksLoaded(false);
        const initialTasks = await loadUserTasks(user.id);
        if (isMounted) {
          setTasks(prev => {
            if (Array.isArray(initialTasks) && initialTasks.length > 0) {
              return initialTasks;
            }
            return (prev && prev.length > 0) ? prev : (initialTasks || []);
          });
          loadedUserIdRef.current = user.id;
          setIsTasksLoaded(true);
        }
      } else {
        loadedUserIdRef.current = null;
        setIsTasksLoaded(true);
      }
    }
    initTasks();
    return () => { isMounted = false; };
  }, [user?.id]);

  useEffect(() => {
    // SÓ sincroniza se a carga inicial deste usuário já foi totalmente concluída
    if (!isTasksLoaded) return;
    if (user?.id && loadedUserIdRef.current !== user.id) return;

    syncUserTasks(user?.id, tasks);
  }, [tasks, user?.id, isTasksLoaded]);

  const handleMoveToToday = (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          date: todayStr
        };
      }
      return t;
    }));
    toast.success('Tarefa transferida para a data de hoje!');
  };


  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() - 1);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + 1);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleAddTask = (newTask, saveAsTemplate) => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const taskWithDate = {
      ...newTask,
      id: uniqueId,
      date: selectedDate
    };
    setTasks(prevTasks => sortTasksChronologically([...prevTasks, taskWithDate]));
    if (saveAsTemplate) {
      const newTemplate = {
        id: Date.now().toString(),
        text: newTask.text,
        emoji: newTask.emoji,
        category: newTask.category || '',
        color: newTask.color || '',
        description: newTask.description || '',
        subtasks: newTask.subtasks || []
      };
      setTemplates(prev => [...prev, newTemplate]);
    }
  };

  const handleUpdateTask = (updatedTask) => {
    setTasks(prevTasks => {
      const updatedList = prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t);
      return sortTasksChronologically(updatedList);
    });
    setSelectedTask(null);
  };

  const handleDropFromCalendar = (e) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      if (dataStr) {
        const item = JSON.parse(dataStr);
        if (item.text) {
          const newTask = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            text: item.text,
            emoji: item.emoji || '📅',
            description: item.description || '',
            time: item.time || '09:00',
            period: item.period || 'Manhã',
            completed: false,
            subtasks: item.subtasks || [],
            color: item.color || null,
            date: selectedDate
          };
          setTasks(prev => sortTasksChronologically([...prev, newTask]));
        }
      }
    } catch (err) {
      console.error('Erro ao processar drop da agenda:', err);
    }
  };

  const handleDragOverFromCalendar = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const playBeep = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }, []);

  const startNextPhase = useCallback(() => {
    const { taskId, phase, pomodoroCycle, config } = activeTimer;
    let nextPhase = 'Focus';
    let nextCycle = pomodoroCycle;
    let durationMinutes = config.Focus;
    let speechMessage = '';

    if (phase === 'Focus') {
      onPomodoroComplete();
      nextCycle += 1;
      if (nextCycle % config.cycles === 0) {
        nextPhase = 'LongBreak';
        durationMinutes = config.LongBreak;
        speechMessage = `Excelente trabalho! Você concluiu ${config.cycles} ciclos de foco. É hora do seu descanso longo de ${config.LongBreak} minutos. Pode relaxar!`;
      } else {
        nextPhase = 'ShortBreak';
        durationMinutes = config.ShortBreak;
        speechMessage = `Parabéns! Ciclo de foco concluído. É hora da sua pausa curta de ${config.ShortBreak} minutos. Respire e relaxe um pouco!`;
      }
    } else {
      nextPhase = 'Focus';
      durationMinutes = config.Focus;
      const taskText = tasks.find(t => t.id === taskId)?.text || 'sua tarefa';
      speechMessage = `Pausa concluída! É hora de voltar ao foco na tarefa: ${taskText}. Bom trabalho!`;
    }

    speak(speechMessage);
    playBeep();

    setActiveTimer(prev => ({
      ...prev,
      phase: nextPhase,
      totalSeconds: durationMinutes * 60,
      pomodoroCycle: nextCycle,
      isRunning: true
    }));
  }, [activeTimer, playBeep, speak, tasks, onPomodoroComplete]);

  const handleCancelTimer = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setActiveTimer({ taskId: null, totalSeconds: 0, phase: 'Focus', isRunning: false, pomodoroCycle: 0, type: null, config: null });
  }, []);

  useEffect(() => {
    let interval = null;
    if (activeTimer.isRunning && activeTimer.totalSeconds > 0) {
      interval = setInterval(() => {
        setActiveTimer(prev => ({ ...prev, totalSeconds: prev.totalSeconds - 1 }));
      }, 1000);
    } else if (activeTimer.isRunning && activeTimer.totalSeconds === 0) {
      if (activeTimer.type === 'pomodoro') {
        startNextPhase();
      } else {
        const completedTask = tasks.find(t => t.id === activeTimer.taskId);
        const endMessage = `Tempo para ${completedTask?.text || 'a tarefa'} concluído!`;
        speak(endMessage);
        toast.success(endMessage, { icon: '🎉' });
        handleCancelTimer();
      }
    }
    return () => clearInterval(interval);
  }, [activeTimer, startNextPhase, tasks, speak, handleCancelTimer]);

  const handleStartTimer = (taskId, config, type) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const currentTask = tasks.find(t => t.id === taskId);
    speak(`Iniciando ${config.ShortBreak ? 'ciclo' : 'timer'} de ${config.Focus} minutos para a tarefa ${currentTask?.text}.`);
    
    // Registrar startedAt na tarefa se ainda não tiver sido iniciado
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          startedAt: t.startedAt || new Date().toISOString()
        };
      }
      return t;
    }));

    setActiveTimer({ taskId, totalSeconds: config.Focus * 60, phase: 'Focus', isRunning: true, pomodoroCycle: 0, type, config });
  };

  const handlePauseResumeTimer = () => {
    if (activeTimer.totalSeconds > 0) {
      setActiveTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
    }
  };

  const getDayOfWeek = (dateStr) => {
    if (!dateStr) return new Date().getDay();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
  };

  const isTaskForSelectedDate = (t, dateStr) => {
    const dayOfWeek = getDayOfWeek(dateStr);
    if (t.isRecurring) {
      const days = (t.recurringDays || []).map(Number);
      if (days.length === 0) return false;
      if (!days.includes(dayOfWeek)) return false;
      if (t.date && dateStr < t.date) return false;
      return true;
    }
    return (t.date || todayStr) === dateStr;
  };

  const isTaskCompletedForDate = (t, dateStr) => {
    if (t.isRecurring) {
      return Array.isArray(t.completedDates) && t.completedDates.includes(dateStr);
    }
    return Boolean(t.completed);
  };

  const handleToggle = (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const isCompletedCurrently = isTaskCompletedForDate(task, selectedDate);
    const isCompleting = !isCompletedCurrently;

    if (isCompleting && activeTimer.taskId === id) {
      const userConfirmed = window.confirm("⏱️ A atividade está em andamento. Deseja realmente finalizá-la e parar o timer?");
      if (userConfirmed) {
        handleCancelTimer();
      } else {
        return;
      }
    }

    setTasks(tasks.map(t => {
      if (t.id !== id) return t;

      if (t.isRecurring) {
        const currentDates = Array.isArray(t.completedDates) ? t.completedDates : [];
        const updatedDates = isCompleting
          ? [...currentDates, selectedDate]
          : currentDates.filter(d => d !== selectedDate);

        return {
          ...t,
          completedDates: updatedDates,
          completed: selectedDate === todayStr ? isCompleting : (Array.isArray(updatedDates) && updatedDates.includes(todayStr)),
          completedAt: isCompleting ? new Date().toISOString() : null
        };
      }

      return {
        ...t,
        completed: isCompleting,
        completedAt: isCompleting ? new Date().toISOString() : null
      };
    }));
  };

  const handleRemove = (id) => {
    if (activeTimer.taskId === id) handleCancelTimer();
    setTasks(tasks.filter(t => t.id !== id));
    toast.success('Tarefa removida.');
  };

  const handleToggleCategory = (catName) => {
    setSelectedCategories(prev => {
      if (prev.includes(catName)) {
        return prev.filter(c => c !== catName);
      } else {
        return [...prev, catName];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedCategories([]);
  };

  const handleOnDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTasks((allTasks) => {
        const currentDayTasks = allTasks.filter(t => isTaskForSelectedDate(t, selectedDate));
        const otherDayTasks = allTasks.filter(t => !isTaskForSelectedDate(t, selectedDate));

        const oldIndex = currentDayTasks.findIndex((item) => item.id === active.id);
        const newIndex = currentDayTasks.findIndex((item) => item.id === over.id);

        const reordered = arrayMove(currentDayTasks, oldIndex, newIndex);

        return [...otherDayTasks, ...reordered];
      });
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    setCurrentTimeDisplay(formatTime(activeTimer.totalSeconds));
  }, [activeTimer.totalSeconds]);

  const getPeriod = (t) => {
    if (!t) return 'Manhã';
    if (t.period) return t.period;
    if (!t.time) return 'Manhã';
    const h = parseInt(t.time.split(':')[0], 10);
    if (h >= 12 && h < 18) return 'Tarde';
    if (h >= 18) return 'Noite';
    return 'Manhã';
  };

  const todayStr = getTodayString();
  const tasksForSelectedDate = tasks.filter(t => isTaskForSelectedDate(t, selectedDate));

  const categoryCounts = {};
  let uncategorizedCount = 0;
  tasksForSelectedDate.forEach(t => {
    if (t.category) {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    } else {
      uncategorizedCount += 1;
    }
  });

  const filteredTasks = tasksForSelectedDate.filter(t => {
    if (selectedCategories.length === 0) return true;
    if (!t.category) return selectedCategories.includes('__none__');
    return selectedCategories.includes(t.category);
  });

  const processedTasks = sortTasksChronologically(
    filteredTasks.map(t => ({
      ...t,
      completed: isTaskCompletedForDate(t, selectedDate)
    }))
  );

  const PERIOD_NAMES = ['Manhã', 'Tarde', 'Noite'];
  const groupedPeriodTasks = PERIOD_NAMES.map(pName => {
    return {
      period: pName,
      tasks: processedTasks.filter(t => getPeriod(t) === pName)
    };
  });

  const otherTasks = processedTasks.filter(t => !PERIOD_NAMES.includes(getPeriod(t)));
  if (otherTasks.length > 0) {
    groupedPeriodTasks.push({ period: 'Outros', tasks: otherTasks });
  }

  const otherDatesWithTasks = Array.from(new Set(
    tasks
      .filter(t => !t.isRecurring)
      .map(t => t.date || todayStr)
      .filter(d => d !== selectedDate)
  )).sort();

  const getUserAvatar = (u) => {
    if (u) {
      const meta = u.user_metadata || {};
      if (meta.avatar_url) return meta.avatar_url;
      if (meta.picture) return meta.picture;
      
      if (u.identities && u.identities.length > 0) {
        for (const identity of u.identities) {
          const idData = identity.identity_data || {};
          if (idData.avatar_url) return idData.avatar_url;
          if (idData.picture) return idData.picture;
        }
      }
    }

    const savedAvatar = localStorage.getItem('google_user_avatar');
    if (savedAvatar && u) return savedAvatar;
    return null;
  };

  const userAvatarUrl = getUserAvatar(user);

  return (
    <div className="planner-container">
      <div className="top-navigation-bar">
        <div className="date-navigator-container">
          <button className="date-nav-btn" onClick={handlePrevDay} title="Dia anterior">
            <CaretLeft size={18} weight="bold" />
          </button>

          <div className="date-picker-badge" title="Clique para escolher uma data">
            <CalendarBlank size={18} weight="bold" className="calendar-icon" />
            <span className="date-display-text">{getFormattedDateLabel(selectedDate)}</span>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="date-input-hidden"
            />
          </div>

          <button className="date-nav-btn" onClick={handleNextDay} title="Próximo dia">
            <CaretRight size={18} weight="bold" />
          </button>

          {selectedDate !== getTodayString() && (
            <button className="today-shortcut-btn" onClick={() => setSelectedDate(getTodayString())}>
              Hoje
            </button>
          )}
        </div>

        <div className="top-actions-right">
          <div className="theme-toggle-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>{isDarkMode ? '🌙' : '☀️'}</span>
            <label className="switch">
              <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
              <span className="slider round"></span>
            </label>
          </div>

          {userAvatarUrl ? (
            <button 
              className="user-auth-badge-btn user-avatar-only-btn" 
              onClick={onOpenAuthModal} 
              title={user?.email ? `Logado como ${user.email}` : "Perfil do Usuário"}
            >
              <div className="google-avatar-ring">
                <img src={userAvatarUrl} alt="Perfil" className="google-avatar-img" />
              </div>
            </button>
          ) : (
            <button className="user-auth-badge-btn" onClick={onOpenAuthModal} title={user ? `Logado como ${user.email}` : "Entrar ou Criar Conta"}>
              <User size={20} />
              <span>{user ? (user.email ? user.email.split('@')[0] : 'Minha Conta') : 'Entrar'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="planner-header">
        <h1>Focus Task 🎯</h1>
        <button className="add-task-button" onClick={() => setIsAddTaskModalOpen(true)}>
          <PlusCircle size={28} />
          <span>Nova Tarefa</span>
        </button>
      </div>

      <CategoryFilterBar
        categories={plannerCategories}
        categoryCounts={categoryCounts}
        totalCount={tasksForSelectedDate.length}
        uncategorizedCount={uncategorizedCount}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        onSelectAll={handleSelectAll}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOnDragEnd}>
        <SortableContext items={processedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div 
            className="planner-periods-wrapper"
            onDragOver={handleDragOverFromCalendar}
            onDrop={handleDropFromCalendar}
          >
            {processedTasks.length > 0 ? (
              groupedPeriodTasks.map((group) => {
                if (group.tasks.length === 0) return null;

                return (
                  <div key={group.period} className="period-section-group">
                    <h2 className="period-section-title">{group.period}</h2>
                    <div className="period-section-box">
                      {group.tasks.map((task) => (
                        <TodoItem
                          key={task.id}
                          task={task}
                          onToggle={handleToggle}
                          onRemove={handleRemove}
                          onStartTimer={handleStartTimer}
                          onPauseResume={handlePauseResumeTimer}
                          onCancel={handleCancelTimer}
                          activeTimer={activeTimer}
                          currentTimeDisplay={currentTimeDisplay}
                          onOpenDetails={() => setSelectedTask(tasks.find(t => t.id === task.id) || task)}
                          selectedDate={selectedDate}
                          todayStr={todayStr}
                          onMoveToToday={handleMoveToToday}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : tasksForSelectedDate.length > 0 ? (
              <div className="period-section-group">
                <div className="period-section-box empty-box" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <p className="empty-state-message" style={{ margin: 0, padding: 0 }}>
                    Nenhuma tarefa encontrada para a(s) categoria(s) selecionada(s).
                  </p>
                  <button 
                    type="button" 
                    onClick={handleSelectAll}
                    style={{
                      marginTop: '1rem',
                      backgroundColor: 'var(--primary-bg)',
                      color: 'var(--primary-text)',
                      border: 'none',
                      padding: '0.45rem 1.1rem',
                      borderRadius: '20px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Mostrar Todas as Tarefas
                  </button>
                </div>
              </div>
            ) : (
              <div className="period-section-group">
                <h2 className="period-section-title">
                  {selectedDate === todayStr ? 'Hoje' : getFormattedDateLabel(selectedDate)}
                </h2>
                <div className="period-section-box empty-box">
                  <p className="empty-state-message">
                    {selectedDate === todayStr 
                      ? 'A sua lista de tarefas para hoje está vazia.' 
                      : `A sua lista de tarefas para ${getFormattedDateLabel(selectedDate)} está vazia.`}
                  </p>

                  {otherDatesWithTasks.length > 0 && (
                    <div className="empty-state-other-dates">
                      <span>Você possui tarefas agendadas em outros dias:</span>
                      <div className="other-dates-badges">
                        {otherDatesWithTasks.map(dateStr => (
                          <button 
                            key={dateStr} 
                            type="button" 
                            className="other-date-btn" 
                            onClick={() => setSelectedDate(dateStr)}
                            title={`Ver tarefas de ${getFormattedDateLabel(dateStr)}`}
                          >
                            📅 {getFormattedDateLabel(dateStr)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          selectedDate={selectedDate}
          todayStr={todayStr}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onRemoveTask={handleRemove}
        />
      )}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onAddTask={handleAddTask}
        taskTemplates={templates}
        selectedDate={selectedDate}
      />
    </div>
  );
}

export default DailyPlanner;