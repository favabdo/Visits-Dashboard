import React from 'react';
import SamplesChart from './SamplesChart';

// Renders one chart per question exactly as the stored procedure returns them.
const QuestionCharts = ({ questions }) => {
  const choiceQuestions = (questions || []).filter(question => question.kind !== 'note');
  if (!choiceQuestions.length) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {choiceQuestions.map(question => (
        <SamplesChart
          key={question.id}
          chartData={question.distribution}
          title={question.text}
          subtitle={`${question.answeredCount} إجابة${question.optionCount ? ` · ${question.optionCount} اختيار` : ''}`}
        />
      ))}
    </div>
  );
};

export default QuestionCharts;
