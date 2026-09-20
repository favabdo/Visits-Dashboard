import React from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import MetricsCards, { totalsCards } from './MetricsCards';
import VisitChart from './VisitChart';
import SamplesChart from './SamplesChart';
import GeoChart from './GeoChart';
import NotesTable from './NotesTable';
import Panel, { EmptyState } from './Panel';

const DelegateStatsPage = () => {
  const { delegates } = useOutletContext();
  const navigate = useNavigate();
  const { name: paramName } = useParams();
  const name = paramName ? decodeURIComponent(paramName) : '';

  const delegate = (delegates || []).find(item => item.name === name);

  if (!delegate) {
    return (
      <Panel>
        <EmptyState text="لم يتم العثور على إحصائيات هذا المندوب في الفترة المحددة" />
        <div className="mt-4 text-center">
          <Link to="/delegates" className="text-sm font-bold text-accent hover:underline">
            العودة إلى قائمة المندوبين
          </Link>
        </div>
      </Panel>
    );
  }

  const cards = totalsCards(delegate.totals).filter(card => card.title !== 'المندوبون');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="العودة"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-panel text-muted shadow-soft transition-colors hover:border-accent/40 hover:text-accent"
          >
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
              className="rotate-180"
            >
              <path d="M14 6l-6 6 6 6" />
            </svg>
          </button>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-base font-extrabold text-white shadow-glow">
            {String(delegate.name).trim().charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted">إحصائيات المندوب</p>
            <h2 className="truncate text-xl font-extrabold tracking-tight text-ink">
              {delegate.name}
            </h2>
          </div>
        </div>
        <Link
          to="/delegates"
          className="rounded-full border border-line bg-panel px-3.5 py-1.5 text-xs font-semibold text-muted shadow-soft transition-colors hover:border-accent/40 hover:text-accent"
        >
          كل المندوبين
        </Link>
      </div>

      <MetricsCards cards={cards} />
      <VisitChart chartData={delegate.visitTrend} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SamplesChart chartData={delegate.ratingDistribution} title="تقييم مساحة العرض" />
        <SamplesChart chartData={delegate.competitorDistribution} title="وجود منتجات منافسة" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SamplesChart chartData={delegate.stockoutItems} title="أصناف نفدت" />
        <GeoChart chartData={delegate.geoData} title="زيارات المندوب حسب النطاق" />
      </div>
      <NotesTable notes={delegate.notes} title={`ملاحظات ${delegate.name}`} />
    </div>
  );
};

export default DelegateStatsPage;
