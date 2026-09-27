import React from 'react';
import Plot from 'react-plotly.js';
import { plotConfig, plotFont, tokens } from '../../theme/chartTheme';
import { nf } from '../../utils/format';

const EGYPT_VIEW = { lat: 30.5, lon: 31.2, range: { lat: [22, 32], lon: [24, 36] } };

function geoLayout() {
  return {
    font: plotFont,
    paper_bgcolor: tokens.panel,
    plot_bgcolor: tokens.panel,
    margin: { t: 8, b: 34, l: 8, r: 8 },
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
      projection: { type: 'mercator' },
      center: { lat: EGYPT_VIEW.lat, lon: EGYPT_VIEW.lon },
      lataxis: { range: EGYPT_VIEW.range.lat },
      lonaxis: { range: EGYPT_VIEW.range.lon },
    },
    legend: { orientation: 'h', y: -0.08, font: { size: 11, color: tokens.muted } },
  };
}

/**
 * Field map: density bubbles where several visits land in the same cell, plus the
 * individual points coloured by in/out of range.
 */
export default function GeoMap({ points = [], density = [], height = 380, showPoints = true }) {
  const traces = [];
  const maxDensity = Math.max(...density.map(cell => cell.visits), 1);

  if (density.length) {
    traces.push({
      type: 'scattergeo',
      mode: 'markers',
      name: 'كثافة الزيارات',
      lon: density.map(cell => cell.longitude),
      lat: density.map(cell => cell.latitude),
      marker: {
        size: density.map(cell => 14 + (cell.visits / maxDensity) * 34),
        color: 'rgba(37, 99, 235, 0.22)',
        line: { color: tokens.blueDeep, width: 1 },
        sizemode: 'diameter',
      },
      customdata: density.map(cell => [cell.visits, cell.customers, cell.outOfRange, cell.areas.join(' · ')]),
      hovertemplate:
        'منطقة %{customdata[3]}<br>%{customdata[0]} زيارة · %{customdata[1]} عميل · %{customdata[2]} خارج النطاق<extra></extra>',
      showlegend: false,
    });
  }

  if (showPoints && points.length) {
    const groups = [
      { key: false, name: 'جوّه النطاق', color: tokens.emerald },
      { key: true, name: 'برّه النطاق', color: tokens.amber },
    ];
    groups.forEach(group => {
      const own = points.filter(point => point.outOfRange === group.key);
      if (!own.length) return;
      traces.push({
        type: 'scattergeo',
        mode: 'markers',
        name: group.name,
        lon: own.map(point => point.longitude),
        lat: own.map(point => point.latitude),
        marker: { size: 8, color: group.color, line: { color: tokens.panel, width: 1.4 } },
        customdata: own.map(point => [point.customer, point.rep, point.area, point.date]),
        hovertemplate:
          '%{customdata[0]}<br>المندوب: %{customdata[1]} · %{customdata[2]}<br>%{customdata[3]}<extra></extra>',
      });
    });
  }

  if (!traces.length) {
    return <p className="py-8 text-center text-[12px] text-muted">لا توجد إحداثيات صالحة في هذه الفترة</p>;
  }

  return (
    <div>
      <Plot
        data={traces}
        layout={geoLayout()}
        config={plotConfig}
        useResize
        style={{ width: '100%', height: `${height}px` }}
      />
      <p className="mt-1 text-[11px] text-muted">
        {nf(points.length)} نقطة صالحة · {nf(density.length)} خلية كثافة رئيسية
      </p>
    </div>
  );
}
