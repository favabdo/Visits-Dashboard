const express = require('express');
const authenticate = require('../middleware/authenticate');
const { isSafeDatabaseName, getAnalytics } = require('../data/source');

const router = express.Router();

const SECTIONS = [
  'overview', 'visits', 'customers', 'salesReps', 'questions', 'options',
  'trends', 'geography', 'crossAnalysis', 'text', 'quality', 'insights',
];

function emptyAnalytics() {
  return {
    generatedAt: new Date().toISOString(),
    empty: true,
    sourceCounts: { questions: 0, options: 0, visits: 0, answers: 0 },
    overview: { window: { start: null, end: null, days: 0 }, totals: {}, headline: null, dataQuality: null },
    visits: {},
    customers: { totals: {}, list: [], mostVisited: [], leastVisited: [], needingFollowUp: [], negativeFeedback: [], unusual: [] },
    salesReps: { totals: {}, list: [] },
    questions: { count: 0, list: [] },
    options: { count: 0, list: [] },
    trends: {},
    geography: { areas: [], coverage: {}, outOfRange: { total: 0, rate: 0, byArea: [] }, gaps: [], repeatHeavy: [] },
    crossAnalysis: {},
    text: { notesCount: 0, keywords: [], phrases: [], complaints: [], requests: [], positiveFeedback: [], productMentions: [], locationMentions: [], sentiment: {}, repeatedIssues: [] },
    quality: { issues: [], summary: { issueTypes: 0, affectedRecords: 0, highSeverityTypes: 0, completeness: {} } },
    insights: [],
  };
}

function resolveDbName(req) {
  return String((req.user && req.user.databaseName) || process.env.DB_DATABASE || '').trim();
}

router.get('/', authenticate, async (req, res) => {
  const { startDate, endDate } = req.query;
  const dbName = resolveDbName(req);
  if (!isSafeDatabaseName(dbName)) {
    return res.status(400).json({ error: 'Invalid database in token' });
  }

  try {
    const analytics = await getAnalytics({ dbName, startDate, endDate });
    res.json(analytics || emptyAnalytics());
  } catch (err) {
    console.error('Error in /api/analytics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:section', authenticate, async (req, res) => {
  const { section } = req.params;
  if (!SECTIONS.includes(section)) {
    return res.status(404).json({ error: 'Unknown analytics section', available: SECTIONS });
  }

  const { startDate, endDate } = req.query;
  const dbName = resolveDbName(req);
  if (!isSafeDatabaseName(dbName)) {
    return res.status(400).json({ error: 'Invalid database in token' });
  }

  try {
    const analytics = await getAnalytics({ dbName, startDate, endDate });
    const payload = analytics || emptyAnalytics();
    res.json({
      section,
      generatedAt: payload.generatedAt,
      window: payload.overview.window,
      data: payload[section],
    });
  } catch (err) {
    console.error(`Error in /api/analytics/${section}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
