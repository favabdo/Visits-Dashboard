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
      <div className="flex min-h-[calc(100vh-var(--header-h))] flex-col lg:flex-row">
        <Sidebar onDateChange={onDateChange} />
        <main className="min-w-0 flex-1 px-5 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-card border border-line bg-panel p-5 shadow-soft">
            <div className="h-3 w-24 animate-pulse rounded-full bg-line" />
            <div className="mt-4 h-7 w-20 animate-pulse rounded-lg bg-line" />
          </div>
        ))}
      </div>
      <div className="rounded-card border border-line bg-panel p-6 shadow-soft">
        <div className="h-3 w-32 animate-pulse rounded-full bg-line" />
        <div className="mt-6 h-64 animate-pulse rounded-xl bg-panel-soft" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-card border border-line bg-panel p-6 shadow-soft">
            <div className="h-3 w-28 animate-pulse rounded-full bg-line" />
            <div className="mt-6 h-56 animate-pulse rounded-xl bg-panel-soft" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-card border border-danger/25 bg-danger-soft p-5 shadow-soft">
      <div className="flex items-start gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-panel text-danger">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 8v5M12 16.5v.2" />
            <circle cx="12" cy="12" r="8.5" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-danger">تعذّر تحميل البيانات</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/80">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3.5 rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    </div>
  );
}

function OverviewHeader({ rangeLabel }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-ink">نظرة عامة</h2>
        <p className="mt-1 text-sm text-muted">ملخّص أداء الفريق خلال الفترة المحددة</p>
      </div>
      <span
        className="rounded-full border border-line bg-panel px-3.5 py-1.5 text-xs font-semibold tabular-nums text-muted shadow-soft"
        dir={rangeLabel.dir}
      >
        {rangeLabel.text}
      </span>
    </div>
  );
}

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
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
  }, [dateRange, reloadKey]);

  const handleRetry = () => setReloadKey(value => value + 1);

  const hasRange = Boolean(dateRange.startDate || dateRange.endDate);
  const rangeLabel = {
    text: hasRange
      ? `${dateRange.startDate || '—'}  ←  ${dateRange.endDate || '—'}`
      : 'كل الفترات',
    dir: hasRange ? 'ltr' : 'rtl',
  };

  if (loading) {
    return (
      <DashboardShell onDateChange={setDateRange}>
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell onDateChange={setDateRange}>
        <ErrorPanel message={error} onRetry={handleRetry} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell onDateChange={setDateRange}>
      <OverviewHeader rangeLabel={rangeLabel} />
      <div className="space-y-6">
        <MetricsCards data={data.totals} />
        <VisitChart chartData={data.visitTrend} />
        <div className="grid gap-6 lg:grid-cols-2">
          <SamplesChart chartData={data.ratingDistribution} title="تقييم مساحة العرض" />
          <SamplesChart chartData={data.competitorDistribution} title="وجود منتجات منافسة" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SamplesChart chartData={data.stockoutItems} title="أصناف نفدت" />
          <DelegatePerformanceChart chartData={data.delegatePerformance} title="أداء المندوبين" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SamplesChart chartData={data.samplesByDelegate} title="الإجابات حسب المندوب" />
          <GeoChart chartData={data.geoData} title="الخريطة حسب النطاق" />
        </div>
        <NotesTable notes={data.notes} />
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
