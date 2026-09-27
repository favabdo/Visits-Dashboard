import api from './api';

const cache = new Map();
const inflight = new Map();

const cacheKey = range => `__full__|${range.startDate || ''}|${range.endDate || ''}`;

/**
 * The dashboard reads every section from one payload, so the analytics API is
 * called once per date window and reused while the user navigates.
 */
export async function fetchAnalytics(range = {}, { fresh = false } = {}) {
  const key = cacheKey(range);
  if (fresh) cache.delete(key);
  if (cache.has(key)) return cache.get(key);
  if (inflight.has(key)) return inflight.get(key);

  const promise = api
    .get('/analytics', { params: range })
    .then(response => {
      cache.set(key, response.data);
      return response.data;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}
