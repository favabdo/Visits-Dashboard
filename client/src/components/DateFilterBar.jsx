import React, { useState } from 'react';
import { format, subDays } from 'date-fns';

const toISO = date => format(date, 'yyyy-MM-dd');
const today = () => toISO(new Date());

const PRESETS = [
  { key: 'today', label: 'اليوم', range: () => ({ startDate: today(), endDate: today() }) },
  {
    key: 'week',
    label: 'آخر 7 أيام',
    range: () => ({ startDate: toISO(subDays(new Date(), 6)), endDate: today() }),
  },
  {
    key: 'month',
    label: 'آخر 30 يوم',
    range: () => ({ startDate: toISO(subDays(new Date(), 29)), endDate: today() }),
  },
];

const sameRange = (a, b) => a.startDate === b.startDate && a.endDate === b.endDate;

const DateFilterBar = ({ range, onApply }) => {
  const [startDate, setStartDate] = useState(range.startDate || '');
  const [endDate, setEndDate] = useState(range.endDate || '');

  const apply = next => {
    setStartDate(next.startDate);
    setEndDate(next.endDate);
    onApply(next);
  };

  const handleSubmit = e => {
    e.preventDefault();
    apply({ startDate, endDate });
  };

  const handleReset = () => apply({ startDate: '', endDate: '' });

  const hasRange = Boolean(range.startDate || range.endDate);
  const activePreset = PRESETS.find(item => sameRange(item.range(), range))?.key || '';
  const rangeLabel = hasRange
    ? `${range.startDate || '—'}  ←  ${range.endDate || '—'}`
    : 'كل الفترات';

  const inputClass =
    'date-field w-full min-w-0 appearance-none rounded-xl border border-line bg-panel-soft px-3.5 py-2.5 text-[13.5px] leading-normal text-ink tabular-nums outline-none transition focus:border-accent focus:bg-panel focus:ring-4 focus:ring-accent/12';

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-card border border-line bg-panel p-4 shadow-soft lg:px-5"
    >
      <div className="flex min-w-0 items-center gap-3 pb-1">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <rect x="3.5" y="5" width="17" height="15" rx="3" />
            <path d="M3.5 10h17M8 3.5V6M16 3.5V6" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">نطاق التاريخ</p>
          <p className="text-[11px] text-muted">يُطبَّق على كل الصفحات</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-1">
        {PRESETS.map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() => apply(item.range())}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              activePreset === item.key
                ? 'border-accent bg-accent text-white shadow-glow'
                : 'border-line bg-panel-soft text-muted hover:border-accent/40 hover:text-accent'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 sm:flex-none sm:w-[10.5rem]">
          <label className="mb-1 block text-[11px] font-semibold text-muted" htmlFor="range-from">
            من
          </label>
          <input
            id="range-from"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="min-w-0 flex-1 sm:flex-none sm:w-[10.5rem]">
          <label className="mb-1 block text-[11px] font-semibold text-muted" htmlFor="range-to">
            إلى
          </label>
          <input
            id="range-to"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-glow transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex-none sm:py-2"
          >
            تطبيق
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 rounded-xl border border-line px-4 py-2.5 text-xs font-semibold text-muted transition-colors hover:border-accent/40 hover:text-accent sm:flex-none sm:py-2"
          >
            مسح الفترة
          </button>
        </div>
      </div>

      <span
        className="ms-auto rounded-full border border-line bg-panel-soft px-3.5 py-1.5 text-xs font-semibold tabular-nums text-muted"
        dir={hasRange ? 'ltr' : 'rtl'}
      >
        {rangeLabel}
      </span>
    </form>
  );
};

export default DateFilterBar;
