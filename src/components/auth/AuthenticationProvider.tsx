import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { RegistrationForm } from './RegistrationForm';
import {
  signIn,
  signOut,
  getCurrentUser,
  resetPassword,
  confirmResetPassword,
  signInWithRedirect
} from '@aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import outputs from '../../../amplify_outputs.json';
Amplify.configure(outputs);

interface AuthContextType {
  user: any;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  socialLogin: (provider: 'Google' | 'Facebook' | 'Apple') => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthenticationProvider');
  return ctx;
};

interface AuthenticationProviderProps {
  children: ReactNode;
}

export const AuthenticationProvider: React.FC<AuthenticationProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const u = await signIn({ username: email, password });
      setUser(u);
    } catch (e: any) {
      setError(e.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }, []);

  const socialLogin = useCallback(async (provider: 'Google' | 'Facebook' | 'Apple') => {
    setLoading(true);
    setError(null);
    try {
      await signInWithRedirect({ provider });
    } catch (e: any) {
      setError(e.message || 'Social login failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut();
      setUser(null);
    } catch (e: any) {
      setError(e.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const forgotPasswordHandler = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await resetPassword({ username: email });
      setResetEmail(email);
      setResetSent(true);
    } catch (e: any) {
      setError(e.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPasswordHandler = useCallback(async (email: string, code: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
      setResetSent(false);
      setShowForgot(false);
    } catch (e: any) {
      setError(e.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    socialLogin,
    logout,
    forgotPassword: forgotPasswordHandler,
    resetPassword: resetPasswordHandler,
  };


  if (loading) return <div className="auth-card">Loading...</div>;



  if (!user) {
    if (showRegister) {
      return (
        <div className="registration-card">
          <RegistrationForm />
          <button className="auth-link-btn" onClick={() => setShowRegister(false)}>
            &larr; Back to Login
          </button>
        </div>
      );
    }
    if (showForgot || resetSent) {
      return (
        <div className="forgot-card">
          {resetSent ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                const code = (e.currentTarget.elements.namedItem('code') as HTMLInputElement).value;
                const newPassword = (e.currentTarget.elements.namedItem('newPassword') as HTMLInputElement).value;
                resetPasswordHandler(resetEmail, code, newPassword);
              }}
            >
              <label htmlFor="code">Verification Code</label>
              <input id="code" name="code" autoFocus />
              <label htmlFor="newPassword">New Password</label>
              <input id="newPassword" name="newPassword" type="password" />
              <div className="auth-actions">
                <button type="submit">Reset Password</button>
                <button type="button" className="auth-link-btn" onClick={() => { setShowForgot(false); setResetSent(false); }}>
                  &larr; Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={e => {
                e.preventDefault();
                const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
                forgotPasswordHandler(email);
              }}
            >
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoFocus />
              <div className="auth-actions">
                <button type="submit">Send Reset Code</button>
                <button type="button" className="auth-link-btn" onClick={() => { setShowForgot(false); setResetSent(false); }}>
                  &larr; Back to Login
                </button>
              </div>
            </form>
          )}
          {error && <div className="auth-error">{error}</div>}
        </div>
      );
    }
    return (
      <div className="auth-card">
        <form
          onSubmit={e => {
            e.preventDefault();
            const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
            const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
            login(email, password);
          }}
        >
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoFocus />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" />
          <div className="auth-actions">
            <button type="submit">Log In</button>
            <button type="button" className="auth-link-btn" onClick={() => setShowForgot(true)}>
              Forgot Password?
            </button>
            <button type="button" className="auth-link-btn" onClick={() => setShowRegister(true)}>
              Create Account
            </button>
          </div>
        </form>
        <div className="auth-divider">or</div>
        <div className="auth-actions">
          <button type="button" onClick={() => socialLogin('Google')}>Continue with Google</button>
          <button type="button" onClick={() => socialLogin('Facebook')}>Continue with Facebook</button>
          <button type="button" onClick={() => socialLogin('Apple')}>Continue with Apple</button>
        </div>
        {error && <div className="auth-error">{error}</div>}
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <button onClick={logout}>Log Out</button>
    </AuthContext.Provider>
  );
};
