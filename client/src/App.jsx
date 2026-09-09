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

function DashboardShell({ children, onDateChange }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex min-h-[calc(100vh-64px)]">
        <Sidebar onDateChange={onDateChange} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function DashboardPage() {
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
        setError(err.response?.data?.error || err.message || 'خطأ غير متوقع');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <DashboardShell onDateChange={setDateRange}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">جاري تحميل البيانات…</p>
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell onDateChange={setDateRange}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell onDateChange={setDateRange}>
      <div className="grid gap-6">
        <MetricsCards data={data.totals} />
        <div className="col-span-1 sm:col-span-2 lg:col-span-2">
          <VisitChart chartData={data.visitTrend} />
        </div>
        <div className="col-span-1 sm:col-span-1 lg:col-span-1">
          <SamplesChart
            chartData={data.samplesByDelegate}
            title="توزيع العينات حسب المندوب"
          />
        </div>
        <div className="col-span-1 sm:col-span-1 lg:col-span-1">
          <DelegatePerformanceChart
            chartData={data.delegatePerformance}
            title="أداء المندوبين: الزيارات مقابل العينات"
          />
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-2">
          <GeoChart chartData={data.geoData} title="التوزيع الجغرافي" />
        </div>
      </div>
    </DashboardShell>
  );
}

function RequireToken({ children }) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/settings" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/*"
          element={
            <RequireToken>
              <DashboardPage />
            </RequireToken>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
