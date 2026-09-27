import React from 'react';

export default function ErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-card border border-danger/25 bg-danger-soft p-5 shadow-soft">
      <div className="flex items-start gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-panel text-danger">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 8v5M12 16.5v.2" />
            <circle cx="12" cy="12" r="8.5" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-danger">تعذّر تحميل البيانات التحليلية</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/80">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3.5 rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    </div>
  );
}
