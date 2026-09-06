import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { PlusCircle, User } from '@phosphor-icons/react';
import { loadUserTasks, syncUserTasks } from '../../services/supabaseService';

import TodoItem from '../TodoItem';
import TaskDetailsModal from '../TaskDetailsModal';
import AddTaskModal from '../AddTaskModal';

import './styles.css';

const taskTemplates = [
  { id: '1', text: 'Treino', emoji: '💪', description: 'Foco em peito e tríceps. Manter a boa forma e controlar a respiração.', subtasks: [{ id: 101, text: 'Aquecimento - 10 min', completed: false }, { id: 102, text: 'Supino Reto - 4x8', completed: false }] },
  { id: '2', text: 'Estudo Espiritual', emoji: '🙏', description: 'Leitura do capítulo de hoje e meditação. O objetivo é a reflexão.', subtasks: [] },
  { id: '3', text: 'Estudo de Órgão', emoji: '🎹', description: 'Praticar as escalas e a nova peça.', subtasks: [{ id: 301, text: 'Escalas - 15 min', completed: false }, { id: 302, text: 'Praticar nova música', completed: false }] },
  { id: '4', text: 'Faculdade / Concursos', emoji: '📚', description: 'Revisão da matéria e resolução de exercícios.', subtasks: [{ id: 401, text: 'Ler resumo do capítulo', completed: false }, { id: 402, text: 'Fazer 10 exercícios', completed: false }] },
  { id: '5', text: 'Limpeza Rápida da Casa', emoji: '🧹', description: 'Foco num cómodo por 15 minutos.', subtasks: [] },
  { id: '6', text: 'Organização do Dia', emoji: '📋', description: 'Organizar manhã de trabalho por 30 min', subtasks: [{ id: 601, text: 'Verificar mensagens pessoais e profissionais no email e whatsapp', completed: false }, { id: 602, text: 'Processar todas as ULs', completed: false }, { id: 603, text: 'Organizar as tarefas pendentes no trello', completed: false }, { id: 604, text: 'Ler notícias', completed: false }] },
  { id: '7', text: 'Conferência de Serviços', emoji: '🔍', description: 'Verificar relatório de inconsistencia e fazer backup e ajustes se necessário', subtasks: [] },
  { id: '8', text: 'Estudo no Trabalho', emoji: '🧠', description: 'Estudar ferramentas para usar no meu trabalho', subtasks: [{ id: 801, text: 'Estudar SQL Server', completed: false }, { id: 802, text: 'Estudar Maker Softwell', completed: false },] },
  { id: '9', text: 'Suporte', emoji: '📞', description: 'Solução de problemas aleatórios relacionadas ao Suporte', subtasks: [{ id: 901, text: 'Conferência de inconsistencia de catraca se precisar', completed: false }, { id: 902, text: 'Estudar Maker Softwell', completed: false },] },
  { id: '10', text: 'Desenvolvimento de Software', emoji: '👨‍💻', description: 'Focar em projetos de desenvolvimento e implementação de novas funcionalidades.', subtasks: [{ id: 1001, text: 'Codificar e testar novas features', completed: false }, { id: 1002, text: 'Revisar código (Code Review)', completed: false }, { id: 1003, text: 'Corrigir bugs identificados', completed: false }, { id: 1004, text: 'Documentar a nova funcionalidade', completed: false }] },
];

export const initialTaskTemplates = taskTemplates;

export const POMODORO_CONFIG = { Focus: 25, ShortBreak: 5, LongBreak: 15, cycles: 4 };

