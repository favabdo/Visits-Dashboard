import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MetricsCards from './components/MetricsCards';
import VisitChart from './components/VisitChart';
import SamplesChart from './components/SamplesChart';
import DelegatePerformanceChart from './components/DelegatePerformanceChart';
import GeoChart from './components/GeoChart';
import Settings from './components/Settings';
import { fetchDashboardData } from './services/api';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const token = localStorage.getItem('accessToken');

  // If no token, redirect to settings/login
  if (!token) {
    return (
      <Router>
        <Routes>
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/settings" replace />} />
        </Routes>
      </Router>
    );
  }

  // Fetch dashboard data when token present
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchDashboardData(dateRange);
        setData(result);
      } catch (err) {
        setError(err.message || 'خطأ غير متوقع');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex min-h-[calc(100vh-64px)]">
            <Sidebar onDateChange={setDateRange} />
            <main className="flex-1 p-6">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">جاري تحميل البيانات…</p>
              </div>
            </main>
          </div>
        </div>
      </Router>
    );
  }

  if (error) {
    return (
      <Router>
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
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-[calc(100vh-64px)]">
          <Sidebar onDateChange={setDateRange} />
          <main className="flex-1 p-6">
            <div className="grid gap-6">
              <MetricsCards data={data.totals} />
              <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                <VisitChart chartData={data.visitTrend} />
              </div>
              <div className="col-span-1 sm:col-span-1 lg:col-span-1">
                <SamplesChart
                  chartData={data.samplesByDelegate}
                  title='توزيع العينات حسب المندوب'
                />
              </div>
              <div className="col-span-1 sm:col-span-1 lg:col-span-1">
                <DelegatePerformanceChart
                  chartData={data.delegatePerformance}
                  title='أداء المندوبين: الزيارات مقابل العينات'
                />
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                <GeoChart chartData={data.geoData} title='التوزيع الجغرافي' />
              </div>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
