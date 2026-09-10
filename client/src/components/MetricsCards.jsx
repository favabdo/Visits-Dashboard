import React from 'react';

function Card({ title, value, hint, warn }) {
  return (
    <div className="bg-panel border border-line rounded-sm p-4">
      <h3 className="text-xs text-muted">{title}</h3>
      <p
        className={`text-[1.65rem] font-semibold mt-2 leading-none tabular-nums ${
          warn ? 'text-choco' : 'text-ink'
        }`}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-muted mt-2">{hint}</p>}
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

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card title="الزيارات" value={totalVisits} />
      <Card title="إجابات الاستمارة" value={totals.totalSamples ?? 0} />
      <Card title="المندوبون" value={totals.totalDelegates ?? 0} />
      <Card title="متوسط الإجابات / زيارة" value={avg.toFixed(2)} />
      <Card title="عملاء مميزون" value={totals.uniqueCustomers ?? 0} />
      <Card
        title="استكمال الاستمارة"
        value={`${completion}%`}
        hint={`${totals.completedVisits ?? 0} زيارة مكتملة`}
      />
      <Card title="جوّه النطاق" value={inVisits} />
      <Card
        title="برّه النطاق"
        value={`${outOfRange}%`}
        hint={`${outVisits} زيارة`}
        warn
      />
    </div>
  );
};

export default MetricsCards;
