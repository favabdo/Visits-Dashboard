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
import { nf, periodLabel, windowLabel } from '../utils/format';

const GRAINS = [
  { key: 'daily', label: 'يومي' },
  { key: 'weekly', label: 'أسبوعي' },
  { key: 'monthly', label: 'شهري' },
];

const GRAIN_LABEL = { daily: 'day', weekly: 'week', monthly: 'month' };

export default function TrendsPage() {
  const { data, loading, error, retry } = useAnalyticsSection('trends');
  const [grain, setGrain] = useState('daily');
  const section = data?.data;

  const visits = section?.visits || {};
  const answers = section?.answers || {};
  const timeWindow = section?.window || data?.window;
  const change = visits.change;
  const peak = visits.peak || null;
  const low = visits.low || null;
  const weekdayDistribution = section?.weekdayDistribution || [];
  const perQuestion = section?.perQuestion || [];
  const perRep = section?.perRep || [];
  const lowActivityDays = (section?.lowActivityDays || []).map(day => ({
    key: day.period,
    label: periodLabel(day.period, 'day'),
    count: day.count,
  }));

  return (
    <>
      <PageIntro
        title="الاتجاهات الزمنية"
        caption="كيف تحرّكت الزيارات والإجابات والأسئلة والمندوبون عبر الفترة"
        meta={[
          { label: 'الفترة الفعلية', value: windowLabel(timeWindow) },
          { label: 'أيام نشطة', value: nf(section?.activeDayCount) },
        ]}
      />

      <SectionState
        loading={loading && !section}
        error={error}
        onRetry={retry}
        isEmpty={!visits.daily?.length}
        emptyText="لا توجد بيانات اتجاهات في هذه الفترة"
      >
        <div className="space-y-6">
          <StatsRow
            columns={4}
            items={[
              {
                key: 'days',
                label: 'أيام المدى الزمني',
                value: timeWindow?.days ?? '—',
                suffix: timeWindow?.days ? 'يوم' : '',
                tone: 'neutral',
                hint: 'من أول زيارة إلى آخر زيارة',
              },
              {
                key: 'active',
                label: 'أيام بها زيارات',
                value: section?.activeDayCount ?? 0,
                tone: 'accent',
                hint: 'عدد الأيام الفعلية في السلسلة',
              },
              {
                key: 'peak',
                label: 'أعلى يوم زيارات',
                value: peak ? peak.count : '—',
                suffix: peak ? 'زيارة' : '',
                tone: 'teal',
                hint: peak ? `في ${periodLabel(peak.period, 'day')}` : 'غير محسوب',
              },
              {
                key: 'low',
                label: 'أدنى يوم زيارات',
                value: low ? low.count : '—',
                suffix: low ? 'زيارة' : '',
                tone: 'warning',
                hint: low ? `في ${periodLabel(low.period, 'day')}` : 'غير محسوب',
              },
            ]}
          />

          <Panel
            title="الإيقاع الزمني للزيارات"
            subtitle="اختر دقة العرض؛ قيمة التغيير تقارن نصفي السلسلة الأسبوعية للزيارات"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Segmented options={GRAINS} value={grain} onChange={setGrain} ariaLabel="دقة الزمن" />
              {change ? (
                <Delta
                  value={change.changePercentage}
                  hint={`${nf(change.first ?? 0)} ← ${nf(change.second ?? 0)}`}
                />
              ) : (
                <span className="text-[11.5px] font-bold text-muted">غير محسوب</span>
              )}
            </div>
            <TrendChart
              series={visits[grain] || []}
              granularity={GRAIN_LABEL[grain]}
              height={300}
              label="زيارة"
            />
          </Panel>

          <Panel
            title="الزيارات مقابل الإجابات"
            subtitle="مقارنة أسبوعية بين عدد الزيارات وعدد الإجابات داخل الفترة"
          >
            <TrendChart
              height={280}
              multi={[
                { label: 'الزيارات', series: visits.weekly || [], granularity: 'week' },
                { label: 'الإجابات', series: answers.weekly || [], granularity: 'week' },
              ]}
            />
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="توزيع الزيارات على أيام الأسبوع" subtitle="الأيام التي تشهد أغلب المواعيد الميدانية">
              <RankBars
                rows={weekdayDistribution}
                unit="زيارة"
                tone="accent"
                emptyText="لا توجد بيانات توزيع على أيام الأسبوع"
              />
            </Panel>
            <Panel title="أيام النشاط المنخفض" subtitle="أيام تقل زياراتها عن نصف المتوسط اليومي">
              <Table
                dense
                rows={lowActivityDays}
                columns={[
                  { key: 'label', label: 'اليوم' },
                  { key: 'count', label: 'عدد الزيارات', numeric: true },
                ]}
                initialSort={{ key: 'count', dir: 'asc' }}
                emptyText="لا توجد أيام نشاط منخفض في هذه الفترة"
              />
            </Panel>
          </div>

          <Panel
            title="تغيّر الأسئلة بين نصفي الفترة"
            subtitle="لكل سؤال مقارنة نصفي السلسلة الأسبوعية مع شكل الحركة"
          >
            {perQuestion.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {perQuestion.map((entry, index) => (
                  <div
                    key={`${entry.text}-${index}`}
                    className="rounded-xl border border-line bg-panel-soft p-3.5"
                  >
                    <p className="text-[12.5px] font-bold leading-snug text-ink">{entry.text}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11.5px] text-muted tabular-nums">
                        {nf(entry.change?.first ?? 0)} ← {nf(entry.change?.second ?? 0)}
                      </span>
                      <Delta value={entry.change?.changePercentage} />
                    </div>
                    <div className="mt-3">
                      <TrendChart
                        series={entry.trend || []}
                        granularity="week"
                        height={110}
                        fill={false}
                        label="إجابة"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-[12px] text-muted">
                لا توجد أسئلة ذات اتجاه قابل للمقارنة في هذه الفترة
              </p>
            )}
          </Panel>

          <Panel
            title="تغيّر المندوبين بين نصفي الفترة"
            subtitle="مقارنة نصفي السلسلة الأسبوعية لنشاط كل مندوب"
          >
            {perRep.length ? (
              <ul className="space-y-2.5">
                {perRep.map((rep, index) => (
                  <li
                    key={`${rep.name}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-panel-soft px-3.5 py-2.5"
                  >
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink"
                      title={rep.name}
                    >
                      {rep.name}
                    </span>
                    <span className="shrink-0 text-[11.5px] text-muted tabular-nums">
                      {nf(rep.change?.first ?? 0)} ← {nf(rep.change?.second ?? 0)}
                    </span>
                    <Delta value={rep.change?.changePercentage} hint="بين نصفي الفترة" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-[12px] text-muted">
                لا توجد بيانات نشاط قابلة للمقارنة للمندوبين في هذه الفترة
              </p>
            )}
          </Panel>
        </div>
      </SectionState>
    </>
  );
}
