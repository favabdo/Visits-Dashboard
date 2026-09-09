import React from 'react';
import Plot from 'react-plotly.js';

const DelegatePerformanceChart = ({ chartData, title = 'أداء المندوبين: الزيارات مقابل العينات' }) => {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">لا توجد بيانات لعرضها</p>
      </div>
    );
  }

  const delegates = chartData.map(item => item.delegate);
  const visits = chartData.map(item => item.visits);
  const samples = chartData.map(item => item.samples);

  const traceVisits = {
    x: delegates,
    y: visits,
    name: 'الزيارات',
    type: 'bar',
    marker: { color: '#3b82f6' },
  };

  const traceSamples = {
    x: delegates,
    y: samples,
    name: 'العينات',
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
      title: 'المندوب',
      tickangle: -45,
    },
    yaxis: {
      title: 'العدد',
    },
    margin: { t: 50, b: 50, l: 50, r: 50 },
    barmode: 'group',
    plot_bgcolor: '#fff',
    paper_bgcolor: '#fff',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Plot data={[traceVisits, traceSamples]} layout={layout} useResize={true} />
    </div>
  );
};

export default DelegatePerformanceChart;
