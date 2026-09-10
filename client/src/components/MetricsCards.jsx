import React from 'react';

const cardClass = 'bg-white rounded-lg shadow p-4';

function Card({ title, value, hint }) {
  return (
    <div className={cardClass}>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const MetricsCards = ({ data }) => {
  const totals = data || {};
  const avg = Number(totals.avgSamplesPerVisit || 0);
  const completion = Number(totals.formCompletionRate || 0);
  const outOfRange = Number(totals.outOfRangeRate || 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card title="إجمالي الزيارات" value={totals.totalVisits ?? 0} />
      <Card title="إجمالي الإجابات" value={totals.totalSamples ?? 0} hint="إجابات استمارة الزيارة" />
      <Card title="عدد المندوبين" value={totals.totalDelegates ?? 0} />
      <Card title="متوسط الإجابات لكل زيارة" value={avg.toFixed(2)} />
      <Card title="عملاء مميزون" value={totals.uniqueCustomers ?? 0} />
      <Card
        title="نسبة استكمال الاستمارة"
        value={`${completion}%`}
        hint={`${totals.completedVisits ?? 0} زيارة فيها إجابات`}
      />
      <Card
        title="نسبة برّه النطاق"
        value={`${outOfRange}%`}
        hint={`${totals.outOfRangeVisits ?? 0} زيارة خارج النطاق`}
      />
    </div>
  );
};

export default MetricsCards;
