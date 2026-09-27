import React, { useMemo, useState } from 'react';
import Panel from '../components/Panel';
import StatsRow from '../components/ui/StatsRow';
import RankBars from '../components/ui/RankBars';
import Table from '../components/ui/Table';
import { PageIntro, SectionState } from '../components/ui/Section';
import { useAnalyticsSection } from '../hooks/useAnalytics';
import { nf, pf, windowLabel } from '../utils/format';

const FLAG = (text, tone) => (
  <span
    className={`inline-block rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
      tone === 'danger' ? 'bg-danger-soft text-danger' : tone === 'warning' ? 'bg-choco-soft text-choco' : 'bg-panel-soft text-slate'
    }`}
  >
    {text}
  </span>
);

export default function CustomersPage() {
  const { data, loading, error, retry } = useAnalyticsSection('customers');
  const [query, setQuery] = useState('');
  const section = data?.data;

  const rows = useMemo(() => {
    const list = section?.list || [];
    if (!query.trim()) return list;
    const needle = query.trim().toLowerCase();
    return list.filter(
      customer =>
        customer.name.toLowerCase().includes(needle) ||
        (customer.areas || []).some(area => String(area).toLowerCase().includes(needle)) ||
        (customer.reps || []).some(rep => String(rep).toLowerCase().includes(needle))
    );
  }, [section, query]);

  const totals = section?.totals || {};

  const columns = [
    { key: 'name', label: 'العميل', render: row => <span className="font-semibold">{row.name}</span> },
    { key: 'visits', label: 'زيارات', numeric: true },
    { key: 'completionRate', label: 'الاكتمال', numeric: true, render: row => pf(row.completionRate) },
    { key: 'answers', label: 'إجابات', numeric: true },
    {
      key: 'outOfRange',
      label: 'خارج النطاق',
      numeric: true,
      render: row => (row.outOfRange ? FLAG(`${nf(row.outOfRange)} (${pf((row.outOfRange * 100) / (row.visits || 1))})`, 'warning') : '—'),
    },
    { key: 'notesCount', label: 'ملاحظات', numeric: true },
    {
      key: 'followUpCount',
      label: 'متابعة',
      numeric: true,
      render: row => (row.followUpCount ? FLAG(`${nf(row.followUpCount)}`, 'warning') : '—'),
    },
    {
      key: 'negativeCount',
      label: 'سالبة',
      numeric: true,
      render: row => (row.negativeCount ? FLAG(`${nf(row.negativeCount)}`, 'danger') : '—'),
    },
    {
      key: 'lastVisit',
      label: 'آخر زيارة',
      render: row => (
        <span className="text-[11.5px]">
          {row.lastVisit || '—'}
          {row.daysSinceLastVisit != null ? (
            <span className="ms-1 text-muted">({nf(row.daysSinceLastVisit)} يوم)</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'reps',
      label: 'مندوبوه',
      sortable: false,
      render: row => (row.reps?.length ? row.reps.join('، ') : '—'),
    },
    {
      key: 'areas',
      label: 'مناطق',
      sortable: false,
      render: row => (row.areas?.length ? row.areas.join('، ') : '—'),
    },
  ];

  return (
    <>
      <PageIntro
        title="تحليل العملاء"
        caption="من علاقة الزيارة بالعميل: التكرار، الانتظام، الاكتمال، وإشارات المتابعة من النص"
        meta={[
          { label: 'الفترة الفعلية', value: windowLabel(data?.window) },
          { label: 'عملاء ظهروا', value: nf(totals.customers) },
        ]}
      />

      <SectionState
        loading={loading && !section}
        error={error}
        onRetry={retry}
        isEmpty={!section?.list?.length}
        emptyText="لا يوجد عملاء مرتبطون بزيارات في هذه الفترة"
      >
        <div className="space-y-6">
          <StatsRow
            columns={5}
            items={[
              { key: 'all', label: 'إجمالي العملاء', value: totals.customers },
              { key: 'active', label: 'نشِطون (آخر 30 يوم)', value: totals.active, tone: 'success' },
              { key: 'inactive', label: 'غير نشِطين', value: totals.inactive, tone: 'neutral' },
              { key: 'follow', label: 'عندهم طلبات متابعة', value: totals.withFollowUp, tone: 'warning' },
              { key: 'negative', label: 'عندهم ملاحظات سالبة', value: totals.withNegativeNotes, tone: 'danger' },
            ]}
          />

          <Panel title="قائمة العملاء" subtitle="اضغط على رأس أي عمود للترتيب — كل قيمة محسوبة من زيارات الفترة">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="بحث بالاسم أو المنطقة أو المندوب"
                aria-label="بحث في العملاء"
                className="w-full max-w-sm rounded-xl border border-line bg-panel-soft px-3.5 py-2 text-[13px] text-ink outline-none transition focus:border-accent focus:bg-panel"
              />
              <span className="text-[12px] text-muted">
                {nf(rows.length)} من {nf(section.list.length)} عميل
              </span>
            </div>
            <Table columns={columns} rows={rows} initialSort={{ key: 'visits', dir: 'desc' }} />
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="الأكثر زيارة" subtitle="أعلى عشرة عملاء بعدد الزيارات">
              <RankBars
                rows={(section.mostVisited || []).map(row => ({ label: row.name, count: row.visits }))}
                unit="زيارة"
              />
            </Panel>
            <Panel title="الأقل زيارة" subtitle="أدنى عشرة عملاء — مرشحون للتغطية الأضعف">
              <RankBars
                rows={(section.leastVisited || []).map(row => ({ label: row.name, count: row.visits }))}
                unit="زيارة"
                tone="warning"
              />
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="عملاء يحتاجون متابعة" subtitle="استخراج من كلمات المتابعة في الملاحظات النصية">
              <FollowList rows={section.needingFollowUp} field="followUpCount" emptyText="لا توجد ملاحظات طلب متابعة" tone="warning" />
            </Panel>
            <Panel title="عملاء بملاحظات سالبة" subtitle="استخراج من كلمات الشكوى والسلبية في النص">
              <FollowList rows={section.negativeFeedback} field="negativeCount" emptyText="لا توجد ملاحظات سالبة" tone="danger" />
            </Panel>
          </div>

          <Panel title="سلوك غير معتاد" subtitle="إما كل زياراته خارج النطاق، أو زيارات بلا أي إجابة، أو غياب طويل">
            {section.unusual?.length ? (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.unusual.map(customer => (
                  <li key={customer.id} className="rounded-xl border border-line bg-panel-soft p-3.5">
                    <p className="text-[13px] font-bold text-ink">{customer.name}</p>
                    <p className="mt-1 text-[11.5px] text-muted">
                      {nf(customer.visits)} زيارة · {nf(customer.answers)} إجابة
                      {customer.lastVisit ? ` · آخرها ${customer.lastVisit}` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {customer.allOutOfRange ? FLAG('كل الزيارات خارج النطاق', 'danger') : null}
                      {customer.noAnswers ? FLAG('زيارات بلا إجابات', 'warning') : null}
                      {customer.daysSinceLastVisit != null && customer.daysSinceLastVisit > 60
                        ? FLAG(`غياب ${nf(customer.daysSinceLastVisit)} يوم`, 'neutral')
                        : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-[12px] text-muted">لا يوجد سلوك غير معتاد في هذه الفترة</p>
            )}
          </Panel>
        </div>
      </SectionState>
    </>
  );
}

function FollowList({ rows = [], field, emptyText, tone }) {
  if (!rows.length) return <p className="py-6 text-center text-[12px] text-muted">{emptyText}</p>;
  return (
    <ul className="space-y-2">
      {rows.map(row => (
        <li key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel-soft px-3.5 py-2.5">
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink">{row.name}</span>
          <span className="shrink-0 text-[11.5px] text-muted">
            {nf(row.visits)} زيارة · {nf(row.notesCount)} ملاحظة
          </span>
          {FLAG(nf(row[field]), tone)}
        </li>
      ))}
    </ul>
  );
}
