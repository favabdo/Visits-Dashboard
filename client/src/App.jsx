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
import NotesTable from './components/NotesTable';
import { fetchDashboardData } from './services/api';

function DashboardShell({ children, onDateChange }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header />
      <div className="flex min-h-[calc(100vh-73px)] flex-col lg:flex-row">
        <Sidebar onDateChange={onDateChange} />
        <main className="min-w-0 flex-1 p-5 lg:p-8">{children}</main>
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
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <div className="h-8 w-8 border-2 border-line border-t-accent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-muted">جاري تجهيز اللوحة</p>
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell onDateChange={setDateRange}>
        <div className="border border-choco/30 bg-choco/5 p-4 text-sm text-choco">
          {error}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell onDateChange={setDateRange}>
      <div className="space-y-5">
        <MetricsCards data={data.totals} />
        <VisitChart chartData={data.visitTrend} />
        <div className="grid gap-5 lg:grid-cols-2">
          <SamplesChart
            chartData={data.ratingDistribution}
            title="تقييم مساحة العرض"
          />
          <SamplesChart
            chartData={data.competitorDistribution}
            title="وجود منتجات منافسة"
          />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <SamplesChart
            chartData={data.stockoutItems}
            title="أصناف نفدت"
          />
          <DelegatePerformanceChart
            chartData={data.delegatePerformance}
            title="أداء المندوبين"
          />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <SamplesChart
            chartData={data.samplesByDelegate}
            title="الإجابات حسب المندوب"
          />
          <NotesTable notes={data.notes} />
        </div>
        <GeoChart chartData={data.geoData} title="الخريطة حسب النطاق" />
      </div>
    </DashboardShell>
  );
}

function RequireToken({ children }) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Settings />} />
        <Route path="/settings" element={<Navigate to="/login" replace />} />
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
