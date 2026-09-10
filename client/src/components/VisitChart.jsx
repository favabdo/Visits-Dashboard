import React from 'react';
import Plot from 'react-plotly.js';
import Panel, { EmptyState } from './Panel';
import { baseLayout, plotConfig, tokens } from '../theme/chartTheme';

const VisitChart = ({ chartData }) => {
  if (!chartData || chartData.length === 0) {
    return (
      <Panel title="اتجاه الزيارات">
        <EmptyState />
      </Panel>
    );
  }

  const layout = {
    ...baseLayout(),
    margin: { t: 8, r: 12, b: 48, l: 44 },
    hovermode: 'x unified',
    xaxis: { ...baseLayout().xaxis },
    yaxis: {
      ...baseLayout().yaxis,
      title: { text: 'زيارات', font: { size: 12, color: tokens.muted } },
    },
  };

  return (
    <Panel title="اتجاه الزيارات">
      <Plot
        data={[
          {
            x: chartData.map(item => item.date),
            y: chartData.map(item => item.visitCount),
            type: 'scatter',
            mode: 'lines+markers',
            marker: { color: tokens.camo, size: 6 },
            line: { color: tokens.camo, width: 2 },
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

export default VisitChart;
