import React, { useState } from 'react';
import axios from 'axios';

export default function Settings() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      const { accessToken } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('username', username);
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.response?.data?.error ?? 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {isLoggedIn ? 'الإعدادات' : 'تسجيل الدخول'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLoggedIn
              ? 'أنت مسجل الدخول. يمكنك تعديل بياناتك أو تسجيل الخروج.'
              : 'أدخل بياناتك للوصول إلى لوحة التحكم'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 10-2 0v4a1 1 0 100 2h2a1 1 0 100-2v-4zm-1 9a1 1 0 100-2h2a1 1 0 100 2H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">خطأ</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {!isLoggedIn ? (
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                اسم المستخدم
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {loading ? 'جاري الدخول...' : 'دخول'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">
                  أنت مسجل الدخول ك: <span className="font-medium">{localStorage.getItem('username') ?? '(اسم المستخدم)'}</span>
                </p>
              </div>
            </div>

            {/* Logout button */}
            <div>
              <button
                onClick={handleLogout}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
