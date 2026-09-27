import { createContext, useContext, useMemo } from 'react';

export const AnalyticsContext = createContext(null);

export function useAnalyticsLayout() {
  const value = useContext(AnalyticsContext);
  if (!value) throw new Error('useAnalyticsLayout must run inside DashboardLayout');
  return value;
}

/** Reads one analytics section out of the payload the layout already loaded. */
export function useAnalyticsSection(section) {
  const { payload, loading, error, retry } = useAnalyticsLayout();

  const data = useMemo(() => {
    if (!payload) return null;
    return {
      section,
      generatedAt: payload.generatedAt,
      window: payload.overview?.window || null,
      data: payload[section],
    };
  }, [payload, section]);

  return { data, loading: data ? false : loading, error: data ? null : error, retry };
}
