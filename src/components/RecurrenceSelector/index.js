import React from 'react';
import { DAYS_OF_WEEK } from '../../constants/recurrence';
import './styles.css';

function RecurrenceSelector({ isRecurring, onChangeIsRecurring, recurringDays = [], onChangeRecurringDays }) {
  const getSelectedMode = () => {
    if (!isRecurring) return 'none';
    if (recurringDays.length === 7) return 'daily';
    const sorted = [...recurringDays].sort((a, b) => a - b);
    const isWeekdays = sorted.length === 5 && sorted.every((d, i) => d === i + 1);
    if (isWeekdays) return 'weekdays';
    return 'custom';
  };

  const handleModeChange = (e) => {
    const mode = e.target.value;
    if (mode === 'none') {
      onChangeIsRecurring(false);
      onChangeRecurringDays([]);
    } else if (mode === 'daily') {
      onChangeIsRecurring(true);
      onChangeRecurringDays([0, 1, 2, 3, 4, 5, 6]);
    } else if (mode === 'weekdays') {
      onChangeIsRecurring(true);
      onChangeRecurringDays([1, 2, 3, 4, 5]);
    } else if (mode === 'custom') {
      onChangeIsRecurring(true);
      // Se não tiver nada marcado, marca o dia atual ou segunda
      if (recurringDays.length === 0) {
        const todayDay = new Date().getDay();
        onChangeRecurringDays([todayDay]);
      }
    }
  };

  const handleToggleDay = (dayId) => {
    if (!isRecurring) {
      onChangeIsRecurring(true);
      onChangeRecurringDays([dayId]);
      return;
    }

    if (recurringDays.includes(dayId)) {
      const next = recurringDays.filter(d => d !== dayId);
      if (next.length === 0) {
        onChangeIsRecurring(false);
        onChangeRecurringDays([]);
      } else {
        onChangeRecurringDays(next);
      }
    } else {
      onChangeRecurringDays([...recurringDays, dayId]);
    }
  };

  return (
    <div className="recurrence-selector-container">
      <label className="recurrence-label">🔁 Repetir Tarefa / Tarefa Fixa</label>
      
      <div className="recurrence-mode-wrapper">
        <select 
          value={getSelectedMode()} 
          onChange={handleModeChange}
          className="recurrence-select"
        >
          <option value="none">Apenas nesta data (não repetir)</option>
          <option value="daily">Todos os dias (fixa diária)</option>
          <option value="weekdays">Segunda a Sexta (dias úteis)</option>
          <option value="custom">Dias específicos da semana...</option>
        </select>
      </div>

      {isRecurring && (
        <div className="recurrence-days-row">
          {DAYS_OF_WEEK.map(d => {
            const isSelected = recurringDays.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                className={`recurrence-day-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleToggleDay(d.id)}
                title={d.fullName}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecurrenceSelector;