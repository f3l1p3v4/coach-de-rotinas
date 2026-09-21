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

const parseRecurringDaysList = (val) => {
  if (Array.isArray(val)) {
    return val.map(Number).filter(n => !isNaN(n));
  }
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(Number).filter(n => !isNaN(n));
    } catch (e) {}
    const cleaned = val.replace(/[{}[\]"]/g, '').split(',');
    return cleaned.map(Number).filter(n => !isNaN(n));
  }
  return [];
};

export async function loadUserTasks(userId) {
  let localTasks = parseLocalTasks();

  // Se daily_tasks estiver vazio, verificar backup de emergência
  if (localTasks.length === 0) {
    try {
      const backup = localStorage.getItem('daily_tasks_backup');
      if (backup) {
        const parsedBackup = JSON.parse(backup);
        if (Array.isArray(parsedBackup) && parsedBackup.length > 0) {
          localTasks = parsedBackup;
          localStorage.setItem('daily_tasks', JSON.stringify(localTasks));
        }
      }
    } catch (e) {}
  }

  if (isSupabaseConfigured && supabase && userId) {
    try {
      let { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      // Se falhou por não ter coluna created_at, tenta busca simples
      if (error) {
        const retry = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId);
        if (!retry.error) {
          data = retry.data;
          error = null;
        }
      }

      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          const remoteTasks = data.map(t => {
            const recurringDays = t.recurring_days !== undefined
              ? parseRecurringDaysList(t.recurring_days)
              : parseRecurringDaysList(t.recurringDays);

            const completedDates = Array.isArray(t.completed_dates)
              ? t.completed_dates.map(String)
              : (Array.isArray(t.completedDates) ? t.completedDates.map(String) : []);

            const isRecurring = Boolean(t.is_recurring ?? t.isRecurring ?? false);

            return {
              id: String(t.id),
              text: t.text || '',
              emoji: t.emoji || '✨',
              time: t.time || '',
              period: t.period || 'Manhã',
              category: t.category || null,
              color: t.color || null,
              status: t.status || (t.completed ? 'completed' : 'pending'),
              completed: t.completed !== undefined ? Boolean(t.completed) : t.status === 'completed',
              completedAt: isRecurring ? null : (t.completed_at || t.completedAt || null),
              startedAt: isRecurring ? null : (t.started_at || t.startedAt || null),
              date: t.date || null,
              isRecurring,
              recurringDays,
              completedDates,
              recurringUntil: t.recurring_until || t.recurringUntil || null,
              deletedDates: Array.isArray(t.deleted_dates) ? t.deleted_dates.map(String) : (Array.isArray(t.deletedDates) ? t.deletedDates.map(String) : []),
              description: t.description || '',
              subtasks: typeof t.subtasks === 'string' ? JSON.parse(t.subtasks) : (t.subtasks || [])
            };
          });

          localStorage.setItem('daily_tasks', JSON.stringify(remoteTasks));
          localStorage.setItem('daily_tasks_backup', JSON.stringify(remoteTasks));
          return remoteTasks;
        } else {
          // Se o banco remoto retornou vazio ([]):
          // Se o usuário tem tarefas locais salvas, NÃO APAGUE! Salve-as no Supabase!
          if (localTasks.length > 0) {
            syncUserTasks(userId, localTasks).catch(() => {});
            return localTasks;
          }
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
  if (tasks.length > 0) {
    localStorage.setItem('daily_tasks_backup', JSON.stringify(tasks));
  }

  // 2. Sincronizar com Supabase se configurado
  if (isSupabaseConfigured && supabase && userId) {
    try {
      if (tasks.length === 0) {
        await supabase.from('tasks').delete().eq('user_id', userId);
        return;
      }

      const currentIds = tasks.map(t => String(t.id));

      // Payload base com colunas padrão confirmadas da tabela tasks
      const buildPayload = (numRecurrence = false) => tasks.map(t => {
        const isRec = Boolean(t.isRecurring);
        return {
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
          completed_at: isRec ? null : (t.completedAt || null),
          started_at: isRec ? null : (t.startedAt || null),
          is_recurring: isRec,
          recurring_days: numRecurrence 
            ? (t.recurringDays || []).map(Number).filter(n => !isNaN(n))
            : (t.recurringDays || []).map(String),
          completed_dates: (t.completedDates || []).map(String),
          subtasks: t.subtasks || []
        };
      });

      // Tentativa 1: upsert seguro com recurring_days como string[]
      let { error: syncError } = await supabase.from('tasks').upsert(buildPayload(false), { onConflict: 'id' });

      // Tentativa 2: se falhou por tipo de array, tenta com recurring_days numérico
      if (syncError) {
        console.warn('Tentando upsert com recurring_days numérico:', syncError);
        const retry = await supabase.from('tasks').upsert(buildPayload(true), { onConflict: 'id' });
        syncError = retry.error;
      }

      // Se o upsert foi bem-sucedido, remove do Supabase apenas as tarefas que realmente deixaram de existir
      if (!syncError && currentIds.length > 0) {
        const inClause = `(${currentIds.map(id => `"${id}"`).join(',')})`;
        await supabase.from('tasks').delete().eq('user_id', userId).not('id', 'in', inClause);
      } else if (syncError) {
        console.warn('Erro ao sincronizar tarefas no Supabase:', syncError);
      }
    } catch (err) {
      console.error('Erro geral ao sincronizar tarefas no Supabase:', err);
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
            recurringDays: t.recurring_days !== undefined
              ? parseRecurringDaysList(t.recurring_days)
              : parseRecurringDaysList(t.recurringDays),
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
          const remoteNotes = data.map(n => {
            const isChecklist = n.type === 'checklist' || (n.content && /^[-*]\s*\[[ xX]\]/m.test(n.content));
            return {
              id: String(n.id),
              title: n.title || '',
              content: n.content || '',
              category: n.category || null,
              color: n.color || '#fff9c4',
              date: n.date || '',
              type: n.type || (isChecklist ? 'checklist' : 'text')
            };
          });

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
        // 1. Tenta payload completo com type e category
        const fullPayload = notes.map(n => ({
          id: String(n.id),
          user_id: userId,
          title: n.title || '',
          content: n.content || '',
          category: n.category || null,
          color: n.color || '#fff9c4',
          date: n.date || '',
          type: n.type || 'text'
        }));

        const { error: insertError } = await supabase.from('notes').insert(fullPayload);
        if (insertError) {
          console.warn('Tentando payload de notas sem a coluna type:', insertError);
          // 2. Fallback sem type (caso a coluna type não exista no Supabase)
          const fallbackPayload = notes.map(n => ({
            id: String(n.id),
            user_id: userId,
            title: n.title || '',
            content: n.content || '',
            category: n.category || null,
            color: n.color || '#fff9c4',
            date: n.date || ''
          }));
          const { error: fallbackError } = await supabase.from('notes').insert(fallbackPayload);
          if (fallbackError) {
            console.warn('Tentando payload mínimo de notas:', fallbackError);
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

/**
 * --- HISTÓRICO DIÁRIO DE EXECUÇÃO DE TAREFAS ---
 */
export async function loadUserTaskHistory(userId) {
  let localHistory = {};
  try {
    const raw = localStorage.getItem('daily_task_history');
    if (raw) {
      localHistory = JSON.parse(raw) || {};
    }
  } catch (e) {
    localHistory = {};
  }

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('task_history')
        .select('*')
        .eq('user_id', userId);

      if (!error && Array.isArray(data)) {
        const remoteMap = {};
        data.forEach(row => {
          const key = row.id || `${row.task_id}_${row.date}`;
          let parsedSubtasks = [];
          if (row.subtasks) {
            parsedSubtasks = typeof row.subtasks === 'string' ? JSON.parse(row.subtasks) : row.subtasks;
          }
          remoteMap[key] = {
            id: key,
            taskId: String(row.task_id),
            date: row.date,
            status: row.status || 'pending',
            observation: row.observation || '',
            completedAt: row.completed_at || null,
            startedAt: row.started_at || null,
            subtasks: Array.isArray(parsedSubtasks) ? parsedSubtasks : []
          };
        });

        // Faz merge com local para não perder dados criados offline
        const merged = { ...localHistory, ...remoteMap };
        localStorage.setItem('daily_task_history', JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('Erro ao carregar histórico do Supabase, usando localStorage:', err);
    }
  }

  return localHistory;
}

export async function syncUserTaskHistory(userId, historyMap) {
  if (!historyMap || typeof historyMap !== 'object') return;
  try {
    localStorage.setItem('daily_task_history', JSON.stringify(historyMap));
  } catch (e) {}

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const items = Object.values(historyMap);
      if (items.length === 0) return;

      const payload = items.map(item => ({
        id: item.id || `${item.taskId}_${item.date}`,
        user_id: userId,
        task_id: String(item.taskId),
        date: item.date,
        status: item.status || 'pending',
        observation: item.observation || '',
        completed_at: item.completedAt || null,
        started_at: item.startedAt || null,
        subtasks: item.subtasks || []
      }));

      await supabase.from('task_history').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('Erro ao sincronizar histórico de tarefas no Supabase:', err);
    }
  }
}

