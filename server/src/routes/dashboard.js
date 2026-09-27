const express = require('express');
const router = express.Router();
const { buildDashboardFromXml } = require('../utils/visitXml');
const { getLegacyDashboard, isSafeDatabaseName } = require('../data/source');
const authenticate = require('../middleware/authenticate');

function emptyDashboard() {
  return {
    totals: {
      totalVisits: 0,
      totalSamples: 0,
      totalDelegates: 0,
      avgSamplesPerVisit: 0,
      uniqueCustomers: 0,
      formCompletionRate: 0,
      outOfRangeRate: 0,
      completedVisits: 0,
      outOfRangeVisits: 0
    },
    visitTrend: [],
    samplesByDelegate: [],
    delegatePerformance: [],
    delegates: [],
    customers: [],
    geoData: [],
    questions: [],
    kpis: {
      questionCount: 0,
      answeredQuestionCount: 0,
      mostAnsweredQuestion: null,
      leastAnsweredQuestion: null,
      topAnswer: null,
      topAnswers: [],
      mostRequestedProduct: null
    },
    notes: []
  };
}

// Legacy shape consumed by the current dashboard screens.
router.get('/', authenticate, async (req, res) => {
  const { startDate, endDate } = req.query;
  const dbName = (req.user.databaseName || process.env.DB_DATABASE || '').trim();

  if (!isSafeDatabaseName(dbName)) {
    return res.status(400).json({ error: 'Invalid database in token' });
  }

  try {
    const data = await getLegacyDashboard({
      dbName,
      startDate,
      endDate,
      buildDashboardFromXml,
    });

    if (!data) {
      console.error('Dashboard XML empty for database', dbName);
      return res.json(emptyDashboard());
    }

    console.log('Dashboard parsed', {
      database: dbName,
      visits: data.totals.totalVisits,
      answers: data.totals.totalSamples,
      delegates: data.totals.totalDelegates
    });
    res.json(data);
  } catch (err) {
    console.error('Error in dashboard route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
