import React, { useState } from 'react';
import { login } from '../services/api';
import BrandLogo from './BrandLogo';
import '../login.css';

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 7 9-7" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function Settings() {
  const remembered = localStorage.getItem('rememberUsername') || '';
  const [username, setUsername] = useState(remembered);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!remembered);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('accessToken'));

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { accessToken } = await login(username, password);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('username', username);
      if (remember) {
        localStorage.setItem('rememberUsername', username);
      } else {
        localStorage.removeItem('rememberUsername');
      }
      window.location.href = '/';
    } catch (err) {
      const apiMessage = err.response?.data?.error;
      if (apiMessage) {
        setError(apiMessage);
      } else if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
        setError('Could not reach the backend. Check VITE_API_BASE_URL.');
      } else {
        setError('Sign in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    window.location.href = '/login';
  };

  return (
    <div className="login-page" dir="ltr">
      <section className="login-hero">
        <img className="login-hero-photo" src="/login-left.png?v=5" alt="" />
        <div className="login-hero-veil-top" />
        <div className="login-hero-veil-bottom" />

        <div className="login-hero-content">
          <BrandLogo size={64} showTag />
          <h1>
            Better Performance.
            <br />
            Stronger Teams.
          </h1>
          <p className="login-hero-copy">
            Monitor your sales team, track visits,
            <br />
            and turn opportunities into success.
          </p>
        </div>

        <div className="login-features">
          <div>
            <span className="login-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8">
                <path d="M4 19V5" />
                <path d="M4 19h16" />
                <path d="M7 14l4-5 3 3 5-7" />
              </svg>
            </span>
            Real-time Insights
          </div>
          <div>
            <span className="login-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8">
                <circle cx="9" cy="8" r="3" />
                <circle cx="16" cy="9" r="2.4" />
                <path d="M4 19c.8-3.2 3.2-5 5-5s4.2 1.8 5 5" />
                <path d="M14 19c.4-2 1.8-3.4 3.4-3.4 1.4 0 2.6.8 3.2 2.4" />
              </svg>
            </span>
            Better Team Management
          </div>
          <div>
            <span className="login-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8">
                <path d="M12 3l8 3v6c0 5-3.4 8.4-8 9.6C7.4 20.4 4 17 4 12V6l8-3Z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            Secure & Reliable
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <BrandLogo size={40} />
          {isLoggedIn ? (
            <>
              <h2>Welcome Back</h2>
              <p className="login-card-sub">
                Signed in as {localStorage.getItem('username') ?? 'user'}
              </p>
              <div className="login-alt">
                <a href="/">Open dashboard</a>
                <button type="button" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>Welcome Back</h2>
              <p className="login-card-sub">Sign in to your dashboard to continue</p>
              {error ? <div className="login-error">{error}</div> : null}
              <form onSubmit={handleLogin}>
                <label className="login-label" htmlFor="username">
                  Username
                </label>
                <div className="login-field">
                  <IconMail />
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="admin"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>
                <label className="login-label" htmlFor="password">
                  Password
                </label>
                <div className="login-field">
                  <IconLock />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label="Toggle password"
                  >
                    <IconEye />
                  </button>
                </div>
                <div className="login-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                    />
                    Remember me
                  </label>
                </div>
                <button type="submit" className="login-submit" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                  <span aria-hidden="true">→</span>
                </button>
              </form>
            </>
          )}
          <p className="login-foot">
            Nile techno Sales Dashboard
            <br />
            v1.0.0
          </p>
        </div>
      </section>
    </div>
  );
}
