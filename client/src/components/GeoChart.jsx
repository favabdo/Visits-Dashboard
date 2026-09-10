import React from 'react';
import Plot from 'react-plotly.js';

const GeoChart = ({ chartData, title = 'التوزيع الجغرافي' }) => {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">لا توجد بيانات جغرافية لعرضها</p>
      </div>
    );
  }

  const firstItem = chartData[0];
  if (firstItem.latitude === undefined || firstItem.longitude === undefined) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">البيانات لا تحتوي على إحداثيات</p>
      </div>
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
      text: inRange.map(item => `${item.label || ''} - جوّه النطاق`),
      name: 'جوّه النطاق',
      marker: { size: 8, color: '#16a34a', opacity: 0.8 },
    });
  }
  if (outRange.length) {
    traces.push({
      type: 'scattergeo',
      lon: outRange.map(item => item.longitude),
      lat: outRange.map(item => item.latitude),
      text: outRange.map(item => `${item.label || ''} - برّه النطاق`),
      name: 'برّه النطاق',
      marker: { size: 9, color: '#dc2626', opacity: 0.85 },
    });
  }

  const layout = {
    title: {
      text: title,
      font: { size: 18 },
      x: 0.5,
    },
    geo: {
      showframe: false,
      showcoastlines: true,
      showland: true,
      landcolor: '#f3f4f6',
      projection: { type: 'mercator' },
      center: { lat: 30.5, lon: 31.2 },
      lataxis: { range: [22, 32] },
      lonaxis: { range: [24, 36] },
    },
    legend: { orientation: 'h', y: -0.05 },
    margin: { t: 50, b: 40, l: 0, r: 0 },
    plot_bgcolor: '#fff',
    paper_bgcolor: '#fff',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Plot data={traces} layout={layout} useResize={true} style={{ width: '100%' }} />
    </div>
  );
};

export default GeoChart;
