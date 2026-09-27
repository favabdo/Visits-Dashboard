import React from 'react';
import { nf, pf } from '../../utils/format';

const BAR_COLORS = {
  accent: 'bg-accent',
  teal: 'bg-teal',
  success: 'bg-success',
  warning: 'bg-choco',
  danger: 'bg-danger',
  neutral: 'bg-slate',
};

/**
 * Ranked distribution as labelled bars — clearer than a pie when the category
 * names are long Arabic phrases. Rows may carry `percentage`, else it is derived.
 */
export default function RankBars({
  rows = [],
  tone = 'accent',
  unit = 'إجابة',
  limit,
  emptyText = 'لا توجد بيانات في هذه الفترة',
}) {
  const present = rows.filter(row => row && typeof row.count === 'number');
  if (!present.length) {
    return <p className="py-6 text-center text-[12px] text-muted">{emptyText}</p>;
  }

  const shown = limit ? present.slice(0, limit) : present;
  const max = Math.max(...shown.map(row => row.count || 0), 1);

  return (
    <ul className="space-y-2.5">
      {shown.map((row, index) => {
        const label = row.label ?? row.name ?? row.area ?? row.question ?? `بند ${index + 1}`;
        const count = row.count ?? 0;
        const width = (count / max) * 100;
        const share = row.percentage ?? (row.total ? (count * 100) / row.total : null);
        return (
          <li key={`${label}-${index}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink" title={label}>
                {label}
              </span>
              <span className="shrink-0 text-[12px] text-muted tabular-nums">
                <b className="font-bold text-ink">{nf(count)}</b> {unit}
                {share != null ? <span className="ms-1.5 text-slate">· {pf(share)}</span> : null}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-panel-soft">
              <div
                className={`h-full rounded-full ${BAR_COLORS[tone] || BAR_COLORS.accent}`}
                style={{ width: `${Math.max(width, count ? 3 : 0)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
