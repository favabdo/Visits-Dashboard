import React, { useState } from 'react';
import Panel from '../components/Panel';
import StatsRow from '../components/ui/StatsRow';
import RankBars from '../components/ui/RankBars';
import Table from '../components/ui/Table';
import Segmented from '../components/ui/Segmented';
import { PageIntro, SectionState } from '../components/ui/Section';
import { useAnalyticsSection } from '../hooks/useAnalytics';
import { nf, pf, windowLabel } from '../utils/format';

const SEVERITY_LABELS = { high: 'حرج', medium: 'متوسط', low: 'منخفض' };

const SEVERITY_FILTERS = [
  { key: 'all', label: 'كل المستويات' },
  { key: 'high', label: 'حرج' },
  { key: 'medium', label: 'متوسط' },
  { key: 'low', label: 'منخفض' },
];

const FIELD_LABELS = {
  withCoordinates: 'إحداثيات صالحة',
  withAddress: 'عنوان',
  withStatus: 'قيمة حالة',
  withValidDate: 'تاريخ صالح',
  withCustomer: 'عميل مرتبط',
  withRep: 'مندوب مرتبط',
};

function SeverityBadge({ severity }) {
  const palette =
    severity === 'high'
      ? 'bg-danger-soft text-danger'
      : severity === 'medium'
        ? 'bg-choco-soft text-choco'
        : 'bg-panel-soft text-slate';
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${palette}`}>
      {SEVERITY_LABELS[severity] || severity}
    </span>
  );
}

export default function QualityPage() {
  const { data, loading, error, retry } = useAnalyticsSection('quality');
  const [severity, setSeverity] = useState('all');
  const [open, setOpen] = useState(null);
  const section = data?.data;
  const issues = section?.issues || [];
  const summary = section?.summary || {};

  const visible = issues.filter(issue => severity === 'all' || issue.severity === severity);
  const openIssue = open ? visible.find(item => item.code === open) : null;
  const completenessRows = Object.entries(summary.completeness || {}).map(([key, value]) => ({
    label: FIELD_LABELS[key] || key,
    count: value,
    percentage: value,
  }));

  return (
    <>
      <PageIntro
        title="جودة البيانات"
        caption="المشاكل تُعرض كما هي — أي مؤشر أعلاه يعتمد على حقول بها خلل يظهر هنا كملاحظة مستقلة"
        meta={[
          { label: 'الفترة الفعلية', value: windowLabel(data?.window) },
          { label: 'أنواع المشاكل', value: nf(summary.issueTypes) },
          { label: 'سجلات متأثرة', value: nf(summary.affectedRecords) },
        ]}
      />

      <SectionState
        loading={loading && !section}
        error={error}
        onRetry={retry}
        isEmpty={!issues.length}
        emptyText="لم تُرصد أي مشكلة جودة بيانات في هذه الفترة"
      >
        <div className="space-y-6">
          <StatsRow
            columns={4}
            items={[
              { key: 'types', label: 'أنواع المشاكل', value: summary.issueTypes, tone: 'neutral' },
              {
                key: 'high',
                label: 'أنواع حرجة',
                value: summary.highSeverityTypes,
                tone: summary.highSeverityTypes ? 'danger' : 'success',
                badge: summary.highSeverityTypes ? 'يحتاج معالجة' : null,
              },
              { key: 'records', label: 'سجلات متأثرة', value: summary.affectedRecords, tone: 'warning' },
              {
                key: 'worst',
                label: 'أضعف حقل اكتمال',
                value:
                  completenessRows.length === 0
                    ? '—'
                    : (() => {
                        const weakest = completenessRows.slice().sort((a, b) => a.count - b.count)[0];
                        return `${weakest.label} ${pf(weakest.count)}`;
                      })(),
                tone: 'neutral',
                hint: 'نسبة الزيارات التي بها هذا الحقل صالحاً',
              },
            ]}
          />

          <Panel
            title="نسب اكتمال الحقول"
            subtitle="كل نسبة محسوبة من عدد الزيارات في الفترة، والحقول المستخرجة من الزيارة نفسها"
          >
            <RankBars rows={completenessRows} unit="%" tone="teal" emptyText="لا توجد زيارات محسوبة" />
          </Panel>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented
              options={SEVERITY_FILTERS}
              value={severity}
              onChange={setSeverity}
              ariaLabel="تصفية حسب مستوى الخطورة"
            />
            <span className="text-[12px] text-muted">
              {nf(visible.length)} من {nf(issues.length)} نوع مشكلة
            </span>
          </div>

          <Panel
            title="مشاكل التفاصيل"
            subtitle="اضغط على أي صف لعرض أمثلة السجلات — الأرقام المرجعية تظهر هنا فقط لأن الغرض هو الإصلاح في مصدر البيانات"
          >
            <Table
              columns={[
                {
                  key: 'label',
                  label: 'المشكلة',
                  render: row => <span className="font-semibold">{row.label}</span>,
                },
                {
                  key: 'severity',
                  label: 'الخطورة',
                  sortValue: row => ({ high: 3, medium: 2, low: 1 })[row.severity] || 0,
                  render: row => <SeverityBadge severity={row.severity} />,
                },
                { key: 'count', label: 'عدد السجلات', numeric: true },
                {
                  key: 'technical',
                  label: 'الحقل في المصدر',
                  sortable: false,
                  render: row => <span className="text-[11.5px] text-muted">{row.technical}</span>,
                },
                {
                  key: 'examples',
                  label: 'أمثلة',
                  sortable: false,
                  render: row => (
                    <button
                      type="button"
                      onClick={() => setOpen(open === row.code ? null : row.code)}
                      className="rounded-lg border border-line bg-panel-soft px-2.5 py-1 text-[11px] font-bold text-ink transition-colors hover:border-accent hover:text-accent"
                    >
                      {open === row.code ? 'إخفاء' : `عرض ${nf(row.examples.length)}`}
                    </button>
                  ),
                },
              ]}
              rows={visible}
              initialSort={{ key: 'count', dir: 'desc' }}
            />
            {openIssue ? (
              <div className="mt-4 rounded-xl border border-line bg-panel-soft p-4">
                <p className="text-[12.5px] font-bold text-ink">
                  {openIssue.label} — {nf(openIssue.count)} سجل
                </p>
                <p className="mt-1 text-[11.5px] text-muted">مرجع المصدر: {openIssue.technical}</p>
                {openIssue.examples.length ? (
                  <ul className="mt-3 space-y-1.5">
                    {openIssue.examples.map((example, index) => (
                      <li key={`${example}-${index}`} className="rounded-lg bg-panel px-3 py-2 text-[12px] text-ink">
                        {example}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[11.5px] text-muted">لا توجد أمثلة قابلة للعرض</p>
                )}
              </div>
            ) : null}
          </Panel>
        </div>
      </SectionState>
    </>
  );
}
