const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export const nf = value =>
  value == null || Number.isNaN(Number(value)) ? '—' : numberFormatter.format(Number(value));

export const pf = value => (value == null || Number.isNaN(Number(value)) ? '—' : `${nf(value)}%`);

export const textOrDash = value =>
  value == null || value === '' ? '—' : String(value).replace('T', ' ').slice(0, 16);

const WEEKDAY_SHORT = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

/** "2026-08-12" -> "12 أغسطس" (or with the year for month/week buckets). */
export function periodLabel(period, granularity = 'day') {
  if (!period) return '—';
  if (granularity === 'month') {
    const [year, month] = period.split('-');
    return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
  }
  const date = new Date(`${period.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return period;
  const day = date.getDate();
  if (granularity === 'week') {
    return `${WEEKDAY_SHORT[date.getDay()]} ${day} ${MONTH_NAMES[date.getMonth()].slice(0, 4)}`;
  }
  return `${day} ${MONTH_NAMES[date.getMonth()]}`;
}

/** Compact window caption for a header: "٢ يوليو – ١٢ أغسطس (42 يوم)". */
export function windowLabel(window) {
  if (!window || !window.start || !window.end) return 'لا توجد زيارات في هذه الفترة';
  const span = window.days > 1 ? ` · ${nf(window.days)} يوم` : '';
  return `${periodLabel(window.start)} – ${periodLabel(window.end)}${span}`;
}

export const signed = value =>
  value == null ? '—' : `${value > 0 ? '+' : ''}${nf(value)}%`;
