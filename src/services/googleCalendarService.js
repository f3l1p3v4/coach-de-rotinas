import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// Ouvinte para salvar provider_token assim que o Supabase redirecionar
if (supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.provider_token) {
      localStorage.setItem('google_access_token', session.provider_token);
    }
  });
}

/**
 * Inicia o login OAuth com o Google solicitando os escopos de leitura/escrita no Google Calendar.
 */
export async function signInWithGoogleCalendar() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase não está configurado.');
  }

  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/calendar.events',
      redirectTo: redirectUrl
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Recupera o Access Token da sessão atual do Supabase.
 */
export async function getGoogleAccessToken() {
  if (!isSupabaseConfigured || !supabase) {
    return localStorage.getItem('google_access_token') || null;
  }
  
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.provider_token) {
    localStorage.setItem('google_access_token', session.provider_token);
    return session.provider_token;
  }

  return localStorage.getItem('google_access_token') || null;
}

/**
 * Salva um token localmente caso retornado na URL/OAuth.
 */
export function setLocalGoogleAccessToken(token) {
  if (token) {
    localStorage.setItem('google_access_token', token);
  }
}

/**
 * Busca compromissos do Google Calendar do usuário primário.
 */
export async function fetchGoogleEvents(accessToken, timeMin, timeMax) {
  if (!accessToken) return [];

  let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=2500';
  
  if (timeMin) {
    url += `&timeMin=${encodeURIComponent(timeMin)}`;
  } else {
    // Padrão: buscar a partir de 2 meses atrás se timeMin não for informado
    const dMin = new Date();
    dMin.setMonth(dMin.getMonth() - 2);
    url += `&timeMin=${encodeURIComponent(dMin.toISOString())}`;
  }

  if (timeMax) {
    url += `&timeMax=${encodeURIComponent(timeMax)}`;
  }

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.warn('Token do Google Calendar expirado ou inválido.');
      }
      return [];
    }

    const data = await res.json();
    if (!data.items) return [];

    return data.items.map(item => {
      const startDT = item.start?.dateTime || item.start?.date;
      const endDT = item.end?.dateTime || item.end?.date;
      
      let dateStr = '';
      let timeStr = 'Dia inteiro';

      if (startDT) {
        if (startDT.includes('T')) {
          const d = new Date(startDT);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          dateStr = `${y}-${m}-${day}`;

          const startTime = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
          let endTime = '';
          if (endDT && endDT.includes('T')) {
            const ed = new Date(endDT);
            endTime = String(ed.getHours()).padStart(2, '0') + ':' + String(ed.getMinutes()).padStart(2, '0');
          }
          timeStr = endTime ? `${startTime} - ${endTime}` : startTime;
        } else {
          // É uma data no formato "YYYY-MM-DD"
          dateStr = startDT;
        }
      }

      // Determinar período (Manhã / Tarde / Noite)
      let period = 'Manhã';
      if (timeStr.includes(':')) {
        const hour = parseInt(timeStr.split(':')[0], 10);
        if (hour >= 12 && hour < 18) period = 'Tarde';
        else if (hour >= 18) period = 'Noite';
      }

      return {
        id: item.id,
        title: item.summary || 'Sem Título',
        emoji: '📅',
        date: dateStr,
        time: timeStr,
        period,
        description: item.description || '',
        htmlLink: item.htmlLink
      };
    });
  } catch (err) {
    console.error('Erro ao buscar eventos do Google Calendar:', err);
    return [];
  }
}

/**
 * Cria um novo compromisso na agenda do Google do usuário.
 */
export async function createGoogleEvent(accessToken, eventData) {
  if (!accessToken) throw new Error('Acesso do Google não autorizado.');

  const startDateStr = `${eventData.date || getTodayStr()}T09:00:00Z`;
  const endDateStr = `${eventData.date || getTodayStr()}T10:00:00Z`;

  const body = {
    summary: `${eventData.emoji ? eventData.emoji + ' ' : ''}${eventData.title}`,
    description: eventData.description || 'Criado via Daily Planner',
    start: { dateTime: startDateStr },
    end: { dateTime: endDateStr }
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Falha ao criar evento no Google Calendar.');
  }

  return await res.json();
}

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
