import React, { useState } from 'react';
import axios from 'axios';

export default function Settings() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      const { accessToken } = res.data;
      localStorage.setItem('accessToken', accessToken);
      // Optionally store username for display
      localStorage.setItem('username', username);
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error ?? 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    window.location.href = '/settings';
  };

  const isLoggedIn = !!localStorage.getItem('accessToken');

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">{isLoggedIn ? 'الإعدادات' : 'تسجيل الدخول'}</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!isLoggedIn ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
      ) : (
        <>
          <p className="text-gray-600">أنت مسجل الدخول ك:</p>
          <p className="font-semibold mb-4">{localStorage.getItem('username') ?? '(اسم المستخدم)'}</p>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            تسجيل الخروج
          </button>
        </>
      )}
    </div>
  );
}
