import { supabase } from '../lib/supabaseClient';
import { WORKSPACE_KEYS, normalizeWorkspace } from '../utils/workspaceData';

const copy = value => JSON.parse(JSON.stringify(value));
const describeError = error => new Error(error?.code === '40001'
  ? 'Os dados foram alterados em outro dispositivo. Baixe as alterações pendentes antes de recarregar.'
  : `Não foi possível salvar ou carregar seus dados no Supabase. ${error?.message || 'Verifique a conexão e tente novamente.'}`);

async function withTimeout(request) {
  let timer;
  try {
    return await Promise.race([request, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('O Supabase não respondeu a tempo. Verifique a conexão e tente novamente.')), 20000);
    })]);
  } finally { clearTimeout(timer); }
}

export function createWorkspaceStore(client) {
  let snapshot = { userId: null, ready: false, status: 'idle', error: null, data: {}, persistedKeys: [], version: 0, generation: 0 };
  const listeners = new Set();
  let epoch = 0;
  let pending = {};
  let inFlight = null;
  let flushing = null;
  let loadPromise = null;
  const emit = updates => {
    snapshot = { ...snapshot, ...updates };
    queueMicrotask(() => listeners.forEach(listener => listener()));
  };
  const assertReady = userId => {
    if (!snapshot.ready || !snapshot.userId || (userId && userId !== snapshot.userId)) throw new Error('Entre na sua conta e aguarde o carregamento dos dados.');
  };
  const flush = async () => {
    if (flushing) return flushing;
    if (snapshot.error) throw snapshot.error;
    if (!Object.keys(pending).length && !inFlight) return;
    const currentEpoch = epoch;
    flushing = (async () => {
      emit({ status: 'saving' });
      try {
        while (Object.keys(pending).length || inFlight) {
          if (epoch !== currentEpoch) throw new Error('A sessão foi alterada.');
          if (!inFlight) {
            inFlight = { patch: pending, userId: snapshot.userId, version: snapshot.version, id: crypto.randomUUID() };
            pending = {};
          }
          const request = inFlight;
          const { data, error } = await withTimeout(client.rpc('save_workspace', {
            p_user_id: request.userId, p_patch: request.patch, p_expected_version: request.version, p_request_id: request.id
          }));
          if (epoch !== currentEpoch) return;
          if (error) throw describeError(error);
          if (!data || data.user_id !== request.userId || !Number.isSafeInteger(Number(data.version))) throw new Error('O Supabase não confirmou o salvamento da conta correta.');
          inFlight = null;
          emit({ version: Number(data.version), persistedKeys: [...new Set([...snapshot.persistedKeys, ...Object.keys(request.patch)])] });
        }
        if (epoch === currentEpoch) emit({ status: 'saved', error: null });
      } catch (error) {
        if (epoch === currentEpoch) emit({ status: 'error', error });
        throw error;
      } finally {
        if (epoch === currentEpoch) flushing = null;
      }
    })();
    return flushing;
  };
  const reset = () => {
    epoch += 1; pending = {}; inFlight = null; flushing = null; loadPromise = null;
    emit({ userId: null, ready: false, status: 'idle', error: null, data: {}, persistedKeys: [], version: 0, generation: snapshot.generation + 1 });
  };
  return {
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    getSnapshot: () => snapshot,
    reset,
    async load(userId) {
      if (!client) throw new Error('Configure o Supabase para acessar o aplicativo.');
      if (!userId) throw new Error('É necessário entrar na conta.');
      if (loadPromise && snapshot.userId === userId && snapshot.status !== 'error') return loadPromise;
      reset();
      const currentEpoch = epoch;
      emit({ userId, status: 'loading' });
      loadPromise = (async () => {
        const { data, error } = await withTimeout(client.rpc('open_workspace', { p_user_id: userId }));
        if (epoch !== currentEpoch) return;
        if (error || !data || data.user_id !== userId || !Number.isSafeInteger(Number(data.version))) {
          const failure = describeError(error || { message: 'Resposta inválida do banco.' });
          emit({ status: 'error', error: failure });
          throw failure;
        }
        try {
          emit({ data: normalizeWorkspace(data.data), persistedKeys: Object.keys(data.data || {}), version: Number(data.version), ready: true, status: 'saved', error: null });
        } catch (failure) {
          emit({ status: 'error', error: failure });
          throw failure;
        }
      })().catch(error => {
        if (epoch === currentEpoch) emit({ status: 'error', error });
        throw error;
      });
      return loadPromise;
    },
    read(key, userId) { assertReady(userId); return copy(snapshot.data[key] ?? null); },
    write(key, value, userId) {
      assertReady(userId);
      if (!WORKSPACE_KEYS.includes(key)) throw new Error(`Campo de dados não permitido: ${key}`);
      if (snapshot.error) throw snapshot.error;
      if (snapshot.persistedKeys.includes(key) && JSON.stringify(snapshot.data[key]) === JSON.stringify(value)) return;
      const safeValue = copy(value);
      pending[key] = safeValue;
      emit({ data: { ...snapshot.data, [key]: safeValue }, status: 'saving' });
      // Batch updates from the same render, persist serially, never fall back to browser storage.
      queueMicrotask(() => flush().catch(() => {}));
    },
    flush,
    async retry() { emit({ error: null }); await flush(); },
    exportPending() { return copy(snapshot.data); }
  };
}
export const workspaceStore = createWorkspaceStore(supabase);

// Synchronous view of already-loaded database data. It never reads/writes localStorage.
export const appData = {
  getItem(key) {
    const snapshot = workspaceStore.getSnapshot();
    if (!snapshot.ready) return null;
    const aliases = { daily_tasks_backup: 'daily_tasks', coach_anotacoes_backup: 'coach_anotacoes' };
    const value = snapshot.data[aliases[key] || key];
    if (value == null) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
  },
  setItem(key, value) {
    let parsed;
    try { parsed = JSON.parse(value); } catch { parsed = value; }
    workspaceStore.write(key, parsed);
  }
};
