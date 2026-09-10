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

function Feature({ children, icon }) {
  return (
    <div>
      {icon}
      <span>{children}</span>
    </div>
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
    window.location.href = '/settings';
  };

  return (
    <div className="login-page" dir="ltr">
      <section className="login-hero">
        <div className="login-skyline" />
        <div className="login-hero-content">
          <BrandLogo />
          <h1>
            Better Performance.
            <br />
            Stronger Teams.
          </h1>
          <p className="login-hero-copy">
            Monitor your sales team, track visits, and turn opportunities into success.
          </p>
        </div>

        <div className="login-stage">
          <div className="login-laptop">
            <div className="login-laptop-bar">
              <span className="login-laptop-dot" />
              <span className="login-laptop-dot" />
              <span className="login-laptop-dot" />
              Nile techno
            </div>
            <div className="login-mini">
              <div className="login-mini-side">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="login-mini-main">
                <div className="login-mini-card">
                  <small>Total visits</small>
                  <b>1,248</b>
                </div>
                <div className="login-mini-card">
                  <small>Coverage</small>
                  <b>24.8%</b>
                </div>
                <div className="login-mini-card">
                  <small>Team</small>
                  <b>312</b>
                </div>
                <div className="login-mini-card login-mini-wide" />
                <div className="login-mini-card login-mini-donut" />
              </div>
            </div>
          </div>
        </div>

        <div className="login-features">
          <Feature
            icon={
              <svg viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="15" stroke="#94a3b8" />
                <path d="M8 20l5-6 4 4 7-8" stroke="#3b82f6" strokeWidth="1.8" fill="none" />
              </svg>
            }
          >
            Real-time Insights
          </Feature>
          <Feature
            icon={
              <svg viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="15" stroke="#94a3b8" />
                <circle cx="16" cy="13" r="3" stroke="#3b82f6" />
                <path d="M10 22c1.2-3 10.8-3 12 0" stroke="#3b82f6" />
              </svg>
            }
          >
            Better Team Management
          </Feature>
          <Feature
            icon={
              <svg viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="15" stroke="#94a3b8" />
                <path d="M16 8l8 3v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9v-6l8-3Z" stroke="#3b82f6" />
              </svg>
            }
          >
            Secure & Reliable
          </Feature>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <BrandLogo />
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
