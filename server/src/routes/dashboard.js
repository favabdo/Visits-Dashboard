const express = require('express');
const router = express.Router();
const { getConnectionConfig, sql } = require('../config/db');
const { parseXML } = require('../utils/xmlParser');
const authenticate = require('../middleware/authenticate');

function isSafeDatabaseName(name) {
  if (!name || typeof name !== 'string') return false;
  const dbName = name.trim();
  if (!dbName || dbName.length > 128) return false;
  if (/[;='"\\[\]]/.test(dbName)) return false;
  return true;
}

/**
 * GET /api/dashboard-data
 * Optional query parameters: startDate, endDate (format YYYY-MM-DD)
 * Requires Authorization: Bearer <jwt>
 */
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

    // Extract XML string from first column of first row
    let xmlString = '';
    if (result.recordset && result.recordset.length > 0) {
      const firstRow = result.recordset[0];
      xmlString = Object.values(firstRow)[0];
    }

    if (!xmlString) {
      return res.json({
        totals: {},
        visitTrend: [],
        samplesByDelegate: [],
        delegatePerformance: [],
        geoData: []
      });
    }

    // Parse XML to JSON
    const parsed = await parseXML(xmlString);

    // The XML structure is:
    // <DataPayload>
    //   <Questions> ... </Questions>
    //   <QuestionOptions> ... </QuestionOptions>
    //   <Visits>
    //     <Visit> ... </Visit>
    //     ...
    //   </Visits>
    //   <VisitAnswers>
    //     <Answer> ... </Answer>
    //     ...
    //   </VisitAnswers>
    // </DataPayload>
    const dataPayload = parsed.DataPayload;
    if (!dataPayload) {
      console.error('Unexpected XML structure: missing DataPayload');
      return res.status(500).json({ error: 'Invalid XML structure' });
    }

    const visitsArray = dataPayload.Visits?.Visit || [];
    const answersArray = dataPayload.VisitAnswers?.Answer || [];

    const getVal = (obj, key) => (obj && obj[key] !== undefined && obj[key] !== null) ? obj[key] : undefined;

    const visitDateKey = (visitDateStr) => {
      if (!visitDateStr) return null;
      const s = String(visitDateStr);
      if (/^\d{8}/.test(s)) {
        return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
      }
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        return s.slice(0, 10);
      }
      return null;
    };

    const inDateRange = (dateKey) => {
      if (startDate && (!dateKey || dateKey < startDate)) return false;
      if (endDate && (!dateKey || dateKey > endDate)) return false;
      return true;
    };

    let visits = Array.isArray(visitsArray) ? visitsArray : [visitsArray];
    let answers = Array.isArray(answersArray) ? answersArray : [answersArray];

    if (startDate || endDate) {
      visits = visits.filter(v => inDateRange(visitDateKey(getVal(v, 'VisitDate'))));
      const visitIds = new Set(
        visits.map(v => getVal(v, 'ID')).filter(id => id !== undefined).map(String)
      );
      answers = answers.filter(a => visitIds.has(String(getVal(a, 'VisitId'))));
    }

    // Calculate totals
    let totalVisits = visits.length;
    let totalSamples = answers.length; // each answer is a sample

    const visitIdToRep = new Map();
    const delegateVisitCount = new Map();
    const delegateAnswerCount = new Map();
    const delegateSet = new Set();

    visits.forEach(v => {
      const id = getVal(v, 'ID');
      const repId = getVal(v, 'SalesRepId');
      if (id !== undefined && repId !== undefined) {
        visitIdToRep.set(String(id), String(repId));
      }
      if (repId !== undefined) {
        delegateSet.add(String(repId));
        const current = delegateVisitCount.get(String(repId)) || 0;
        delegateVisitCount.set(String(repId), current + 1);
      }
    });

    answers.forEach(a => {
      const visitId = getVal(a, 'VisitId');
      if (visitId !== undefined) {
        const repId = visitIdToRep.get(String(visitId));
        if (repId !== undefined) {
          const current = delegateAnswerCount.get(repId) || 0;
          delegateAnswerCount.set(repId, current + 1);
        }
      }
    });

    const totalDelegates = delegateSet.size;
    const avgSamplesPerVisit = totalVisits > 0 ? totalSamples / totalVisits : 0;

    // Visit trend: group by VisitDate (format YYYYMMDD)
    const visitTrendMap = new Map();
    visits.forEach(v => {
      const visitDateStr = getVal(v, 'VisitDate');
      if (visitDateStr) {
        const year = visitDateStr.substring(0, 4);
        const month = visitDateStr.substring(4, 6);
        const day = visitDateStr.substring(6, 8);
        const formattedDate = `${year}-${month}-${day}`;
        const current = visitTrendMap.get(formattedDate) || 0;
        visitTrendMap.set(formattedDate, current + 1);
      }
    });
    const visitTrend = Array.from(visitTrendMap.entries())
      .map(([date, count]) => ({ date, visitCount: count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Samples by delegate: label = delegate ID, value = answer count
    const samplesByDelegate = Array.from(delegateAnswerCount.entries())
      .map(([delegateId, value]) => ({ label: `Delegate ${delegateId}`, value }))
      .sort((a, b) => b.value - a.value);

    // Delegate performance: visits and samples per delegate
    const delegatePerformance = Array.from(delegateSet)
      .map(delegateId => ({
        delegate: `Delegate ${delegateId}`,
        visits: delegateVisitCount.get(delegateId) || 0,
        samples: delegateAnswerCount.get(delegateId) || 0
      }))
      .sort((a, b) => b.visits - a.visits);

    // Geo data: each visit as a point with latitude, longitude
    const geoData = visits
      .filter(v => {
        const lat = getVal(v, 'Latitude');
        const lon = getVal(v, 'Longitude');
        return lat !== undefined && lon !== undefined && lat !== '' && lon !== '';
      })
      .map(v => ({
        latitude: parseFloat(getVal(v, 'Latitude')),
        longitude: parseFloat(getVal(v, 'Longitude')),
        label: `Delegate ${getVal(v, 'SalesRepId') || 'Unknown'}`,
        value: 1
      }));

    // Return the formatted data
    res.json({
      totals: {
        totalVisits,
        totalSamples,
        totalDelegates,
        avgSamplesPerVisit: Number(avgSamplesPerVisit.toFixed(2))
      },
      visitTrend,
      samplesByDelegate,
      delegatePerformance,
      geoData
    });
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
