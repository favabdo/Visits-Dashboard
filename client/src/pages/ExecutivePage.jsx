import React from 'react';
import { Link } from 'react-router-dom';
import Panel from '../components/Panel';
import StatsRow from '../components/ui/StatsRow';
import RankBars from '../components/ui/RankBars';
import TrendChart from '../components/ui/TrendChart';
import Delta from '../components/ui/Delta';
import InsightFeed from '../components/ui/InsightFeed';
import { PageIntro } from '../components/ui/Section';
import { useAnalyticsLayout } from '../hooks/useAnalytics';
import { nf, windowLabel } from '../utils/format';

const SHAPE_LABELS = {
  single: 'اختيار واحد',
  multi: 'اختيار متعدد',
  text: 'نصي',
  unanswered: 'بلا إجابات',
};

function HeadlineTile({ label, value, hint, tone = 'accent' }) {
  const chip =
    tone === 'danger'
      ? 'bg-danger-soft text-danger'
      : tone === 'warning'
        ? 'bg-choco-soft text-choco'
        : tone === 'teal'
          ? 'bg-teal-soft text-teal'
          : 'bg-accent-soft text-accent';
  return (
    <div className="rounded-xl border border-line bg-panel-soft p-3.5">
      <p className="text-[11px] font-bold text-muted">{label}</p>
      <p className="mt-1.5 text-[14px] font-extrabold leading-snug text-ink">{value || '—'}</p>
      {hint ? (
        <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${chip}`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export default function ExecutivePage() {
  const { payload, insights } = useAnalyticsLayout();
  const overview = payload?.overview;
  if (!overview) return null;

  const { window, totals, headline, dataQuality, questionCoverage = [] } = overview;
  const trend = overview.visitsTrendWeek || [];
  const change = overview.visitsTrendChange;
  const completeness = dataQuality?.completeness || {};

  const shapeCounts = new Map();
  questionCoverage.forEach(question => {
    const key = SHAPE_LABELS[question.shape] || question.shape || 'غير مصنّف';
    shapeCounts.set(key, (shapeCounts.get(key) || 0) + 1);
  });
  const shapeRows = Array.from(shapeCounts.entries())
    .map(([label, count]) => ({ label, count, total: questionCoverage.length }))
    .sort((a, b) => b.count - a.count);

  const coverageRows = questionCoverage
    .slice()
    .sort((a, b) => b.responseRate - a.responseRate)
    .map(question => ({
      label: question.text,
      count: question.visitsCovered,
      percentage: question.responseRate,
    }));

  const completenessRows = Object.entries(completeness).map(([key, value]) => ({
    label: COMPLETENESS_LABELS[key] || key,
    count: value,
    percentage: value,
  }));

  return (
    <>
      <PageIntro
        title="نظرة تنفيذية"
        caption="أهم المؤشرات المكتشفة تلقائياً من بيانات الزيارة خلال الفترة"
        meta={[
          { label: 'الفترة الفعلية', value: windowLabel(window) },
          { label: 'أسئلة بالاستبيان', value: nf(totals.questions) },
          { label: 'خيارات متاحة', value: nf(totals.options) },
        ]}
      />

      <StatsRow
        columns={4}
        items={[
          {
            key: 'visits',
            label: 'إجمالي الزيارات',
            value: totals.visits,
            hint: `${nf(totals.answers)} إجابة · ${nf(totals.answersPerVisit)} لكل زيارة`,
          },
          {
            key: 'completion',
            label: 'اكتمال الزيارات',
            value: totals.completionRate,
            suffix: '%',
            tone: totals.completionRate >= 70 ? 'success' : 'warning',
            progress: totals.completionRate,
            hint: `${nf(totals.completedVisits)} مكتملة · ${nf(totals.pendingVisits)} معلّقة`,
          },
          {
            key: 'response',
            label: 'معدل الاستجابة',
            value: totals.responseRate,
            suffix: '%',
            tone: totals.responseRate >= 60 ? 'teal' : 'warning',
            progress: totals.responseRate,
            hint: `${nf(totals.answeredQuestions)} من ${nf(totals.questions)} سؤال له إجابات`,
          },
          {
            key: 'outrange',
            label: 'زيارات خارج النطاق',
            value: totals.outOfRangeRate,
            suffix: '%',
            tone: totals.outOfRangeRate > 15 ? 'danger' : 'neutral',
            progress: totals.outOfRangeRate,
            hint: `${nf(totals.outOfRangeVisits)} زيارة`,
          },
          {
            key: 'customers',
            label: 'عملاء نشِطون',
            value: totals.activeCustomers,
            tone: 'accent',
            hint: `من ${nf(totals.customers)} عميل · ${nf(totals.inactiveCustomers)} غير نشِط`,
          },
          {
            key: 'reps',
            label: 'مندوبون في الفترة',
            value: totals.reps,
            hint: `${nf(totals.areas)} منطقة تغطية`,
          },
          {
            key: 'duration',
            label: 'متوسط مدة الزيارة',
            value: totals.avgVisitMinutes == null ? 'غير محسوبة' : totals.avgVisitMinutes,
            suffix: totals.avgVisitMinutes == null ? '' : 'دقيقة',
            tone: 'neutral',
            hint: 'من فروق توقيت الإجابات داخل الزيارة',
          },
          {
            key: 'quality',
            label: 'مشاكل جودة البيانات',
            value: dataQuality?.issueTypes ?? 0,
            tone: (dataQuality?.highSeverityTypes || 0) > 0 ? 'danger' : 'neutral',
            badge: (dataQuality?.highSeverityTypes || 0) > 0 ? 'حرج' : null,
            hint: `${nf(dataQuality?.affectedRecords ?? 0)} سجل متأثر · ${nf(dataQuality?.highSeverityTypes ?? 0)} نوع حرج`,
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="أهم ما رصدته البيانات"
          subtitle="عبارات مبنية على أرقام محسوبة، بدون تفسير خارج البيانات"
          className="xl:col-span-2"
        >
          <InsightFeed items={insights} limit={6} />
          {insights.length > 6 ? (
            <Link
              to="/insights"
              className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-accent hover:text-accent-hover"
            >
              عرض كل الرؤى ({nf(insights.length)})
            </Link>
          ) : null}
        </Panel>

        <div className="space-y-6">
          <Panel title="اتجاه الزيارات أسبوعياً" subtitle="مقارنة نصفي الفترة">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[12px] text-muted">
                {nf(change?.first ?? 0)} ← {nf(change?.second ?? 0)}
              </span>
              <Delta value={change?.changePercentage} hint="بين نصفي الفترة" />
            </div>
            <TrendChart series={trend} granularity="week" height={196} label="زيارة" />
          </Panel>

          <Panel title="طبيعة أسئلة الاستبيان" subtitle="النوع يُستنتج من شكل الإجابات لا من تسمية ثابتة">
            <RankBars rows={shapeRows} unit="سؤال" tone="teal" emptyText="لا توجد أسئلة في الاستبيان" />
          </Panel>
        </div>
      </div>

      <Panel
        title="مؤشرات رأسية مكتشفة تلقائياً"
        subtitle="كل قيمة محسوبة من البيانات، والعلامة «—» تعني أن البيانات لا تدعمها في هذه الفترة"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HeadlineTile
            label="أكثر إجابة تكراراً"
            value={headline?.mostCommonAnswer?.option}
            hint={
              headline?.mostCommonAnswer
                ? `${headline.mostCommonAnswer.question} · ${nf(headline.mostCommonAnswer.count)}`
                : null
            }
          />
          <HeadlineTile
            label="أكثر منتج تكراراً"
            value={headline?.mostRequestedProduct?.option}
            hint={
              headline?.mostRequestedProduct
                ? `${headline.mostRequestedProduct.question} · ${nf(headline.mostRequestedProduct.count)}`
                : null
            }
            tone="teal"
          />
          <HeadlineTile
            label="أكثر كلمة شكوى"
            value={headline?.mostCommonComplaint?.term}
            hint={headline?.mostCommonComplaint ? `${nf(headline.mostCommonComplaint.count)} ملاحظة` : null}
            tone="danger"
          />
          <HeadlineTile
            label="أكثر موضوع تكراراً"
            value={headline?.mostCommonTopic?.term}
            hint={headline?.mostCommonTopic ? `${nf(headline.mostCommonTopic.count)} ذكر` : null}
          />
          <HeadlineTile
            label="أكثر المندوبين زيارات"
            value={headline?.busiestRep}
            hint={`${nf(totals.visits)} زيارة بالفترة`}
          />
          <HeadlineTile
            label="أكثر المناطق زيارة"
            value={headline?.busiestArea}
            hint={`${nf(totals.areas)} منطقة`}
            tone="teal"
          />
          <HeadlineTile
            label="عملاء طلبوا متابعة"
            value={`${nf(headline?.followUpCustomers ?? 0)} عميل`}
            hint="من ملاحظاتهم النصية"
            tone="warning"
          />
          <HeadlineTile
            label="عملاء بملاحظات سالبة"
            value={`${nf(headline?.negativeFeedbackCustomers ?? 0)} عميل`}
            hint="من تحليل النص"
            tone="danger"
          />
        </div>
        {totals.statusUnknownVisits > 0 ? (
          <p className="mt-4 rounded-xl bg-choco-soft px-3.5 py-2.5 text-[12px] text-choco">
            {nf(totals.statusUnknownVisits)} زيارة بلا قيمة حالة صالحة، لذا يُحسب اكتمالها من وجود إجابات لها.
          </p>
        ) : null}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="تغطية الأسئلة" subtitle="نسبة الزيارات التي أجابت على كل سؤال">
          <RankBars rows={coverageRows} unit="زيارة" tone="accent" emptyText="لا توجد أسئلة" />
          <Link
            to="/questions"
            className="mt-4 inline-block text-[12px] font-bold text-accent hover:text-accent-hover"
          >
            تحليل الأسئلة بالتفصيل
          </Link>
        </Panel>
        <Panel title="اكتمال حقول الزيارة" subtitle="ما الذي تنقصه البيانات قبل الاعتماد على أي مؤشر">
          <RankBars rows={completenessRows} unit="%" tone="teal" emptyText="لا توجد زيارات محسوبة" />
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-[12px] text-muted">
              {nf(dataQuality?.issueTypes ?? 0)} نوع مشكلة · {nf(dataQuality?.affectedRecords ?? 0)} سجل متأثر
            </span>
            <Link
              to="/quality"
              className="text-[12px] font-bold text-accent hover:text-accent-hover"
            >
              تفاصيل جودة البيانات
            </Link>
          </div>
        </Panel>
      </div>
    </>
  );
}

const COMPLETENESS_LABELS = {
  withCoordinates: 'إحداثيات صالحة',
  withAddress: 'عنوان',
  withStatus: 'قيمة حالة',
  withValidDate: 'تاريخ صالح',
  withCustomer: 'عميل مرتبط',
  withRep: 'مندوب مرتبط',
};
