import React from 'react';
import Panel from '../components/Panel';
import StatsRow from '../components/ui/StatsRow';
import RankBars from '../components/ui/RankBars';
import GeoMap from '../components/ui/GeoMap';
import Table from '../components/ui/Table';
import { PageIntro, SectionState } from '../components/ui/Section';
import { useAnalyticsSection } from '../hooks/useAnalytics';
import { nf, pf, windowLabel } from '../utils/format';

const FLAG = (text, tone) => (
  <span
    className={`inline-block rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
      tone === 'danger'
        ? 'bg-danger-soft text-danger'
        : tone === 'warning'
          ? 'bg-choco-soft text-choco'
          : tone === 'teal'
            ? 'bg-teal-soft text-teal'
            : 'bg-panel-soft text-slate'
    }`}
  >
    {text}
  </span>
);

export default function GeographyPage() {
  const { data, loading, error, retry } = useAnalyticsSection('geography');
  const section = data?.data;

  const coverage = section?.coverage || {};
  const outOfRange = section?.outOfRange || {};
  const areas = section?.areas || [];

  const columns = [
    {
      key: 'area',
      label: 'المنطقة',
      render: row => (
        <span className="block max-w-[220px] truncate font-semibold" title={row.area}>
          {row.area || '—'}
        </span>
      ),
    },
    { key: 'visits', label: 'زيارات', numeric: true },
    { key: 'percentage', label: 'نسبة', numeric: true, render: row => pf(row.percentage) },
    { key: 'customers', label: 'عملاء', numeric: true },
    {
      key: 'reps',
      label: 'عدد المندوبين',
      numeric: true,
      sortValue: row => row.reps?.length ?? 0,
      render: row => nf(row.reps?.length ?? 0),
    },
    { key: 'answers', label: 'إجابات', numeric: true },
    {
      key: 'outOfRange',
      label: 'خارج النطاق',
      numeric: true,
      render: row =>
        row.outOfRange
          ? FLAG(`${nf(row.outOfRange)} (${pf(row.outOfRangeRate)})`, 'warning')
          : '—',
    },
    {
      key: 'flags',
      label: 'علامة',
      sortable: false,
      render: row => {
        const marks = [];
        if (row.underCovered) marks.push(<li key='under'>{FLAG('تغطية ضعيفة', 'warning')}</li>);
        if (row.repeatHeavy) marks.push(<li key='repeat'>{FLAG('زيارات متكررة', 'teal')}</li>);
        return marks.length ? (
          <ul className="flex flex-wrap gap-1.5">{marks}</ul>
        ) : (
          <span className="text-[11.5px] text-muted">—</span>
        );
      },
    },
  ];

  return (
    <>
      <PageIntro
        title="التغطية الجغرافية"
        caption="أين تُنفَّذ الزيارات فعلياً: المناطق المحسوبة من الإحداثيات والعنوان، التغطية، والخروج عن النطاق"
        meta={[
          { label: 'الفترة الفعلية', value: windowLabel(data?.window) },
          { label: 'مناطق محسوبة', value: nf(coverage.areas) },
          { label: 'زيارات بلا موقع', value: nf(coverage.unlocatedVisits) },
        ]}
      />

      <SectionState
        loading={loading && !section}
        error={error}
        onRetry={retry}
        isEmpty={!areas.length}
        emptyText="لا توجد زيارات يمكن إسنادها إلى منطقة في هذه الفترة"
      >
        <div className="space-y-6">
          <StatsRow
            columns={5}
            items={[
              {
                key: 'areas',
                label: 'مناطق محسوبة',
                value: coverage.areas,
                hint: `${nf(section.points?.length ?? 0)} نقطة تُرسم (حتى 4000 نقطة)`,
              },
              {
                key: 'located',
                label: 'نقاط بإحداثيات صالحة',
                value: coverage.locatedVisits,
                tone: 'teal',
                hint: 'إحداثيات رقمية في مداها الصحيح وليست صفراً',
              },
              {
                key: 'share',
                label: 'نسبة المواقع الصالحة',
                value: coverage.locatedShare,
                suffix: '%',
                progress: coverage.locatedShare,
                tone: coverage.locatedShare >= 70 ? 'success' : 'warning',
                hint: `${pf(coverage.locatedShare)} من زيارات الفترة`,
              },
              {
                key: 'unlocated',
                label: 'زيارات بلا موقع',
                value: coverage.unlocatedVisits,
                tone: coverage.unlocatedVisits ? 'danger' : 'neutral',
                hint: 'لم تُسجَّل لها إحداثيات صالحة',
              },
              {
                key: 'out',
                label: 'زيارات خارج النطاق',
                value: outOfRange.total,
                progress: outOfRange.rate,
                tone: 'danger',
                hint: `${pf(outOfRange.rate)} من إجمالي الزيارات`,
              },
            ]}
          />

          <Panel
            title="خريطة الزيارات"
            subtitle="الفقاقيع الأكبر هي خلايا تكرّرت فيها الزيارات على الموقع نفسه، واللون يفرّق بين نقاط جوّه النطاق ونقاط برّاه"
          >
            <GeoMap points={section.points || []} density={section.density || []} height={420} />
          </Panel>

          <Panel
            title="المناطق بالتفصيل"
            subtitle="اسم المنطقة يأتي من نص العنوان؛ وزيارة بلا عنوان تُجمَّع مع خليتها الإحداثية التقريبية تحت «منطقة (…)»"
          >
            <Table columns={columns} rows={areas} initialSort={{ key: 'visits', dir: 'desc' }} />
          </Panel>

          <Panel
            title="أكثر المناطق خروجاً عن النطاق"
            subtitle="النسبة المعروضة هي نصيب الزيارات الخارجة من إجمالي زيارات المنطقة نفسها"
          >
            <RankBars
              rows={(outOfRange.byArea || []).map(row => ({
                label: row.area,
                count: row.count,
                percentage: row.rate,
              }))}
              unit="زيارة"
              tone="danger"
              emptyText="لا توجد زيارات خارج النطاق في هذه الفترة"
            />
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="مناطق بتغطية ضعيفة"
              subtitle="زيارات المنطقة أقل من نصف متوسط زيارات المناطق — حساب من الإحداثيات ونص العنوان المسجل، والنسبة من زيارات الفترة"
            >
              <AreaList
                rows={section.gaps || []}
                emptyText="لا توجد منطقة بتغطية أقل من نصف المتوسط"
                tone="warning"
              />
            </Panel>
            <Panel
              title="مناطق بتكرار زيارات مرتفع"
              subtitle="متوسط الزيارات لكل عميل داخل المنطقة أعلى من 1.5 — حساب من الإحداثيات ونص العنوان المسجل، والنسبة من زيارات الفترة"
            >
              <AreaList
                rows={section.repeatHeavy || []}
                emptyText="لا توجد منطقة بتكرار زيارات ملحوظ في هذه الفترة"
                tone="teal"
                showRatio
              />
            </Panel>
          </div>
        </div>
      </SectionState>
    </>
  );
}

function AreaList({ rows = [], emptyText, tone, showRatio = false }) {
  if (!rows.length) {
    return <p className="py-6 text-center text-[12px] text-muted">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2">
      {rows.map(row => (
        <li
          key={row.area}
          className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel-soft px-3.5 py-2.5"
        >
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink" title={row.area}>
            {row.area || '—'}
          </span>
          <span className="shrink-0 text-[11.5px] text-muted tabular-nums">
            {nf(row.visits)} زيارة · {nf(row.customers)} عميل
            {showRatio && row.customers
              ? ` · ${nf(Math.round((row.visits / row.customers) * 10) / 10)} زيارة لكل عميل`
              : ''}
          </span>
          {FLAG(pf(row.percentage), tone)}
        </li>
      ))}
    </ul>
  );
}
