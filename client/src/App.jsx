import React, { useEffect, useState } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  useOutletContext,
} from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DateFilterBar from './components/DateFilterBar';
import MetricsCards from './components/MetricsCards';
import VisitChart from './components/VisitChart';
import SamplesChart from './components/SamplesChart';
import DelegatePerformanceChart from './components/DelegatePerformanceChart';
import GeoChart from './components/GeoChart';
import Settings from './components/Settings';
import NotesTable from './components/NotesTable';
import LoadingScreen from './components/LoadingScreen';
import DelegateStatsPage from './components/DelegateStatsPage';
import DelegatesPage from './components/DelegatesPage';
import { fetchDashboardData } from './services/api';

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

function OverviewHeader() {
  return (
    <div>
      <h2 className="text-xl font-extrabold tracking-tight text-ink">نظرة عامة</h2>
      <p className="mt-1 text-sm text-muted">ملخّص أداء الفريق خلال الفترة المحددة</p>
    </div>
  );
}

function OverviewPage({ data }) {
  return (
    <>
      <OverviewHeader />
      <div className="space-y-6">
        <MetricsCards totals={data.totals} />
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
    </>
  );
}

function DashboardLayout() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = () => setNavOpen(false);

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
  const delegates = data?.delegates || [];

  return (
    <div className="min-h-screen bg-paper text-ink md:flex">
      <Sidebar
        open={navOpen}
        onClose={closeNav}
        delegatesCount={delegates.length}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenNav={() => setNavOpen(true)} />
        <main className="min-w-0 flex-1 px-5 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[1500px] space-y-6">
            <DateFilterBar range={dateRange} onApply={setDateRange} />
            {loading ? (
              <LoadingScreen />
            ) : error ? (
              <ErrorPanel message={error} onRetry={handleRetry} />
            ) : (
              <Outlet context={{ data, delegates }} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function RequireToken({ children }) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function OverviewWrapper() {
  const { data } = useOutletContext();
  return <OverviewPage data={data} />;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Settings />} />
      <Route path="/settings" element={<Navigate to="/login" replace />} />
      <Route
        path="/*"
        element={
          <RequireToken>
            <DashboardLayout />
          </RequireToken>
        }
      >
        <Route index element={<OverviewWrapper />} />
        <Route path="delegates" element={<DelegatesPage />} />
        <Route path="delegates/:name" element={<DelegateStatsPage />} />
      </Route>
    </>
  )
);

function App() {
  // إخفاء شاشة البداية بعد أول رسم للتطبيق
  useEffect(() => {
    const splash = document.getElementById('boot-loader');
    if (!splash) return undefined;
    splash.classList.add('is-hidden');
    const timer = window.setTimeout(() => splash.remove(), 400);
    return () => window.clearTimeout(timer);
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
