import React from 'react';
import { NavLink } from 'react-router-dom';

const ITEMS = [
  {
    to: '/',
    end: true,
    label: 'الرئيسية',
    hint: 'نظرة عامة على أداء الفريق',
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
    hint: 'إحصائيات كل مندوب على حدة',
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

const Sidebar = ({ delegatesCount = 0 }) => (
  <aside className="w-full shrink-0 border-b border-line bg-panel lg:sticky lg:top-[var(--header-h)] lg:h-[calc(100vh-var(--header-h))] lg:w-[288px] lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-e">
    <nav className="p-5 lg:p-6">
      <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-muted">التنقّل</p>
      <div className="mt-2.5 space-y-2">
        {ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                isActive
                  ? 'bg-accent text-white shadow-glow'
                  : 'text-ink hover:bg-panel-soft hover:text-accent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    isActive ? 'bg-white/15 text-white' : 'bg-accent-soft text-accent'
                  }`}
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
                    {item.icon}
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{item.label}</span>
                  <span
                    className={`block truncate text-[11px] ${
                      isActive ? 'text-white/75' : 'text-muted'
                    }`}
                  >
                    {item.hint}
                  </span>
                </span>
                {item.to === '/delegates' && delegatesCount ? (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                      isActive ? 'bg-white/20 text-white' : 'bg-panel-soft text-muted'
                    }`}
                  >
                    {delegatesCount}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  </aside>
);

export default Sidebar;
