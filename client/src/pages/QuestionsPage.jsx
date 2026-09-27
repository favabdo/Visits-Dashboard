import React, { useMemo, useState } from 'react';
import Panel from '../components/Panel';
import StatsRow from '../components/ui/StatsRow';
import RankBars from '../components/ui/RankBars';
import DonutChart from '../components/ui/DonutChart';
import TrendChart from '../components/ui/TrendChart';
import Table from '../components/ui/Table';
import Segmented from '../components/ui/Segmented';
import { PageIntro, SectionState } from '../components/ui/Section';
import { useAnalyticsLayout, useAnalyticsSection } from '../hooks/useAnalytics';
import { nf, pf, windowLabel } from '../utils/format';

const SHAPE_LABELS = {
  single: 'اختيار واحد',
  multi: 'اختيار متعدد',
  text: 'نصي',
  unanswered: 'بلا إجابات',
};

const SHAPE_FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'single', label: 'اختيار واحد' },
  { key: 'multi', label: 'اختيار متعدد' },
  { key: 'text', label: 'نصي' },
  { key: 'unanswered', label: 'بلا إجابات' },
];

function Chip({ children, tone = 'neutral' }) {
  const palette =
    tone === 'accent'
      ? 'bg-accent-soft text-accent'
      : tone === 'teal'
        ? 'bg-teal-soft text-teal'
        : tone === 'warning'
          ? 'bg-choco-soft text-choco'
          : tone === 'danger'
            ? 'bg-danger-soft text-danger'
            : 'bg-panel-soft text-slate';
  return <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${palette}`}>{children}</span>;
}

const NO_QUESTIONS = [];

export default function QuestionsPage() {
  const { data, loading, error, retry } = useAnalyticsSection('questions');
  const { overview } = useAnalyticsLayout();
  const totalVisits = overview?.overview?.totals?.visits;
  const [shape, setShape] = useState('all');
  const [query, setQuery] = useState('');
  const list = data?.data?.list || NO_QUESTIONS;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return list.filter(question => {
      if (shape !== 'all' && question.shape !== shape) return false;
      if (!needle) return true;
      return (
        String(question.text).toLowerCase().includes(needle) ||
        (question.distribution || []).some(row => String(row.label).toLowerCase().includes(needle))
      );
    });
  }, [list, shape, query]);

  const answered = list.filter(question => question.responseCount > 0);
  const avgResponse = answered.length
    ? answered.reduce((sum, question) => sum + question.responseRate, 0) / answered.length
    : 0;

  return (
    <>
      <PageIntro
        title="تحليل الأسئلة"
        caption="الأسئلة تُقرأ من الاستبيان نفسه: أي سؤال جديد يظهر هنا تلقائياً بنفس المعاملات، دون أي إعداد إضافي"
        meta={[
          { label: 'الفترة الفعلية', value: windowLabel(data?.window) },
          { label: 'أسئلة بالاستبيان', value: nf(list.length) },
          { label: 'أسئلة لها إجابات', value: nf(answered.length) },
        ]}
      />

      <SectionState
        loading={loading && !data}
        error={error}
        onRetry={retry}
        isEmpty={!list.length}
        emptyText="لا توجد أسئلة ضمن بيانات الاستبيان"
      >
        <div className="space-y-6">
          <StatsRow
            columns={4}
            items={[
              { key: 'count', label: 'عدد الأسئلة', value: list.length, hint: `${nf(answered.length)} عليها إجابات` },
              {
                key: 'avg',
                label: 'متوسط تغطية الأسئلة',
                value: Number(avgResponse.toFixed(1)),
                suffix: '%',
                tone: 'teal',
                hint: 'نسبة الزيارات التي أجابت على السؤال',
              },
              {
                key: 'silent',
                label: 'أسئلة بلا أي إجابة',
                value: list.length - answered.length,
                tone: list.length - answered.length ? 'danger' : 'neutral',
                hint: list.length === answered.length ? 'كل الأسئلة عليها إجابات' : 'قد تكون جديدة أو اختيارية',
              },
              {
                key: 'types',
                label: 'أنواع الأسئلة',
                value: new Set(list.map(question => question.type || 'غير محدد')).size,
                tone: 'neutral',
                hint: 'كما جاءت في عمود QuestionType',
              },
            ]}
          />

          <Panel
            title="مقارنة الأسئلة"
            subtitle="التركيز هو نصيب أكثر خيار تكراراً من إجابات السؤال نفسه"
          >
            <Table
              columns={[
                { key: 'text', label: 'السؤال', render: row => <span className="font-semibold">{row.text}</span> },
                {
                  key: 'type',
                  label: 'النوع',
                  render: row => (
                    <div className="flex flex-wrap gap-1.5">
                      <Chip tone="accent">{row.type || 'بدون نوع'}</Chip>
                      <Chip tone="teal">{SHAPE_LABELS[row.shape] || row.shape}</Chip>
                    </div>
                  ),
                },
                { key: 'responseCount', label: 'إجابات', numeric: true },
                { key: 'visitsCovered', label: 'زيارات مجيبة', numeric: true },
                { key: 'responseRate', label: 'التغطية', numeric: true, render: row => pf(row.responseRate) },
                {
                  key: 'missingResponseRate',
                  label: 'نقص الاستجابة',
                  numeric: true,
                  render: row => (
                    <span className={row.missingResponseRate >= 60 ? 'font-bold text-danger' : ''}>
                      {pf(row.missingResponseRate)}
                    </span>
                  ),
                },
                {
                  key: 'concentration',
                  label: 'أكثر خيار',
                  render: row =>
                    row.mostSelected ? (
                      <span className="block max-w-[210px] truncate" title={row.mostSelected.label}>
                        {row.mostSelected.label}
                        <span className="ms-1.5 text-slate tabular-nums">{pf(row.concentration)}</span>
                      </span>
                    ) : (
                      '—'
                    ),
                },
                { key: 'optionCount', label: 'خيارات', numeric: true },
              ]}
              rows={filtered}
              initialSort={{ key: 'responseCount', dir: 'desc' }}
            />
          </Panel>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented options={SHAPE_FILTERS} value={shape} onChange={setShape} ariaLabel="تصفية حسب طبيعة السؤال" />
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="بحث في الأسئلة أو الإجابات"
              aria-label="بحث في الأسئلة"
              className="w-full max-w-sm rounded-xl border border-line bg-panel px-3.5 py-2 text-[13px] text-ink outline-none transition focus:border-accent"
            />
          </div>

          {filtered.length ? (
            <div className="grid gap-6 xl:grid-cols-2">
              {filtered.map(question => (
                <QuestionCard key={question.text} question={question} totalVisits={totalVisits} />
              ))}
            </div>
          ) : (
            <Panel>
              <p className="py-8 text-center text-[12px] text-muted">لا توجد أسئلة مطابقة للتصفية الحالية</p>
            </Panel>
          )}

          <Panel
            title="أسئلة أظهرت تحولاً بين نصفي الفترة"
            subtitle="مقارنة نصف المدى الزمني الأول بنصفه الثاني على عدد الإجابات الأسبوعي"
          >
            <TrendsSummary list={list} />
          </Panel>
        </div>
      </SectionState>
    </>
  );
}

function QuestionCard({ question, totalVisits }) {
  const distribution = question.distribution || [];
  const used = distribution.filter(row => row.count > 0);

  return (
    <Panel
      title={question.text}
      subtitle={`${nf(question.responseCount)} إجابة من ${nf(totalVisits ?? 0)} زيارة · تغطية ${pf(question.responseRate)}`}
      className="min-w-0"
    >
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <Chip tone="accent">{question.type || 'بدون نوع'}</Chip>
        <Chip tone="teal">{SHAPE_LABELS[question.shape] || question.shape}</Chip>
        {question.required === 1 ? <Chip tone="warning">مطلوب</Chip> : null}
        {question.required === 0 ? <Chip>اختياري</Chip> : null}
        {question.active === 0 ? <Chip tone="danger">غير فعّال</Chip> : null}
        <Chip>{nf(question.optionCount)} خيار</Chip>
      </div>

      {used.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2.5 text-[11px] font-bold text-muted">توزيع الإجابات</p>
            <RankBars rows={distribution} unit="إجابة" limit={8} />
          </div>
          <div>
            <p className="mb-2.5 text-[11px] font-bold text-muted">النسب</p>
            {used.length <= 6 ? (
              <DonutChart rows={used} height={216} totalLabel="إجابة" />
            ) : (
              <RankBars rows={used} unit="إجابة" tone="teal" />
            )}
          </div>
        </div>
      ) : question.shape === 'text' ? (
        <p className="rounded-xl bg-panel-soft px-3.5 py-3 text-[12px] text-muted">
          سؤال نصي: تُحلّل إجاباته في قسم التحليل النصي بدل توزيع خيارات.
        </p>
      ) : (
        <p className="rounded-xl bg-danger-soft px-3.5 py-3 text-[12px] font-semibold text-danger">
          لا توجد إجابات على هذا السؤال ضمن الفترة — قد يكون سؤالاً جديداً أو لم يُملأ في الميدان.
        </p>
      )}

      {question.trend?.length > 1 ? (
        <div className="mt-4 border-t border-line pt-3.5">
          <p className="mb-1 text-[11px] font-bold text-muted">التوزيع الزمني للإجابات (أسبوعياً)</p>
          <TrendChart series={question.trend} granularity="week" height={150} fill={false} label="إجابة" />
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 border-t border-line pt-3.5 sm:grid-cols-3">
        <div>
          <p className="mb-1.5 text-[11px] font-bold text-muted">حسب المندوب</p>
          <RankBars rows={question.byRep} unit="إجابة" limit={4} tone="accent" emptyText="لا توجد إجابات" />
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-bold text-muted">حسب المنطقة</p>
          <RankBars rows={question.byArea} unit="إجابة" limit={4} tone="warning" emptyText="لا توجد إجابات" />
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-bold text-muted">حسب العميل</p>
          <RankBars rows={question.byCustomer} unit="إجابة" limit={4} tone="teal" emptyText="لا توجد إجابات" />
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted">
        {question.mostSelected ? (
          <span>
            الأكثر اختياراً: <b className="text-ink">{question.mostSelected.label}</b> ({nf(question.mostSelected.count)})
          </span>
        ) : null}
        {question.leastSelected ? (
          <span>
            الأقل اختياراً: <b className="text-ink">{question.leastSelected.label}</b> ({nf(question.leastSelected.count)})
          </span>
        ) : null}
      </div>
    </Panel>
  );
}

function TrendsSummary({ list }) {
  const rows = useMemo(
    () =>
      list
        .filter(question => question.trend?.length > 1)
        .map(question => {
          const mid = Math.ceil(question.trend.length / 2);
          const first = question.trend.slice(0, mid).reduce((sum, point) => sum + point.count, 0);
          const second = question.trend.slice(mid).reduce((sum, point) => sum + point.count, 0);
          return {
            text: question.text,
            first,
            second,
            change: first > 0 ? Number((((second - first) * 100) / first).toFixed(1)) : null,
          };
        })
        .filter(row => row.change != null && Math.abs(row.change) >= 20)
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change)),
    [list]
  );

  if (!rows.length) {
    return <p className="py-6 text-center text-[12px] text-muted">لا تحوّل واضح (أقل من 20%) بين نصفي الفترة</p>;
  }

  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {rows.map(row => (
        <li key={row.text} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel-soft px-3.5 py-2.5">
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink" title={row.text}>
            {row.text}
          </span>
          <span className="shrink-0 text-[11.5px] text-muted tabular-nums">
            {nf(row.first)} ← {nf(row.second)}
          </span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
              row.change > 0 ? 'bg-accent-soft text-accent' : 'bg-choco-soft text-choco'
            }`}
          >
            {row.change > 0 ? '+' : ''}
            {nf(row.change)}%
          </span>
        </li>
      ))}
    </ul>
  );
}
