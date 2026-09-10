import React from 'react';

const Header = () => {
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-panel">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div>
          <p className="text-[11px] text-muted mb-0.5">تحليل التغطية الميدانية</p>
          <h1 className="text-xl font-semibold text-ink tracking-tight">لوحة الزيارات</h1>
        </div>
        <div className="flex items-center gap-3">
          {username && (
            <span className="text-sm text-muted border border-line px-3 py-1 rounded-sm">
              {username}
            </span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-ink border border-line px-3 py-1.5 rounded-sm hover:bg-paper"
          >
            خروج
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
