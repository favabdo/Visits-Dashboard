import React from 'react';
import { nf, signed } from '../../utils/format';

/** Half-period change: up is blue, down is amber — no invented "good/bad". */
export default function Delta({ value, hint, showZero = false }) {
  if (value == null || (!showZero && value === 0)) return null;
  const up = value > 0;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 tabular-nums ${
          up ? 'bg-accent-soft text-accent' : 'bg-choco-soft text-choco'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          width="11"
          height="11"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {up ? <path d="M6 15l6-6 6 6" /> : <path d="M6 9l6 6 6-6" />}
        </svg>
        {signed(value)}
      </span>
      {hint ? <span className="font-medium text-muted">{hint}</span> : null}
    </span>
  );
}

/** Term frequency chips: keyword plus how often it appeared. */
export function TermChips({ terms = [], tone = 'accent', emptyText = 'لا توجد كلمات مميزة في هذه الفترة' }) {
  if (!terms.length) return <p className="py-4 text-center text-[12px] text-muted">{emptyText}</p>;
  const palette =
    tone === 'danger'
      ? 'bg-danger-soft text-danger'
      : tone === 'teal'
        ? 'bg-teal-soft text-teal'
        : tone === 'warning'
          ? 'bg-choco-soft text-choco'
          : 'bg-accent-soft text-accent';
  const max = Math.max(...terms.map(term => term.count || 0), 1);

  return (
    <ul className="flex flex-wrap gap-2">
      {terms.map(term => (
        <li
          key={term.term || term.label}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${palette}`}
          style={{ opacity: 0.55 + ((term.count || 0) / max) * 0.45 }}
        >
          {term.term || term.label}
          <b className="tabular-nums">{nf(term.count)}</b>
        </li>
      ))}
    </ul>
  );
}
