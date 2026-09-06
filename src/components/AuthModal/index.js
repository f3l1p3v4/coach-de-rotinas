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
