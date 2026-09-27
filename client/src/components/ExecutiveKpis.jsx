import React from 'react';

const Card = ({ label, value, hint, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-accent-soft text-accent',
    teal: 'bg-teal-soft text-teal',
    green: 'bg-success-soft text-success',
    amber: 'bg-choco-soft text-choco',
  };
  return (
    <div className="rounded-card border border-line bg-panel p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
          <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 19V9M12 19V5M19 19v-6" />
            <path d="M3 21h18" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-muted">{label}</p>
          <p className="mt-1 truncate text-[15px] font-extrabold text-ink">{value}</p>
          {hint ? <p className="mt-0.5 truncate text-[11px] text-muted tabular-nums">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
};

const ExecutiveKpis = ({ kpis, totals }) => {
  const stats = kpis || {};
  const numbers = totals || {};

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card
        label="أكثر إجابة شيوعًا"
        value={stats.topAnswer ? stats.topAnswer.option : '—'}
        hint={stats.topAnswer ? `${stats.topAnswer.question} · ${stats.topAnswer.percentage}%` : undefined}
        tone="blue"
      />
      <Card
        label="أكثر منتج مطلوب"
        value={stats.mostRequestedProduct ? stats.mostRequestedProduct.option : '—'}
        hint={
          stats.mostRequestedProduct
            ? `${stats.mostRequestedProduct.question} · ${stats.mostRequestedProduct.value} إجابة`
            : 'لا يوجد سؤال باختيار متعدد'
        }
        tone="teal"
      />
      <Card
        label="أكثر سؤال إجابة"
        value={stats.mostAnsweredQuestion ? stats.mostAnsweredQuestion.text : '—'}
        hint={
          stats.mostAnsweredQuestion
            ? `${stats.mostAnsweredQuestion.answeredCount} إجابة · ${stats.mostAnsweredQuestion.responsePercentage}%`
            : undefined
        }
        tone="green"
      />
      <Card
        label="أقل سؤال إجابة"
        value={stats.leastAnsweredQuestion ? stats.leastAnsweredQuestion.text : '—'}
        hint={
          stats.leastAnsweredQuestion
            ? `${stats.leastAnsweredQuestion.answeredCount} إجابة · ${stats.leastAnsweredQuestion.responsePercentage}%`
            : undefined
        }
        tone="amber"
      />
      <Card
        label="نسبة استكمال الاستمارة"
        value={`${numbers.formCompletionRate ?? 0}%`}
        hint={`${numbers.completedVisits ?? 0} من ${numbers.totalVisits ?? 0} زيارة`}
        tone="green"
      />
      <Card
        label="زيارات برّه النطاق"
        value={`${numbers.outOfRangeRate ?? 0}%`}
        hint={`${numbers.outOfRangeVisits ?? 0} زيارة`}
        tone="amber"
      />
    </div>
  );
};

export default ExecutiveKpis;
