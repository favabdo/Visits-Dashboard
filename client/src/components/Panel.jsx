import React from 'react';

export default function Panel({ title, children, className = '' }) {
  return (
    <section
      className={`rounded-card border border-line bg-panel p-5 shadow-soft lg:p-6 ${className}`}
    >
      {title && (
        <div className="mb-5 flex items-center gap-2.5">
          <span className="h-4 w-1 rounded-full bg-accent" aria-hidden="true" />
          <h2 className="text-sm font-bold text-ink">{title}</h2>
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ text = 'لا توجد بيانات لعرضها' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-panel-soft text-muted">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 13.5 6 5h12l2 8.5" />
          <path d="M4 13.5h4.5l1 2.5h5l1-2.5H20v4.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        </svg>
      </span>
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}
