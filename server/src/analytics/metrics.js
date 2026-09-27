// Shared metric helpers for the analytics engine: percentages, time buckets and
// top-N counters. Everything here is label-based; IDs never leave the model layer.

const round1 = value => Number(Number(value).toFixed(1));

const share = (value, total) => (total > 0 ? round1((value * 100) / total) : 0);

const bump = (map, key, by = 1) => {
  if (key == null) return;
  map.set(key, (map.get(key) || 0) + by);
};

function topFromCounts(map, total, limit = 10) {
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count, percentage: share(count, total) }))
    .sort((a, b) => b.count - a.count || String(a.label).localeCompare(String(b.label)))
    .slice(0, limit);
}

const isoDate = date => date.toISOString().slice(0, 10);

function weekStart(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return isoDate(date);
}

// day | week | month -> the period label an ISO date belongs to.
function periodOf(dateKey, granularity) {
  if (!dateKey) return null;
  if (granularity === 'day') return dateKey;
  if (granularity === 'week') return weekStart(dateKey);
  return dateKey.slice(0, 7);
}

function series(items, dateOf, granularity = 'day') {
  const buckets = new Map();
  items.forEach(item => {
    const period = periodOf(dateOf(item), granularity);
    bump(buckets, period);
  });
  return Array.from(buckets.entries())
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

// Compares the two halves of a series: the only "trend" claim the data can support.
function halves(seriesList) {
  if (seriesList.length < 2) return null;
  const mid = Math.ceil(seriesList.length / 2);
  const first = seriesList.slice(0, mid).reduce((sum, p) => sum + p.count, 0);
  const second = seriesList.slice(mid).reduce((sum, p) => sum + p.count, 0);
  return {
    firstPeriod: seriesList[0].period,
    lastPeriod: seriesList[seriesList.length - 1].period,
    first,
    second,
    changePercentage: first > 0 ? round1(((second - first) * 100) / first) : null,
  };
}

function extremes(seriesList) {
  if (!seriesList.length) return { peak: null, low: null };
  const sorted = [...seriesList].sort((a, b) => b.count - a.count);
  return { peak: sorted[0], low: sorted[sorted.length - 1] };
}

const WEEKDAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function weekdayDistribution(items, dateOf) {
  const buckets = new Map();
  items.forEach(item => {
    const key = dateOf(item);
    if (!key) return;
    const [year, month, day] = key.split('-').map(Number);
    bump(buckets, WEEKDAY_NAMES[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]);
  });
  return topFromCounts(buckets, items.length, 7).sort((a, b) => b.count - a.count);
}

// Minutes between the first and last answer timestamp of a group of answers.
function durationMinutes(answers) {
  const stamps = answers
    .map(a => a.createdAtRaw)
    .filter(raw => raw && /\d{2}:\d{2}/.test(raw))
    .map(raw => new Date(raw.replace(' ', 'T')))
    .filter(date => !Number.isNaN(date.getTime()));
  if (stamps.length < 2) return null;
  const min = Math.min(...stamps.map(d => d.getTime()));
  const max = Math.max(...stamps.map(d => d.getTime()));
  return round1((max - min) / 60000);
}

module.exports = {
  round1,
  share,
  bump,
  topFromCounts,
  periodOf,
  series,
  halves,
  extremes,
  weekdayDistribution,
  durationMinutes,
};
