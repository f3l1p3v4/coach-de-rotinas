import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import TodoItem from './TodoItem';

const initialTasks = [
  { id: '1', text: 'Treino', emoji: '💪', completed: false },
  { id: '2', text: 'Estudo Espiritual', emoji: '🙏', completed: false },
  { id: '3', text: 'Estudo de Órgão', emoji: '🎹', completed: false },
  { id: '4', text: 'Faculdade / Concursos', emoji: '📚', completed: false },
  { id: '5', text: 'Limpeza Rápida da Casa', emoji: '🧹', completed: false },
];

const POMODORO_CONFIG = { Focus: 25, ShortBreak: 5, LongBreak: 15, cycles: 4 };

function DailyPlanner({ onPomodoroComplete }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTimer, setActiveTimer] = useState({ taskId: null, totalSeconds: 0, phase: 'Focus', isRunning: false, pomodoroCycle: 0 });
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState('00:00');
  const audioContextRef = useRef(null);

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
    const completedTask = tasks.find(t => t.id === activeTimer.taskId);
    let nextPhase, nextSeconds, nextCycle = activeTimer.pomodoroCycle;

    if (activeTimer.phase === 'Focus') {
      onPomodoroComplete(); // Chama a função para incrementar o placar
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
    alert(`🎉 Tempo para "${completedTask?.emoji} ${completedTask?.text}" (${activeTimer.phase}) concluído! Iniciando: ${nextPhase}`);
    setActiveTimer(prev => ({ ...prev, totalSeconds: nextSeconds, phase: nextPhase, pomodoroCycle: nextCycle, isRunning: true }));
  }, [activeTimer.taskId, activeTimer.phase, activeTimer.pomodoroCycle, tasks, onPomodoroComplete]); // <<< DEPENDÊNCIA CORRIGIDA AQUI

  useEffect(() => {
    if (activeTimer.isRunning && activeTimer.totalSeconds > 0) {
      const interval = setInterval(() => {
        setActiveTimer(prev => ({ ...prev, totalSeconds: prev.totalSeconds - 1 }));
        const secondsLeft = activeTimer.totalSeconds;
        if (secondsLeft > 1 && secondsLeft <= 11) {
          playBeep(880, 0.1, 0.3);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else if (activeTimer.isRunning && activeTimer.totalSeconds === 0) {
      playBeep(1200, 0.5, 0.6);
      startNextPhase();
    }
  }, [activeTimer.isRunning, activeTimer.totalSeconds, playBeep, startNextPhase]);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    setCurrentTimeDisplay(formatTime(activeTimer.totalSeconds));
  }, [activeTimer.totalSeconds]);

  const handleStartTimer = (taskId, minutes) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    setActiveTimer({ taskId, totalSeconds: minutes * 60, phase: 'Focus', isRunning: true, pomodoroCycle: 0 });
  };
  
  const handlePauseResumeTimer = () => {
    if (activeTimer.totalSeconds > 0) {
      setActiveTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
    }
  };

  const handleCancelTimer = () => {
    setActiveTimer({ taskId: null, totalSeconds: 0, phase: 'Focus', isRunning: false, pomodoroCycle: 0 });
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
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
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