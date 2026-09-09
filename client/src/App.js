import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MetricsCards from './components/MetricsCards';
import VisitChart from './components/VisitChart';
import SamplesChart from './components/SamplesChart';
import DelegatePerformanceChart from './components/DelegatePerformanceChart';
import GeoChart from './components/GeoChart';
import { fetchDashboardData } from './services/api';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchDashboardData(dateRange);
        setData(result);
      } catch (err) {
        setError(err.message || 'حدث خطأ غير متوقع');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-[calc(100vh-64px)]">
          <Sidebar onDateChange={setDateRange} />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-[calc(100vh-64px)]">
          <Sidebar onDateChange={setDateRange} />
          <main className="flex-1 p-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Extract data for each component
  const totals = data.totals || {};
  const visitTrend = data.visitTrend || [];
  const samplesByDelegate = data.samplesByDelegate || [];
  const delegatePerformance = data.delegatePerformance || [];
  const geoData = data.geoData || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex min-h-[calc(100vh-64px)]">
        <Sidebar onDateChange={setDateRange} />
        <main className="flex-1 p-6">
          <div className="grid gap-6">
            {/* Metrics Cards - full width on extra small, half on small, quarter on large */}
            <MetricsCards data={totals} />
            {/* Visit Chart - full width */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-2">
              <VisitChart chartData={visitTrend} />
            </div>
            {/* Samples Chart - half width on small and up */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-1">
              <SamplesChart
                chartData={samplesByDelegate}
                title='توزيع العينات حسب المندوب'
              />
            </div>
            {/* Delegate Performance Chart - half width on small and up */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-1">
              <DelegatePerformanceChart
                chartData={delegatePerformance}
                title='أداء المندوبين: الزيارات مقابل العينات'
              />
            </div>
            {/* Geo Chart - full width on large and up, otherwise half */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-2">
              <GeoChart chartData={geoData} title='التوزيع الجغرافي' />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
