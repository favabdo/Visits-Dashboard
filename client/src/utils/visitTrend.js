function parseDay(dateStr) {
  const s = String(dateStr || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDay(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function weekStart(d) {
  const copy = new Date(d);
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  return copy;
}

function spanDays(sorted) {
  const first = parseDay(sorted[0].date);
  const last = parseDay(sorted[sorted.length - 1].date);
  if (!first || !last) return 0;
  return Math.round((last - first) / 86400000);
}

function rollup(rows, keyFn) {
  const map = new Map();
  rows.forEach(row => {
    const d = parseDay(row.date);
    if (!d) return;
    const key = keyFn(d);
    map.set(key, (map.get(key) || 0) + Number(row.visitCount || 0));
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, visitCount]) => ({ date, visitCount }));
}

export function prepareVisitTrend(chartData) {
  const sorted = [...(chartData || [])]
    .filter(item => item?.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  if (sorted.length === 0) {
    return { points: [], granularity: 'day', tickformat: '%d %b', hint: '' };
  }

  const span = spanDays(sorted);

  if (span > 120) {
    return {
      points: rollup(sorted, d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`),
      granularity: 'month',
      tickformat: '%b %Y',
      hint: 'مجمّعة شهرياً لأن الفترة طويلة. حدّد نطاقاً أقصر لرؤية الأيام.',
    };
  }

  if (span > 35) {
    return {
      points: rollup(sorted, d => formatDay(weekStart(d))),
      granularity: 'week',
      tickformat: '%d %b',
      hint: 'مجمّعة أسبوعياً. حدّد نطاقاً أقصر لرؤية الأيام.',
    };
  }

  return {
    points: sorted.map(item => ({
      date: String(item.date).slice(0, 10),
      visitCount: Number(item.visitCount || 0),
    })),
    granularity: 'day',
    tickformat: '%d %b',
    hint: '',
  };
}
