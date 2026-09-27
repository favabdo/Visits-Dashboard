import React from 'react';
import Panel, { EmptyState } from '../Panel';
import ErrorPanel from './ErrorPanel';

export function PageIntro({ title, caption, meta = [], children }) {
  return (
    <div>
      <h2 className="text-xl font-extrabold tracking-tight text-ink">{title}</h2>
      {caption ? <p className="mt-1 text-sm text-muted">{caption}</p> : null}
      {meta.length ? (
        <ul className="mt-3 flex flex-wrap items-center gap-2">
          {meta.filter(Boolean).map(item => (
            <li
              key={item.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 py-1 text-[11px] text-muted"
            >
              <span>{item.label}</span>
              <b className="font-bold text-ink tabular-nums">{item.value}</b>
            </li>
          ))}
        </ul>
      ) : null}
      {children}
    </div>
  );
}

/** One load state wrapper so every section page behaves the same way. */
export function SectionState({ loading, error, onRetry, isEmpty, emptyText, children }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map(index => (
          <div
            key={index}
            className="h-[104px] animate-pulse rounded-card border border-line bg-panel"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }
  if (error) return <ErrorPanel message={error} onRetry={onRetry} />;
  if (isEmpty) return <Panel><EmptyState text={emptyText} /></Panel>;
  return children;
}
