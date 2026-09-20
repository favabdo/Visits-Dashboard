import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const NAV_LINK_BASE =
  'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const DelegateCard = ({ delegate, path, active }) => {
  const navigate = useNavigate();
  const initials = String(delegate.name || '؟').trim().charAt(0);
  return (
    <button
      type="button"
      onClick={() => navigate(path)}
      aria-current={active ? 'page' : undefined}
      className={`w-full rounded-xl border p-3 text-start transition-all ${
        active
          ? 'border-accent/50 bg-accent-soft shadow-soft'
          : 'border-line bg-panel-soft hover:border-accent/35 hover:bg-panel'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${
            active ? 'bg-accent text-white' : 'bg-panel text-accent'
          }`}
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-ink">{delegate.name}</p>
          <p className="mt-0.5 text-[11px] text-muted tabular-nums">
            {delegate.visits} زيارة · {delegate.samples} إجابة
          </p>
        </div>
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
          className={`shrink-0 transition-colors ${active ? 'text-accent' : 'text-muted'}`}
        >
          <path d="M14 6l-6 6 6 6" />
        </svg>
      </div>
    </button>
  );
};

const Sidebar = ({ delegates = [] }) => {
  const [delegatesOpen, setDelegatesOpen] = useState(true);
  const location = useLocation();

  return (
    <aside className="w-full shrink-0 border-b border-line bg-panel lg:sticky lg:top-[calc(var(--header-h)+var(--filter-h))] lg:h-[calc(100vh-var(--header-h)-var(--filter-h))] lg:w-[304px] lg:overflow-y-auto lg:border-b-0 lg:border-e">
      <nav className="space-y-5 p-5 lg:p-6">
        <div className="space-y-1.5">
          <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-muted">التنقّل</p>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${NAV_LINK_BASE} ${
                isActive
                  ? 'bg-accent text-white shadow-glow'
                  : 'text-ink hover:bg-panel-soft hover:text-accent'
              }`
            }
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
              <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
              <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
              <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
            </svg>
            الرئيسية
          </NavLink>
        </div>

        <div className="border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setDelegatesOpen(value => !value)}
            aria-expanded={delegatesOpen}
            className="flex w-full items-center gap-3 rounded-xl px-1.5 py-2 text-start transition-colors hover:bg-panel-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-soft text-teal">
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="9.5" cy="8.5" r="3.2" />
                <circle cx="16.5" cy="9.5" r="2.4" />
                <path d="M3.5 19c1-3.4 3.4-5.2 6-5.2s5 1.8 6 5.2" />
                <path d="M15.6 19c.5-1.9 1.9-3.2 3.4-3.2 1 0 1.9.5 2.5 1.5" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-ink">المندوبون</span>
              <span className="block text-[11px] text-muted">اضغط على مندوب لعرض إحصائياته</span>
            </span>
            <span className="shrink-0 rounded-full bg-panel-soft px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted">
              {delegates.length}
            </span>
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
              className={`shrink-0 text-muted transition-transform ${delegatesOpen ? 'rotate-180' : ''}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {delegatesOpen ? (
            delegates.length ? (
              <div className="mt-3 space-y-2">
                {delegates.map(delegate => {
                  const path = `/delegates/${encodeURIComponent(delegate.name)}`;
                  return (
                    <DelegateCard
                      key={delegate.name}
                      delegate={delegate}
                      path={path}
                      active={location.pathname === path}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 rounded-xl border border-line bg-panel-soft px-3.5 py-3 text-xs text-muted">
                لا يوجد مندوبون في هذه الفترة
              </p>
            )
          ) : null}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
