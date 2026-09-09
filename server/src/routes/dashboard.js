const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const { parseXML } = require('../utils/xmlParser');

/**
 * GET /api/dashboard-data
 * Optional query parameters: startDate, endDate (format YYYY-MM-DD)
 */
router.get('/', async (req, res) => {
  // Check if we should use mock data
  const useMock = process.env.USE_MOCK_DATA === 'true';
  if (useMock) {
    return res.json(generateMockData());
  }

  const { startDate, endDate } = req.query;
  let pool;
  try {
    pool = await getPool();
    
    // Prepare stored procedure call
    // Assuming the stored procedure accepts @StartDate and @EndDate as optional parameters
    // If not provided, we pass NULL so the procedure returns all data.
    const startParam = startDate ? startDate : null;
    const endParam = endDate ? endDate : null;
    
    const result = await pool.request()
      .input('StartDate', sql.VarChar(10), startParam)
      .input('EndDate', sql.VarChar(10), endParam)
      .execute('sp_GetVisitsAndQuestionsXML'); // stored procedure name from user
    
    // The stored procedure returns XML in the first recordset's first column?
    // Depending on how the procedure returns XML, it might be:
    // 1. A single XML value in the first column of the first row.
    // 2. Or the recordset itself is the XML (unlikely).
    // We'll assume the procedure returns a single XML string in the first column of the first recordset.
    // Adjust if needed.
    
    let xmlString = '';
    if (result.recordset && result.recordset.length > 0) {
      // Assume the XML is in the first column; we can get the first key's value.
      const firstRow = result.recordset[0];
      // Get the first value regardless of column name
      xmlString = Object.values(firstRow)[0];
    } else {
      // No data returned
      xmlString = '';
    }
    
    if (!xmlString) {
      // Return empty structure
      return res.json({
        totals: {},
        visitTrend: [],
        samplesByDelegate: [],
        delegatePerformance: [],
        geoData: []
      });
    }
    
    // Parse XML to JSON
    // We want arrays for repeating elements, so do not set explicitArray:false
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
    
    // Ensure they are arrays
    const visits = Array.isArray(visitsArray) ? visitsArray : [visitsArray];
    const answers = Array.isArray(answersArray) ? answersArray : [answersArray];
    
    // Helper to get value safely
    const getVal = (obj, key) => (obj && obj[key] !== undefined && obj[key] !== null) ? obj[key] : undefined;
    
    // Calculate totals
    let totalVisits = visits.length;
    let totalSamples = answers.length; // each answer is a sample
    
    // Build map from Visit ID to SalesRepId for linking answers to delegates
    const visitIdToRep = new Map();
    const delegateVisitCount = new Map(); // delegate -> visit count
    const delegateAnswerCount = new Map(); // delegate -> answer count
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
    
    // Count answers per delegate
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
    const visitTrendMap = new Map(); // key: date string (YYYY-MM-DD), value: visit count
    visits.forEach(v => {
      const visitDateStr = getVal(v, 'VisitDate'); // expects YYYYMMDD
      if (visitDateStr) {
        // Convert YYYYMMDD to YYYY-MM-DD for display
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
        value: 1 // each visit counts as 1; could weight by something else
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
    // We keep the pool open for efficiency; in a real app you might want to close on app termination.
    // For simplicity, we don't close the pool here.
  }
});

/**
 * Generate mock data for development and testing
 * @returns {Object} Mock data in the same structure as the real data
 */
function generateMockData() {
  // Mock visits: array of visit objects
  const visits = [];
  // Mock answers: array of answer objects
  const answers = [];

  // Create 5 delegates (SalesRepId: 1,2,3,4,5)
  const delegateIds = [1, 2, 3, 4, 5];

  // Generate 50 visits spread over the last 30 days
  const today = new Date();
  for (let i = 0; i < 50; i++) {
    const delegateId = delegateIds[i % delegateIds.length];
    const vis
