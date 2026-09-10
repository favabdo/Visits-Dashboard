import React from 'react';
import Plot from 'react-plotly.js';
import Panel, { EmptyState } from './Panel';
import { baseLayout, plotConfig, tokens } from '../theme/chartTheme';

const DelegatePerformanceChart = ({
  chartData,
  title = 'أداء المندوبين: الزيارات مقابل الإجابات',
}) => {
  if (!chartData || chartData.length === 0) {
    return (
      <Panel title={title}>
        <EmptyState />
      </Panel>
    );
  }

  const delegates = chartData.map(item => item.delegate);
  const layout = {
    ...baseLayout(),
    barmode: 'group',
    bargap: 0.35,
    bargroupgap: 0.12,
    margin: { t: 10, r: 12, b: 92, l: 48 },
    xaxis: { ...baseLayout().xaxis, tickangle: -35 },
    yaxis: {
      ...baseLayout().yaxis,
      title: { text: 'العدد', font: { size: 12, color: tokens.muted } },
    },
  };

  return (
    <Panel title={title}>
      <Plot
        data={[
          {
            x: delegates,
            y: chartData.map(item => item.visits),
            name: 'الزيارات',
            type: 'bar',
            marker: { color: tokens.blue, cornerradius: 8 },
            hovertemplate: '%{y}<extra></extra>',
          },
          {
            x: delegates,
            y: chartData.map(item => item.samples),
            name: 'الإجابات',
            type: 'bar',
            marker: { color: tokens.teal, cornerradius: 8 },
            hovertemplate: '%{y}<extra></extra>',
          },
        ]}
        layout={layout}
        config={plotConfig}
        useResize={true}
        style={{ width: '100%', height: '320px' }}
      />
    </Panel>
  );
};

export default DelegatePerformanceChart;
