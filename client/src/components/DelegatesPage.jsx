import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { EmptyState } from './Panel';

const STAT = 'text-center';

const DelegateCard = ({ delegate }) => {
  const totals = delegate.totals || {};

  return (
    <Link
      to={`/delegates/${encodeURIComponent(delegate.name)}`}
      className="group rounded-card border border-line bg-panel p-5 shadow-soft transition-shadow duration-200 hover:border-accent/40 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex items-center gap-3.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-base font-extrabold text-accent transition-colors group-hover:bg-accent group-hover:text-white">
          {String(delegate.name || '؟').trim().charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold text-ink">{delegate.name}</p>
          <p className="mt-0.5 text-[11px] text-muted">
            متوسط {(Number(totals.avgSamplesPerVisit || 0)).toFixed(2)} إجابة لكل زيارة
          </p>
        </div>
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0 text-muted transition-colors group-hover:text-accent"
        >
          <path d="M14 6l-6 6 6 6" />
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 border-t border-line pt-4">
        <div className={STAT}>
          <p className="text-base font-extrabold tabular-nums text-ink">{totals.totalVisits ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-muted">زيارة</p>
        </div>
        <div className={STAT}>
          <p className="text-base font-extrabold tabular-nums text-ink">{totals.uniqueCustomers ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-muted">عميل</p>
        </div>
        <div className={STAT}>
          <p className="text-base font-extrabold tabular-nums text-success">
            {totals.formCompletionRate ?? 0}%
          </p>
          <p className="mt-0.5 text-[11px] text-muted">استكمال</p>
        </div>
        <div className={STAT}>
          <p className="text-base font-extrabold tabular-nums text-choco">
            {totals.outOfRangeRate ?? 0}%
          </p>
          <p className="mt-0.5 text-[11px] text-muted">برّه النطاق</p>
        </div>
      </div>
    </Link>
  );
};

const DelegatesPage = () => {
  const { delegates } = useOutletContext();

  return (
    <>
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-ink">المندوبون</h2>
        <p className="mt-1 text-sm text-muted">
          {delegates.length
            ? 'اضغط على أي مندوب لعرض إحصائياته التفصيلية خلال الفترة المحددة'
            : 'لا يوجد مندوبون خلال الفترة المحددة'}
        </p>
      </div>

      {delegates.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {delegates.map(delegate => (
            <DelegateCard key={delegate.name} delegate={delegate} />
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-line bg-panel p-5 shadow-soft">
          <EmptyState />
        </div>
      )}
    </>
  );
};

export default DelegatesPage;
