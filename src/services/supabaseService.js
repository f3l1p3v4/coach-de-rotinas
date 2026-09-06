import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * --- TAREFAS DIÁRIAS ---
 */
export async function loadUserTasks(userId) {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        return data.map(t => ({
          id: t.id,
          text: t.text,
          emoji: t.emoji,
          time: t.time,
          period: t.period,
          status: t.status,
          completedAt: t.completed_at,
          subtasks: typeof t.subtasks === 'string' ? JSON.parse(t.subtasks) : (t.subtasks || [])
        }));
      }
    } catch (err) {
      console.warn('Erro ao carregar tarefas do Supabase, usando localStorage:', err);
    }
  }

  // Fallback LocalStorage
  const savedTasks = localStorage.getItem('daily_tasks');
  return savedTasks ? JSON.parse(savedTasks) : [];
}

export async function syncUserTasks(userId, tasks) {
  // Salvar no localStorage sempre para cache offline
  localStorage.setItem('daily_tasks', JSON.stringify(tasks));

  if (isSupabaseConfigured && supabase && userId) {
    try {
      // 1. Limpar tarefas antigas do usuário e re-inserir para manter sincronia
      await supabase.from('tasks').delete().eq('user_id', userId);

      if (tasks.length > 0) {
        const payload = tasks.map(t => ({
          id: String(t.id),
          user_id: userId,
          text: t.text,
          emoji: t.emoji || '📝',
          time: t.time || '',
          period: t.period || '',
          status: t.status || 'pending',
          completed_at: t.completedAt || null,
          subtasks: t.subtasks || []
        }));

        await supabase.from('tasks').insert(payload);
      }
    } catch (err) {
      console.error('Erro ao sincronizar tarefas no Supabase:', err);
    }
  }
}

/**
 * --- MODELOS DE TAREFA ---
 */
export async function loadUserTemplates(userId, initialTemplates) {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('user_id', userId);

      if (!error && data && data.length > 0) {
        return data.map(t => ({
          id: t.id,
          text: t.text,
          emoji: t.emoji,
          description: t.description,
          subtasks: typeof t.subtasks === 'string' ? JSON.parse(t.subtasks) : (t.subtasks || [])
        }));
      }
    } catch (err) {
      console.warn('Erro ao carregar modelos do Supabase:', err);
    }
  }

  const savedTemplates = localStorage.getItem('custom_task_templates');
  if (savedTemplates) {
    try {
      return JSON.parse(savedTemplates);
    } catch (e) {
      return initialTemplates;
    }
  }
  return initialTemplates;
}

export async function syncUserTemplates(userId, templates) {
  localStorage.setItem('custom_task_templates', JSON.stringify(templates));

  if (isSupabaseConfigured && supabase && userId) {
    try {
      await supabase.from('task_templates').delete().eq('user_id', userId);

      if (templates.length > 0) {
        const payload = templates.map(t => ({
          id: String(t.id),
          user_id: userId,
          text: t.text,
          emoji: t.emoji || '📋',
          description: t.description || '',
          subtasks: t.subtasks || []
        }));

        await supabase.from('task_templates').insert(payload);
      }
    } catch (err) {
      console.error('Erro ao sincronizar modelos no Supabase:', err);
    }
  }
}

/**
 * --- BLOCO DE NOTAS ---
 */
export async function loadUserNotes(userId) {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(n => ({
          id: n.id,
          title: n.title,
          content: n.content,
          color: n.color,
          date: n.date
        }));
      }
    } catch (err) {
      console.warn('Erro ao carregar notas do Supabase:', err);
    }
  }

  const saved = localStorage.getItem('coach_anotacoes');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export async function syncUserNotes(userId, notes) {
  localStorage.setItem('coach_anotacoes', JSON.stringify(notes));

  if (isSupabaseConfigured && supabase && userId) {
    try {
      await supabase.from('notes').delete().eq('user_id', userId);

      if (notes.length > 0) {
        const payload = notes.map(n => ({
          id: String(n.id),
          user_id: userId,
          title: n.title,
          content: n.content,
          color: n.color || '#fff9c4',
          date: n.date
        }));

        await supabase.from('notes').insert(payload);
      }
    } catch (err) {
      console.error('Erro ao sincronizar notas no Supabase:', err);
    }
  }
}

/**
 * --- PLACAR DE FOCO (POMODOROS) ---
 */
export async function loadUserFocusScore(userId) {
  const today = new Date().toISOString().split('T')[0];

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('focus_score')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (!error && data) {
        return data.count;
      }
    } catch (err) {
      console.warn('Erro ao carregar placar de foco:', err);
    }
  }

  const savedData = JSON.parse(localStorage.getItem('placar_foco_data'));
  if (savedData && savedData.date === today) {
    return savedData.count;
  }
  return 0;
}

export async function syncUserFocusScore(userId, count) {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem('placar_foco_data', JSON.stringify({ count, date: today }));

  if (isSupabaseConfigured && supabase && userId) {
    try {
      await supabase.from('focus_score').upsert({
        user_id: userId,
        date: today,
        count: count
      }, { onConflict: 'user_id, date' });
    } catch (err) {
      console.error('Erro ao sincronizar placar de foco no Supabase:', err);
    }
  }
}
