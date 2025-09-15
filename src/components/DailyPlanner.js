import React, { useState, useEffect, useCallback, useRef } from 'react';
// Importações da biblioteca correta: @dnd-kit
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import TodoItem from './TodoItem';

const initialTasks = [
  { id: '1', text: 'Treino', emoji: '💪', completed: false, completedAt: null },
  { id: '2', text: 'Estudo Espiritual', emoji: '🙏', completed: false, completedAt: null },
  { id: '3', text: 'Estudo de Órgão', emoji: '🎹', completed: false, completedAt: null },
  { id: '4', text: 'Faculdade / Concursos', emoji: '📚', completed: false, completedAt: null },
  { id: '5', text: 'Limpeza Rápida da Casa', emoji: '🧹', completed: false, completedAt: null },
];

const POMODORO_CONFIG = { Focus: 25, ShortBreak: 5, LongBreak: 15, cycles: 4 };

function DailyPlanner() {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTimer, setActiveTimer] = useState({ taskId: null, totalSeconds: 0, phase: 'Focus', isRunning: false, pomodoroCycle: 0, type: null });
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState('00:00');
  const audioContextRef = useRef(null);

  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancela falas anteriores
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
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
    let nextPhase, nextSeconds, nextCycle = activeTimer.pomodoroCycle;
    const completedTask = tasks.find(t => t.id === activeTimer.taskId);
    if (activeTimer.phase === 'Focus') {
      nextCycle++;
      if (nextCycle > 0 && nextCycle % POMODORO_CONFIG.cycles === 0) {
        nextPhase = 'LongBreak';
        nextSeconds = POMODORO_CONFIG.LongBreak * 60;
      } else {
        nextPhase = 'ShortBreak';
        nextSeconds = POMODORO_CONFIG.ShortBreak * 60;
      }
    } else {
      nextPhase = 'Focus';
      nextSeconds = POMODORO_CONFIG.Focus * 60;
    }

    let spokenMessage = '';
    if (nextPhase === 'ShortBreak') {
      spokenMessage = `Iniciando pausa curta de ${POMODORO_CONFIG.ShortBreak} minutos.`;
    } else if (nextPhase === 'LongBreak') {
      spokenMessage = `Iniciando pausa longa de ${POMODORO_CONFIG.LongBreak} minutos.`;
    } else {
      spokenMessage = `Iniciando sessão de foco de ${POMODORO_CONFIG.Focus} minutos.`;
    }
    speak(spokenMessage);

    alert(`🎉 Tempo para "${completedTask?.emoji} ${completedTask?.text}" (${activeTimer.phase}) concluído! Iniciando: ${nextPhase}`);
    setActiveTimer(prev => ({ ...prev, totalSeconds: nextSeconds, phase: nextPhase, pomodoroCycle: nextCycle, isRunning: true }));
  }, [activeTimer.phase, activeTimer.pomodoroCycle, activeTimer.taskId, tasks, speak]);

  const handleCancelTimer = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setActiveTimer({ taskId: null, totalSeconds: 0, phase: 'Focus', isRunning: false, pomodoroCycle: 0, type: null });
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
      if (activeTimer.type === 'pomodoro' && secondsLeft === 11) {
        speak('A sua sessão está a terminar em 10 segundos.');
      }

      return () => clearInterval(interval);
    } else if (activeTimer.isRunning && activeTimer.totalSeconds === 0) {
      playBeep(1200, 0.5, 0.6);
      
      if (activeTimer.type === 'pomodoro') {
        startNextPhase();
      } else {
        const completedTask = tasks.find(t => t.id === activeTimer.taskId);
        speak(`Tempo personalizado para ${completedTask?.text} concluído!`)
        alert(`🎉 Tempo personalizado para "${completedTask?.emoji} ${completedTask?.text}" concluído!`);
        handleCancelTimer();
      }
    }
  }, [activeTimer.isRunning, activeTimer.totalSeconds, playBeep, startNextPhase, activeTimer.type, activeTimer.taskId, tasks, handleCancelTimer, speak]);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    setCurrentTimeDisplay(formatTime(activeTimer.totalSeconds));
  }, [activeTimer.totalSeconds]);

  const handleStartTimer = (taskId, minutes, type) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (type === 'pomodoro') {
      speak(`Iniciando sessão de foco de ${minutes} minutos.`);
    } else {
      speak(`Iniciando timer personalizado de ${minutes} minutos.`);
    }
    setActiveTimer({ taskId, totalSeconds: minutes * 60, phase: 'Focus', isRunning: true, pomodoroCycle: 0, type });
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
    setTasks(tasks.map(t => 
      t.id === id 
        ? { ...t, completed: isCompleting, completedAt: isCompleting ? new Date() : null } 
        : t
    ));
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
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  return (
    <div className="planner-container">
      <h1>🗓️ Plano do Dia</h1>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOnDragEnd}>
        <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
          <ul className="todo-list">
            {tasks.map((task) => (
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
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default DailyPlanner;