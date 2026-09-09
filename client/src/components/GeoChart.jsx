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

  // Check if we have latitude and longitude in the first item
  const firstItem = chartData[0];
  if (firstItem.latitude === undefined || firstItem.longitude === undefined) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">البيانات لا تحتوي على إحداثيات latitude و longitude</p>
      </div>
    );
  }

  const lats = chartData.map(item => item.latitude);
  const lons = chartData.map(item => item.longitude);
  // We'll use a third value for marker size/color, e.g., sampleCount or visitCount
  // Assume the item has a field `value` for the magnitude
  const values = chartData.map(item => item.value || 1);

  const trace = {
    type: 'scattergeo',
    locationmode: 'ISO-3',
    lon: lons,
    lat: lats,
    text: chartData.map(item => item.label || ''), // hover text
    marker: {
      size: values.map(v => Math.max(5, Math.min(50, v))), // scale size
      color: values,
      colorscale: 'Viridis',
      reversescale: true,
      opacity: 0.7,
    },
  };

  const layout = {
    title: {
      text: title,
      font: { size: 18 },
      x: 0.5,
    },
    geo: {
      showframe: false,
      showcoastlines: true,
      projectionType: 'equirectangular',
    },
    margin: { t: 50, b: 0, l: 0, r: 0 },
    plot_bgcolor: '#fff',
    paper_bgcolor: '#fff',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Plot data={[trace]} layout={layout} useResize={true} />
    </div>
  );
};

export default GeoChart;
