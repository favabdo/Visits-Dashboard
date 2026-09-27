import React from 'react';

/** Small segmented switch used for time granularity and view modes. */
export default function Segmented({ options = [], value, onChange, ariaLabel }) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-line bg-panel-soft p-1"
    >
      {options.map(option => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            aria-pressed={active}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition-colors ${
              active ? 'bg-panel text-accent shadow-soft' : 'text-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
