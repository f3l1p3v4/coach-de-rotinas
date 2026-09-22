import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { PlusCircle, User, CaretLeft, CaretRight, CalendarBlank, ArrowsClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { 
  loadUserTasks, 
  syncUserTasks, 
  deleteUserTask,
  loadUserTaskHistory, 
  syncUserTaskHistory 
} from '../../services/supabaseService';

import TodoItem from '../TodoItem';
import TaskDetailsModal from '../TaskDetailsModal';
import AddTaskModal from '../AddTaskModal';
import TaskCompletionModal from '../TaskCompletionModal';
import TaskObservationModal from '../TaskObservationModal';
import DeleteTaskModal from '../DeleteTaskModal';
import CategoryFilterBar from '../CategoryFilterBar';
import { getStoredCategories } from '../../constants/categories';
import { 
  getGoogleAccessToken, 
  fetchGoogleEvents, 
  isBirthdayEvent 
} from '../../services/googleCalendarService';

import './styles.css';

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFormattedDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const today = getTodayString();
  if (dateStr === today) return 'Hoje';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const currentYear = String(new Date().getFullYear());
    if (y === currentYear) {
      return `${d}/${m}`;
    }
    return `${d}/${m}/${y}`;
  }
  return dateStr;
};

export const getWeekdayLabel = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
  if (!weekday) return '';
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
};

const sortTasksChronologically = (taskList) => {
  return [...taskList].sort((a, b) => {
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    return timeA.localeCompare(timeB);
  });
};

export const DEFAULT_WORK_TASKS = [
  { 
    id: '6', 
    text: 'Organização do Dia', 
    emoji: '📋', 
    category: 'Trabalho', 
    color: '#3b82f6', 
    time: '08:00',
    period: 'Manhã',
    description: 'Organizar manhã de trabalho por 30 min', 
    isRecurring: true,
    recurringDays: [1, 2, 3, 4, 5],
    subtasks: [
      { id: 601, text: 'Verificar mensagens pessoais e profissionais no email e whatsapp', completed: false }, 
      { id: 602, text: 'Processar todas as ULs', completed: false }, 
      { id: 603, text: 'Organizar as tarefas pendentes no trello', completed: false }, 
      { id: 604, text: 'Ler notícias', completed: false }
    ] 
  },
  { 
    id: '7', 
    text: 'Conferência de Serviços', 
    emoji: '🔍', 
    category: 'Trabalho', 
    color: '#3b82f6', 
    time: '08:30',
    period: 'Manhã',
    description: 'Verificar relatório de inconsistencia e fazer backup e ajustes se necessário', 
    isRecurring: true,
    recurringDays: [1, 2, 3, 4, 5],
    subtasks: [] 
  },
  { 
    id: '9', 
    text: 'Suporte', 
    emoji: '📞', 
    category: 'Trabalho', 
    color: '#3b82f6', 
    time: '09:00',
    period: 'Manhã',
    description: 'Solução de problemas aleatórios relacionadas ao Suporte', 
    isRecurring: true,
    recurringDays: [1, 2, 3, 4, 5],
    subtasks: [
      { id: 901, text: 'Conferência de inconsistencia de catraca se precisar', completed: false }, 
      { id: 902, text: 'Estudar Maker Softwell', completed: false }
    ] 
  },
  { 
    id: '10', 
    text: 'Desenvolvimento de Software', 
    emoji: '👨‍💻', 
    category: 'Trabalho', 
    color: '#3b82f6', 
    time: '10:00',
    period: 'Manhã',
    description: 'Focar em projetos de desenvolvimento e implementação de novas funcionalidades.', 
    isRecurring: true,
    recurringDays: [1, 2, 3, 4, 5],
    subtasks: [
      { id: 1001, text: 'Codificar e testar novas features', completed: false }, 
      { id: 1002, text: 'Revisar código (Code Review)', completed: false }, 
      { id: 1003, text: 'Corrigir bugs identificados', completed: false }, 
      { id: 1004, text: 'Documentar a nova funcionalidade', completed: false }
    ] 
  },
  { 
    id: '8', 
    text: 'Estudo no Trabalho', 
    emoji: '🧠', 
    category: 'Trabalho', 
    color: '#3b82f6', 
    time: '11:00',
    period: 'Manhã',
    description: 'Estudar ferramentas para usar no meu trabalho', 
    isRecurring: true,
    recurringDays: [1, 2, 3, 4, 5],
    subtasks: [
      { id: 801, text: 'Estudar SQL Server', completed: false }, 
      { id: 802, text: 'Estudar Maker Softwell', completed: false }
    ] 
  }
];

export const ensureWorkAndRoutineTasks = (taskList) => {
  if (!Array.isArray(taskList) || taskList.length === 0) {
    return DEFAULT_WORK_TASKS;
  }

  const seenRoutines = new Set();
  const cleanedList = [];

  for (const t of taskList) {
    const textNorm = (t.text || '').toLowerCase().trim();

    // 1. Suporte: desduplica e preserva personalizações do usuário (período, horário, etc.)
    if (textNorm === 'suporte') {
      if (seenRoutines.has('suporte')) {
        // Ignora duplicata!
        continue;
      }
      seenRoutines.add('suporte');
      const def = DEFAULT_WORK_TASKS.find(w => w.id === '9');
      cleanedList.push({
        ...t,
        text: t.text || 'Suporte',
        emoji: t.emoji || '📞',
        category: t.category || 'Trabalho',
        color: t.color || '#3b82f6',
        time: t.time || '09:00',
        period: t.period || 'Manhã',
        isRecurring: t.isRecurring !== undefined ? Boolean(t.isRecurring) : true,
        recurringDays: (Array.isArray(t.recurringDays) && t.recurringDays.length > 0) ? t.recurringDays : [1, 2, 3, 4, 5],
        date: null,
        subtasks: (Array.isArray(t.subtasks) && t.subtasks.length > 0) ? t.subtasks : def.subtasks
      });
      continue;
    }

    // 2. Organização do Dia: desduplica e preserva personalizações
    if (textNorm.includes('organização') || textNorm.includes('organizacao')) {
      if (seenRoutines.has('organizacao')) {
        continue;
      }
      seenRoutines.add('organizacao');
      const def = DEFAULT_WORK_TASKS.find(w => w.id === '6');
      cleanedList.push({
        ...t,
        text: t.text || 'Organização do Dia',
        emoji: t.emoji || '📋',
        category: t.category || 'Trabalho',
        color: t.color || '#3b82f6',
        time: t.time || '08:00',
        period: t.period || 'Manhã',
        isRecurring: t.isRecurring !== undefined ? Boolean(t.isRecurring) : true,
        recurringDays: (Array.isArray(t.recurringDays) && t.recurringDays.length > 0) ? t.recurringDays : [1, 2, 3, 4, 5],
        date: null,
        subtasks: (Array.isArray(t.subtasks) && t.subtasks.length > 0) ? t.subtasks : def.subtasks
      });
      continue;
    }

    // 3. Conferência de Serviços: desduplica e preserva personalizações
    if (textNorm.includes('conferência') || textNorm.includes('conferencia')) {
      if (seenRoutines.has('conferencia')) {
        continue;
      }
      seenRoutines.add('conferencia');
      cleanedList.push({
        ...t,
        text: t.text || 'Conferência de Serviços',
        emoji: t.emoji || '🔍',
        category: t.category || 'Trabalho',
        color: t.color || '#3b82f6',
        time: t.time || '08:30',
        period: t.period || 'Manhã',
        isRecurring: t.isRecurring !== undefined ? Boolean(t.isRecurring) : true,
        recurringDays: (Array.isArray(t.recurringDays) && t.recurringDays.length > 0) ? t.recurringDays : [1, 2, 3, 4, 5],
        date: null
      });
      continue;
    }

    // 4. Desenvolvimento de Software: desduplica e preserva personalizações (ex: Tarde!)
    if (textNorm.includes('desenvolvimento de software') || textNorm === 'desenvolvimento') {
      if (seenRoutines.has('desenvolvimento')) {
        continue;
      }
      seenRoutines.add('desenvolvimento');
      const def = DEFAULT_WORK_TASKS.find(w => w.id === '10');
      cleanedList.push({
        ...t,
        text: t.text || 'Desenvolvimento de Software',
        emoji: t.emoji || '👨‍💻',
        category: t.category || 'Trabalho',
        color: t.color || '#3b82f6',
        time: t.time || '10:00',
        period: t.period || 'Manhã',
        isRecurring: t.isRecurring !== undefined ? Boolean(t.isRecurring) : true,
        recurringDays: (Array.isArray(t.recurringDays) && t.recurringDays.length > 0) ? t.recurringDays : [1, 2, 3, 4, 5],
        date: null,
        subtasks: (Array.isArray(t.subtasks) && t.subtasks.length > 0) ? t.subtasks : def.subtasks
      });
      continue;
    }

    // 5. Estudo no Trabalho: desduplica e preserva personalizações
    if (textNorm.includes('estudo no trabalho')) {
      if (seenRoutines.has('estudotrabalho')) {
        continue;
      }
      seenRoutines.add('estudotrabalho');
      const def = DEFAULT_WORK_TASKS.find(w => w.id === '8');
      cleanedList.push({
        ...t,
        text: t.text || 'Estudo no Trabalho',
        emoji: t.emoji || '🧠',
        category: t.category || 'Trabalho',
        color: t.color || '#3b82f6',
        time: t.time || '11:00',
        period: t.period || 'Manhã',
        isRecurring: t.isRecurring !== undefined ? Boolean(t.isRecurring) : true,
        recurringDays: (Array.isArray(t.recurringDays) && t.recurringDays.length > 0) ? t.recurringDays : [1, 2, 3, 4, 5],
        date: null,
        subtasks: (Array.isArray(t.subtasks) && t.subtasks.length > 0) ? t.subtasks : def.subtasks
      });
      continue;
    }

    // 6. Faculdade / Concursos: desduplica e preserva personalizações
    if (textNorm.includes('faculdade') || textNorm.includes('concursos')) {
      if (seenRoutines.has('faculdade')) {
        continue;
      }
      seenRoutines.add('faculdade');
      cleanedList.push({
        ...t,
        text: t.text || 'Faculdade / Concursos',
        emoji: t.emoji || '📚',
        category: t.category || 'Estudos',
        color: t.color || '#8b5cf6',
        time: t.time || '19:00',
        period: t.period || 'Noite',
        isRecurring: t.isRecurring !== undefined ? Boolean(t.isRecurring) : true,
        recurringDays: (Array.isArray(t.recurringDays) && t.recurringDays.length > 0) ? t.recurringDays : [1, 2, 3, 4, 5],
        date: null
      });
      continue;
    }

    // Tarefas pessoais ou outras tarefas (ex: Pilha Geralda, Alterar plano claro vó, etc.)
    cleanedList.push(t);
  }

  // IMPORTANTE: NÃO insere missingWork automaticamente!
  // Se uma tarefa não está na lista, significa que o usuário a apagou voluntariamente.
  return sortTasksChronologically(cleanedList);
};

