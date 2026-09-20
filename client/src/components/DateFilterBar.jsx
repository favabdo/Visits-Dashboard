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

const DateFilterBar = ({ onDateChange }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preset, setPreset] = useState('');
  const [applied, setApplied] = useState({ startDate: '', endDate: '' });

  const apply = next => {
    setApplied(next);
    onDateChange(next);
  };

  const handleSubmit = e => {
    e.preventDefault();
    setPreset('');
    apply({ startDate, endDate });
  };

  const handlePreset = item => {
    const range = item.range();
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setPreset(item.key);
    apply(range);
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setPreset('');
    apply({ startDate: '', endDate: '' });
  };

  const hasRange = Boolean(applied.startDate || applied.endDate);
  const rangeLabel = hasRange
    ? `${applied.startDate || '—'}  ←  ${applied.endDate || '—'}`
    : 'كل الفترات';

  const inputClass =
    'w-full rounded-xl border border-line bg-panel-soft px-3 py-2 text-sm text-ink tabular-nums outline-none transition focus:border-accent focus:bg-panel focus:ring-4 focus:ring-accent/12';

  return (
    <div className="sticky top-[var(--header-h)] z-20 border-b border-line bg-panel/95 backdrop-blur">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-[1700px] flex-wrap items-end gap-x-4 gap-y-3 px-5 py-3.5 lg:px-8"
      >
        <div className="flex min-w-0 items-end gap-2.5">
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
          <div className="min-w-0 pb-0.5">
            <p className="text-xs font-bold text-ink">نطاق التاريخ</p>
            <p className="text-[11px] text-muted">اختر الفترة ثم اضغط تطبيق</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pb-1">
          {PRESETS.map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => handlePreset(item)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                preset === item.key
                  ? 'border-accent bg-accent text-white shadow-glow'
                  : 'border-line bg-panel-soft text-muted hover:border-accent/40 hover:text-accent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-[9.5rem]">
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
          <div className="w-[9.5rem]">
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
          <button
            type="submit"
            className="rounded-xl bg-accent px-5 py-2 text-sm font-bold text-white shadow-glow transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            تطبيق
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-muted transition-colors hover:border-accent/40 hover:text-accent"
          >
            مسح الفترة
          </button>
        </div>

        <span
          className="ms-auto rounded-full border border-line bg-panel-soft px-3.5 py-1.5 text-xs font-semibold tabular-nums text-muted"
          dir={hasRange ? 'ltr' : 'rtl'}
        >
          {rangeLabel}
        </span>
      </form>
    </div>
  );
};

export default DateFilterBar;
