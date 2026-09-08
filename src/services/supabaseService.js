import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * --- TAREFAS DIÁRIAS ---
 */

const parseLocalTasks = () => {
  try {
    const raw = localStorage.getItem('daily_tasks');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export async function loadUserTasks(userId) {
  const localTasks = parseLocalTasks();

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          const remoteTasks = data.map(t => ({
            id: String(t.id),
            text: t.text || '',
            emoji: t.emoji || '✨',
            time: t.time || '',
            period: t.period || 'Manhã',
            category: t.category || null,
            color: t.color || null,
            status: t.status || (t.completed ? 'completed' : 'pending'),
            completed: t.completed !== undefined ? Boolean(t.completed) : t.status === 'completed',
            completedAt: t.completed_at || t.completedAt || null,
            startedAt: t.started_at || t.startedAt || null,
            date: t.date || null,
            isRecurring: Boolean(t.is_recurring ?? t.isRecurring ?? false),
            recurringDays: Array.isArray(t.recurring_days) ? t.recurring_days : (Array.isArray(t.recurringDays) ? t.recurringDays : []),
            completedDates: Array.isArray(t.completed_dates) ? t.completed_dates : (Array.isArray(t.completedDates) ? t.completedDates : []),
            description: t.description || '',
            subtasks: typeof t.subtasks === 'string' ? JSON.parse(t.subtasks) : (t.subtasks || [])
          }));

          localStorage.setItem('daily_tasks', JSON.stringify(remoteTasks));
          return remoteTasks;
        } else {
          // Se o banco remoto retornou vazio ([]):
          // Se o usuário tem tarefas locais que ainda não foram sincronizadas (ex: primeiro login pós offline):
          const hasSynced = localStorage.getItem('has_synced_user_tasks');
          if (localTasks.length > 0 && !hasSynced) {
            localStorage.setItem('has_synced_user_tasks', 'true');
            syncUserTasks(userId, localTasks).catch(() => {});
            return localTasks;
          }

          // Caso contrário, a lista está legitimamente vazia (ex: usuário apagou tudo)
          localStorage.setItem('daily_tasks', JSON.stringify([]));
          return [];
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar tarefas do Supabase, usando localStorage:', err);
    }
  }

  return localTasks;
}

