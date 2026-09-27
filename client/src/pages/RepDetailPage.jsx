import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Panel from '../components/Panel';
import StatsRow from '../components/ui/StatsRow';
import RankBars from '../components/ui/RankBars';
import Table from '../components/ui/Table';
import TrendChart from '../components/ui/TrendChart';
import Delta from '../components/ui/Delta';
import DonutChart from '../components/ui/DonutChart';
import ErrorPanel from '../components/ui/ErrorPanel';
import { PageIntro, SectionState } from '../components/ui/Section';
import { useAnalyticsSection } from '../hooks/useAnalytics';
import { nf, pf, windowLabel } from '../utils/format';

export default function RepDetailPage() {
  const { name } = useParams();
  const { data, loading, error, retry } = useAnalyticsSection('salesReps');
  const list = data?.data?.list || [];
  const rep = list.find(item => item.name === name);

  if (error) {
    return <ErrorPanel message={error} onRetry={retry} />;
  }
  if (loading && !data) {
    return <SectionState loading error={null} onRetry={retry}>{null}</SectionState>;
  }
  if (!rep) {
    return (
      <Panel title="المندوب غير موجود">
        <p className="text-[12.5px] text-muted">
          لا يوجد مندوب بهذا الاسم ضمن زيارات الفترة المحددة.
        </p>
        <Link to="/reps" className="mt-3 inline-block text-[12px] font-bold text-accent hover:text-accent-hover">
          رجوع إلى قائمة المندوبين
        </Link>
      </Panel>
    );
  }

  const areaRows = (rep.areas || []).map(row => ({
    label: row.label,
    count: row.count,
    percentage: row.percentage,
  }));

  const answerColumns = [
    { key: 'question', label: 'السؤال' },
    { key: 'option', label: 'الإجابة', render: row => <span className="font-semibold">{row.option}</span> },
    { key: 'count', label: 'عدد', numeric: true },
    { key: 'percentage', label: 'من إجاباته', numeric: true, render: row => pf(row.percentage) },
  ];

  return (
    <>
      <PageIntro
        title={`إحصائيات المندوب: ${rep.name}`}
        caption="كل رقم هنا محسوب من زيارات هذا المندوب وإجاباته داخل الفترة المحددة"
        meta={[
          { label: 'الفترة الفعلية', value: windowLabel(data?.window) },
          { label: 'زيارات', value: nf(rep.visits) },
          { label: 'إجابات', value: nf(rep.answers) },
        ]}
      />

      <div className="mb-1">
        <Link to="/reps" className="text-[12px] font-bold text-accent hover:text-accent-hover">
          ← كل المندوبين
        </Link>
      </div>

      <StatsRow
        columns={4}
        items={[
          { key: 'visits', label: 'الزيارات', value: rep.visits, hint: `${nf(rep.completed)} مكتملة` },
          {
            key: 'completion',
            label: 'معدل الاكتمال',
            value: rep.completionRate,
            suffix: '%',
            progress: rep.completionRate,
            tone: rep.completionRate >= 70 ? 'success' : 'warning',
          },
          {
            key: 'out',
            label: 'خارج النطاق',
            value: rep.outOfRangeRate,
            suffix: '%',
            progress: rep.outOfRangeRate,
            tone: rep.outOfRangeRate > 15 ? 'danger' : 'neutral',
          },
          {
            key: 'customers',
            label: 'عملاء فريدون',
            value: rep.uniqueCustomers,
            hint: `${nf(rep.avgVisitsPerCustomer)} زيارة لكل عميل`,
          },
          {
            key: 'answers',
            label: 'إجابات مسجّلة',
            value: rep.answers,
            hint: `${nf(rep.responseRate)} لكل زيارة`,
            tone: 'teal',
          },
          {
            key: 'questions',
            label: 'أسئلة أجاب عنها',
            value: rep.questionsAnswered,
            hint: 'من أسئلة الاستبيان الظاهرة في الفترة',
            tone: 'teal',
          },
          {
            key: 'notes',
            label: 'ملاحظات نصية',
            value: rep.notesCount,
            tone: 'neutral',
          },
          {
            key: 'duration',
            label: 'متوسط مدة الزيارة',
            value: rep.avgVisitMinutes == null ? 'غير محسوبة' : rep.avgVisitMinutes,
            suffix: rep.avgVisitMinutes == null ? '' : 'دقيقة',
            tone: 'neutral',
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="النشاط عبر الزمن"
          subtitle="تجميع أسبوعي لتواريخ الزيارات"
          className="lg:col-span-2"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[12px] text-muted">
              {nf(rep.activityTrend?.first ?? 0)} ← {nf(rep.activityTrend?.second ?? 0)}
            </span>
            <Delta value={rep.activityTrend?.changePercentage} hint="بين نصفي الفترة" />
          </div>
          {rep.activitySeries?.length ? (
            <TrendChart series={rep.activitySeries} granularity="week" height={280} label="زيارة" />
          ) : (
            <p className="py-8 text-center text-[12px] text-muted">لا يوجد نشاط زمني كافٍ لحساب اتجاه</p>
          )}
        </Panel>

        <Panel title="التغطية" subtitle="نقاط صالحة على الخريطة ومناطق عمل">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-panel-soft p-3">
                <p className="text-[11px] font-semibold text-muted">نقاط بإحداثيات صالحة</p>
                <p className="mt-1 text-[18px] font-extrabold text-ink tabular-nums">{nf(rep.coverage?.points ?? 0)}</p>
              </div>
              <div className="rounded-xl border border-line bg-panel-soft p-3">
                <p className="text-[11px] font-semibold text-muted">مناطق عمل</p>
                <p className="mt-1 text-[18px] font-extrabold text-ink tabular-nums">{nf(rep.coverage?.areas ?? 0)}</p>
              </div>
            </div>
            <RankBars rows={areaRows} unit="زيارة" tone="warning" limit={8} emptyText="لا توجد مناطق مستخرجة" />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="أكثر إجاباته تكراراً" subtitle="مرتبطة بالسؤال نفسه حتى لا تختلط الخيارات المتشابهة">
          {rep.mostCommonAnswers?.length ? (
            <Table
              dense
              columns={answerColumns}
              rows={rep.mostCommonAnswers}
              initialSort={{ key: 'count', dir: 'desc' }}
            />
          ) : (
            <p className="py-6 text-center text-[12px] text-muted">لا توجد إجابات اختيارية مسجّلة</p>
          )}
        </Panel>

        <Panel title="توزيع إجاباته على الأسئلة" subtitle="عدد الأسئلة التي أجاب عنها مقارنة بباقي المندوبين">
          {rep.questionsAnswered ? (
            <DonutChart
              rows={[
                { label: 'أسئلة أجاب عنها', count: rep.questionsAnswered },
                { label: 'ملاحظات نصية', count: rep.notesCount },
              ]}
              height={260}
              totalLabel="إشارات"
            />
          ) : (
            <p className="py-6 text-center text-[12px] text-muted">لم يسجّل هذا المندوب أي إجابة في الفترة</p>
          )}
        </Panel>
      </div>

      <Panel title="ما لا تظهره هذه الأرقام" subtitle="حدود القراءة الموضوعية لأداء المندوب">
        <ul className="grid gap-2.5 text-[12.5px] leading-relaxed text-muted sm:grid-cols-2">
          <li>· لا يُحسب «ترتيب» أو «درجة أداء»: البيانات لا تحمل أهدافاً أو مدة معيارية للمقارنة بها.</li>
          <li>· معدل الاكتمال يعتمد على عمود الحالة؛ إذا غاب يُحسب من وجود إجابات للزيارة.</li>
          <li>· متوسط المدة يحتاج أكثر من إجابة مؤقَّتة داخل الزيارة الواحدة، وإلا يظهر «غير محسوبة».</li>
          <li>· «خارج النطاق» قيمة مسجّلة في البيانات نفسها، لا استنتاج جغرافي من اللوحة.</li>
        </ul>
      </Panel>
    </>
  );
}
