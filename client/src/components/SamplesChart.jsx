import React from 'react';
import Plot from 'react-plotly.js';
import Panel, { EmptyState } from './Panel';
import { baseLayout, plotConfig, tokens } from '../theme/chartTheme';

const PALETTE = [
  tokens.blue,
  tokens.teal,
  tokens.blueLight,
  tokens.emerald,
  tokens.amber,
  tokens.slate,
];

const SamplesChart = ({ chartData, title = 'التوزيع' }) => {
  if (!chartData || chartData.length === 0) {
    return (
      <Panel title={title}>
        <EmptyState />
      </Panel>
    );
  }

  const labels = chartData.map(item => item.label);
  const values = chartData.map(item => item.value);
  const single = labels.length === 1;
  const longest = labels.reduce((max, label) => Math.max(max, String(label).length), 0);
  const rotate = !single && (labels.length > 4 || longest > 10);

  const layout = {
    ...baseLayout(),
    margin: { t: 10, r: 12, b: rotate ? 84 : 48, l: 48 },
    bargap: 0.45,
    xaxis: {
      ...baseLayout().xaxis,
      tickangle: rotate ? -35 : 0,
    },
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
            x: labels,
            y: values,
            type: 'bar',
            marker: {
              color: single ? tokens.blue : labels.map((_, i) => PALETTE[i % PALETTE.length]),
              cornerradius: 8,
            },
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

export default SamplesChart;
