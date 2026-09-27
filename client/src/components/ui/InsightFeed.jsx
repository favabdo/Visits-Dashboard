import React from 'react';
import { nf } from '../../utils/format';

const LEVELS = {
  alert: { dot: 'bg-danger', chip: 'bg-danger-soft text-danger', ring: 'border-danger/20' },
  watch: { dot: 'bg-choco', chip: 'bg-choco-soft text-choco', ring: 'border-choco/20' },
  info: { dot: 'bg-accent', chip: 'bg-accent-soft text-accent', ring: 'border-line' },
};

const LEVEL_TITLES = { alert: 'تنبيه', watch: 'ملاحظة', info: 'معلومة' };

/** Data-driven observations, ordered alert → watch → info by the engine. */
export default function InsightFeed({ items = [], limit, emptyText = 'لم تُرصد ملاحظات من البيانات في هذه الفترة' }) {
  const shown = limit ? items.slice(0, limit) : items;
  if (!shown.length) {
    return <p className="py-6 text-center text-[12px] text-muted">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2.5">
      {shown.map((item, index) => {
        const level = LEVELS[item.level] || LEVELS.info;
        return (
          <li
            key={`${item.topic}-${index}`}
            className={`flex items-start gap-3 rounded-xl border bg-panel p-3.5 ${level.ring}`}
          >
            <span
              className={`mt-1 grid h-6 shrink-0 place-items-center rounded-md px-1.5 text-[10px] font-bold ${level.chip}`}
            >
              {LEVEL_TITLES[item.level] || LEVEL_TITLES.info}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-muted">{item.topic}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink">{item.text}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function InsightCounts({ items = [] }) {
  const counts = items.reduce(
    (acc, item) => {
      acc[item.level] = (acc[item.level] || 0) + 1;
      return acc;
    },
    {}
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      {['alert', 'watch', 'info'].map(level => (
        <span
          key={level}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            (LEVELS[level] || LEVELS.info).chip
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${LEVELS[level]?.dot || LEVELS.info.dot}`} />
          {LEVEL_TITLES[level]}
          <b className="tabular-nums">{nf(counts[level] || 0)}</b>
        </span>
      ))}
    </div>
  );
}
