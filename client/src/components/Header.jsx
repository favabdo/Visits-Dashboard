import React from 'react';
import BrandLogo from './BrandLogo';

const Header = () => {
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-panel">
      <div className="mx-auto flex h-[var(--header-h)] max-w-[1700px] items-center justify-between gap-4 px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <BrandLogo size={34} className="login-brand-compact" />
          <span className="hidden h-9 w-px shrink-0 bg-line sm:block" aria-hidden="true" />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[11px] font-medium text-muted">تحليل التغطية الميدانية</p>
            <h1 className="truncate text-[17px] font-extrabold tracking-tight text-ink">لوحة الزيارات</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {username && (
            <span className="hidden items-center gap-2 rounded-full border border-line bg-panel-soft py-1 pe-3.5 ps-1 sm:inline-flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">
                {username.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-semibold text-ink">{username}</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-danger/30 hover:bg-danger-soft hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
              <path d="M10 16l-4-4 4-4" />
              <path d="M6 12h9" />
            </svg>
            خروج
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