export async function syncUserTasks(userId, tasks) {
  if (!Array.isArray(tasks)) return;

  // 1. Salvar no localStorage sempre para cache offline
  localStorage.setItem('daily_tasks', JSON.stringify(tasks));
  localStorage.setItem('has_synced_user_tasks', 'true');

  // Limpar resíduo de backup antigo se existir
  localStorage.removeItem('daily_tasks_backup');

  // 2. Sincronizar com Supabase se configurado
  if (isSupabaseConfigured && supabase && userId) {
    try {
      // Deletar tarefas anteriores para atualizar estado completo
      await supabase.from('tasks').delete().eq('user_id', userId);

      if (tasks.length > 0) {
        // Tentar payload completo com todos os campos
        const fullPayload = tasks.map(t => ({
          id: String(t.id),
          user_id: userId,
          text: t.text || '',
          emoji: t.emoji || '📝',
          description: t.description || '',
          time: t.time || '',
          period: t.period || 'Manhã',
          category: t.category || null,
          color: t.color || null,
          date: t.date || null,
          status: t.completed ? 'completed' : (t.status || 'pending'),
          completed_at: t.completedAt || null,
          started_at: t.startedAt || null,
          is_recurring: Boolean(t.isRecurring),
          recurring_days: t.recurringDays || [],
          completed_dates: t.completedDates || [],
          subtasks: t.subtasks || []
        }));

        const { error: insertError } = await supabase.from('tasks').insert(fullPayload);

        // Se falhar (ex: colunas extras não existem no schema do banco)
        // faz fallback seguro para o schema básico sem quebrar
        if (insertError) {
          console.warn('Falha com payload completo, tentando schema básico:', insertError);
          const basicPayload = tasks.map(t => ({
            id: String(t.id),
            user_id: userId,
            text: t.text || '',
            emoji: t.emoji || '📝',
            time: t.time || '',
            period: t.period || 'Manhã',
            status: t.completed ? 'completed' : (t.status || 'pending'),
            completed_at: t.completedAt || null,
            subtasks: t.subtasks || []
          }));
          await supabase.from('tasks').insert(basicPayload);
        }
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
  let localTemplates = initialTemplates;
  try {
    const savedTemplates = localStorage.getItem('custom_task_templates');
    if (savedTemplates) {
      const parsed = JSON.parse(savedTemplates);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localTemplates = parsed;
      }
    }
  } catch (e) {}

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('user_id', userId);

      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          const remoteTemplates = data.map(t => ({
            id: String(t.id),
            text: t.text || '',
            emoji: t.emoji || '📋',
            category: t.category || null,
            color: t.color || null,
            isRecurring: Boolean(t.is_recurring ?? t.isRecurring ?? false),
            recurringDays: Array.isArray(t.recurring_days) ? t.recurring_days : (Array.isArray(t.recurringDays) ? t.recurringDays : []),
            description: t.description || '',
            subtasks: typeof t.subtasks === 'string' ? JSON.parse(t.subtasks) : (t.subtasks || [])
          }));

          localStorage.setItem('custom_task_templates', JSON.stringify(remoteTemplates));
          return remoteTemplates;
        } else {
          // Se o banco remoto retornou vazio ([]):
          // Se temos modelos locais, salva-os no banco do usuário e mantém!
          if (localTemplates && localTemplates.length > 0) {
            syncUserTemplates(userId, localTemplates).catch(() => {});
            return localTemplates;
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar modelos do Supabase:', err);
    }
  }

  return localTemplates;
}

export async function syncUserTemplates(userId, templates) {
  if (!Array.isArray(templates)) return;
  localStorage.setItem('custom_task_templates', JSON.stringify(templates));

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { error: deleteError } = await supabase
        .from('task_templates')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.warn('Erro ao limpar modelos no Supabase antes de inserir:', deleteError);
      }

      if (templates.length > 0) {
        const fullPayload = templates.map(t => ({
          id: String(t.id),
          user_id: userId,
          text: t.text || '',
          emoji: t.emoji || '📋',
          category: t.category || null,
          color: t.color || null,
          is_recurring: Boolean(t.isRecurring),
          recurring_days: t.recurringDays || [],
          description: t.description || '',
          subtasks: t.subtasks || []
        }));

        const { error: insertError } = await supabase.from('task_templates').insert(fullPayload);
        if (insertError) {
          console.warn('Falha ao inserir modelos com category/color/is_recurring, tentando payload básico:', insertError);
          const basicPayload = templates.map(t => ({
            id: String(t.id),
            user_id: userId,
            text: t.text || '',
            emoji: t.emoji || '📋',
            description: t.description || '',
            subtasks: t.subtasks || []
          }));
          const { error: basicError } = await supabase.from('task_templates').insert(basicPayload);
          if (basicError) {
            console.error('Erro ao sincronizar modelos mesmo com payload básico:', basicError);
          }
        }
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
  let localNotes = [];
  try {
    const saved = localStorage.getItem('coach_anotacoes');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localNotes = parsed;
      }
    }
  } catch (e) {}

  // Se coach_anotacoes estiver vazio, verificar backup de emergência
  if (localNotes.length === 0) {
    try {
      const backup = localStorage.getItem('coach_anotacoes_backup');
      if (backup) {
        const parsedBackup = JSON.parse(backup);
        if (Array.isArray(parsedBackup) && parsedBackup.length > 0) {
          localNotes = parsedBackup;
          localStorage.setItem('coach_anotacoes', JSON.stringify(localNotes));
        }
      }
    } catch (e) {}
  }

  if (isSupabaseConfigured && supabase && userId) {
    try {
      let { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Se falhar (ex: coluna created_at não existe no schema), tenta sem ordenação
      if (error) {
        const retry = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId);
        if (!retry.error) {
          data = retry.data;
          error = null;
        }
      }

      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          const remoteNotes = data.map(n => ({
            id: String(n.id),
            title: n.title || '',
            content: n.content || '',
            category: n.category || null,
            color: n.color || '#fff9c4',
            date: n.date || ''
          }));

          localStorage.setItem('coach_anotacoes', JSON.stringify(remoteNotes));
          localStorage.setItem('coach_anotacoes_backup', JSON.stringify(remoteNotes));
          return remoteNotes;
        } else {
          // Se o banco remoto retornou vazio (0 notas):
          // Se o usuário já possui notas locais, NÃO as apague! Sincronize-as com a nuvem!
          if (localNotes.length > 0) {
            syncUserNotes(userId, localNotes).catch(() => {});
            return localNotes;
          }
          return [];
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar notas do Supabase, usando localStorage:', err);
    }
  }

  return localNotes;
}

export async function syncUserNotes(userId, notes) {
  if (!Array.isArray(notes)) return;

  localStorage.setItem('coach_anotacoes', JSON.stringify(notes));
  if (notes.length > 0) {
    localStorage.setItem('coach_anotacoes_backup', JSON.stringify(notes));
  }

  if (isSupabaseConfigured && supabase && userId) {
    try {
      await supabase.from('notes').delete().eq('user_id', userId);

      if (notes.length > 0) {
        const fullPayload = notes.map(n => ({
          id: String(n.id),
          user_id: userId,
          title: n.title || '',
          content: n.content || '',
          category: n.category || null,
          color: n.color || '#fff9c4',
          date: n.date || ''
        }));

        const { error: insertError } = await supabase.from('notes').insert(fullPayload);
        if (insertError) {
          console.warn('Falha ao sincronizar notas com category, tentando payload básico:', insertError);
          const basicPayload = notes.map(n => ({
            id: String(n.id),
            user_id: userId,
            title: n.title || '',
            content: n.content || '',
            color: n.color || '#fff9c4',
            date: n.date || ''
          }));
          await supabase.from('notes').insert(basicPayload);
        }
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
