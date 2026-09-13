const express = require('express');
const router = express.Router();
const { getConnectionConfig, sql } = require('../config/db');
const { parseXML } = require('../utils/xmlParser');
const { buildDashboardFromXml, pickItems, field } = require('../utils/visitXml');
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

    // جلب أسماء المندوبين من جدول wh_SalesReps استعدادًا للاستبدال
    let repNameMap = new Map();
    try {
      const repResult = await pool.request().query('SELECT ID, Name_AR AS Name FROM wh_SalesReps');
      repNameMap = new Map(
        (repResult.recordset || []).map(r => [String(r.ID), r.Name || `مندوب ${r.ID}`])
      );
    } catch (repErr) {
      console.warn('Unable to fetch sales rep names from wh_SalesReps:', repErr.message);
    }

    const result = await pool.request().execute('sp_GetVisitsAndQuestionsXML');
    const xmlString = extractXmlString(result);

    if (!xmlString) {
      console.error('Dashboard XML empty for database', dbName);
      return res.json(emptyDashboard());
    }

    const parsed = await parseXML(xmlString);

    // استخراج معرفات المندوبين من XML لاستدعاء إجراءات العملاء
    const payload = parsed?.DataPayload || parsed || {};
    const visits = pickItems(payload, 'Visits', 'Visit');
    const repIds = [...new Set(
      visits.map(v => field(v, 'SalesRepId')).filter(Boolean)
    )];

    // جلب أسماء العملاء من إجراء wh_SalesrepCustomerWithBalances لكل مندوب
    let customerNameMap = new Map();
    const getValue = (row, names) => {
      for (const n of names) {
        if (row[n] !== undefined) return row[n];
        const key = Object.keys(row).find(k => k.toLowerCase() === n.toLowerCase());
        if (key) return row[key];
      }
      return undefined;
    };
    if (repIds.length > 0) {
      try {
        for (const repId of repIds) {
          try {
            const repIdNum = parseInt(repId, 10);
            if (isNaN(repIdNum)) continue;
            const custResult = await pool.request().query(`EXEC wh_SalesrepCustomerWithBalances ${repIdNum}`);
            const rows = custResult.recordset || [];
            for (const row of rows) {
              const custId = String(getValue(row, ['CustomerID', 'ID', 'CustomerId', 'CustomerID']) || '');
              const name = getValue(row, ['Name', 'CustomerName', 'NameAr', 'Name_AR', 'name', 'customername']) || '';
              if (custId && name) {
                if (!customerNameMap.has(custId)) {
                  customerNameMap.set(custId, name);
                }
              }
            }
          } catch (e) {
            console.warn(`Failed to fetch customers for rep ${repId}:`, e.message);
          }
        }
      } catch (e) {
        console.warn('Error while fetching customer names:', e.message);
      }
    }

    const data = buildDashboardFromXml(parsed, { startDate, endDate, repNameMap, customerNameMap });
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
