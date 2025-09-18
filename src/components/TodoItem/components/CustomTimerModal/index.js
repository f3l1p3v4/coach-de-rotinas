import React, { useState } from 'react';
import { XCircle } from '@phosphor-icons/react';

import './styles.css';

function CustomTimerModal({ onStartCustom, closeModal }) {
  const [customFocus, setCustomFocus] = useState(50);
  const [customBreak, setCustomBreak] = useState(10);
  const [isCycle, setIsCycle] = useState(true);

  const handleStart = () => {
    let config;
    if (isCycle) {
      config = { Focus: customFocus, ShortBreak: customBreak, cycles: 100 };
    } else {
      config = { Focus: customFocus };
    }
    onStartCustom(config, isCycle ? 'customCycle' : 'customSimple');
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Definir Timer Personalizado</h3>
        <button className="modal-close-button" onClick={closeModal}>
          <XCircle size={24} />
        </button>
        
        <div className="toggle-cycle-container">
          <label>Ciclo com Pausas?</label>
          <label className="switch">
            <input type="checkbox" checked={isCycle} onChange={() => setIsCycle(!isCycle)} />
            <span className="slider round"></span>
          </label>
        </div>

        <div className="custom-time-adjuster">
          <label>Foco (min):</label>
          <div className="adjuster-buttons">
            <button onClick={() => setCustomFocus(m => Math.max(5, m - 5))}>-</button>
            <span>{customFocus}</span>
            <button onClick={() => setCustomFocus(m => m + 5)}>+</button>
          </div>
        </div>

        {isCycle && (
          <div className="custom-time-adjuster">
            <label>Pausa (min):</label>
            <div className="adjuster-buttons">
              <button onClick={() => setCustomBreak(m => Math.max(5, m - 5))}>-</button>
              <span>{customBreak}</span>
              <button onClick={() => setCustomBreak(m => m + 5)}>+</button>
            </div>
          </div>
        )}

        <button className="start-custom-btn" onClick={handleStart}>
          Iniciar Timer
        </button>
      </div>
    </div>
  );
}

export default CustomTimerModal;