import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { workspaceStore } from '../../services/workspaceStore';
import AuthModal from '../AuthModal';
import AppIcon from '../AppIcon';
import './styles.css';

export function downloadWorkspace() {
  const data = workspaceStore.exportPending();
  const blob = new Blob([JSON.stringify({ format: 'focus-task-local-export', version: 1, data }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'focus-task-recuperacao.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CloudGate({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [authOpen, setAuthOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const userId = useRef(null);
  const cloud = useSyncExternalStore(workspaceStore.subscribe, workspaceStore.getSnapshot);
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    let authEventSeen = false;
    const applyUser = next => {
      if (!mounted) return;
      if (userId.current !== (next?.id || null)) { workspaceStore.reset(); userId.current = next?.id || null; }
      setUser(next); setAuthReady(true);
    };
    supabase.auth.getSession().then(({ data, error }) => {
      if (authEventSeen) return;
      if (error) { applyUser(null); return; }
      applyUser(data.session?.user || null);
    }).catch(() => { if (!authEventSeen) applyUser(null); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { authEventSeen = true; applyUser(session?.user || null); });
    return () => { mounted = false; data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (user?.id) workspaceStore.load(user.id).catch(() => {});
  }, [user?.id]);
  useEffect(() => {
    const handleUnload = event => {
      const state = workspaceStore.getSnapshot();
      if (state.status === 'saving' || (state.ready && state.error)) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);
  const retry = async () => {
    setRetrying(true);
    try {
      if (cloud.ready) await workspaceStore.retry();
      else await workspaceStore.load(user.id);
    } catch {} finally { setRetrying(false); }
  };
  if (!authReady) return <main className="cloud-screen"><p>Verificando sua conta...</p></main>;
  if (!user) return <main className="cloud-screen">
    <AppIcon name="target" size={52} /><h1>Focus Task</h1>
    <p>{isSupabaseConfigured ? 'Entre na sua conta para acessar seus dados salvos na nuvem.' : 'Configure o Supabase para usar o Focus Task.'}</p>
    {isSupabaseConfigured && <button onClick={() => setAuthOpen(true)}>Entrar ou criar conta</button>}
    {authOpen && <AuthModal user={null} onClose={() => setAuthOpen(false)} onAuthSuccess={() => setAuthOpen(false)} />}
  </main>;
  const correctAccount = cloud.ready && cloud.userId === user.id;
  return <>
    {correctAccount ? <React.Fragment key={`${user.id}:${cloud.generation}`}>
      {children(user)}
      <aside className="cloud-tools" aria-label="Dados na nuvem"><span role="status">{cloud.status === 'saved' ? 'Salvo no Supabase' : 'Salvando...'}</span></aside>
    </React.Fragment> : !cloud.error && <main className="cloud-screen"><p>Carregando seus dados do Supabase...</p></main>}
    {(cloud.error || (correctAccount && cloud.status === 'saving')) && <div className="cloud-blocker" role="dialog" aria-modal="true" aria-label={cloud.error ? 'Falha ao salvar dados' : 'Salvando dados'}>
      <section className="cloud-panel">
        <AppIcon name={cloud.error ? 'failed' : 'calendar'} size={32} />
        <h2>{cloud.error ? 'Seus dados ainda não foram confirmados' : 'Salvando no Supabase...'}</h2>
        <p>{cloud.error?.message || 'Aguarde a confirmação do banco.'}</p>
        {cloud.error && <>
          <button disabled={retrying} onClick={retry}>{retrying ? 'Tentando...' : 'Tentar novamente'}</button>
          {correctAccount && <button onClick={downloadWorkspace}>Baixar alterações pendentes</button>}
          <button onClick={() => { if (!correctAccount || window.confirm('Recarregar descarta as alterações não salvas. Já baixou uma cópia?')) window.location.reload(); }}>Recarregar dados</button>
          <button onClick={async () => { if (!correctAccount || window.confirm('Há alterações não salvas. Deseja sair mesmo assim?')) await supabase.auth.signOut(); }}>Sair da conta</button>
        </>}
      </section>
    </div>}
  </>;
}
