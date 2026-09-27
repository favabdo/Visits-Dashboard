import React, { useMemo, useState } from 'react';
import Panel from '../components/Panel';
import StatsRow from '../components/ui/StatsRow';
import RankBars from '../components/ui/RankBars';
import Table from '../components/ui/Table';
import { PageIntro, SectionState } from '../components/ui/Section';
import { useAnalyticsSection } from '../hooks/useAnalytics';
import { nf, periodLabel, pf, windowLabel } from '../utils/format';

/** أعلى مندوبين استخدموا الخيار — أسماء مقروءة فقط، لا معرِّفات. */
const topReps = row =>
  row.byRep?.length
    ? row.byRep.slice(0, 2).map(item => `${item.label} (${nf(item.count)})`).join('، ')
    : '—';

/** المؤشر النصي يُرسم بخط كبير، فيُختصر الطويل للعرض فقط ويبقى الوصف كاملاً أسفله. */
const shorten = (text, max = 34) =>
  text == null ? '—' : String(text).length > max ? `${String(text).slice(0, max - 1)}…` : String(text);

export default function AnswersPage() {
  const { data, loading, error, retry } = useAnalyticsSection('options');
  const [query, setQuery] = useState('');
  const section = data?.data;
  const list = useMemo(() => section?.list || [], [section]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      option =>
        String(option.label || '').toLowerCase().includes(needle) ||
        String(option.question || '').toLowerCase().includes(needle)
    );
  }, [list, query]);

  const used = useMemo(() => list.filter(option => option.count > 0), [list]);
  const unused = useMemo(() => list.filter(option => !option.count), [list]);
  const mostUsed = used[0] || null;

  const columns = [
    {
      key: 'question',
      label: 'السؤال',
      render: row => (
        <span className="block max-w-[240px] truncate text-[12px] text-muted" title={row.question}>
          {row.question || '—'}
        </span>
      ),
    },
    {
      key: 'label',
      label: 'الخيار',
      render: row => (
        <span className="block max-w-[220px] truncate font-semibold" title={row.label}>
          {row.label || 'خيار بدون نص'}
        </span>
      ),
    },
    { key: 'count', label: 'عدد', numeric: true },
    { key: 'percentage', label: 'نسبة من إجابات السؤال', numeric: true, render: row => pf(row.percentage) },
    {
      key: 'shareOfAllAnswers',
      label: 'نسبة من كل الإجابات',
      numeric: true,
      render: row => (row.shareOfAllAnswers == null ? 'غير محسوب' : pf(row.shareOfAllAnswers)),
    },
    {
      key: 'firstSeen',
      label: 'أول ظهور',
      render: row => <span className="text-[11.5px]">{periodLabel(row.firstSeen)}</span>,
    },
    {
      key: 'lastSeen',
      label: 'آخر ظهور',
      render: row => <span className="text-[11.5px]">{periodLabel(row.lastSeen)}</span>,
    },
    {
      key: 'byRep',
      label: 'استخدام حسب المندوب',
      sortable: false,
      render: row => <span className="text-[11.5px]">{topReps(row)}</span>,
    },
  ];

  return (
    <>
      <PageIntro
        title="الإجابات والخيارات"
        caption="كل خيار في الاستبيان ونصيبه من الإجابات: كم مرة استُخدم، وفي أي سؤال، ومن أي مندوب"
        meta={[
          { label: 'الفترة الفعلية', value: windowLabel(data?.window) },
          { label: 'خيارات معروفة', value: nf(section?.count ?? list.length) },
          { label: 'خيارات مستخدمة', value: nf(used.length) },
        ]}
      />

      <SectionState
        loading={loading && !section}
        error={error}
        onRetry={retry}
        isEmpty={!list.length}
        emptyText="لا توجد خيارات مرتبطة بأسئلة الاستبيان في هذه الفترة"
      >
        <div className="space-y-6">
          <StatsRow
            columns={4}
            items={[
              {
                key: 'total',
                label: 'عدد الخيارات',
                value: section?.count ?? list.length,
                hint: `${nf(used.length)} خيار استُخدم مرة واحدة على الأقل`,
              },
              {
                key: 'used',
                label: 'خيارات استُخدمت فعلاً',
                value: used.length,
                tone: 'success',
                hint: `مجموع استخداماتها ${nf(used.reduce((sum, option) => sum + (option.count || 0), 0))} إجابة`,
              },
              {
                key: 'top',
                label: 'أعلى خيار تكراراً',
                value: mostUsed ? shorten(mostUsed.label) : 'لا توجد إجابات',
                tone: 'accent',
                hint: mostUsed
                  ? `${mostUsed.label} — ${mostUsed.question} · ${nf(mostUsed.count)} إجابة (${pf(mostUsed.percentage)})`
                  : 'لم يُسجَّل أي استخدام لخيار ضمن الفترة',
              },
              {
                key: 'unused',
                label: 'خيارات بلا أي استخدام',
                value: unused.length,
                tone: unused.length ? 'warning' : 'neutral',
                hint: unused.length ? 'قد تكون خيارات جديدة أو مهملة في الميدان' : 'كل الخيارات استُخدمت',
              },
            ]}
          />

          <Panel
            title="قائمة الخيارات"
            subtitle="نسبة السؤال تُقارن بإجابات السؤال نفسه، ونسبة كل الإجابات تُقارن بإجمالي إجابات الفترة"
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="بحث باسم الخيار أو السؤال"
                aria-label="بحث في الخيارات"
                className="w-full max-w-sm rounded-xl border border-line bg-panel-soft px-3.5 py-2 text-[13px] text-ink outline-none transition focus:border-accent focus:bg-panel"
              />
              <span className="text-[12px] text-muted">
                {nf(rows.length)} من {nf(list.length)} خيار
              </span>
            </div>
            <Table
              columns={columns}
              rows={rows.map(option => ({ ...option, key: `${option.question} :: ${option.label}` }))}
              initialSort={{ key: 'count', dir: 'desc' }}
            />
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="أكثر الخيارات استخداماً"
              subtitle="أعلى عشرة خيارات بعدد الإجابات، والنسبة داخل إجابات السؤال نفسه"
            >
              <RankBars
                rows={used.slice(0, 10).map(option => ({
                  label: option.label,
                  count: option.count,
                  percentage: option.percentage,
                }))}
                unit="إجابة"
                tone="accent"
                emptyText="لم يُستخدم أي خيار في هذه الفترة"
              />
            </Panel>
            <Panel
              title="خيارات لم تُستخدم إطلاقاً"
              subtitle={`${nf(unused.length)} خيار معرَّف بالاستبيان لكنه لم يستقبل أي إجابة ضمن الفترة`}
            >
              <RankBars
                rows={unused.map(option => ({
                  label: option.label,
                  count: 0,
                  percentage: 0,
                }))}
                unit="خيار"
                tone="neutral"
                limit={12}
                emptyText="كل الخيارات لها استخدام واحد على الأقل"
              />
            </Panel>
          </div>
        </div>
      </SectionState>
    </>
  );
}
