import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { User, EnvelopeSimple, LockKey, SignOut, XCircle, UserPlus, SignIn, WarningCircle } from '@phosphor-icons/react';

import './styles.css';

function AuthModal({ user, onClose, onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('O Supabase ainda não foi configurado. Preencha as chaves no arquivo .env.local para habilitar o login na nuvem.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, informe email e senha.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isSignUp) {
        // Criar Conta
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;

        if (data.session) {
          setSuccessMessage('Conta criada e logada com sucesso!');
          if (onAuthSuccess) onAuthSuccess(data.session.user);
        } else {
          setSuccessMessage('Conta criada! Caso o Supabase exija verificação, verifique sua caixa de entrada.');
        }
      } else {
        // Entrar
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;

        setSuccessMessage('Login realizado com sucesso!');
        if (onAuthSuccess) onAuthSuccess(data.user);
        setTimeout(() => onClose(), 1000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Erro ao realizar autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    if (onAuthSuccess) onAuthSuccess(null);
    onClose();
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" onClick={e => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h3>
            <User size={26} />
            <span>{user ? 'Minha Conta' : (isSignUp ? 'Criar Conta' : 'Entrar na Conta')}</span>
          </h3>
          <button className="auth-close-btn" onClick={onClose}>
            <XCircle size={24} />
          </button>
        </div>

        {!isSupabaseConfigured && (
          <div className="auth-warning-banner">
            <WarningCircle size={22} color="#d97706" />
            <div>
              <strong>Atenção: Chaves do Supabase Pendentes</strong>
              <p>Para ativar a nuvem, cole a URL e a Anon Key do Supabase no seu arquivo <code>.env.local</code> no código do aplicativo.</p>
            </div>
          </div>
        )}

        {user ? (
          <div className="auth-logged-in-view">
            <div className="user-info-box">
              <span className="user-avatar-badge">{user.email ? user.email[0].toUpperCase() : 'U'}</span>
              <div className="user-details">
                <span className="user-email-text">{user.email}</span>
                <span className="user-status-online">● Conectado</span>
              </div>
            </div>

            <p className="auth-sync-note">
              ✨ Todas as suas tarefas, modelos e anotações estão sincronizados e salvos na sua conta na nuvem!
            </p>

            <button className="auth-logout-btn" onClick={handleLogout}>
              <SignOut size={20} />
              <span>Sair da Conta</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="auth-form">
            {errorMessage && <div className="auth-alert error">{errorMessage}</div>}
            {successMessage && <div className="auth-alert success">{successMessage}</div>}

            <div className="auth-input-group">
              <label>E-mail</label>
              <div className="input-wrapper">
                <EnvelopeSimple size={20} className="input-icon" />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label>Senha</label>
              <div className="input-wrapper">
                <LockKey size={20} className="input-icon" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span>Aguarde...</span>
              ) : isSignUp ? (
                <>
                  <UserPlus size={20} />
                  <span>Cadastrar Conta</span>
                </>
              ) : (
                <>
                  <SignIn size={20} />
                  <span>Entrar</span>
                </>
              )}
            </button>

            <div className="auth-social-divider">
              <span>ou continue com</span>
            </div>

            <button 
              type="button" 
              className="auth-google-btn"
              disabled={loading}
              onClick={async () => {
                try {
                  setLoading(true);
                  const { signInWithGoogleCalendar } = await import('../../services/googleCalendarService');
                  await signInWithGoogleCalendar();
                } catch(err) {
                  setErrorMessage(err.message || 'Erro ao conectar com Google.');
                } finally {
                  setLoading(false);
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Entrar com o Google</span>
            </button>

            <div className="auth-toggle-mode">
              {isSignUp ? (
                <p>
                  Já possui uma conta?{' '}
                  <button type="button" onClick={() => setIsSignUp(false)}>
                    Fazer Login
                  </button>
                </p>
              ) : (
                <p>
                  Não tem conta ainda?{' '}
                  <button type="button" onClick={() => setIsSignUp(true)}>
                    Criar Conta Grátis
                  </button>
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
