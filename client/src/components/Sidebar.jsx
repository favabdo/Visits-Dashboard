import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const ITEMS = [
  {
    to: '/',
    end: true,
    label: 'الرئيسية',
    icon: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
      </>
    ),
  },
  {
    to: '/delegates',
    end: false,
    label: 'المندوبون',
    badge: true,
    icon: (
      <>
        <circle cx="9.5" cy="8.5" r="3.2" />
        <circle cx="16.5" cy="9.5" r="2.4" />
        <path d="M3.5 19c1-3.4 3.4-5.2 6-5.2s5 1.8 6 5.2" />
        <path d="M15.6 19c.5-1.9 1.9-3.2 3.4-3.2 1 0 1.9.5 2.5 1.5" />
      </>
    ),
  },
];

const Sidebar = ({ open, onClose, delegatesCount = 0 }) => {
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  return (
    <>
      <button
        type="button"
        aria-hidden={!open}
        tabIndex={-1}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`flex w-[min(82vw,248px)] shrink-0 flex-col border-e border-line bg-panel
          max-md:fixed max-md:inset-y-0 max-md:start-0 max-md:z-50 max-md:shadow-lift max-md:transition-transform max-md:duration-300
          md:sticky md:top-0 md:h-screen md:w-[248px]
          ${open ? 'max-md:translate-x-0' : 'max-md:ltr:-translate-x-full max-md:rtl:translate-x-full'}`}
      >
        <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-6">
          <BrandLogo size={30} className="login-brand-compact" />
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق القائمة"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-panel-soft hover:text-ink md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pt-3">
          {ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isActive
                    ? 'bg-accent-soft text-ink shadow-soft'
                    : 'text-muted hover:bg-panel-soft hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <span
                      className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-accent-hover"
                      aria-hidden="true"
                    />
                  ) : null}
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className={isActive ? 'shrink-0 text-accent' : 'shrink-0'}
                  >
                    {item.icon}
                  </svg>
                  {item.label}
                  {item.badge && delegatesCount ? (
                    <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold tabular-nums text-white">
                      {delegatesCount}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-3 pb-4">
          <div className="flex items-center gap-2.5 rounded-xl border border-line bg-panel-soft px-2 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-[13px] font-bold text-accent">
              {username ? username.charAt(0).toUpperCase() : '؟'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">
                {username || 'حساب المشرف'}
              </p>
              <p className="text-[11px] text-muted">لوحة الزيارات</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="خروج"
              title="خروج"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
                <path d="M10 16l-4-4 4-4" />
                <path d="M6 12h9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
