// Rule-based Arabic text signals. Runs in-process: no external API, no customer
// text leaves the server. Extend the lists here as more field vocabulary appears.

const DIACRITICS = /[ً-ْٰـ]/g;

function normalizeArabic(text) {
  return String(text == null ? '' : text)
    .toLowerCase()
    .replace(DIACRITICS, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

const NEGATIVE_TERMS = [
  'مشكله', 'مشكل', 'سيئ', 'سيئه', 'ضعيف', 'ضعف', 'نقص', 'عيب', 'تالف', 'تالفه',
  'فساد', 'فاسد', 'شكوي', 'شكاوي', 'رفض', 'مرفوض', 'متاخر', 'تاخير', 'موصلش',
  'لا يوجد', 'مفيش', 'خطا', 'ظلم', 'هزار', 'غير مرضي',
];

const FOLLOW_UP_TERMS = [
  'متابعه', 'يحتاج', 'تحتاج', 'نحتاج', 'طلب', 'مطلوب', 'يرجي', 'لابد', 'لازم',
  'تنفيذ', 'توريد', 'طبيه', 'طلبية', 'مواعيد', 'مره تانيه', 'الفاتوره', 'ديون',
  'تاصل', 'ارسال', 'توصيل',
];

const POSITIVE_TERMS = [
  'ممتاز', 'جيد', 'جميل', 'تمام', 'كويس', 'راضى', 'راضي', 'سعيد', 'نجاح', 'زياده',
  'تطور', 'شكرا', 'متعاون',
];

const REQUEST_TERMS = FOLLOW_UP_TERMS;

const containsAny = (haystack, terms) => terms.find(term => haystack.includes(term)) || null;

function classifyNote(text) {
  const normalized = normalizeArabic(text);
  if (!normalized) return { negative: false, followUp: false, sentiment: 'neutral', matched: [] };

  const negative = containsAny(normalized, NEGATIVE_TERMS);
  const followUp = containsAny(normalized, FOLLOW_UP_TERMS);
  const positive = containsAny(normalized, POSITIVE_TERMS);

  let sentiment = 'neutral';
  if (negative) sentiment = 'negative';
  else if (positive) sentiment = 'positive';

  return {
    negative: Boolean(negative),
    followUp: Boolean(followUp),
    sentiment,
    matched: [negative, followUp, positive].filter(Boolean),
  };
}

module.exports = {
  normalizeArabic,
  classifyNote,
  NEGATIVE_TERMS,
  FOLLOW_UP_TERMS,
  POSITIVE_TERMS,
  REQUEST_TERMS,
};
