const { getConnectionConfig, sql } = require('../config/db');
const { parseXML } = require('../utils/xmlParser');
const { pickItems, field } = require('../utils/visitXml');
const { normalizeDataset } = require('../analytics/model');
const { buildAnalytics } = require('../analytics/engine');

// One place talks to SQL. Everything above it works on the normalised model,
// so the stored procedure is executed once per database per cache window.

const CACHE_TTL_MS = Number(process.env.ANALYTICS_CACHE_TTL_MS) || 60_000;

const rawCache = new Map();
const rawInFlight = new Map();
const modelCache = new Map();
const analyticsCache = new Map();
const legacyCache = new Map();

function isSafeDatabaseName(name) {
  if (!name || typeof name !== 'string') return false;
  const dbName = name.trim();
  if (!dbName || dbName.length > 128) return false;
  if (/[;='"\\[\]]/.test(dbName)) return false;
  return true;
}

// The procedure returns a resultset whose cells hold the XML document.
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

function pickColumn(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null) return row[name];
    const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
    if (key && row[key] !== null && row[key] !== undefined) return row[key];
  }
  return undefined;
}

async function fetchRepNames(pool) {
  const map = new Map();
  try {
    const result = await pool.request().query('SELECT ID, Name_AR AS Name FROM wh_SalesReps');
    (result.recordset || []).forEach(row => {
      const id = String(pickColumn(row, ['ID', 'SalesRepId']) ?? '');
      const name = pickColumn(row, ['Name', 'Name_AR', 'NameAr']);
      if (id && name) map.set(id, String(name));
    });
  } catch (err) {
    console.warn('Unable to fetch sales rep names from wh_SalesReps:', err.message);
  }
  return map;
}

// Customer names are not in the XML, so they come from the sales-rep view.
async function fetchCustomerNames(pool, payload) {
  const map = new Map();
  const repIds = [
    ...new Set(pickItems(payload, 'Visits', 'Visit').map(v => field(v, 'SalesRepId')).filter(Boolean)),
  ];

  for (const repId of repIds) {
    const repIdNum = parseInt(repId, 10);
    if (Number.isNaN(repIdNum)) continue;
    try {
      const result = await pool.request().query(`EXEC wh_SalesrepCustomerWithBalances ${repIdNum}`);
      for (const row of result.recordset || []) {
        const id = String(pickColumn(row, ['CustomerID', 'CustomerId', 'ID']) ?? '');
        const name = pickColumn(row, ['Name', 'CustomerName', 'Name_AR', 'NameAr']);
        if (id && name && !map.has(id)) map.set(id, String(name));
      }
    } catch (err) {
      console.warn(`Failed to fetch customers for rep ${repId}:`, err.message);
    }
  }
  return map;
}

async function runLoad(dbName) {
  const pool = new sql.ConnectionPool(getConnectionConfig(dbName));
  try {
    await pool.connect();
    const result = await pool.request().execute('sp_GetVisitsAndQuestionsXML');
    const xmlString = extractXmlString(result);
    if (!xmlString) {
      console.error('Analytics XML empty for database', dbName);
      return { parsed: null, repNameMap: new Map(), customerNameMap: new Map(), fetchedAt: Date.now() };
    }
    const parsed = await parseXML(xmlString);
    const payload = (parsed && (parsed.DataPayload || parsed)) || {};
    const repNameMap = await fetchRepNames(pool);
    const customerNameMap = await fetchCustomerNames(pool, payload);
    return { parsed, repNameMap, customerNameMap, fetchedAt: Date.now() };
  } finally {
    await pool.close().catch(() => {});
  }
}

// Concurrent requests for the same database share one procedure execution.
function loadRaw(dbName) {
  const cached = rawCache.get(dbName);
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.value);
  if (rawInFlight.has(dbName)) return rawInFlight.get(dbName);

  const promise = runLoad(dbName)
    .then(value => {
      rawCache.set(dbName, { value, expires: Date.now() + CACHE_TTL_MS });
      return value;
    })
    .finally(() => rawInFlight.delete(dbName));

  rawInFlight.set(dbName, promise);
  return promise;
}

function cachedCompute(cache, key, compute) {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.value);
  return Promise.resolve(compute()).then(value => {
    cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
    return value;
  });
}

async function getDataset({ dbName, startDate, endDate }) {
  const raw = await loadRaw(dbName);
  if (!raw.parsed) return null;
  const key = `${dbName}|${startDate || ''}|${endDate || ''}|${raw.fetchedAt}`;
  return cachedCompute(modelCache, key, () =>
    normalizeDataset(raw.parsed, {
      repNameMap: raw.repNameMap,
      customerNameMap: raw.customerNameMap,
      startDate,
      endDate,
    })
  );
}

async function getAnalytics({ dbName, startDate, endDate }) {
  const raw = await loadRaw(dbName);
  if (!raw.parsed) return null;
  const key = `${dbName}|${startDate || ''}|${endDate || ''}|${raw.fetchedAt}`;
  return cachedCompute(analyticsCache, key, () => {
    const model = normalizeDataset(raw.parsed, {
      repNameMap: raw.repNameMap,
      customerNameMap: raw.customerNameMap,
      startDate,
      endDate,
    });
    return buildAnalytics(model);
  });
}

// Legacy payload kept alive while the frontend moves onto /api/analytics.
async function getLegacyDashboard({ dbName, startDate, endDate, buildDashboardFromXml }) {
  const raw = await loadRaw(dbName);
  if (!raw.parsed) return null;
  const key = `${dbName}|${startDate || ''}|${endDate || ''}|${raw.fetchedAt}`;
  return cachedCompute(legacyCache, key, () =>
    buildDashboardFromXml(raw.parsed, {
      startDate,
      endDate,
      repNameMap: raw.repNameMap,
      customerNameMap: raw.customerNameMap,
    })
  );
}

module.exports = {
  isSafeDatabaseName,
  extractXmlString,
  loadRaw,
  getDataset,
  getAnalytics,
  getLegacyDashboard,
};
