import React, { useCallback, useEffect, useState } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
} from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DateFilterBar from './components/DateFilterBar';
import LoadingScreen from './components/LoadingScreen';
import ErrorPanel from './components/ui/ErrorPanel';
import Settings from './components/Settings';
import { fetchAnalytics } from './services/analytics';
import { AnalyticsContext } from './hooks/useAnalytics';

import ExecutivePage from './pages/ExecutivePage';
import InsightsPage from './pages/InsightsPage';
import VisitsPage from './pages/VisitsPage';
import CustomersPage from './pages/CustomersPage';
import RepsPage from './pages/RepsPage';
import RepDetailPage from './pages/RepDetailPage';
import GeographyPage from './pages/GeographyPage';
import QuestionsPage from './pages/QuestionsPage';
import AnswersPage from './pages/AnswersPage';
import TextPage from './pages/TextPage';
import TrendsPage from './pages/TrendsPage';
import CrossPage from './pages/CrossPage';
import QualityPage from './pages/QualityPage';

function readError(err) {
  return err?.response?.data?.error || err?.message || 'تعذّر الوصول إلى الخدمة التحليلية';
}

function DashboardLayout() {
  const [range, setRange] = useState({ startDate: '', endDate: '' });
  const [navOpen, setNavOpen] = useState(false);
  const [result, setResult] = useState({ key: null, payload: null, error: null });
  const [reloadKey, setReloadKey] = useState(0);
  const closeNav = () => setNavOpen(false);

  const requestKey = `${range.startDate}|${range.endDate}|${reloadKey}`;
  const loading = result.key !== requestKey;

  useEffect(() => {
    let alive = true;
    fetchAnalytics(range, { fresh: reloadKey > 0 })
      .then(payload => alive && setResult({ key: requestKey, payload, error: null }))
      .catch(err => alive && setResult({ key: requestKey, payload: null, error: readError(err) }));
    return () => {
      alive = false;
    };
  }, [range, requestKey, reloadKey]);

  const retry = useCallback(() => setReloadKey(value => value + 1), []);

  const payload = result.payload;
  const totals = payload?.overview?.totals;
  const quality = payload?.overview?.dataQuality;
  const insightList = payload?.insights || [];

  const contextValue = {
    range,
    setRange,
    reloadKey,
    retry,
    payload,
    loading,
    error: result.error,
    insights: insightList,
  };

  const counts = {
    visits: totals?.visits,
    customers: totals?.customers,
    reps: totals?.reps,
    questions: totals?.questions,
    answers: totals?.answers,
    notes: totals?.notesCount,
    insights: insightList.length,
    alerts: insightList.filter(item => item.level === 'alert').length,
    issues: quality?.issueTypes,
    highIssues: quality?.highSeverityTypes,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      <div className="min-h-screen bg-paper text-ink md:flex">
        <Sidebar open={navOpen} onClose={closeNav} counts={counts} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onOpenNav={() => setNavOpen(true)} />
          <main className="min-w-0 flex-1 px-5 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-[1500px] space-y-6">
              <DateFilterBar range={range} onApply={setRange} />
              {loading && !payload ? (
                <LoadingScreen label="جاري حساب التحليلات" />
              ) : result.error ? (
                <ErrorPanel message={result.error} onRetry={retry} />
              ) : (
                <Outlet />
              )}
            </div>
          </main>
        </div>
      </div>
    </AnalyticsContext.Provider>
  );
}

function RequireToken({ children }) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Settings />} />
      <Route path="/delegates" element={<Navigate to="/reps" replace />} />
      <Route
        path="/*"
        element={
          <RequireToken>
            <DashboardLayout />
          </RequireToken>
        }
      >
        <Route index element={<ExecutivePage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="visits" element={<VisitsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="reps" element={<RepsPage />} />
        <Route path="reps/:name" element={<RepDetailPage />} />
        <Route path="geography" element={<GeographyPage />} />
        <Route path="questions" element={<QuestionsPage />} />
        <Route path="answers" element={<AnswersPage />} />
        <Route path="text" element={<TextPage />} />
        <Route path="trends" element={<TrendsPage />} />
        <Route path="cross" element={<CrossPage />} />
        <Route path="quality" element={<QualityPage />} />
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
