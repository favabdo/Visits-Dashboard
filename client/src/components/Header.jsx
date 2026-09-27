import React from 'react';

const Header = ({ onOpenNav }) => (
  <header className="sticky top-0 z-30 border-b border-line bg-panel">
    <div className="flex h-[var(--header-h)] items-center gap-3 px-5 lg:px-8">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="فتح القائمة"
        aria-expanded={false}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink transition-colors hover:bg-panel-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-muted">تحليل التغطية الميدانية</p>
        <h1 className="truncate text-[17px] font-extrabold tracking-tight text-ink">
          لوحة الزيارات
        </h1>
      </div>
    </div>
  </header>
);

export default Header;
