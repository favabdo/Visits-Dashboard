import React from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import MetricsCards, { totalsCards } from './MetricsCards';
import VisitChart from './VisitChart';
import QuestionCharts from './QuestionCharts';
import ExecutiveKpis from './ExecutiveKpis';
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
      <ExecutiveKpis kpis={delegate.kpis} totals={delegate.totals} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="التغطية الجغرافية">
          <dl className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-panel-soft p-3">
              <dt className="text-[11px] text-muted">نقاط مصوَّرة</dt>
              <dd className="mt-1 text-lg font-extrabold tabular-nums text-ink">
                {delegate.coverage?.points ?? 0}
              </dd>
            </div>
            <div className="rounded-xl bg-panel-soft p-3">
              <dt className="text-[11px] text-muted">اتساع النطاق</dt>
              <dd className="mt-1 text-lg font-extrabold tabular-nums text-ink">
                {delegate.coverage?.spanKm ?? 0} كم
              </dd>
            </div>
            <div className="rounded-xl bg-panel-soft p-3">
              <dt className="text-[11px] text-muted">برّه النطاق</dt>
              <dd className="mt-1 text-lg font-extrabold tabular-nums text-choco">
                {delegate.totals.outOfRangeVisits ?? 0}
              </dd>
            </div>
          </dl>
        </Panel>
        <Panel title="أعلى الإجابات">
          {delegate.kpis?.topAnswers?.length ? (
            <ul className="divide-y divide-line/70">
              {delegate.kpis.topAnswers.map((answer, index) => (
                <li key={`${answer.question}-${answer.option}`} className="flex items-center gap-2.5 py-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-accent-soft text-[10px] font-bold text-accent">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{answer.option}</span>
                  <span className="shrink-0 text-[11px] text-muted">{answer.question}</span>
                  <span className="w-14 shrink-0 text-end text-[12px] font-bold tabular-nums text-ink">
                    {answer.value} · {answer.percentage}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState text="لا توجد إجابات مسجَّلة" />
          )}
        </Panel>
      </div>
      <VisitChart chartData={delegate.visitTrend} />
      <QuestionCharts questions={delegate.questions} />
      <GeoChart chartData={delegate.geoData} title="زيارات المندوب حسب النطاق" />
      <NotesTable notes={delegate.notes} title={`ملاحظات ${delegate.name}`} />
    </div>
  );
};

export default DelegateStatsPage;
