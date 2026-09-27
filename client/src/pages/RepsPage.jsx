import React from 'react';
import { Link } from 'react-router-dom';
import StatsRow from '../components/ui/StatsRow';
import Delta from '../components/ui/Delta';
import TrendChart from '../components/ui/TrendChart';
import { PageIntro, SectionState } from '../components/ui/Section';
import { useAnalyticsSection } from '../hooks/useAnalytics';
import { tokens } from '../theme/chartTheme';
import { nf, pf, windowLabel } from '../utils/format';

export default function RepsPage() {
  const { data, loading, error, retry } = useAnalyticsSection('salesReps');
  const section = data?.data;
  const list = section?.list || [];
  const totals = section?.totals || {};

  return (
    <>
      <PageIntro
        title="المندوبون"
        caption="مؤشرات موضوعية محسوبة من الزيارات والمسوحات — بدون ترتيب أو تقدير أداء"
        meta={[
          { label: 'الفترة الفعلية', value: windowLabel(data?.window) },
          { label: 'مندوبون ظهروا', value: nf(totals.reps) },
        ]}
      />

      <SectionState
        loading={loading && !section}
        error={error}
        onRetry={retry}
        isEmpty={!list.length}
        emptyText="لا توجد زيارات مرتبطة بمندوبين في هذه الفترة"
      >
        <div className="space-y-6">
          <StatsRow
            columns={4}
            items={[
              { key: 'reps', label: 'عدد المندوبين', value: totals.reps },
              { key: 'avg', label: 'متوسط الزيارات لكل مندوب', value: totals.avgVisitsPerRep, tone: 'teal' },
              {
                key: 'completion',
                label: 'متوسط معدل الاكتمال',
                value: totals.avgCompletionRate,
                suffix: '%',
                progress: totals.avgCompletionRate,
                tone: totals.avgCompletionRate >= 70 ? 'success' : 'warning',
              },
              {
                key: 'out',
                label: 'متوسط الزيارات خارج النطاق',
                value: totals.avgOutOfRangeRate,
                suffix: '%',
                progress: totals.avgOutOfRangeRate,
                tone: totals.avgOutOfRangeRate > 15 ? 'danger' : 'neutral',
              },
            ]}
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map(rep => (
              <RepCard key={rep.id} rep={rep} />
            ))}
          </div>
        </div>
      </SectionState>
    </>
  );
}

function RepCard({ rep }) {
  const href = `/reps/${encodeURIComponent(rep.name)}`;
  const completionTone =
    rep.completionRate >= 70 ? 'success' : rep.completionRate >= 40 ? 'warning' : 'danger';

  return (
    <Link
      to={href}
      className="group flex flex-col rounded-card border border-line bg-panel p-4 shadow-soft transition-all hover:border-accent/40 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-extrabold text-ink">{rep.name}</p>
          <p className="mt-0.5 text-[11.5px] text-muted">
            {nf(rep.uniqueCustomers)} عميل · {nf(rep.areas.length)} منطقة
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-bold text-accent tabular-nums">
          {nf(rep.visits)} زيارة
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Cell label="الاكتمال" value={pf(rep.completionRate)} tone={completionTone} />
        <Cell label="خارج النطاق" value={pf(rep.outOfRangeRate)} tone={rep.outOfRangeRate > 15 ? 'danger' : 'neutral'} />
        <Cell label="إجابات" value={nf(rep.answers)} tone="neutral" />
        <Cell label="أسئلة مُجاب عنها" value={`${nf(rep.questionsAnswered)}`} tone="neutral" />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold text-muted">النشاط الأسبوعي</p>
          <Delta value={rep.activityTrend?.changePercentage} />
        </div>
        {rep.activitySeries?.length ? (
          <TrendChart series={rep.activitySeries} granularity="week" height={122} fill color={tokens.blue} label="زيارة" />
        ) : (
          <p className="mt-2 text-[11.5px] text-muted">لا يوجد نشاط زمني كافٍ لحساب اتجاه</p>
        )}
      </div>

      {rep.mostCommonAnswers?.length ? (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-[11px] font-bold text-muted">أكثر إجابات تكراراً</p>
          <ul className="mt-1.5 space-y-1">
            {rep.mostCommonAnswers.slice(0, 2).map(item => (
              <li key={`${item.question}-${item.option}`} className="truncate text-[11.5px] text-ink">
                <span className="text-muted">{item.question}: </span>
                {item.option}
                <span className="ms-1 text-slate tabular-nums">
                  ({nf(item.count)} · {pf(item.percentage)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <span className="mt-3.5 inline-flex items-center gap-1 text-[12px] font-bold text-accent group-hover:text-accent-hover">
        إحصائيات المندوب الكاملة
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 6l-6 6 6 6" />
        </svg>
      </span>
    </Link>
  );
}

function Cell({ label, value, tone }) {
  const palette =
    tone === 'danger'
      ? 'text-danger'
      : tone === 'warning'
        ? 'text-choco'
        : tone === 'success'
          ? 'text-success'
          : 'text-ink';
  return (
    <div className="rounded-lg bg-panel-soft px-2.5 py-2">
      <p className="text-[10.5px] font-semibold text-muted">{label}</p>
      <p className={`mt-0.5 text-[13.5px] font-extrabold tabular-nums ${palette}`}>{value}</p>
    </div>
  );
}
