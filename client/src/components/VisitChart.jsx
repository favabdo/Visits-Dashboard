import React from 'react';
import Plot from 'react-plotly.js';
import Panel, { EmptyState } from './Panel';
import { areaFill, baseLayout, plotConfig, tokens } from '../theme/chartTheme';
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
    margin: { t: 10, r: 16, b: 48, l: 48 },
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
      {hint ? <p className="-mt-2 mb-3 text-xs text-muted">{hint}</p> : null}
      <Plot
        data={[
          {
            x: points.map(item => item.date),
            y: points.map(item => item.visitCount),
            type: 'scatter',
            mode: points.length === 1 ? 'markers' : 'lines+markers',
            name: 'الزيارات',
            line: { color: tokens.blue, width: 3, shape: 'spline', smoothing: 0.6 },
            marker: {
              color: tokens.blue,
              size: 8,
              line: { color: tokens.panel, width: 2 },
            },
            fill: 'tozeroy',
            fillcolor: areaFill,
            hovertemplate: '%{x|%d/%m}<br>%{y} زيارة<extra></extra>',
          },
        ]}
        layout={layout}
        config={plotConfig}
        useResize={true}
        style={{ width: '100%', height: '340px' }}
      />
    </Panel>
  );
};

export default VisitChart;
