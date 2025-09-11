// src/components/TimerControl.js
import React from 'react';
import { PlayIcon, PauseIcon, StopIcon } from '@phosphor-icons/react';

const phaseLabels = {
  Focus: 'Foco',
  ShortBreak: 'Pausa Curta',
  LongBreak: 'Pausa Longa'
};

function TimerControl({ activeTimer, onPauseResume, onCancel, currentTimeDisplay }) {
  const { phase, isRunning } = activeTimer;

  return (
    <div className="timer-controls-container">
      <span className="timer-phase-label">{phaseLabels[phase]}</span>
      <span className="timer-display">{currentTimeDisplay}</span>
      <button className="timer-control-button" onClick={onPauseResume}>
        {isRunning ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
      </button>
      <button className="timer-control-button" onClick={onCancel}>
        <StopIcon size={16} />
      </button>
    </div>
  );
}

export default TimerControl;