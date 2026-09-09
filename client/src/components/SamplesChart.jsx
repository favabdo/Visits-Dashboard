import React from 'react';
import Plot from 'react-plotly.js';

const SamplesChart = ({ chartData, title = 'توزيع العينات' }) => {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">لا توجد بيانات لعرضها</p>
      </div>
    );
  }

  const labels = chartData.map(item => item.label);
  const values = chartData.map(item => item.value);

  const trace = {
    x: labels,
    y: values,
    type: 'bar',
    marker: { color: '#10b981' },
  };

  const layout = {
    title: {
      text: title,
      font: { size: 18 },
      x: 0.5,
    },
    xaxis: {
      title: 'البند',
      tickangle: -45,
    },
    yaxis: {
      title: 'العدد',
    },
    margin: { t: 50, b: 50, l: 50, r: 50 },
    plot_bgcolor: '#fff',
    paper_bgcolor: '#fff',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Plot data={[trace]} layout={layout} useResize={true} />
    </div>
  );
};

export default SamplesChart;
