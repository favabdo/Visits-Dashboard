import React from 'react';
import { nf } from '../../utils/format';

const TONES = {
  accent: { ring: 'border-line', chip: 'bg-accent-soft text-accent', bar: 'bg-accent' },
  teal: { ring: 'border-line', chip: 'bg-teal-soft text-teal', bar: 'bg-teal' },
  success: { ring: 'border-line', chip: 'bg-success-soft text-success', bar: 'bg-success' },
  warning: { ring: 'border-line', chip: 'bg-choco-soft text-choco', bar: 'bg-choco' },
  danger: { ring: 'border-danger/25', chip: 'bg-danger-soft text-danger', bar: 'bg-danger' },
  neutral: { ring: 'border-line', chip: 'bg-panel-soft text-slate', bar: 'bg-slate' },
};

const GRID_CLASSES = {
  2: 'grid gap-4 sm:grid-cols-2',
  3: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4',
  5: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  6: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
};

/** A row of objective KPI tiles. `progress` (0-100) draws the meter strip. */
export default function StatsRow({ items = [], columns = 4 }) {
  const present = items.filter(Boolean);
  if (!present.length) return null;

  const gridClass = GRID_CLASSES[columns] || GRID_CLASSES[4];

  return (
    <div className={gridClass}>
      {present.map(item => {
        const tone = TONES[item.tone] || TONES.accent;
        const numeric = typeof item.value === 'number';
        const meter = numeric && item.progress != null ? Math.max(0, Math.min(100, item.progress)) : null;
        return (
          <div
            key={item.key || item.label}
            className={`rounded-card border bg-panel p-4 shadow-soft ${tone.ring}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-semibold leading-snug text-muted">{item.label}</p>
              {item.badge ? (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone.chip}`}>
                  {item.badge}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-[26px] font-extrabold leading-none tracking-tight text-ink tabular-nums">
              {numeric ? nf(item.value) : item.value}
              {numeric && item.suffix ? (
                <span className="ms-1 text-[15px] font-bold text-muted">{item.suffix}</span>
              ) : null}
            </p>
            {item.hint ? <p className="mt-1.5 text-[11px] text-muted">{item.hint}</p> : null}
            {meter != null ? (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-panel-soft">
                <div
                  className={`h-full rounded-full ${tone.bar}`}
                  style={{ width: `${meter}%` }}
                  aria-hidden="true"
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
