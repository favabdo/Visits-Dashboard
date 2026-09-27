import React, { useState } from 'react';
import Panel from '../components/Panel';
import StatsRow from '../components/ui/StatsRow';
import RankBars from '../components/ui/RankBars';
import TrendChart from '../components/ui/TrendChart';
import Delta from '../components/ui/Delta';
import Segmented from '../components/ui/Segmented';
import Table from '../components/ui/Table';
import { PageIntro, SectionState } from '../components/ui/Section';
import { useAnalyticsSection } from '../hooks/useAnalytics';
import { nf, pf, windowLabel } from '../utils/format';

const GRAINS = [
  { key: 'daily', label: 'يومي' },
  { key: 'weekly', label: 'أسبوعي' },
  { key: 'monthly', label: 'شهري' },
];

const GRAIN_LABEL = { daily: 'day', weekly: 'week', monthly: 'month' };

export default function VisitsPage() {
  const { data, loading, error, retry } = useAnalyticsSection('visits');
  const [grain, setGrain] = useState('daily');
  const section = data?.data;

  const totals = section?.totals || {};
  const missing = section?.missingData || {};
  const change = section ? section[`${grain}Change`] : null;

  return (
    <>
      <PageIntro
        title="تحليل الزيارات"
        caption="كل ما يمكن استنتاجه من جدول الزيارات وعلاقاته بالعملاء والمندوبين والمناطق"
        meta={[
          { label: 'الفترة الفعلية', value: windowLabel(data?.window) },
          { label: 'زيارات', value: nf(totals.visits) },
        ]}
      />

      <SectionState loading={loading && !section} error={error} onRetry={retry} isEmpty={!section?.daily?.length} emptyText="لا توجد زيارات في هذه الفترة">
        <div className="space-y-6">
          <StatsRow
            columns={5}
            items={[
              { key: 'visits', label: 'الزيارات', value: totals.visits, hint: `${nf(totals.answers)} إجابة` },
              {
                key: 'completed',
                label: 'زيارات مكتملة',
                value: totals.completedVisits,
                tone: 'success',
                progress: totals.completionRate,
                hint: `${pf(totals.completionRate)} من الإجمالي`,
              },
              {
                key: 'pending',
                label: 'زيارات معلّقة',
                value: totals.pendingVisits,
                tone: 'warning',
                hint: totals.statusUnknownVisits ? `${nf(totals.statusUnknownVisits)} بلا حالة صالحة` : 'الحالة متاحة لكل زيارة',
              },
              {
                key: 'out',
                label: 'خارج النطاق',
                value: totals.outOfRangeVisits,
                tone: 'danger',
                progress: totals.outOfRangeRate,
                hint: pf(totals.outOfRangeRate),
              },
              {
                key: 'per',
                label: 'متوسط الإجابات لكل زيارة',
                value: totals.answersPerVisit,
                tone: 'teal',
                hint: `معدل استجابة ${pf(totals.responseRate)}`,
              },
            ]}
          />

          <Panel
            title="الإيقاع الزمني للزيارات"
            subtitle="تُحسب الفترة من تاريخ الزيارة نفسه، والتغيير بين نصفي المدى الزمني للبيانات"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Segmented options={GRAINS} value={grain} onChange={setGrain} ariaLabel="دقة الزمن" />
              <Delta value={change?.changePercentage} hint={`${nf(change?.first ?? 0)} ← ${nf(change?.second ?? 0)}`} />
            </div>
            <TrendChart
              series={section[grain] || []}
              granularity={GRAIN_LABEL[grain]}
              height={300}
              label="زيارة"
            />
          </Panel>

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel title="الزيارات حسب المندوب">
              <RankBars rows={section.byRep} unit="زيارة" limit={10} />
            </Panel>
            <Panel title="الزيارات حسب العميل">
              <RankBars rows={section.byCustomer} unit="زيارة" tone="teal" limit={10} />
            </Panel>
            <Panel title="الزيارات حسب المنطقة">
              <RankBars rows={section.byArea} unit="زيارة" tone="warning" limit={10} />
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="توزيع الزيارات على أيام الأسبوع" subtitle="يكشف أنماط المواعيد الميدانية">
              <RankBars rows={section.weekdayDistribution} unit="زيارة" tone="accent" />
            </Panel>
            <Panel title="تكرار الزيارة لكل عميل" subtitle="كم زيارة حصل عليها العميل الواحد">
              <RankBars rows={section.frequencyDistribution} unit="عميل" tone="teal" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MiniStat label="عملاء تكررت زياراتهم" value={nf(section.repeatCustomers)} />
                <MiniStat label="زيارات متكررة لنفس العميل في يوم" value={nf(section.sameDayRepeatVisits)} tone="warning" />
                <MiniStat label="سجلات مكررة بنفس المُعرِّف" value={nf(section.duplicateVisits)} tone={section.duplicateVisits ? 'danger' : 'neutral'} />
                <MiniStat label="متوسط مدة الزيارة" value={section.avgVisitMinutes == null ? 'غير محسوبة' : `${nf(section.avgVisitMinutes)} دقيقة`} tone="neutral" />
              </div>
            </Panel>
          </div>

          <Panel title="بيانات ناقصة داخل الزيارات" subtitle="ما الذي ينقص الجدول نفسه، لا ما ينقص التحليل">
            <Table
              dense
              rows={[
                { key: 'coords', field: 'الحقل', missing: missing.withoutCoordinates, label: 'بلا إحداثيات صالحة' },
                { key: 'address', field: 'العنوان', missing: missing.withoutAddress, label: 'بلا عنوان' },
                { key: 'status', field: 'الحالة', missing: missing.withoutStatus, label: 'بلا قيمة حالة' },
                { key: 'answers', field: 'الإجابات', missing: missing.withoutAnswers, label: 'بلا أي إجابة' },
              ].map(row => ({ ...row, share: totals.visits ? (row.missing * 100) / totals.visits : 0 }))}
              columns={[
                { key: 'label', label: 'النقص', render: row => row.label },
                { key: 'missing', label: 'عدد الزيارات', numeric: true, render: row => nf(row.missing) },
                { key: 'share', label: 'نسبتها', numeric: true, render: row => pf(row.share) },
              ]}
              initialSort={{ key: 'missing', dir: 'desc' }}
            />
          </Panel>
        </div>
      </SectionState>
    </>
  );
}

function MiniStat({ label, value, tone = 'accent' }) {
  const palette =
    tone === 'danger'
      ? 'text-danger'
      : tone === 'warning'
        ? 'text-choco'
        : tone === 'neutral'
          ? 'text-slate'
          : 'text-ink';
  return (
    <div className="rounded-xl border border-line bg-panel-soft p-3">
      <p className="text-[11px] font-semibold text-muted">{label}</p>
      <p className={`mt-1 text-[16px] font-extrabold tabular-nums ${palette}`}>{value}</p>
    </div>
  );
}
