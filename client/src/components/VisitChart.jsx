import React from 'react';
import Plot from 'react-plotly.js';
import Panel, { EmptyState } from './Panel';
import { baseLayout, plotConfig, tokens } from '../theme/chartTheme';
import { prepareVisitTrend } from '../utils/visitTrend';

const VisitChart = ({ chartData }) => {
  const { points, tickformat, hint } = prepareVisitTrend(chartData);

  if (!points.length) {
    return (
      <Panel title="اتجاه الزيارات">
        <EmptyState />
      </Panel>
    );
  }

  const layout = {
    ...baseLayout(),
    margin: { t: 8, r: 16, b: 56, l: 44 },
    hovermode: 'x unified',
    xaxis: {
      ...baseLayout().xaxis,
      type: 'date',
      tickformat,
      nticks: Math.min(8, points.length),
    },
    yaxis: {
      ...baseLayout().yaxis,
      title: { text: 'زيارات', font: { size: 12, color: tokens.muted } },
    },
  };

  return (
    <Panel title="اتجاه الزيارات">
      {hint ? <p className="text-xs text-muted -mt-2 mb-3">{hint}</p> : null}
      <Plot
        data={[
          {
            x: points.map(item => item.date),
            y: points.map(item => item.visitCount),
            type: 'scatter',
            mode: points.length === 1 ? 'markers' : 'lines+markers',
            marker: { color: tokens.camo, size: 7 },
            line: { color: tokens.camo, width: 2, shape: 'linear' },
            hoverinfo: 'x+y',
          },
        ]}
        layout={layout}
        config={plotConfig}
        useResize={true}
        style={{ width: '100%', height: '360px' }}
      />
    </Panel>
  );
};

export default VisitChart;
