import React, { useState } from 'react';
import { login } from '../services/api';

export default function Settings() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      window.location.href = '/';
    } catch (err) {
      const apiMessage = err.response?.data?.error;
      if (apiMessage) {
        setError(apiMessage);
      } else if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
        setError('تعذر الوصول لسيرفر الباك إند. تأكد من VITE_API_BASE_URL على Vercel.');
      } else {
        setError('فشل تسجيل الدخول');
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
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-panel border border-line rounded-sm p-8">
        <p className="text-[11px] text-muted mb-1">تحليل التغطية الميدانية</p>
        <h2 className="text-xl font-semibold text-ink">
          {isLoggedIn ? 'الإعدادات' : 'دخول اللوحة'}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {isLoggedIn
            ? 'يمكنك متابعة اللوحة أو تسجيل الخروج.'
            : 'استخدم حساب اللوحة، مش حساب SQL.'}
        </p>

        {error && (
          <div className="mt-5 border border-choco/30 bg-choco/5 p-3 text-sm text-choco">
            {error}
          </div>
        )}

        {!isLoggedIn ? (
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs text-muted mb-1.5">
                اسم المستخدم
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full bg-paper border border-line rounded-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs text-muted mb-1.5">
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-paper border border-line rounded-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-panel text-sm py-2.5 rounded-sm hover:bg-accent-hover disabled:opacity-60"
            >
              {loading ? 'جاري الدخول...' : 'دخول'}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted">
              مسجل كـ{' '}
              <span className="text-ink font-medium">
                {localStorage.getItem('username') ?? 'مستخدم'}
              </span>
            </p>
            <a
              href="/"
              className="block w-full bg-accent text-panel text-sm py-2.5 rounded-sm text-center hover:bg-accent-hover"
            >
              فتح اللوحة
            </a>
            <button
              onClick={handleLogout}
              className="w-full border border-line text-ink text-sm py-2.5 rounded-sm hover:bg-paper"
            >
              تسجيل الخروج
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
