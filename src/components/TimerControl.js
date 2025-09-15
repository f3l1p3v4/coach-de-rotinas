import React from 'react';
import { PlayCircle, PauseCircle, XCircle } from '@phosphor-icons/react';

const phaseLabels = {
  Focus: 'Foco',
  ShortBreak: 'Pausa Curta',
  LongBreak: 'Pausa Longa'
};

function TimerControl({ activeTimer, onPauseResume, onCancel, currentTimeDisplay }) {
  const { phase, isRunning } = activeTimer;

  return (
    <div className="timer-controls-container-v2">
      <span className="timer-phase-label-v2">{phaseLabels[phase]}</span>
      <span className="timer-display-v2">{currentTimeDisplay}</span>
      <div className="timer-buttons-wrapper">
        <button className="timer-control-button-v2" onClick={onPauseResume}>
          {isRunning ? <PauseCircle size={32} weight="fill" /> : <PlayCircle size={32} weight="fill" />}
        </button>
        <button className="timer-control-button-v2 timer-cancel-button" onClick={onCancel}>
          <XCircle size={32} weight="fill" />
        </button>
      </div>
    </div>
  );
}

export default TimerControl;