import React, { useMemo, useState } from 'react';
import Panel from '../components/Panel';
import InsightFeed, { InsightCounts } from '../components/ui/InsightFeed';
import { PageIntro, SectionState } from '../components/ui/Section';
import { useAnalyticsLayout } from '../hooks/useAnalytics';
import { nf, windowLabel } from '../utils/format';

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'alert', label: 'تنبيهات' },
  { key: 'watch', label: 'ملاحظات' },
  { key: 'info', label: 'معلومات' },
];

const NO_ITEMS = [];

export default function InsightsPage() {
  const { payload, insights } = useAnalyticsLayout();
  const [filter, setFilter] = useState('all');
  const [topic, setTopic] = useState('');

  const items = insights || NO_ITEMS;
  const topics = useMemo(
    () => Array.from(new Set(items.map(item => item.topic))).sort((a, b) => a.localeCompare(b, 'ar')),
    [items]
  );
  const visible = items.filter(
    item => (filter === 'all' || item.level === filter) && (!topic || item.topic === topic)
  );

  return (
    <>
      <PageIntro
        title="الرؤى والرصد"
        caption="كل عبارة هنا مشتقة من رقم محسوب في نفس الفترة — لا أسباب مفترضة ولا استنتاجات خارج البيانات"
        meta={[
          { label: 'الفترة', value: windowLabel(payload?.overview?.window) },
          { label: 'إجمالي الرؤى', value: nf(items.length) },
        ]}
      />

      <SectionState isEmpty={!items.length} emptyText="لم تُرصد أي ملاحظة من البيانات في هذه الفترة">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <InsightCounts items={items} />
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-panel-soft p-1">
                {FILTERS.map(option => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setFilter(option.key)}
                    aria-pressed={filter === option.key}
                    className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition-colors ${
                      filter === option.key ? 'bg-panel text-ink shadow-soft' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <select
                value={topic}
                onChange={event => setTopic(event.target.value)}
                aria-label="تصفية حسب الموضوع"
                className="rounded-xl border border-line bg-panel-soft px-3 py-2 text-[12px] font-semibold text-ink outline-none focus:border-accent"
              >
                <option value="">كل المواضيع</option>
                {topics.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Panel
            title={`النتائج (${nf(visible.length)})`}
            subtitle={filter === 'all' ? 'مرتبة: التنبيهات ثم الملاحظات ثم المعلومات' : null}
          >
            <InsightFeed items={visible} />
          </Panel>

          <Panel title="كيف تُقرأ هذه العبارات؟" subtitle="خلفية منهجية">
            <ul className="space-y-2 text-[12.5px] leading-relaxed text-muted">
              <li>· «تنبيه» يعني رقمًا يتجاوز حدًا معلنًا في نفس الشاشة أو مشكلة جودة بيانات حرجة.</li>
              <li>· «ملاحظة» تعني انحرافاً يستحق النظر لكن البيانات لا تكفي للقطع بسبب له.</li>
              <li>· «معلومة» وصف مباشر لتوزيع أو اتجاه محسوب، بدون أي استنتاج سببي.</li>
              <li>· أي مؤشر لم يحسب يظهر كـ«غير محسوب» بدل أن يُملأ بافتراض.</li>
            </ul>
          </Panel>
        </div>
      </SectionState>
    </>
  );
}
