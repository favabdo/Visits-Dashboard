const express = require('express');
const router = express.Router();
const { getConnectionConfig, sql } = require('../config/db');
const { parseXML } = require('../utils/xmlParser');
const { buildDashboardFromXml } = require('../utils/visitXml');
const authenticate = require('../middleware/authenticate');

function extractXmlString(result) {
  const sets = [];
  if (Array.isArray(result.recordsets) && result.recordsets.length) {
    sets.push(...result.recordsets);
  } else if (result.recordset) {
    sets.push(result.recordset);
  }

  for (const set of sets) {
    if (!set || !set.length) continue;
    for (const row of set) {
      for (const value of Object.values(row)) {
        if (value == null) continue;
        const text = Buffer.isBuffer(value) ? value.toString('utf8') : String(value);
        const start = text.indexOf('<DataPayload');
        if (start >= 0) return text.slice(start);
        if (text.includes('<')) return text;
      }
    }
  }
  return '';
}

function isSafeDatabaseName(name) {
  if (!name || typeof name !== 'string') return false;
  const dbName = name.trim();
  if (!dbName || dbName.length > 128) return false;
  if (/[;='"\\[\]]/.test(dbName)) return false;
  return true;
}

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
    geoData: [],
    ratingDistribution: [],
    competitorDistribution: [],
    stockoutItems: [],
    notes: []
  };
}

router.get('/', authenticate, async (req, res) => {
  const { startDate, endDate } = req.query;
  const dbName = (req.user.databaseName || process.env.DB_DATABASE || '').trim();

  if (!isSafeDatabaseName(dbName)) {
    return res.status(400).json({ error: 'Invalid database in token' });
  }

  let pool;
  try {
    pool = new sql.ConnectionPool(getConnectionConfig(dbName));
    await pool.connect();

    const result = await pool.request().execute('sp_GetVisitsAndQuestionsXML');
    const xmlString = extractXmlString(result);

    if (!xmlString) {
      console.error('Dashboard XML empty for database', dbName);
      return res.json(emptyDashboard());
    }

    const parsed = await parseXML(xmlString);
    const data = buildDashboardFromXml(parsed, { startDate, endDate });
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
  } finally {
    if (pool) {
      pool.close();
    }
  }
});

module.exports = router;
