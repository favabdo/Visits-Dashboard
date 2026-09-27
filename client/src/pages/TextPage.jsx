import React from 'react';
import Panel from '../components/Panel';
import StatsRow from '../components/ui/StatsRow';
import RankBars from '../components/ui/RankBars';
import Table from '../components/ui/Table';
import DonutChart from '../components/ui/DonutChart';
import { TermChips } from '../components/ui/Delta';
import { PageIntro, SectionState } from '../components/ui/Section';
import { useAnalyticsSection } from '../hooks/useAnalytics';
import { nf, pf, windowLabel } from '../utils/format';

export default function TextPage() {
  const { data, loading, error, retry } = useAnalyticsSection('text');
  const section = data?.data;

  const notesCount = section?.notesCount ?? 0;
  const sentiment = section?.sentiment || {};
  const keywords = section?.keywords || [];
  const phrases = section?.phrases || [];
  const complaints = section?.complaints || [];
  const requests = section?.requests || [];
  const positiveFeedback = section?.positiveFeedback || [];
  const productMentions = section?.productMentions || [];
  const locationMentions = section?.locationMentions || [];
  const repeatedIssues = section?.repeatedIssues || [];

  const positive = sentiment.positive ?? 0;
  const neutral = sentiment.neutral ?? 0;
  const negative = sentiment.negative ?? 0;
  const followUpMentions = requests.reduce((sum, item) => sum + (item.count || 0), 0);

  const share = value => (notesCount ? Number(((value * 100) / notesCount).toFixed(1)) : null);
  const positiveShare = share(positive);
  const neutralShare = share(neutral);
  const negativeShare = share(negative);
  const followUpShare = share(followUpMentions);

  const sentimentRows = [
    { label: 'أثر إيجابي', count: positive },
    { label: 'أثر محايد', count: neutral },
    { label: 'أثر سلبي', count: negative },
  ];

  const issueColumns = [
    { key: 'customer', label: 'العميل' },
    { key: 'term', label: 'الكلمة أو الإشارة' },
    { key: 'count', label: 'عدد التكرار', numeric: true },
    {
      key: 'sentiment',
      label: 'نوع الإشارة',
      render: row => {
        const negativeSignal = row.sentiment === 'negative';
        return (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
              negativeSignal ? 'bg-danger-soft text-danger' : 'bg-choco-soft text-choco'
            }`}
          >
            {negativeSignal ? 'سلبية' : 'متابعة'}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageIntro
        title="تحليل النصوص"
        caption="قراءة آلية للملاحظات النصية: الكلمات والعبارات والأثر وطلبات المتابعة، محسوبة داخل الخادم فقط"
        meta={[
          { label: 'الفترة الفعلية', value: windowLabel(data?.window) },
          { label: 'ملاحظات نصية', value: nf(notesCount) },
        ]}
      />

      <SectionState
        loading={loading && !section}
        error={error}
        onRetry={retry}
        isEmpty={!notesCount}
        emptyText="لا توجد ملاحظات نصية في هذه الفترة"
      >
        <div className="space-y-6">
          <StatsRow
            columns={6}
            items={[
              {
                key: 'notes',
                label: 'الملاحظات النصية',
                value: notesCount,
                tone: 'accent',
                hint: 'إجابات نصية حرة من الزيارات',
              },
              {
                key: 'pos',
                label: 'ملاحظات إيجابية',
                value: positive,
                tone: 'teal',
                progress: positiveShare,
                hint: `${pf(positiveShare)} من الملاحظات`,
              },
              {
                key: 'neu',
                label: 'ملاحظات محايدة',
                value: neutral,
                tone: 'neutral',
                progress: neutralShare,
                hint: `${pf(neutralShare)} من الملاحظات`,
              },
              {
                key: 'neg',
                label: 'ملاحظات سلبية',
                value: negative,
                tone: 'danger',
                progress: negativeShare,
                hint: `${pf(negativeShare)} من الملاحظات`,
              },
              {
                key: 'negRate',
                label: 'نسبة الملاحظات السلبية',
                value: negativeShare ?? '—',
                suffix: '%',
                tone: 'danger',
                progress: negativeShare,
                hint: `${nf(negative)} من ${nf(notesCount)}`,
              },
              {
                key: 'fuRate',
                label: 'نسبة طلبات المتابعة',
                value: followUpShare ?? '—',
                suffix: '%',
                tone: 'warning',
                progress: followUpShare,
                hint: `${nf(followUpMentions)} إشارة · من ${nf(notesCount)} ملاحظة`,
              },
            ]}
          />

          <Panel
            title="كيف تُحسب هذه التحليلات؟"
            subtitle="متطلب أساسي في المشروع: تحليل النص يتم بالكامل داخل الخادم"
          >
            <div className="space-y-2.5 text-[12.5px] leading-snug text-muted">
              <p>
                تُحلَّل النصوص بقواعد جاهزة داخل الخادم فقط: تُطبَّع الكلمات العربية، ثم تُستخرج
                الكلمات والعبارات المتكررة، وتُطابَق مصطلحات الشكوى وطلب المتابعة والإشادة من قوائم
                ثابتة لا تحتاج إلى أي اتصال خارجي.
              </p>
              <p className="rounded-xl bg-panel-soft px-3.5 py-2.5 text-ink">
                لا يُستدعى أي خدمة تحليل نص خارجية، ولا تُرسَل نصوص العملاء أو ملاحظاتهم خارج الخادم
                إطلاقاً. تصنيف الأثر إلى إيجابي ومحايد وسلبي يعتمد على المصطلحات المطابقة داخل
                الملاحظة نفسها، وليس على نموذج لغوي خارجي.
              </p>
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="توزيع الأثر في الملاحظات" subtitle="كل ملاحظة تُحسب في تصنيف واحد فقط">
              <DonutChart rows={sentimentRows} totalLabel="ملاحظة محللة" height={260} />
            </Panel>
            <Panel title="أكثر الكلمات استخداماً" subtitle="كلمات بعد إزالة أدوات الربط والتكرار">
              <TermChips terms={keywords} tone="accent" emptyText="لا توجد كلمات مميزة في هذه الفترة" />
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="عبارات متكررة" subtitle="ثنائيات الكلمات الأكثر وروداً معاً">
              <TermChips terms={phrases} tone="accent" emptyText="لا توجد عبارات متكررة في هذه الفترة" />
            </Panel>
            <Panel title="كلمات الشكوى" subtitle="مصطلحات سلبية مطابقة داخل الملاحظات">
              <TermChips terms={complaints} tone="danger" emptyText="لا توجد مصطلحات شكوى في هذه الفترة" />
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="طلبات المتابعة" subtitle="إشارات رغبة العميل في التواصل أو المتابعة">
              <TermChips terms={requests} tone="warning" emptyText="لا توجد طلبات متابعة في هذه الفترة" />
            </Panel>
            <Panel title="إشادات إيجابية" subtitle="مصطلحات الرضا والمدح داخل الملاحظات">
              <TermChips terms={positiveFeedback} tone="teal" emptyText="لا توجد إشادات في هذه الفترة" />
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="المنتجات والخيارات المذكورة"
              subtitle="مطابقة نص الملاحظة مع خيارات الاستبيان"
            >
              <RankBars
                rows={productMentions.map(item => ({ label: item.term, count: item.count }))}
                unit="ذكر"
                tone="accent"
                limit={10}
                emptyText="لا توجد إشارات إلى منتجات في هذه الفترة"
              />
            </Panel>
            <Panel title="المناطق المرتبطة بالملاحظات" subtitle="توزيع الملاحظات حسب منطقة الزيارة">
              <RankBars
                rows={locationMentions.map(item => ({ label: item.term, count: item.count }))}
                unit="ملاحظة"
                tone="teal"
                limit={10}
                emptyText="لا توجد مناطق مرتبطة بملاحظات في هذه الفترة"
              />
            </Panel>
          </div>

          <Panel
            title="قضايا متكررة لنفس العميل"
            subtitle="كلمة أو إشارة تكرر ظهورها أكثر من مرة في ملاحظات العميل نفسه"
          >
            <Table
              rows={repeatedIssues}
              columns={issueColumns}
              initialSort={{ key: 'count', dir: 'desc' }}
              emptyText="لا توجد قضايا متكررة في هذه الفترة"
            />
          </Panel>
        </div>
      </SectionState>
    </>
  );
}
