import React, { useMemo, useState } from 'react';
import Panel from '../components/Panel';
import CrossMatrix from '../components/ui/CrossMatrix';
import Segmented from '../components/ui/Segmented';
import Table from '../components/ui/Table';
import { PageIntro, SectionState } from '../components/ui/Section';
import { useAnalyticsSection } from '../hooks/useAnalytics';
import { nf, windowLabel } from '../utils/format';

const MODES = [
  { key: 'questionByRep', label: 'سؤال × مندوب' },
  { key: 'questionByArea', label: 'سؤال × منطقة' },
  { key: 'questionByCustomer', label: 'سؤال × عميل' },
  { key: 'optionByRep', label: 'خيار × مندوب' },
  { key: 'optionByArea', label: 'خيار × منطقة' },
];

const CONFIG = {
  questionByRep: {
    title: 'تقاطع الأسئلة مع المندوبين',
    source: 'questionByRep',
    parts: 'reps',
    labelOf: row => row.question,
    caption: 'كل صف سؤال من الاستبيان، وكل عمود مندوب',
  },
  questionByArea: {
    title: 'تقاطع الأسئلة مع المناطق',
    source: 'questionByArea',
    parts: 'areas',
    labelOf: row => row.question,
    caption: 'كل صف سؤال من الاستبيان، وكل عمود منطقة محسوبة من الموقع',
  },
  questionByCustomer: {
    title: 'تقاطع الأسئلة مع العملاء',
    source: 'questionByCustomer',
    parts: 'customers',
    labelOf: row => row.question,
    caption: 'كل صف سؤال من الاستبيان، وكل عمود عميل',
  },
  optionByRep: {
    title: 'تقاطع الخيارات مع المندوبين',
    source: 'optionByRep',
    parts: 'reps',
    labelOf: row => `${row.option} — ${row.question}`,
    caption: 'كل صف خيار داخل سؤاله، وكل عمود مندوب',
  },
  optionByArea: {
    title: 'تقاطع الخيارات مع المناطق',
    source: 'optionByArea',
    parts: 'areas',
    labelOf: row => `${row.option} — ${row.question}`,
    caption: 'كل صف خيار داخل سؤاله، وكل عمود منطقة محسوبة من الموقع',
  },
};

export default function CrossPage() {
  const { data, loading, error, retry } = useAnalyticsSection('crossAnalysis');
  const [mode, setMode] = useState('questionByRep');
  const section = data?.data;

  const config = CONFIG[mode];

  const groups = useMemo(() => {
    const source = section?.[config.source] || [];
    return source
      .map(row => ({ label: config.labelOf(row), parts: row[config.parts] || [] }))
      .filter(group => group.label && group.parts.length);
  }, [section, config]);

  const hasAny = useMemo(
    () =>
      [...Object.values(CONFIG).map(item => item.source), 'customerByRep', 'repByArea'].some(
        source => (section?.[source] || []).length
      ),
    [section]
  );

  const customerRows = useMemo(
    () => (section?.customerByRep || []).map(row => ({ ...row, key: row.customer })),
    [section]
  );
  const repRows = useMemo(
    () => (section?.repByArea || []).map(row => ({ ...row, key: row.rep })),
    [section]
  );

  return (
    <>
      <PageIntro
        title="التحليل المتقاطع"
        caption="لا مؤشرات جديدة هنا: نفس أعداد الإجابات لكن موزّعة على بعدين في وقت واحد"
        meta={[
          { label: 'الفترة الفعلية', value: windowLabel(data?.window) },
          { label: 'صفوف المصفوفة الحالية', value: nf(groups.length) },
        ]}
      />

      <SectionState
        loading={loading && !section}
        error={error}
        onRetry={retry}
        isEmpty={!hasAny}
        emptyText="لا توجد علاقات متقاطعة محسوبة في هذه الفترة"
      >
        <div className="space-y-6">
          <Panel
            title={config.title}
            subtitle={`${config.caption} — الخلايا تعرض نصيب العمود داخل صفّه (نسبة من إجمالي الصف) لا عدداً مطلقاً، والعمود الأخير هو مجموع الصف`}
          >
            <div className="mb-5 overflow-x-auto pb-1">
              <Segmented options={MODES} value={mode} onChange={setMode} ariaLabel="نوع التحليل المتقاطع" />
            </div>
            <CrossMatrix
              groups={groups}
              columnsLimit={8}
              emptyText="لا توجد بيانات كافية لبناء هذه المصفوفة في الفترة الحالية"
            />
          </Panel>

          <Panel
            title="العملاء حسب المندوب"
            subtitle="قائمة لا تناسب المصفوفة: كل عميل والمندوبين الذين زاروه فعلاً"
          >
            <Table
              columns={[
                {
                  key: 'customer',
                  label: 'العميل',
                  render: row => (
                    <span className="block max-w-[240px] truncate font-semibold" title={row.customer}>
                      {row.customer || '—'}
                    </span>
                  ),
                },
                { key: 'visits', label: 'زيارات', numeric: true },
                {
                  key: 'reps',
                  label: 'المندوبون',
                  sortable: false,
                  render: row =>
                    row.reps?.length ? (
                      <span className="text-[11.5px]">{row.reps.join('، ')}</span>
                    ) : (
                      '—'
                    ),
                },
              ]}
              rows={customerRows}
              initialSort={{ key: 'visits', dir: 'desc' }}
              emptyText="لا يوجد عملاء مرتبطون بمندوبين في هذه الفترة"
            />
          </Panel>

          <Panel
            title="المندوبون حسب المنطقة"
            subtitle="أين يعمل كل مندوب فعلياً، كما تُحسب المناطق من الإحداثيات ونص العنوان"
          >
            <Table
              columns={[
                {
                  key: 'rep',
                  label: 'المندوب',
                  render: row => (
                    <span className="block max-w-[220px] truncate font-semibold" title={row.rep}>
                      {row.rep || '—'}
                    </span>
                  ),
                },
                { key: 'visits', label: 'زيارات', numeric: true },
                {
                  key: 'areas',
                  label: 'المناطق',
                  sortable: false,
                  render: row =>
                    row.areas?.length ? (
                      <span className="text-[11.5px]">{row.areas.map(area => area.label).join('، ')}</span>
                    ) : (
                      '—'
                    ),
                },
              ]}
              rows={repRows}
              initialSort={{ key: 'visits', dir: 'desc' }}
              emptyText="لا توجد مناطق مسجلة لمندوبي هذه الفترة"
            />
          </Panel>
        </div>
      </SectionState>
    </>
  );
}
