import React from 'react';
import Plot from 'react-plotly.js';
import { baseLayout, plotConfig, plotFont, tokens } from '../../theme/chartTheme';
import { periodLabel } from '../../utils/format';

const COLORS = [
  tokens.blue, tokens.teal, tokens.amber, tokens.emerald,
  tokens.blueLight, tokens.slate, tokens.blueDeep,
];

// Category axis with Arabic period labels: plotly's date axis formats in English.
function axisTicks(points, granularity) {
  return points.map(point => periodLabel(point.period, granularity));
}

/** Line/area chart over the engine's `[{ period, count }]` series. */
export default function TrendChart({
  series = [],
  granularity = 'day',
  height = 280,
  color = tokens.blue,
  fill = true,
  label = 'العدد',
  multi = null,
}) {
  const traces = multi?.length
    ? multi.map((entry, index) => ({
        type: 'scatter',
        mode: 'lines+markers',
        name: entry.label,
        x: axisTicks(entry.series, entry.granularity || granularity),
        y: entry.series.map(point => point.count),
        line: { color: COLORS[index % COLORS.length], width: 2.2, shape: 'spline' },
        marker: { size: 5 },
        hovertemplate: `%{y} %{fullData.name}<extra></extra>`,
      }))
    : [
        {
          type: 'scatter',
          mode: 'lines+markers',
          name: label,
          x: axisTicks(series, granularity),
          y: series.map(point => point.count),
          line: { color, width: 2.6, shape: 'spline' },
          marker: { size: 6 },
          fill: fill ? 'tozeroy' : undefined,
          fillcolor: fill ? `${color}1a` : undefined,
          customdata: series.map(point => point.period),
          hovertemplate: `%{y} ${label}<br>%{customdata}<extra></extra>`,
        },
      ];

  const axis = baseLayout();
  const layout = {
    ...axis,
    font: plotFont,
    showlegend: Boolean(multi?.length && multi.length > 1),
    margin: { t: 12, r: 14, b: 56, l: 40 },
    xaxis: { ...axis.xaxis, tickangle: -25, nticks: 7, automargin: true },
    yaxis: { ...axis.yaxis, rangemode: 'tozero', nticks: 5 },
    hovermode: 'x unified',
  };

  return (
    <Plot
      data={traces}
      layout={layout}
      config={plotConfig}
      useResize
      style={{ width: '100%', height: `${height}px` }}
    />
  );
}

export { COLORS };
