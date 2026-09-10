import React from 'react';
import Plot from 'react-plotly.js';
import Panel, { EmptyState } from './Panel';
import { plotConfig, plotFont, tokens } from '../theme/chartTheme';

const markerStyle = color => ({
  size: 9,
  color,
  line: { color: tokens.panel, width: 1.5 },
});

const GeoChart = ({ chartData, title = 'التوزيع الجغرافي حسب النطاق' }) => {
  if (!chartData || chartData.length === 0) {
    return (
      <Panel title={title}>
        <EmptyState text="لا توجد إحداثيات لعرضها" />
      </Panel>
    );
  }

  const firstItem = chartData[0];
  if (firstItem.latitude === undefined || firstItem.longitude === undefined) {
    return (
      <Panel title={title}>
        <EmptyState text="البيانات لا تحتوي على إحداثيات" />
      </Panel>
    );
  }

  const inRange = chartData.filter(item => !item.outOfRange);
  const outRange = chartData.filter(item => item.outOfRange);
  const traces = [];

  if (inRange.length) {
    traces.push({
      type: 'scattergeo',
      lon: inRange.map(item => item.longitude),
      lat: inRange.map(item => item.latitude),
      text: inRange.map(item => `${item.label || ''} · جوّه النطاق`),
      name: 'جوّه النطاق',
      marker: markerStyle(tokens.emerald),
      hovertemplate: '%{text}<extra></extra>',
    });
  }
  if (outRange.length) {
    traces.push({
      type: 'scattergeo',
      lon: outRange.map(item => item.longitude),
      lat: outRange.map(item => item.latitude),
      text: outRange.map(item => `${item.label || ''} · برّه النطاق`),
      name: 'برّه النطاق',
      marker: markerStyle(tokens.amber),
      hovertemplate: '%{text}<extra></extra>',
    });
  }

  const layout = {
    font: plotFont,
    paper_bgcolor: tokens.panel,
    plot_bgcolor: tokens.panel,
    margin: { t: 10, b: 40, l: 0, r: 0 },
    hoverlabel: {
      bgcolor: tokens.ink,
      bordercolor: tokens.ink,
      font: { family: plotFont.family, size: 12, color: '#ffffff' },
      align: 'right',
    },
    geo: {
      bgcolor: '#e3effc',
      showframe: false,
      showcoastlines: true,
      coastlinecolor: '#c8dcf1',
      showcountries: true,
      countrycolor: '#d3e4f6',
      showland: true,
      landcolor: tokens.panel,
      showlakes: false,
      projection: { type: 'mercator' },
      center: { lat: 30.5, lon: 31.2 },
      lataxis: { range: [22, 32] },
      lonaxis: { range: [24, 36] },
    },
    legend: {
      orientation: 'h',
      y: -0.06,
      font: { size: 12, color: tokens.muted },
    },
  };

  return (
    <Panel title={title}>
      <Plot
        data={traces}
        layout={layout}
        config={plotConfig}
        useResize={true}
        style={{ width: '100%', height: '330px' }}
      />
    </Panel>
  );
};

export default GeoChart;
