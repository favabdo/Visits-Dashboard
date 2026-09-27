import React from 'react';
import Plot from 'react-plotly.js';
import { plotConfig, plotFont, tokens } from '../../theme/chartTheme';
import { nf } from '../../utils/format';
import { COLORS } from './TrendChart';

/** Donut for a small closed set of categories; the centre shows the total. */
export default function DonutChart({
  rows = [],
  height = 300,
  totalLabel = 'إجمالي الاستجابات',
  holeColor = tokens.panel,
}) {
  const present = rows.filter(row => row && row.count > 0);
  const total = present.reduce((sum, row) => sum + row.count, 0);

  return (
    <Plot
      data={[
        {
          type: 'pie',
          hole: 0.58,
          sort: false,
          direction: 'counterclockwise',
          labels: present.map(row => row.label),
          values: present.map(row => row.count),
          textinfo: 'percent',
          textposition: 'outside',
          outsideorient: 'any',
          marker: {
            colors: COLORS,
            line: { color: tokens.panel, width: 2 },
          },
          pull: 0,
          hovertemplate: `%{label}<br>%{value} · %{percent}<extra></extra>`,
        },
      ]}
      layout={{
        font: plotFont,
        paper_bgcolor: tokens.panel,
        plot_bgcolor: tokens.panel,
        showlegend: true,
        margin: { t: 10, r: 10, b: 10, l: 10 },
        legend: {
          orientation: 'v',
          x: 1,
          xanchor: 'right',
          y: 0.5,
          yanchor: 'middle',
          font: { size: 11, color: tokens.muted },
        },
        annotations: total
          ? [
              {
                text: `<b>${nf(total)}</b><br><span style="font-size:10px">${totalLabel}</span>`,
                showarrow: false,
                font: { size: 17, color: tokens.ink, family: plotFont.family },
                bgcolor: holeColor,
              },
            ]
          : [],
      }}
      config={plotConfig}
      useResize
      style={{ width: '100%', height: `${height}px` }}
    />
  );
}
