import React from 'react';

const iconProps = {
  viewBox: '0 0 24 24',
  width: 19,
  height: 19,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const IconRoute = () => (
  <svg {...iconProps}>
    <path d="M6.5 3.5A2.5 2.5 0 0 0 4 6c0 1.9 2.5 5.5 2.5 5.5S9 7.9 9 6a2.5 2.5 0 0 0-2.5-2.5Z" />
    <circle cx="6.5" cy="6" r="1" />
    <path d="M17.5 12.5A2.5 2.5 0 0 0 15 15c0 1.9 2.5 5.5 2.5 5.5S20 16.9 20 15a2.5 2.5 0 0 0-2.5-2.5Z" />
    <circle cx="17.5" cy="15" r="1" />
    <path d="M9 6h5.5a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6" />
  </svg>
);

const IconForm = () => (
  <svg {...iconProps}>
    <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
    <path d="M9 8.5h6M9 12h6M9 15.5h3.5" />
  </svg>
);

const IconUsers = () => (
  <svg {...iconProps}>
    <circle cx="9.5" cy="8.5" r="3.2" />
    <circle cx="16.5" cy="9.5" r="2.4" />
    <path d="M3.5 19c1-3.4 3.4-5.2 6-5.2s5 1.8 6 5.2" />
    <path d="M15.6 19c.5-1.9 1.9-3.2 3.4-3.2 1 0 1.9.5 2.5 1.5" />
  </svg>
);

const IconAverage = () => (
  <svg {...iconProps}>
    <path d="M5 19V9M12 19V5M19 19v-6" />
    <path d="M3 21h18" />
  </svg>
);

const IconStar = () => (
  <svg {...iconProps}>
    <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 9.7l5.4-.8Z" />
  </svg>
);

const IconCheck = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.3 2.4 2.4 4.6-5" />
  </svg>
);

const IconInside = () => (
  <svg {...iconProps}>
    <path d="M12 3.5 19 6v6c0 4.6-3 7.7-7 9-4-1.3-7-4.4-7-9V6Z" />
    <path d="m9 11.8 2.2 2.2 4-4.4" />
  </svg>
);

const IconAlert = () => (
  <svg {...iconProps}>
    <path d="M12 4.5 20.5 19h-17Z" />
    <path d="M12 10v4M12 16.8v.2" />
  </svg>
);

const TONES = {
  blue: { chip: 'bg-accent-soft text-accent', value: 'text-ink' },
  teal: { chip: 'bg-teal-soft text-teal', value: 'text-ink' },
  slate: { chip: 'bg-panel-soft text-slate', value: 'text-ink' },
  green: { chip: 'bg-success-soft text-success', value: 'text-ink' },
  amber: { chip: 'bg-choco-soft text-choco', value: 'text-choco' },
};

function Card({ title, value, hint, tone = 'blue', icon }) {
  const styles = TONES[tone];
  return (
    <div className="rounded-card border border-line bg-panel p-5 shadow-soft transition-shadow duration-200 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-muted">{title}</p>
          <p
            className={`mt-2.5 text-[1.75rem] font-extrabold leading-none tracking-tight tabular-nums ${styles.value}`}
          >
            {value}
          </p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${styles.chip}`}>
          {icon}
        </span>
      </div>
      {hint && <p className="mt-3 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const MetricsCards = ({ data }) => {
  const totals = data || {};
  const avg = Number(totals.avgSamplesPerVisit || 0);
  const completion = Number(totals.formCompletionRate || 0);
  const outOfRange = Number(totals.outOfRangeRate || 0);
  const totalVisits = Number(totals.totalVisits || 0);
  const outVisits = Number(totals.outOfRangeVisits || 0);
  const inVisits = Math.max(0, totalVisits - outVisits);

  const cards = [
    { title: 'الزيارات', value: totalVisits, tone: 'blue', icon: <IconRoute /> },
    { title: 'إجابات الاستمارة', value: totals.totalSamples ?? 0, tone: 'teal', icon: <IconForm /> },
    { title: 'المندوبون', value: totals.totalDelegates ?? 0, tone: 'slate', icon: <IconUsers /> },
    {
      title: 'متوسط الإجابات / زيارة',
      value: avg.toFixed(2),
      tone: 'blue',
      icon: <IconAverage />,
    },
    {
      title: 'عملاء مميزون',
      value: totals.uniqueCustomers ?? 0,
      tone: 'green',
      icon: <IconStar />,
    },
    {
      title: 'استكمال الاستمارة',
      value: `${completion}%`,
      hint: `${totals.completedVisits ?? 0} زيارة مكتملة`,
      tone: 'teal',
      icon: <IconCheck />,
    },
    { title: 'جوّه النطاق', value: inVisits, tone: 'green', icon: <IconInside /> },
    {
      title: 'برّه النطاق',
      value: `${outOfRange}%`,
      hint: `${outVisits} زيارة`,
      tone: 'amber',
      icon: <IconAlert />,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(card => (
        <Card key={card.title} {...card} />
      ))}
    </div>
  );
};

export default MetricsCards;
