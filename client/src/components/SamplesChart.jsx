import React from 'react';
import Plot from 'react-plotly.js';
import Panel, { EmptyState } from './Panel';
import { baseLayout, plotConfig, tokens } from '../theme/chartTheme';

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
  const palette = [tokens.camo, tokens.choco, tokens.brown, tokens.sand, tokens.camoSoft];

  const layout = {
    ...baseLayout(),
    margin: { t: 8, r: 8, b: 80, l: 40 },
    xaxis: {
      ...baseLayout().xaxis,
      tickangle: -35,
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
              color: labels.map((_, i) => palette[i % palette.length]),
            },
            hoverinfo: 'x+y',
          },
        ]}
        layout={layout}
        config={plotConfig}
        useResize={true}
        style={{ width: '100%' }}
      />
    </Panel>
  );
};

export default SamplesChart;
