import React from 'react';

const Header = () => {
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    window.location.href = '/settings';
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم التحليلية</h1>
        <div className="flex items-center gap-3">
          {username && (
            <span className="text-sm text-gray-600">{username}</span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
