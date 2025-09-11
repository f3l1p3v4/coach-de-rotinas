// src/components/DailyPlanner.js
import React, { useState, useEffect, useCallback } from 'react';
import TodoItem from './TodoItem';

// Adicionamos um emoji para cada tarefa!
const initialTasks = [
  { id: 1, text: 'Treino', emoji: '💪', completed: false },
  { id: 2, text: 'Estudo Espiritual', emoji: '🙏', completed: false },
  { id: 3, text: 'Estudo de Órgão', emoji: '🎹', completed: false },
  { id: 4, text: 'Faculdade / Concursos', emoji: '📚', completed: false },
  { id: 5, text: 'Limpeza Rápida da Casa', emoji: '🧹', completed: false },
];

function DailyPlanner() {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTimer, setActiveTimer] = useState({ taskId: null, totalSeconds: 0 });
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState('00:00');

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  
  const handleToggle = (id) => {
    setTasks(tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };
  
  const handleRemove = (id) => {
    if(activeTimer.taskId === id) {
        setActiveTimer({ taskId: null, totalSeconds: 0 });
    }
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const handleStartTimer = (taskId, minutes) => {
    setActiveTimer({ taskId, totalSeconds: minutes * 60 });
  };

  const handleTimerCompletion = useCallback(() => {
    if (activeTimer.taskId) {
      const completedTask = tasks.find(t => t.id === activeTimer.taskId);
      // Mensagem de alerta mais divertida! 🎉
      alert(`🎉 Tempo para "${completedTask?.emoji} ${completedTask?.text}" concluído! Bom trabalho! ✅`);
      setActiveTimer({ taskId: null, totalSeconds: 0 });
    }
  }, [activeTimer.taskId, tasks]);

  useEffect(() => {
    if (activeTimer.taskId && activeTimer.totalSeconds > 0) {
      const interval = setInterval(() => {
        setActiveTimer(prev => ({ ...prev, totalSeconds: prev.totalSeconds - 1 }));
      }, 1000);
      return () => clearInterval(interval);
    } else if (activeTimer.totalSeconds === 0 && activeTimer.taskId !== null) {
      handleTimerCompletion();
    }
  }, [activeTimer, handleTimerCompletion]);

  useEffect(() => {
    setCurrentTimeDisplay(formatTime(activeTimer.totalSeconds));
  }, [activeTimer.totalSeconds]);

  return (
    <div className="planner-container">
      <h1>🗓️ Plano do Dia</h1>
      <ul className="todo-list">
        {tasks.map((task) => (
          <TodoItem
            key={task.id}
            task={task}
            onToggle={handleToggle}
            onRemove={handleRemove}
            onStartTimer={handleStartTimer}
            activeTimerId={activeTimer.taskId}
            currentTimeDisplay={currentTimeDisplay}
          />
        ))}
      </ul>
    </div>
  );
}

export default DailyPlanner;