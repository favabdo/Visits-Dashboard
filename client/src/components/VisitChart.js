import React, { useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';

const VisitChart = ({ chartData }) => {
  const plotRef = useRef(null);

  useEffect(() => {
    // We can update the plot when chartData changes via the key prop or by using Plot.update
    // But for simplicity, we rely on react-plotly.js to re-render when data changes.
  }, [chartData]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">لا توجد بيانات لعرضها</p>
      </div>
    );
  }

  // Prepare data for Plotly
  const dates = chartData.map(item => item.date);
  const visits = chartData.map(item => item.visitCount);

  const trace = {
    x: dates,
    y: visits,
    type: 'scatter',
    mode: 'lines+markers',
    marker: { color: '#3b82f6' },
    line: { color: '#3b82f6' },
  };

  const layout = {
    title: {
      text: 'اتجاه الزيارات على مدار الوقت',
      font: { size: 18 },
      x: 0.5,
    },
    xaxis: {
      title: 'التاريخ',
      tickangle: -45,
    },
    yaxis: {
      title: 'عدد الزيارات',
    },
    margin: { t: 50, b: 50, l: 50, r: 50 },
    hovermode: 'x unified',
    plot_bgcolor: '#fff',
    paper_bgcolor: '#fff',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Plot data={[trace]} layout={layout} useResize={true} />
    </div>
  );
};

export default VisitChart;
