import React, { useState, useEffect, useCallback } from 'react';
import { 
  CalendarBlank, 
  CaretLeft, 
  CaretRight, 
  Plus, 
  X, 
  Clock, 
  Trash,
  PlusCircle,
  Tag
} from '@phosphor-icons/react';

import { 
  signInWithGoogleCalendar, 
  getGoogleAccessToken, 
  fetchGoogleEvents, 
  createGoogleEvent 
} from '../../services/googleCalendarService';

import './styles.css';

const DEFAULT_EVENTS = [];

const EVENT_COLORS = [
  '#10b981', // Verde
  '#0284c7', // Azul
  '#8b5cf6', // Roxo
  '#ef4444', // Vermelho
  '#d97706', // Laranja / Amarelo
  '#ec4899', // Rosa
  '#0d9488'  // Teal
];

function getEventColor(evt) {
  if (!evt) return EVENT_COLORS[0];
  if (evt.color) return evt.color;
  let hash = 0;
  const str = evt.id || evt.title || '';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % EVENT_COLORS.length;
  return EVENT_COLORS[index];
}

function parseTimeAndPeriod(timeStr, defaultPeriod = 'Manhã') {
  if (!timeStr || timeStr === 'Dia inteiro') {
    return { time: '09:00', period: defaultPeriod || 'Manhã' };
  }
  const match = timeStr.match(/(\d{1,2}:\d{2})/);
  if (match) {
    const rawTime = match[1];
    const [hStr, mStr] = rawTime.split(':');
    const h = parseInt(hStr, 10);
    const formattedTime = `${String(h).padStart(2, '0')}:${mStr}`;
    let period = 'Manhã';
    if (h >= 12 && h < 18) period = 'Tarde';
    else if (h >= 18) period = 'Noite';
    return { time: formattedTime, period };
  }
  return { time: '09:00', period: defaultPeriod || 'Manhã' };
}

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function GoogleCalendarCard({ onClose, onAddTaskFromCalendar, selectedDate }) {
  const [viewMode, setViewMode] = useState('month'); // 'month' ou 'week'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('google_calendar_events');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_EVENTS;
  });

  const [googleToken, setGoogleToken] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  const [selectedEventDetail, setSelectedEventDetail] = useState(null);

  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEmoji, setNewEmoji] = useState('📅');
  const [newDate, setNewDate] = useState(getTodayStr());
  const [newTime, setNewTime] = useState('09:00 - 10:00');
  const [newPeriod, setNewPeriod] = useState('Manhã');
  const [newDesc, setNewDesc] = useState('');

  const loadRealGoogleEvents = useCallback(async (token, dateRef = currentDate) => {
    setIsSyncing(true);
    setSyncStatusMsg('Sincronizando com Google Calendar...');
    try {
      const startRange = new Date(dateRef.getFullYear(), dateRef.getMonth() - 1, 1).toISOString();
      const endRange = new Date(dateRef.getFullYear(), dateRef.getMonth() + 2, 0, 23, 59, 59).toISOString();

      const realEvents = await fetchGoogleEvents(token, startRange, endRange);
      setEvents(realEvents || []);
      if (realEvents && realEvents.length > 0) {
        setSyncStatusMsg(`Sincronizado! ${realEvents.length} evento(s) carregado(s).`);
      } else {
        setSyncStatusMsg('Conectado ao Google Agenda (nenhum evento neste período).');
      }
    } catch (err) {
      console.error('Erro ao recarregar eventos do Google:', err);
      setSyncStatusMsg('Erro ao conectar com Google.');
    } finally {
      setIsSyncing(false);
    }
  }, [currentDate]);

  useEffect(() => {
    async function checkGoogleAuthAndFetch() {
      try {
        const token = await getGoogleAccessToken();
        if (token) {
          setGoogleToken(token);
          loadRealGoogleEvents(token);
        }
      } catch (e) {
        console.warn('Google Calendar token check failed:', e);
      }
    }
    checkGoogleAuthAndFetch();
  }, [loadRealGoogleEvents]);

  const handleConnectGoogle = async () => {
    try {
      setSyncStatusMsg('Redirecionando para login do Google...');
      await signInWithGoogleCalendar();
    } catch (err) {
      alert(err.message || 'Erro ao conectar com Google Agenda.');
    }
  };

  useEffect(() => {
    localStorage.setItem('google_calendar_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    if (googleToken) {
      loadRealGoogleEvents(googleToken, currentDate);
    }
  }, [currentDate, googleToken, loadRealGoogleEvents]);

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEvt = {
      id: 'evt-' + Date.now(),
      title: newTitle.trim(),
      emoji: newEmoji || '📅',
      date: newDate,
      time: newTime,
      period: newPeriod,
      description: newDesc.trim()
    };

    setIsSyncing(true);
    try {
      if (googleToken) {
        await createGoogleEvent(googleToken, newEvt);
        setSyncStatusMsg('Evento criado no seu Google Calendar!');
      }
    } catch (err) {
      console.warn('Erro ao salvar no Google Calendar:', err);
    } finally {
      setIsSyncing(false);
    }

    setEvents(prev => [...prev, newEvt]);
    setNewTitle('');
    setNewDesc('');
    setIsAddingEvent(false);
  };

  const handleDeleteEvent = (id, e) => {
    if (e) e.stopPropagation();
    setEvents(prev => prev.filter(evt => evt.id !== id));
  };

  const handleAddEventToTasks = (evt, e) => {
    if (e) e.stopPropagation();
    const { time, period } = parseTimeAndPeriod(evt.time, evt.period);
    if (onAddTaskFromCalendar) {
      onAddTaskFromCalendar({
        text: evt.title,
        emoji: evt.emoji || '📅',
        description: evt.description ? `${evt.description} (Horário: ${evt.time || ''})` : `Agendado: ${evt.time || 'Dia inteiro'}`,
        time: time,
        period: period,
        subtasks: [],
        date: selectedDate || getTodayStr()
      });
    }
  };

  const handleDragStart = (evt, e) => {
    const { time, period } = parseTimeAndPeriod(evt.time, evt.period);
    const payload = JSON.stringify({
      text: evt.title,
      emoji: evt.emoji || '📅',
      description: evt.description ? `${evt.description} (Horário: ${evt.time || ''})` : `Agendado: ${evt.time || 'Dia inteiro'}`,
      time: time,
      period: period,
      subtasks: [],
      date: selectedDate || getTodayStr()
    });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', payload);
  };

  // Funções auxiliares para montar o calendário
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Grade de dias no Modo Mês
  const getMonthDaysGrid = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startingDayOfWeek = firstDay.getDay(); // 0 = Domingo
    const totalDays = lastDay.getDate();

    const days = [];

    // Dias do mês anterior
    const prevMonthDate = new Date(year, month, 0);
    const prevMonthLastDay = prevMonthDate.getDate();
    const prevYear = prevMonthDate.getFullYear();
    const prevMonthStr = String(prevMonthDate.getMonth() + 1).padStart(2, '0');

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const dayStr = String(d).padStart(2, '0');
      days.push({
        day: d,
        isCurrentMonth: false,
        dateStr: `${prevYear}-${prevMonthStr}-${dayStr}`
      });
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDays; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      days.push({
        day: d,
        isCurrentMonth: true,
        dateStr
      });
    }

    // Completar última semana
    const nextMonthDate = new Date(year, month + 1, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonthStr = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
    const remaining = (7 - (days.length % 7)) % 7;

    for (let i = 1; i <= remaining; i++) {
      const dayStr = String(i).padStart(2, '0');
      days.push({
        day: i,
        isCurrentMonth: false,
        dateStr: `${nextYear}-${nextMonthStr}-${dayStr}`
      });
    }

    return days;
  };

  // Dias da Semana no Modo Semana
  const getWeekDaysGrid = () => {
    const current = new Date(currentDate);
    const dayOfWeek = current.getDay(); // 0 = Domingo
    const sunday = new Date(current);
    sunday.setDate(current.getDate() - dayOfWeek);

    const weekDays = [];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      weekDays.push({
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        dateStr: `${y}-${m}-${dayNum}`
      });
    }

    return weekDays;
  };

  const todayStr = getTodayStr();

  return (
    <div className="google-calendar-card">
      <div className="calendar-card-header">
        <div className="header-title-wrapper">
          <CalendarBlank size={24} className="calendar-brand-icon" weight="fill" />
          <h3>Google Agenda</h3>
        </div>

        <div className="calendar-view-toggle">
          <button 
            className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Mês
          </button>
          <button 
            className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Semana
          </button>
        </div>

        {onClose && (
          <button className="calendar-close-btn" onClick={onClose} title="Fechar">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Barra de Status de Conexão com o Google */}
      <div className="google-sync-status-bar">
        {googleToken ? (
          <div className="status-connected">
            <span className="dot online">●</span>
            <span>{syncStatusMsg || 'Sincronizado com Google Calendar'}</span>
            <button 
              className="sync-reload-btn" 
              onClick={() => loadRealGoogleEvents(googleToken, currentDate)}
              disabled={isSyncing}
            >
              {isSyncing ? 'Carregando...' : 'Recarregar'}
            </button>
          </div>
        ) : (
          <div className="status-disconnected">
            <span>Conecte sua conta do Google para importar seus agendamentos automaticamente:</span>
            <button className="connect-google-btn" onClick={handleConnectGoogle}>
              Conectar Google Agenda
            </button>
          </div>
        )}
      </div>

      <div className="calendar-nav-bar">
        <div className="nav-controls">
          <button className="nav-btn" onClick={handlePrev} title="Anterior">
            <CaretLeft size={16} />
          </button>
          <button className="nav-today-btn" onClick={handleToday}>
            Hoje
          </button>
          <button className="nav-btn" onClick={handleNext} title="Próximo">
            <CaretRight size={16} />
          </button>
        </div>

        <span className="current-label">
          {monthNames[month]} {year}
        </span>

        <button 
          className="add-evt-shortcut-btn"
          onClick={() => setIsAddingEvent(!isAddingEvent)}
        >
          <Plus size={16} />
          <span>Novo Evento</span>
        </button>
      </div>

      {isAddingEvent && (
        <form className="add-event-form" onSubmit={handleCreateEvent}>
          <h4>Criar Evento no Google Agenda</h4>
          <div className="form-row">
            <input 
              type="text" 
              className="emoji-input" 
              value={newEmoji} 
              onChange={e => setNewEmoji(e.target.value)}
              placeholder="Emoji"
            />
            <input 
              type="text" 
              className="title-input" 
              placeholder="Título do evento..." 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <input 
              type="date" 
              value={newDate} 
              onChange={e => setNewDate(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="09:00 - 10:00" 
              value={newTime} 
              onChange={e => setNewTime(e.target.value)}
            />
            <select value={newPeriod} onChange={e => setNewPeriod(e.target.value)}>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Noite">Noite</option>
            </select>
          </div>
          <textarea 
            placeholder="Descrição ou observações adicionais..."
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
          />
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setIsAddingEvent(false)}>
              Cancelar
            </button>
            <button type="submit" className="save-btn">
              Salvar no Calendário
            </button>
          </div>
        </form>
      )}

      <div className="calendar-drag-hint">
        💡 <span><strong>Dica:</strong> Arraste o evento para a lista de tarefas ou clique sobre ele para ver detalhes!</span>
      </div>

      {viewMode === 'month' ? (
        <div className="month-grid-wrapper">
          <div className="weekdays-header">
            <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
          </div>
          <div className="days-grid">
            {getMonthDaysGrid().map((item, index) => {
              const dayEvents = events.filter(e => e.date === item.dateStr);
              const isToday = item.dateStr === todayStr;

              return (
                <div 
                  key={index} 
                  className={`day-cell ${!item.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''}`}
                >
                  <span className="day-number">{item.day}</span>
                  <div className="cell-events">
                    {dayEvents.map(evt => (
                      <div 
                        key={evt.id} 
                        className="event-badge"
                        style={{ backgroundColor: getEventColor(evt) }}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(evt, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventDetail(evt);
                        }}
                        title={`${evt.title} (${evt.time}) - Clique para detalhes ou arraste para tarefas`}
                      >
                        <span className="evt-title">{evt.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="week-grid-wrapper">
          <div className="week-days-columns">
            {getWeekDaysGrid().map((col, idx) => {
              const dayEvents = events.filter(e => e.date === col.dateStr);
              const isToday = col.dateStr === todayStr;

              return (
                <div key={idx} className={`week-col ${isToday ? 'is-today' : ''}`}>
                  <div className="week-col-header">
                    <span className="col-day-name">{col.dayName}</span>
                    <span className="col-day-num">{col.dayNumber}</span>
                  </div>
                  <div className="week-col-events">
                    {dayEvents.length === 0 ? (
                      <span className="no-events-text">Sem eventos</span>
                    ) : (
                      dayEvents.map(evt => (
                        <div 
                          key={evt.id} 
                          className="event-badge week-badge"
                          style={{ backgroundColor: getEventColor(evt) }}
                          draggable="true"
                          onDragStart={(e) => handleDragStart(evt, e)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventDetail(evt);
                          }}
                          title={`${evt.title} (${evt.time}) - Clique para detalhes ou arraste`}
                        >
                          <span className="evt-title">{evt.title}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Evento ao Clicar */}
      {selectedEventDetail && (
        <div className="event-detail-backdrop" onClick={() => setSelectedEventDetail(null)}>
          <div className="event-detail-card" onClick={(e) => e.stopPropagation()}>
            <div 
              className="event-detail-header" 
              style={{ backgroundColor: getEventColor(selectedEventDetail) }}
            >
              <div className="event-detail-title-group">
                <span className="event-detail-emoji">{selectedEventDetail.emoji || '📅'}</span>
                <h4>{selectedEventDetail.title}</h4>
              </div>
              <button 
                className="event-detail-close-btn"
                onClick={() => setSelectedEventDetail(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="event-detail-content">
              <div className="detail-item">
                <CalendarBlank size={18} className="detail-icon" />
                <span><strong>Data:</strong> {selectedEventDetail.date}</span>
              </div>
              <div className="detail-item">
                <Clock size={18} className="detail-icon" />
                <span><strong>Horário:</strong> {selectedEventDetail.time}</span>
              </div>
              <div className="detail-item">
                <Tag size={18} className="detail-icon" />
                <span><strong>Período:</strong> {selectedEventDetail.period}</span>
              </div>
              {selectedEventDetail.description && (
                <div className="detail-item detail-desc">
                  <strong>Descrição:</strong>
                  <p>{selectedEventDetail.description}</p>
                </div>
              )}
            </div>

            <div className="event-detail-actions">
              <button 
                className="action-btn add-task-action"
                onClick={(e) => {
                  handleAddEventToTasks(selectedEventDetail, e);
                  setSelectedEventDetail(null);
                }}
              >
                <PlusCircle size={18} />
                <span>Transformar em Tarefa</span>
              </button>
              <button 
                className="action-btn delete-action"
                onClick={(e) => {
                  handleDeleteEvent(selectedEventDetail.id, e);
                  setSelectedEventDetail(null);
                }}
              >
                <Trash size={18} />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoogleCalendarCard;