const taskTemplates = [
  { id: '1', text: 'Treino', emoji: '💪', category: 'Saúde / Treino', color: '#f97316', time: '07:00', period: 'Manhã', isRecurring: true, recurringDays: [1, 2, 3, 4, 5], description: 'Foco em peito e tríceps. Manter a boa forma e controlar a respiração.', subtasks: [{ id: 101, text: 'Aquecimento - 10 min', completed: false }, { id: 102, text: 'Supino Reto - 4x8', completed: false }] },
  { id: '2', text: 'Estudo Espiritual', emoji: '🙏', category: 'Espiritual', color: '#eab308', time: '07:30', period: 'Manhã', isRecurring: true, recurringDays: [0, 1, 2, 3, 4, 5, 6], description: 'Leitura do capítulo de hoje e meditação. O objetivo é a reflexão.', subtasks: [] },
  { id: '3', text: 'Estudo de Órgão', emoji: '🎹', category: 'Estudos', color: '#8b5cf6', time: '18:00', period: 'Noite', isRecurring: true, recurringDays: [1, 2, 3, 4, 5], description: 'Praticar as escalas e a nova peça.', subtasks: [{ id: 301, text: 'Escalas - 15 min', completed: false }, { id: 302, text: 'Praticar nova música', completed: false }] },
  { id: '4', text: 'Faculdade / Concursos', emoji: '📚', category: 'Estudos', color: '#8b5cf6', time: '19:00', period: 'Noite', isRecurring: true, recurringDays: [1, 2, 3, 4, 5], description: 'Revisão da matéria e resolução de exercícios.', subtasks: [{ id: 401, text: 'Ler resumo do capítulo', completed: false }, { id: 402, text: 'Fazer 10 exercícios', completed: false }] },
  { id: '5', text: 'Limpeza Rápida da Casa', emoji: '🧹', category: 'Casa', color: '#ec4899', time: '12:00', period: 'Tarde', isRecurring: true, recurringDays: [1, 2, 3, 4, 5], description: 'Foco num cómodo por 15 minutos.', subtasks: [] },
  { id: '6', text: 'Organização do Dia', emoji: '📋', category: 'Trabalho', color: '#3b82f6', time: '08:00', period: 'Manhã', isRecurring: true, recurringDays: [1, 2, 3, 4, 5], description: 'Organizar manhã de trabalho por 30 min', subtasks: [{ id: 601, text: 'Verificar mensagens pessoais e profissionais no email e whatsapp', completed: false }, { id: 602, text: 'Processar todas as ULs', completed: false }, { id: 603, text: 'Organizar as tarefas pendentes no trello', completed: false }, { id: 604, text: 'Ler notícias', completed: false }] },
  { id: '7', text: 'Conferência de Serviços', emoji: '🔍', category: 'Trabalho', color: '#3b82f6', time: '08:30', period: 'Manhã', isRecurring: true, recurringDays: [1, 2, 3, 4, 5], description: 'Verificar relatório de inconsistencia e fazer backup e ajustes se necessário', subtasks: [] },
  { id: '8', text: 'Estudo no Trabalho', emoji: '🧠', category: 'Trabalho', color: '#3b82f6', time: '11:00', period: 'Manhã', isRecurring: true, recurringDays: [1, 2, 3, 4, 5], description: 'Estudar ferramentas para usar no meu trabalho', subtasks: [{ id: 801, text: 'Estudar SQL Server', completed: false }, { id: 802, text: 'Estudar Maker Softwell', completed: false },] },
  { id: '9', text: 'Suporte', emoji: '📞', category: 'Trabalho', color: '#3b82f6', time: '09:00', period: 'Manhã', isRecurring: true, recurringDays: [1, 2, 3, 4, 5], description: 'Solução de problemas aleatórios relacionadas ao Suporte', subtasks: [{ id: 901, text: 'Conferência de inconsistencia de catraca se precisar', completed: false }, { id: 902, text: 'Estudar Maker Softwell', completed: false },] },
  { id: '10', text: 'Desenvolvimento de Software', emoji: '👨‍💻', category: 'Trabalho', color: '#3b82f6', time: '10:00', period: 'Manhã', isRecurring: true, recurringDays: [1, 2, 3, 4, 5], description: 'Foco em projetos de desenvolvimento e implementação de novas funcionalidades.', subtasks: [{ id: 1001, text: 'Codificar e testar novas features', completed: false }, { id: 1002, text: 'Revisar código (Code Review)', completed: false }, { id: 1003, text: 'Corrigir bugs identificados', completed: false }, { id: 1004, text: 'Documentar a nova funcionalidade', completed: false }] },
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
    const sanitizeLoadedTasks = (list) => {
      if (!Array.isArray(list)) return [];
      return list.map(t => {
        if (t.isRecurring) {
          const { startedAt, completedAt, ...clean } = t;
          return clean;
        }
        return t;
      });
    };

    const savedTasks = localStorage.getItem('daily_tasks');
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return ensureWorkAndRoutineTasks(sanitizeLoadedTasks(parsed));
        }
      } catch (e) {}
    }
    const backup = localStorage.getItem('daily_tasks_backup');
    if (backup) {
      try {
        const parsedBackup = JSON.parse(backup);
        if (Array.isArray(parsedBackup) && parsedBackup.length > 0) {
          return ensureWorkAndRoutineTasks(sanitizeLoadedTasks(parsedBackup));
        }
      } catch (e) {}
    }
    return DEFAULT_WORK_TASKS;
  });

  const [isTasksLoaded, setIsTasksLoaded] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForCompletion, setTaskForCompletion] = useState(null);
  const [taskForObservation, setTaskForObservation] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
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

  const [calendarEvents, setCalendarEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('google_calendar_events');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [calendarCompletedMap, setCalendarCompletedMap] = useState(() => {
    try {
      const saved = localStorage.getItem('calendar_completed_map');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [calendarStatusMap, setCalendarStatusMap] = useState(() => {
    try {
      const saved = localStorage.getItem('calendar_status_map');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [taskHistory, setTaskHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('daily_task_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [hiddenCalendarEventIds, setHiddenCalendarEventIds] = useState(() => {
    try {
      const saved = localStorage.getItem('calendar_hidden_ids');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [calendarPriorityMap, setCalendarPriorityMap] = useState(() => {
    try {
      const saved = localStorage.getItem('calendar_priority_map');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  useEffect(() => {
    const handleEventsUpdated = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setCalendarEvents(e.detail);
      } else {
        try {
          const saved = localStorage.getItem('google_calendar_events');
          if (saved) setCalendarEvents(JSON.parse(saved));
        } catch (err) {}
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'google_calendar_events') {
        try {
          if (e.newValue) setCalendarEvents(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };

    window.addEventListener('google-calendar-events-updated', handleEventsUpdated);
    window.addEventListener('storage', handleStorageChange);

    async function syncCalendarSilently() {
      try {
        const token = await getGoogleAccessToken();
        if (token) {
          const res = await fetchGoogleEvents(token);
          if (res?.events && res.events.length > 0) {
            setCalendarEvents(res.events);
            localStorage.setItem('google_calendar_events', JSON.stringify(res.events));
          }
        }
      } catch (err) {
        console.warn('Erro ao sincronizar eventos em background:', err);
      }
    }
    syncCalendarSilently();

    return () => {
      window.removeEventListener('google-calendar-events-updated', handleEventsUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
            const raw = (Array.isArray(initialTasks) && initialTasks.length > 0)
              ? initialTasks
              : ((prev && prev.length > 0) ? prev : (initialTasks || []));
            const cleaned = raw.map(t => {
              if (t.isRecurring) {
                const { startedAt, completedAt, ...clean } = t;
                return clean;
              }
              return t;
            });
            return ensureWorkAndRoutineTasks(cleaned);
          });
          loadedUserIdRef.current = user.id;
          setIsTasksLoaded(true);
        }
      } else {
        setTasks(prev => ensureWorkAndRoutineTasks(prev));
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

  useEffect(() => {
    let isMounted = true;
    async function initHistory() {
      if (user?.id) {
        const remoteHistory = await loadUserTaskHistory(user.id);
        if (isMounted && remoteHistory && Object.keys(remoteHistory).length > 0) {
          setTaskHistory(prev => ({ ...prev, ...remoteHistory }));
        }
      }
    }
    initHistory();
    return () => { isMounted = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!isTasksLoaded) return;
    if (user?.id && loadedUserIdRef.current !== user.id) return;

    syncUserTaskHistory(user?.id, taskHistory);
  }, [taskHistory, user?.id, isTasksLoaded]);

  // Migra status locais antigos de compromissos da Google Agenda para o taskHistory para sincronização na nuvem
  useEffect(() => {
    try {
      const savedStatus = localStorage.getItem('calendar_status_map');
      const savedCompleted = localStorage.getItem('calendar_completed_map');
      let statusObj = savedStatus ? JSON.parse(savedStatus) : {};
      let completedObj = savedCompleted ? JSON.parse(savedCompleted) : {};

      const migratedEntries = {};
      let hasMigration = false;

      Object.entries(statusObj).forEach(([k, val]) => {
        const parts = k.split('_');
        if (parts.length >= 2) {
          const date = parts[0];
          const eventId = parts.slice(1).join('_');
          const historyKey = `calendar-${eventId}_${date}`;
          if (!taskHistory[historyKey]) {
            migratedEntries[historyKey] = {
              id: historyKey,
              taskId: `calendar-${eventId}`,
              date: date,
              status: (typeof val === 'object' && val?.status) ? val.status : 'completed',
              observation: (typeof val === 'object' && val?.observation) ? val.observation : '',
              completedAt: new Date().toISOString(),
              startedAt: null,
              subtasks: []
            };
            hasMigration = true;
          }
        }
      });

      Object.entries(completedObj).forEach(([k, isDone]) => {
        if (!isDone) return;
        const parts = k.split('_');
        if (parts.length >= 2) {
          const date = parts[0];
          const eventId = parts.slice(1).join('_');
          const historyKey = `calendar-${eventId}_${date}`;
          if (!taskHistory[historyKey] && !migratedEntries[historyKey]) {
            migratedEntries[historyKey] = {
              id: historyKey,
              taskId: `calendar-${eventId}`,
              date: date,
              status: 'completed',
              observation: '',
              completedAt: new Date().toISOString(),
              startedAt: null,
              subtasks: []
            };
            hasMigration = true;
          }
        }
      });

      if (hasMigration) {
        setTaskHistory(prev => ({ ...prev, ...migratedEntries }));
      }
    } catch (e) {
      console.warn('Erro ao migrar status de compromissos para taskHistory:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      date: newTask.date || selectedDate,
      isRecurring: Boolean(newTask.isRecurring),
      recurringDays: newTask.isRecurring ? (newTask.recurringDays || []).map(Number).filter(n => !isNaN(n)) : []
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
        subtasks: newTask.subtasks || [],
        isRecurring: Boolean(newTask.isRecurring),
        recurringDays: newTask.isRecurring ? (newTask.recurringDays || []).map(Number).filter(n => !isNaN(n)) : []
      };
      setTemplates(prev => [...prev, newTemplate]);
    }
  };

  const handleUpdateTask = (updatedTask) => {
    if (String(updatedTask.id).startsWith('calendar-')) {
      const origId = updatedTask.calendarOriginalId;
      if (origId) {
        setCalendarPriorityMap(prev => {
          const next = {
            ...prev,
            [origId]: {
              color: updatedTask.color || '#10b981',
              difficulty: updatedTask.difficulty || 'low',
              period: updatedTask.period,
              description: updatedTask.description
            }
          };
          try {
            localStorage.setItem('calendar_priority_map', JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      }
      setCalendarEvents(prev => {
        const next = prev.map(evt => {
          if (evt.id === updatedTask.calendarOriginalId) {
            return {
              ...evt,
              title: updatedTask.text,
              description: updatedTask.description,
              period: updatedTask.period,
              time: updatedTask.time || evt.time,
            };
          }
          return evt;
        });
        try {
          localStorage.setItem('google_calendar_events', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      setSelectedTask(null);
      toast.success('Compromisso atualizado.');
      return;
    }

    const sanitizedTask = {
      ...updatedTask,
      isRecurring: Boolean(updatedTask.isRecurring),
      recurringDays: updatedTask.isRecurring ? (updatedTask.recurringDays || []).map(Number).filter(n => !isNaN(n)) : []
    };

    // 1. Salva o estado das subtarefas daquele dia específico no taskHistory
    const historyKey = `${sanitizedTask.id}_${selectedDate}`;
    setTaskHistory(prev => {
      const existing = prev[historyKey] || {};
      return {
        ...prev,
        [historyKey]: {
          ...existing,
          id: historyKey,
          taskId: String(sanitizedTask.id),
          date: selectedDate,
          status: existing.status || 'pending',
          observation: existing.observation || '',
          subtasks: sanitizedTask.subtasks || []
        }
      };
    });

    // 2. Cria o modelo base de subtarefas (com completed: false) para que outros dias não sejam afetados
    const baseSubtasksModel = (sanitizedTask.subtasks || []).map(st => ({
      id: st.id,
      text: st.text,
      completed: false
    }));

    setTasks(prevTasks => {
      const updatedList = prevTasks.map(t => {
        if (t.id !== sanitizedTask.id) return t;
        return {
          ...t,
          text: sanitizedTask.text,
          emoji: sanitizedTask.emoji,
          period: sanitizedTask.period,
          category: sanitizedTask.category,
          color: sanitizedTask.color,
          date: sanitizedTask.date,
          isRecurring: sanitizedTask.isRecurring,
          recurringDays: sanitizedTask.recurringDays,
          description: sanitizedTask.description,
          subtasks: baseSubtasksModel
        };
      });
      return updatedList;
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
    const currentTask = tasks.find(t => t.id === taskId) || calendarTasksForSelectedDate.find(t => t.id === taskId);
    speak(`Iniciando ${config.ShortBreak ? 'ciclo' : 'timer'} de ${config.Focus} minutos para a tarefa ${currentTask?.text || 'selecionada'}.`);
    
    const nowIso = new Date().toISOString();
    const historyKey = `${taskId}_${selectedDate}`;

    // 1. Grava o horário de início única e exclusivamente no histórico da data selecionada
    setTaskHistory(prev => {
      const existing = prev[historyKey] || {};
      if (existing.startedAt) return prev;
      return {
        ...prev,
        [historyKey]: {
          ...existing,
          id: historyKey,
          taskId: String(taskId),
          date: selectedDate,
          status: existing.status || 'pending',
          observation: existing.observation || '',
          completedAt: existing.completedAt || null,
          startedAt: nowIso,
          subtasks: existing.subtasks || (currentTask?.subtasks ? currentTask.subtasks.map(st => ({ ...st, completed: false })) : [])
        }
      };
    });

    // 2. Se for tarefa comum e NÃO for recorrente, atualiza em tasks apenas para a data correspondente
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && !t.isRecurring && (t.date === selectedDate || (!t.date && selectedDate === todayStr))) {
        return {
          ...t,
          startedAt: t.startedAt || nowIso
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
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      // Usar 12:00:00 (meio-dia) para evitar desvios por fuso horário local/UTC
      return new Date(y, m - 1, d, 12, 0, 0).getDay();
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getDay()) ? new Date().getDay() : parsed.getDay();
  };

  const isTaskForSelectedDate = (t, dateStr) => {
    if (!t || !dateStr) return false;

    // Se estiver marcado como deleted no taskHistory para esta data
    const historyKey = `${t.id}_${dateStr}`;
    if (taskHistory && taskHistory[historyKey]?.status === 'deleted') {
      return false;
    }

    const dayOfWeek = getDayOfWeek(dateStr);

    if (Boolean(t.isRecurring)) {
      const days = (t.recurringDays || []).map(Number).filter(n => !isNaN(n));
      // Se não há dias definidos na tarefa recorrente, não exibe
      if (days.length === 0) return false;
      // Só deve aparecer se o dia da semana atual estiver nos dias selecionados
      if (!days.includes(dayOfWeek)) return false;
      // Se tiver data de início/criação, não exibe em dias anteriores
      if (t.date && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && dateStr < t.date) {
        return false;
      }
      // Se tiver data de término (recurringUntil), não exibe a partir desta data nem após ela
      if (t.recurringUntil && /^\d{4}-\d{2}-\d{2}$/.test(t.recurringUntil) && dateStr >= t.recurringUntil) {
        return false;
      }
      // Se esta data específica foi excluída da recorrência
      if (Array.isArray(t.deletedDates) && t.deletedDates.includes(dateStr)) {
        return false;
      }
      return true;
    }

    // Tarefa pontual: só deve aparecer na sua data exata
    const taskDate = t.date || todayStr;
    return taskDate === dateStr;
  };

  const handleToggle = (id) => {
    const task = processedTasks.find(t => t.id === id);
    if (!task) return;
    if (task.isBirthday) return;

    if (activeTimer.taskId === id) {
      const userConfirmed = window.confirm("⏱️ A atividade está em andamento. Deseja realmente parar o timer e definir a conclusão?");
      if (userConfirmed) {
        handleCancelTimer();
      } else {
        return;
      }
    }

    setTaskForCompletion(task);
  };

  const handleSaveCompletion = (taskId, { status, observation }) => {
    if (String(taskId).startsWith('calendar-')) {
      const calTask = calendarTasksForSelectedDate.find(t => t.id === taskId);
      if (!calTask) return;
      const key = `${selectedDate}_${calTask.calendarOriginalId}`;
      const isCompleted = status === 'completed';
      const historyKey = `${taskId}_${selectedDate}`;
      const nowIso = new Date().toISOString();

      setCalendarStatusMap(prev => {
        const next = { ...prev, [key]: { status, observation } };
        try {
          localStorage.setItem('calendar_status_map', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      setCalendarCompletedMap(prev => {
        const next = { ...prev, [key]: isCompleted };
        try {
          localStorage.setItem('calendar_completed_map', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      setTaskHistory(prev => ({
        ...prev,
        [historyKey]: {
          id: historyKey,
          taskId: String(taskId),
          date: selectedDate,
          status,
          observation: observation || '',
          completedAt: (status === 'completed' || status === 'failed') ? nowIso : null,
          startedAt: null,
          subtasks: []
        }
      }));

      setTaskForCompletion(null);
      toast.success(status === 'completed' ? 'Compromisso concluído! ✅' : 'Compromisso marcado como não concluído. ❌');
      return;
    }

    if (activeTimer.taskId === taskId) {
      handleCancelTimer();
    }

    const currentTask = processedTasks.find(t => t.id === taskId);
    const historyKey = `${taskId}_${selectedDate}`;
    const nowIso = new Date().toISOString();

    // 1. Grava no taskHistory a ocorrência exclusiva deste dia
    setTaskHistory(prev => {
      const existing = prev[historyKey] || {};
      return {
        ...prev,
        [historyKey]: {
          ...existing,
          id: historyKey,
          taskId: String(taskId),
          date: selectedDate,
          status,
          observation: observation || '',
          completedAt: (status === 'completed' || status === 'failed') ? nowIso : null,
          startedAt: currentTask?.startedAt || existing.startedAt || null,
          subtasks: currentTask?.subtasks || existing.subtasks || []
        }
      };
    });

    // 2. Mantém compatibilidade com a tabela base tasks
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;

      if (t.isRecurring) {
        const currentDates = Array.isArray(t.completedDates) ? t.completedDates : [];
        const currentFailedDates = Array.isArray(t.failedDates) ? t.failedDates : [];
        const currentObs = { ...(t.dateObservations || {}) };

        let updatedDates = currentDates.filter(d => d !== selectedDate);
        let updatedFailedDates = currentFailedDates.filter(d => d !== selectedDate);

        if (status === 'completed') {
          updatedDates.push(selectedDate);
        } else if (status === 'failed') {
          updatedFailedDates.push(selectedDate);
        }

        if (observation) {
          currentObs[selectedDate] = observation;
        } else {
          delete currentObs[selectedDate];
        }

        const isTodayDone = selectedDate === todayStr ? (status === 'completed') : (updatedDates.includes(todayStr));
        const { startedAt, completedAt, ...cleanRecurring } = t;
        return {
          ...cleanRecurring,
          completedDates: updatedDates,
          failedDates: updatedFailedDates,
          dateObservations: currentObs,
          completed: isTodayDone,
          status: selectedDate === todayStr ? status : t.status
        };
      }

      if (t.date === selectedDate || (!t.date && selectedDate === todayStr)) {
        return {
          ...t,
          status,
          completed: status === 'completed',
          observation: observation || '',
          completedAt: (status === 'completed' || status === 'failed') ? nowIso : null
        };
      }

      return t;
    }));

    setTaskForCompletion(null);
    toast.success(status === 'completed' ? 'Tarefa concluída! ✅' : 'Tarefa marcada como não concluída. ❌');
  };

  const handleResetPending = (taskId) => {
    if (String(taskId).startsWith('calendar-')) {
      const calTask = calendarTasksForSelectedDate.find(t => t.id === taskId);
      if (!calTask) return;
      const key = `${selectedDate}_${calTask.calendarOriginalId}`;
      const historyKey = `${taskId}_${selectedDate}`;

      setCalendarStatusMap(prev => {
        const next = { ...prev };
        delete next[key];
        try {
          localStorage.setItem('calendar_status_map', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      setCalendarCompletedMap(prev => {
        const next = { ...prev };
        delete next[key];
        try {
          localStorage.setItem('calendar_completed_map', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      setTaskHistory(prev => {
        const next = { ...prev };
        if (next[historyKey]) {
          next[historyKey] = {
            ...next[historyKey],
            status: 'pending',
            observation: '',
            completedAt: null
          };
        }
        return next;
      });

      setTaskForCompletion(null);
      toast.info('Compromisso voltou para o estado pendente.');
      return;
    }

    const historyKey = `${taskId}_${selectedDate}`;
    setTaskHistory(prev => {
      const next = { ...prev };
      if (next[historyKey]) {
        next[historyKey] = {
          ...next[historyKey],
          status: 'pending',
          observation: '',
          completedAt: null
        };
      }
      return next;
    });

    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;

      if (t.isRecurring) {
        const currentDates = Array.isArray(t.completedDates) ? t.completedDates : [];
        const currentFailedDates = Array.isArray(t.failedDates) ? t.failedDates : [];
        const currentObs = { ...(t.dateObservations || {}) };

        delete currentObs[selectedDate];

        const updatedDates = currentDates.filter(d => d !== selectedDate);
        const updatedFailedDates = currentFailedDates.filter(d => d !== selectedDate);

        const isTodayDone = selectedDate === todayStr ? false : (updatedDates.includes(todayStr));

        const { startedAt, completedAt, ...cleanRecurring } = t;
        return {
          ...cleanRecurring,
          completedDates: updatedDates,
          failedDates: updatedFailedDates,
          dateObservations: currentObs,
          completed: isTodayDone,
          status: selectedDate === todayStr ? 'pending' : t.status
        };
      }

      if (t.date === selectedDate || (!t.date && selectedDate === todayStr)) {
        return {
          ...t,
          status: 'pending',
          completed: false,
          observation: '',
          completedAt: null
        };
      }

      return t;
    }));

    setTaskForCompletion(null);
    toast.info('Tarefa voltou para o estado pendente.');
  };

  const handleRemove = (id) => {
    if (String(id).startsWith('calendar-')) {
      const calTask = calendarTasksForSelectedDate.find(t => t.id === id);
      if (!calTask) return;
      const key = `${selectedDate}_${calTask.calendarOriginalId}`;
      setHiddenCalendarEventIds(prev => {
        const next = { ...prev, [key]: true };
        try {
          localStorage.setItem('calendar_hidden_ids', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      toast.success('Compromisso removido da lista do dia.');
      return;
    }

    const targetTask = tasks.find(t => t.id === id) || processedTasks.find(t => t.id === id);
    if (!targetTask) return;

    // Se for uma tarefa recorrente, abre o modal de opções de exclusão
    if (targetTask.isRecurring) {
      setTaskToDelete(targetTask);
      return;
    }

    // Tarefa simples (não recorrente): apaga diretamente
    if (activeTimer.taskId === id) handleCancelTimer();
    setTasks(prev => prev.filter(t => t.id !== id));
    deleteUserTask(user?.id, id);
    toast.success('Tarefa removida.');
  };

  const handleDeleteSingleDay = () => {
    if (!taskToDelete) return;
    const taskId = taskToDelete.id;
    if (activeTimer.taskId === taskId) handleCancelTimer();

    const historyKey = `${taskId}_${selectedDate}`;

    // 1. Marca no taskHistory como deleted para sincronização em nuvem
    setTaskHistory(prev => ({
      ...prev,
      [historyKey]: {
        ...(prev[historyKey] || {}),
        id: historyKey,
        taskId: String(taskId),
        date: selectedDate,
        status: 'deleted',
        completedAt: null
      }
    }));

    // 2. Adiciona a data no array deletedDates da tarefa
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const currentDeleted = Array.isArray(t.deletedDates) ? t.deletedDates : [];
      if (currentDeleted.includes(selectedDate)) return t;
      return {
        ...t,
        deletedDates: [...currentDeleted, selectedDate]
      };
    }));

    setTaskToDelete(null);
    toast.success('Tarefa removida apenas deste dia.');
  };

  const handleDeleteFromDayForward = () => {
    if (!taskToDelete) return;
    const taskId = taskToDelete.id;
    if (activeTimer.taskId === taskId) handleCancelTimer();

    // Define recurringUntil como a data selecionada (interrompe repetições a partir desta data)
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        recurringUntil: selectedDate
      };
    }));

    setTaskToDelete(null);
    toast.success('Tarefa cancelada a partir deste dia.');
  };

  const handleDeleteAll = () => {
    if (!taskToDelete) return;
    const taskId = taskToDelete.id;
    if (activeTimer.taskId === taskId) handleCancelTimer();

    setTasks(prev => prev.filter(t => t.id !== taskId));
    deleteUserTask(user?.id, taskId);
    setTaskToDelete(null);
    toast.success('Todas as repetições da tarefa foram removidas.');
  };

  const handleRestoreWorkTasks = () => {
    setTasks(prev => {
      const sanitized = ensureWorkAndRoutineTasks(prev);
      const existingTexts = new Set(sanitized.map(t => (t.text || '').toLowerCase().trim()));
      const missingWork = DEFAULT_WORK_TASKS.filter(
        def => !existingTexts.has(def.text.toLowerCase().trim())
      );
      const restored = sortTasksChronologically([...sanitized, ...missingWork]);
      toast.success('Rotinas de Trabalho (Segunda a Sexta) restauradas com sucesso! 💼');
      return restored;
    });
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
    if (!over || active.id === over.id) return;

    if (String(active.id).startsWith('calendar-') || String(over.id).startsWith('calendar-')) {
      return;
    }

    setTasks((allTasks) => {
      const activeTask = allTasks.find(t => t.id === active.id);
      const overTask = allTasks.find(t => t.id === over.id);

      if (!activeTask || !overTask) return allTasks;

      const activePeriod = getPeriod(activeTask);
      const overPeriod = getPeriod(overTask);

      // Restringe o drag and drop estritamente ao mesmo período!
      if (activePeriod !== overPeriod) {
        return allTasks;
      }

      // Tarefas deste dia pertencentes a este período
      const periodTasks = allTasks.filter(t => 
        isTaskForSelectedDate(t, selectedDate) && getPeriod(t) === activePeriod
      );

      const oldIndex = periodTasks.findIndex(t => t.id === active.id);
      const newIndex = periodTasks.findIndex(t => t.id === over.id);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return allTasks;
      }

      // Reordena apenas as tarefas daquele período
      const reorderedPeriodTasks = arrayMove(periodTasks, oldIndex, newIndex);

      // Se todas as tarefas do período têm horários definidos, ajusta os horários
      // para acompanhar a nova ordem, para que fiquem cronologicamente consistentes
      const existingTimes = periodTasks.map(t => t.time).filter(Boolean);
      let adjustedTasks = reorderedPeriodTasks;

      if (existingTimes.length === periodTasks.length) {
        const sortedTimes = [...existingTimes].sort((a, b) => a.localeCompare(b));
        adjustedTasks = reorderedPeriodTasks.map((t, idx) => ({
          ...t,
          time: sortedTimes[idx] || t.time
        }));
      }

      // Atualiza allTasks mantendo as tarefas de outros períodos e outros dias nos seus lugares
      const periodTaskIds = new Set(periodTasks.map(t => t.id));
      const result = [];
      let periodInserted = false;

      for (const t of allTasks) {
        if (periodTaskIds.has(t.id)) {
          if (!periodInserted) {
            result.push(...adjustedTasks);
            periodInserted = true;
          }
        } else {
          result.push(t);
        }
      }

      return result;
    });
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

  const uniqueCalendarMap = new Map();
  const existingTitles = new Set(
    tasksForSelectedDate.map(t => (t.text || '').toLowerCase().trim())
  );

  (calendarEvents || []).forEach(evt => {
    if (!evt || !evt.id) return;
    const key = `${selectedDate}_${evt.id}`;
    if (hiddenCalendarEventIds[key]) return;

    const isBirthday = isBirthdayEvent(evt);
    let matchesDate = false;

    if (evt.date === selectedDate) {
      matchesDate = true;
    } else if (isBirthday && evt.date && evt.date.length >= 10 && selectedDate.length >= 10) {
      matchesDate = (evt.date.slice(5) === selectedDate.slice(5));
    }

    if (!matchesDate) return;

    const normTitle = (evt.title || evt.text || '').toLowerCase().trim();
    if (!normTitle) return;

    // Se já existe uma tarefa manual com o mesmo título, evita duplicata
    if (existingTitles.has(normTitle)) return;

    // Chave de desduplicação:
    // Para aniversários: normTitle (ex: 'aniversário mãe'), garantindo apenas 1 card mesmo que haja instâncias em outros anos
    // Para compromissos normais: normTitle + horário
    const dedupeKey = isBirthday ? `bday_${normTitle}` : `evt_${normTitle}_${evt.time || 'all'}`;

    if (!uniqueCalendarMap.has(dedupeKey)) {
      uniqueCalendarMap.set(dedupeKey, evt);
    } else {
      const existing = uniqueCalendarMap.get(dedupeKey);
      if (evt.date === selectedDate && existing.date !== selectedDate) {
        uniqueCalendarMap.set(dedupeKey, evt);
      }
    }
  });

  const calendarTasksForSelectedDate = Array.from(uniqueCalendarMap.values()).map(evt => {
    const isBirthday = isBirthdayEvent(evt);
    const key = `${selectedDate}_${evt.id}`;
    const historyKey = `calendar-${evt.id}_${selectedDate}`;
    const historyEntry = taskHistory ? taskHistory[historyKey] : null;
    const calStatusObj = calendarStatusMap[key];
    const legacyCompleted = Boolean(calendarCompletedMap[key]);

    let isCompleted = false;
    let status = 'pending';
    let observation = '';
    let startedAt = null;
    let completedAt = null;

    if (!isBirthday) {
      if (historyEntry && historyEntry.status) {
        status = historyEntry.status;
        isCompleted = status === 'completed';
        observation = historyEntry.observation || '';
        startedAt = historyEntry.startedAt || null;
        completedAt = historyEntry.completedAt || null;
      } else if (calStatusObj) {
        status = calStatusObj.status || 'pending';
        isCompleted = status === 'completed';
        observation = calStatusObj.observation || '';
      } else if (legacyCompleted) {
        status = 'completed';
        isCompleted = true;
      }
    }

    const customPrio = calendarPriorityMap[evt.id] || {};
    const priorityColor = isBirthday ? '#a855f7' : (customPrio.color || '#10b981');
    const calendarBgColor = isBirthday ? '#a855f7' : (evt.calendarColor || evt.color || '#0284c7');

    return {
      id: `calendar-${evt.id}`,
      calendarOriginalId: evt.id,
      text: evt.title || evt.text || 'Compromisso',
      emoji: isBirthday ? '🎉' : (evt.emoji || '📅'),
      description: customPrio.description || evt.description || '',
      time: evt.time || '09:00',
      period: customPrio.period || evt.period || 'Manhã',
      category: 'Pessoal',
      calendarColor: calendarBgColor,
      color: priorityColor,
      difficulty: customPrio.difficulty || 'low',
      completed: isCompleted,
      status,
      observation,
      startedAt,
      completedAt,
      isCalendarEvent: true,
      isBirthday,
      htmlLink: evt.htmlLink || null,
      date: selectedDate
    };
  });

  const allTasksForSelectedDate = [...tasksForSelectedDate, ...calendarTasksForSelectedDate];

  const categoryCounts = {};
  let uncategorizedCount = 0;
  allTasksForSelectedDate.forEach(t => {
    if (t.category) {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    } else {
      uncategorizedCount += 1;
    }
  });

  const filteredTasks = allTasksForSelectedDate.filter(t => {
    if (selectedCategories.length === 0) return true;
    if (!t.category) return selectedCategories.includes('__none__');
    return selectedCategories.includes(t.category);
  });

  const processedTasks = filteredTasks.map(t => {
      if (t.isCalendarEvent) {
        return t;
      }

      const historyKey = `${t.id}_${selectedDate}`;
      const historyEntry = taskHistory[historyKey];

      let status = 'pending';
      let completed = false;
      let observation = '';
      let completedAt = null;
      let startedAt = null;

      if (historyEntry) {
        status = historyEntry.status || 'pending';
        completed = status === 'completed';
        observation = historyEntry.observation || '';
        completedAt = historyEntry.completedAt || null;
        startedAt = historyEntry.startedAt || null;
      } else {
        // Fallback para tarefas salvas antes da migração para taskHistory
        if (t.isRecurring) {
          const completedDates = Array.isArray(t.completedDates) ? t.completedDates : [];
          const failedDates = Array.isArray(t.failedDates) ? t.failedDates : [];
          const dateObservations = t.dateObservations || {};

          if (completedDates.includes(selectedDate)) {
            status = 'completed';
            completed = true;
          } else if (failedDates.includes(selectedDate)) {
            status = 'failed';
            completed = false;
          }
          observation = dateObservations[selectedDate] || '';
          startedAt = null;
          completedAt = null;
        } else if (t.date === selectedDate || (!t.date && selectedDate === todayStr)) {
          status = t.status || (t.completed ? 'completed' : 'pending');
          completed = status === 'completed';
          observation = t.observation || '';
          completedAt = t.completedAt || null;
          startedAt = t.startedAt || null;
        }
      }

      // Subtarefas isoladas para o dia:
      // Se houver histórico salvo no dia, usa-o; caso contrário, deriva do modelo base com completed: false
      const baseSubtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
      let daySubtasks = [];
      if (historyEntry && Array.isArray(historyEntry.subtasks) && historyEntry.subtasks.length > 0) {
        daySubtasks = historyEntry.subtasks;
      } else {
        daySubtasks = baseSubtasks.map(st => ({
          ...st,
          completed: false
        }));
      }

      return {
        ...t,
        status,
        completed,
        observation,
        completedAt,
        startedAt,
        subtasks: daySubtasks
      };
    });

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
        totalCount={allTasksForSelectedDate.length}
        uncategorizedCount={uncategorizedCount}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        onSelectAll={handleSelectAll}
        weekday={getWeekdayLabel(selectedDate)}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOnDragEnd}>
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
                  <SortableContext items={group.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
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
                          onOpenDetails={() => setSelectedTask(processedTasks.find(pt => pt.id === task.id) || task)}
                          selectedDate={selectedDate}
                          todayStr={todayStr}
                          onMoveToToday={handleMoveToToday}
                          onOpenObservation={(t) => setTaskForObservation(processedTasks.find(pt => pt.id === t.id) || t)}
                        />
                      ))}
                    </div>
                  </SortableContext>
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

                  <div className="empty-state-restore-box">
                    <p>💼 Precisa restaurar suas rotinas de trabalho (Segunda a Sexta)?</p>
                    <button 
                      type="button" 
                      className="restore-backup-btn"
                      onClick={handleRestoreWorkTasks}
                      title="Restaura tarefas de rotina: Organização do Dia, Suporte, Desenvolvimento de Software e repetições de Seg a Sex"
                    >
                      <ArrowsClockwise size={18} weight="bold" />
                      <span>Restaurar Rotinas de Trabalho (Seg a Sex)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
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
      {taskForCompletion && (
        <TaskCompletionModal
          task={taskForCompletion}
          onClose={() => setTaskForCompletion(null)}
          onConfirm={(data) => handleSaveCompletion(taskForCompletion.id, data)}
          onResetPending={() => handleResetPending(taskForCompletion.id)}
        />
      )}
      {taskForObservation && (
        <TaskObservationModal
          task={taskForObservation}
          onClose={() => setTaskForObservation(null)}
          onEditObservation={(t) => {
            setTaskForObservation(null);
            setTaskForCompletion(t);
          }}
        />
      )}
      {taskToDelete && (
        <DeleteTaskModal
          task={taskToDelete}
          dateFormatted={(() => {
            if (!selectedDate) return '';
            const parts = selectedDate.split('-');
            return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : selectedDate;
          })()}
          onClose={() => setTaskToDelete(null)}
          onDeleteSingleDay={handleDeleteSingleDay}
          onDeleteFromDayForward={handleDeleteFromDayForward}
          onDeleteAll={handleDeleteAll}
        />
      )}
    </div>
  );
}

export default DailyPlanner;