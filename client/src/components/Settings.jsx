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

function IconEyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2" />
      <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-4.2 4.8" />
      <path d="M6.1 6.1A18 18 0 0 0 2 12s3.5 7 10 7a10.8 10.8 0 0 0 3.1-.5" />
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
        <img className="login-hero-photo" src="/login-hero.jpg?v=2" alt="" />
        <div className="login-hero-fade login-hero-fade-top" />
        <div className="login-hero-fade login-hero-fade-bottom" />

        <div className="login-hero-content">
          <BrandLogo size={44} showTag />
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
              <svg viewBox="0 0 24 24" fill="none" stroke="#6B8499" strokeWidth="1.6">
                <path d="M4 19V5M4 19h16M7 15l4-5 3 3 6-8" />
              </svg>
            </span>
            <span>
              Real-time
              <br />
              Insights
            </span>
          </div>
          <div>
            <span className="login-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#6B8499" strokeWidth="1.6">
                <circle cx="9" cy="8" r="3" />
                <circle cx="16" cy="9" r="2.3" />
                <path d="M4 19c1-3.4 3.4-5 5-5s4 1.6 5 5M14.5 19c.5-2 2-3.5 3.5-3.5 1.4 0 2.6.9 3.2 2.6" />
              </svg>
            </span>
            <span>
              Better Team
              <br />
              Management
            </span>
          </div>
          <div>
            <span className="login-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#6B8499" strokeWidth="1.6">
                <path d="M12 3l8 3.2v6.2c0 5-3.5 8.4-8 9.6-4.5-1.2-8-4.6-8-9.6V6.2L12 3Z" />
              </svg>
            </span>
            <span>
              Secure &
              <br />
              Reliable
            </span>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <BrandLogo size={36} />
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
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <IconEyeOff /> : <IconEye />}
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