function DailyPlanner({ onPomodoroComplete, isDarkMode, toggleDarkMode, templates: propTemplates, setTemplates: propSetTemplates, user, onOpenAuthModal }) {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('daily_tasks');
    if (savedTasks) {
      try {
        return JSON.parse(savedTasks);
      } catch (e) {}
    }
    return [];
  });
  const [isTasksLoaded, setIsTasksLoaded] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTimer, setActiveTimer] = useState({ taskId: null, totalSeconds: 0, phase: 'Focus', isRunning: false, pomodoroCycle: 0, type: null, config: null });
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState('00:00');
  const audioContextRef = useRef(null);

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

  useEffect(() => {
    let isMounted = true;
    async function initTasks() {
      if (user?.id) {
        const initialTasks = await loadUserTasks(user.id);
        if (isMounted) {
          setTasks(initialTasks);
          setIsTasksLoaded(true);
        }
      } else {
        setIsTasksLoaded(true);
      }
    }
    initTasks();
    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    if (isTasksLoaded) {
      syncUserTasks(user?.id, tasks);
    }
  }, [tasks, user, isTasksLoaded]);

  useEffect(() => {
    localStorage.setItem('custom_task_templates', JSON.stringify(templates));
  }, [templates]);

  const handleAddTask = (newTask, saveAsTemplate) => {
    setTasks(prevTasks => [...prevTasks, newTask]);
    if (saveAsTemplate) {
      const newTemplate = {
        id: Date.now().toString(),
        text: newTask.text,
        emoji: newTask.emoji,
        description: newTask.description,
        subtasks: (newTask.subtasks || []).map(st => ({ id: Date.now() + Math.random(), text: st.text, completed: false }))
      };
      setTemplates(prev => [...prev, newTemplate]);
    }
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

  const playBeep = useCallback((frequency = 880, duration = 0.1, volume = 0.5) => {
    if (!audioContextRef.current) return;
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration);
  }, []);

  const startNextPhase = useCallback(() => {
    const { taskId, phase, pomodoroCycle, config } = activeTimer;
    if (!config || !config.ShortBreak) return; // Não avança a fase se não for um ciclo com pausas

    const completedTask = tasks.find(t => t.id === taskId);
    let nextPhase, nextSeconds, nextCycle = pomodoroCycle;

    if (phase === 'Focus') {
      onPomodoroComplete();
      nextCycle++;
      if (config.LongBreak && nextCycle > 0 && nextCycle % config.cycles === 0) {
        nextPhase = 'LongBreak';
        nextSeconds = config.LongBreak * 60;
      } else {
        nextPhase = 'ShortBreak';
        nextSeconds = config.ShortBreak * 60;
      }
    } else {
      nextPhase = 'Focus';
      nextSeconds = config.Focus * 60;
    }

    speak(`Iniciando ${nextPhase === 'Focus' ? 'foco' : 'pausa'}`);
    alert(`🎉 Tempo para "${completedTask?.emoji} ${completedTask?.text}" (${phase}) concluído! Iniciando: ${nextPhase}`);
    setActiveTimer(prev => ({ ...prev, totalSeconds: nextSeconds, phase: nextPhase, pomodoroCycle: nextCycle, isRunning: true }));
  }, [activeTimer, tasks, onPomodoroComplete, speak]);

  const handleCancelTimer = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setActiveTimer({ taskId: null, totalSeconds: 0, phase: 'Focus', isRunning: false, pomodoroCycle: 0, type: null, config: null });
  }, []);

  useEffect(() => {
    if (activeTimer.isRunning && activeTimer.totalSeconds > 0) {
      const interval = setInterval(() => {
        setActiveTimer(prev => ({ ...prev, totalSeconds: prev.totalSeconds - 1 }));
      }, 1000);

      const secondsLeft = activeTimer.totalSeconds;
      if (secondsLeft > 1 && secondsLeft <= 11) {
        playBeep(880, 0.1, 0.3);
      }
      if (secondsLeft === 11) {
        speak('Dez segundos.');
      }

      return () => clearInterval(interval);
    } else if (activeTimer.isRunning && activeTimer.totalSeconds === 0) {
      playBeep(1200, 0.5, 0.6);

      const isCycle = activeTimer.type === 'pomodoro' || activeTimer.type === 'customCycle';

      if (isCycle) {
        startNextPhase();
      } else { // Timer simples de uma só vez
        const completedTask = tasks.find(t => t.id === activeTimer.taskId);
        const endMessage = `Tempo para ${completedTask?.text} concluído!`;
        speak(endMessage);
        alert(`🎉 ${endMessage}`);
        handleCancelTimer();
      }
    }
  }, [activeTimer, playBeep, startNextPhase, handleCancelTimer, tasks, speak]);

  const handleStartTimer = (taskId, config, type) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    speak(`Iniciando ${config.ShortBreak ? 'ciclo' : 'timer'} de ${config.Focus} minutos para a tarefa ${tasks.find(t => t.id === taskId)?.text}.`);
    setActiveTimer({ taskId, totalSeconds: config.Focus * 60, phase: 'Focus', isRunning: true, pomodoroCycle: 0, type, config });
  };

  const handlePauseResumeTimer = () => {
    if (activeTimer.totalSeconds > 0) {
      setActiveTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
    }
  };

  const handleToggle = (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const isCompleting = !task.completed;
    if (isCompleting && activeTimer.taskId === id) {
      const userConfirmed = window.confirm("⏱️ A atividade está em andamento. Deseja realmente finalizá-la e parar o timer?");
      if (userConfirmed) {
        handleCancelTimer();
      } else {
        return;
      }
    }
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: isCompleting, completedAt: isCompleting ? new Date() : null } : t));
  };

  const handleRemove = (id) => {
    if (activeTimer.taskId === id) handleCancelTimer();
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleOnDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        // Extrai a lista de horários na ordem atual das posições
        const times = items.map((item) => item.time);

        // Move as tarefas para a nova ordem visual
        const reorderedItems = arrayMove(items, oldIndex, newIndex);

        // Atribui o horário correspondente da posição para cada tarefa reordenada
        return reorderedItems.map((item, index) => ({
          ...item,
          time: times[index]
        }));
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
    if (!t || !t.time) return null;
    const h = parseInt(t.time.split(':')[0], 10);
    if (h >= 12 && h < 18) return 'Tarde';
    if (h >= 18) return 'Noite';
    return 'Manhã';
  };

  const processedTasks = tasks.map((task, index) => {
    let timelineInfo = null;
    if (task.time) {
      const period = getPeriod(task);
      const prevPeriod = getPeriod(tasks[index - 1]);
      const nextPeriod = getPeriod(tasks[index + 1]);

      const isFirst = prevPeriod !== period;
      const isLast = nextPeriod !== period;

      let startIdx = index;
      while (startIdx > 0 && getPeriod(tasks[startIdx - 1]) === period) startIdx--;
      let endIdx = index;
      while (endIdx < tasks.length - 1 && getPeriod(tasks[endIdx + 1]) === period) endIdx++;

      const groupSize = endIdx - startIdx + 1;
      const showText = isFirst;

      timelineInfo = { time: task.time, period, isFirst, isLast, showText, groupSize };
    }
    return { ...task, timelineInfo };
  });

  return (
    <div className="planner-container">
      <div className="planner-header">
        <h1>Focus Task 🎯</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="user-auth-badge-btn" onClick={onOpenAuthModal} title={user ? `Logado como ${user.email}` : "Entrar ou Criar Conta"}>
            <User size={20} />
            <span>{user ? (user.email ? user.email.split('@')[0] : 'Minha Conta') : 'Entrar'}</span>
          </button>
          <div className="theme-toggle-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>{isDarkMode ? '🌙' : '☀️'}</span>
            <label className="switch">
              <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
              <span className="slider round"></span>
            </label>
          </div>
          <button className="add-task-button" onClick={() => setIsAddTaskModalOpen(true)}>
            <PlusCircle size={28} />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOnDragEnd}>
        <SortableContext items={processedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="todo-list">
            {processedTasks.length > 0 ? (
              processedTasks.map((task, index) => (
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
                  onOpenDetails={() => setSelectedTask(task)}
                />
              ))
            ) : (
              <p className="empty-state-message">A sua lista de tarefas está vazia. Adicione uma nova tarefa para começar!</p>
            )}
          </ul>
        </SortableContext>
      </DndContext>
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onAddTask={handleAddTask}
        taskTemplates={templates}
      />
    </div>
  );
}

export default DailyPlanner;