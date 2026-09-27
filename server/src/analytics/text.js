const { normalizeArabic, NEGATIVE_TERMS, FOLLOW_UP_TERMS, POSITIVE_TERMS } = require('../utils/textRules');

// Rule-based Arabic text analytics. Runs in-process over AnswerText only:
// no external service, so no customer text ever leaves the server.

const STOP_WORDS = new Set(
  ('في من إلى على عن هذا هذه ذلك الذي التي كان كان ما هو هي هم ان او و بل ثم عند بعد قبل كده شوية مرة تاني تانية جديد جديدة كل بعض بين لدى خلال كما حتى لو لم قد يا أي' +
    ' وكذا كذلك لذلك هناك هنا هناك ده دي فيه فيها فيها لي ليا ليه لنا لكم لهم عليا عليك عليه علينا')
    .split(/\s+/)
    .filter(Boolean)
);

const MIN_TOKEN = 3;

function tokenize(normalized) {
  return normalized
    .replace(/[^\u0600-\u06FF\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= MIN_TOKEN && !STOP_WORDS.has(word));
}

const bump = (map, key, by = 1) => map.set(key, (map.get(key) || 0) + by);

const toSorted = (map, limit) =>
  Array.from(map.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, limit);

function analyzeText(model, { limit = 15 } = {}) {
  const { answers, index, label } = model;
  const notes = answers.filter(a => a.kind === 'text' && a.text);

  const keywords = new Map();
  const phrases = new Map();
  const requests = new Map();
  const complaints = new Map();
  const positives = new Map();
  const productMentions = new Map();
  const locationMentions = new Map();
  const perCustomerTerms = new Map();
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };

  // Vocabulary is discovered from the data itself: option texts are the product
  // and topic names the field actually works with.
  const vocabulary = model.options.map(option => ({
    raw: option.text,
    normalized: normalizeArabic(option.text),
  })).filter(entry => entry.normalized.length >= 3);

  notes.forEach(note => {
    const normalized = normalizeArabic(note.text);
    const words = tokenize(normalized);

    words.forEach(word => bump(keywords, word));
    for (let i = 0; i + 1 < words.length; i += 1) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (phrase.length > 6) bump(phrases, phrase);
    }

    const matchedNegative = NEGATIVE_TERMS.filter(term => normalized.includes(term));
    const matchedFollowUp = FOLLOW_UP_TERMS.filter(term => normalized.includes(term));
    const matchedPositive = POSITIVE_TERMS.filter(term => normalized.includes(term));

    matchedNegative.forEach(term => bump(complaints, term));
    matchedFollowUp.forEach(term => bump(requests, term));
    matchedPositive.forEach(term => bump(positives, term));

    if (matchedNegative.length) sentimentCounts.negative += 1;
    else if (matchedPositive.length) sentimentCounts.positive += 1;
    else sentimentCounts.neutral += 1;

    vocabulary.forEach(entry => {
      if (normalized.includes(entry.normalized)) bump(productMentions, entry.raw);
    });

    const visit = index.visitById.get(note.visitId);
    const customerId = visit && visit.customerId;
    if (visit && visit.area) bump(locationMentions, visit.area);
    const signalTerm = matchedNegative[0] || matchedFollowUp[0];
    if (customerId && signalTerm) {
      const key = `${customerId}|${signalTerm}`;
      const bucket = perCustomerTerms.get(key) || {
        customer: label.customer(customerId),
        term: signalTerm,
        count: 0,
        sentiment: matchedNegative.length ? 'negative' : 'follow-up',
      };
      bucket.count += 1;
      perCustomerTerms.set(key, bucket);
    }
  });

  const repeats = Array.from(perCustomerTerms.values()).filter(entry => entry.count > 1);

  return {
    notesCount: notes.length,
    keywords: toSorted(keywords, limit),
    phrases: toSorted(phrases, limit),
    complaints: toSorted(complaints, limit),
    requests: toSorted(requests, limit),
    positiveFeedback: toSorted(positives, limit),
    productMentions: toSorted(productMentions, limit),
    locationMentions: toSorted(locationMentions, limit),
    sentiment: sentimentCounts,
    repeatedIssues: repeats
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(entry => ({ customer: entry.customer, term: entry.term, count: entry.count, sentiment: entry.sentiment })),
  };
}

module.exports = { analyzeText };
