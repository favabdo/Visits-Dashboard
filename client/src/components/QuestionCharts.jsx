import React from 'react';
import Plot from 'react-plotly.js';
import Panel, { EmptyState } from './Panel';
import { baseLayout, plotConfig, tokens } from '../theme/chartTheme';

const KIND_LABEL = {
  single: 'اختيار واحد',
  multi: 'اختيار متعدد',
  note: 'نص حر',
};

const RankingRow = ({ row }) => (
  <li className="flex items-center gap-2.5 py-1.5">
    <span
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-bold tabular-nums ${
        row.rank === 1 && row.value > 0 ? 'bg-accent text-white' : 'bg-panel-soft text-muted'
      }`}
    >
      {row.rank}
    </span>
    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{row.label}</span>
    <span className="shrink-0 text-[12px] font-bold tabular-nums text-ink">{row.value}</span>
    <span className="w-12 shrink-0 text-end text-[11px] tabular-nums text-muted">
      {row.percentage}%
    </span>
  </li>
);

const QuestionCard = ({ question }) => {
  const picked = question.distribution.filter(row => row.value > 0);

  const layout = {
    ...baseLayout(),
    margin: { t: 10, r: 12, b: 84, l: 48 },
    bargap: 0.45,
    xaxis: { ...baseLayout().xaxis, tickangle: -35 },
    yaxis: {
      ...baseLayout().yaxis,
      title: { text: 'العدد', font: { size: 12, color: tokens.muted } },
    },
  };

  return (
    <Panel
      title={question.text}
      subtitle={`${question.answeredCount} إجابة · ${question.responsePercentage}% من إجمالي الإجابات${
        KIND_LABEL[question.kind] ? ` · ${KIND_LABEL[question.kind]}` : ''
      }`}
    >
      {picked.length === 0 ? (
        <EmptyState text="لا توجد إجابات لهذا السؤال في الفترة المحددة" />
      ) : (
        <>
          <Plot
            data={[
              {
                x: picked.map(row => row.label),
                y: picked.map(row => row.value),
                type: 'bar',
                marker: {
                  color: picked.map((_, i) => [tokens.blue, tokens.teal, tokens.blueLight, tokens.emerald, tokens.amber, tokens.slate][i % 6]),
                  cornerradius: 8,
                },
                customdata: picked.map(row => row.percentage),
                hovertemplate: '%{x}<br>%{y} إجابة (%{customdata}%)<extra></extra>',
              },
            ]}
            layout={layout}
            config={plotConfig}
            useResize={true}
            style={{ width: '100%', height: '300px' }}
          />
          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
              ترتيب الاختيارات
            </p>
            <ul className="max-h-60 divide-y divide-line/70 overflow-y-auto pe-1">
              {question.distribution.map(row => (
                <RankingRow key={`${row.rank}-${row.label}`} row={row} />
              ))}
            </ul>
          </div>
        </>
      )}
    </Panel>
  );
};

// One card per question, exactly as the procedure returns them.
const QuestionCharts = ({ questions }) => {
  const choiceQuestions = (questions || []).filter(question => question.kind !== 'note');
  if (!choiceQuestions.length) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {choiceQuestions.map(question => (
        <QuestionCard key={question.id} question={question} />
      ))}
    </div>
  );
};

export default QuestionCharts;
