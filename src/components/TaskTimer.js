import React, { useState, useEffect } from 'react';

// key prop é essencial para forçar a recriação do componente
function TaskTimer({ initialMinutes = 25, onComplete, onCancel, componentKey }) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true); // Começa a contar automaticamente

  useEffect(() => {
    // Resetar o tempo quando a key ou o tempo inicial mudam
    setMinutes(initialMinutes);
    setSeconds(0);
    setIsActive(true);
  }, [componentKey, initialMinutes]);


  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            setIsActive(false);
            if (onComplete) onComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isActive, seconds, minutes, onComplete]);

  const toggleTimer = () => setIsActive(!isActive);

  return (
    <div className="task-timer-container">
      <div className="timer-display">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div className="timer-controls">
        <button onClick={toggleTimer}>{isActive ? 'Pausar' : 'Continuar'}</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

export default TaskTimer;