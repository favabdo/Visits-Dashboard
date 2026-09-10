function asArray(value) {
  if (value == null || value === '') return [];
  return Array.isArray(value) ? value : [value];
}

function field(node, name) {
  if (node == null || typeof node !== 'object') return undefined;
  const key = Object.keys(node).find(k => k.toLowerCase() === String(name).toLowerCase());
  if (!key) return undefined;
  let val = node[key];
  if (Array.isArray(val)) val = val[0];
  if (val && typeof val === 'object' && val._ !== undefined) val = val._;
  if (val == null) return undefined;
  const text = String(val).trim();
  return text === '' ? undefined : text;
}

function pickItems(parent, groupName, itemName) {
  if (!parent || typeof parent !== 'object') return [];
  const groupKey = Object.keys(parent).find(k => k.toLowerCase() === groupName.toLowerCase());
  if (!groupKey) return [];
  const group = parent[groupKey];
  if (Array.isArray(group)) return group;
  if (group && typeof group === 'object') {
    const itemKey = Object.keys(group).find(k => k.toLowerCase() === itemName.toLowerCase());
    if (itemKey) return asArray(group[itemKey]);
  }
  return [];
}

function visitDateKey(visitDateStr) {
  if (!visitDateStr) return null;
  const s = String(visitDateStr).trim();
  if (/^\d{8}/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.slice(0, 10);
  }
  return null;
}

function inDateRange(dateKey, startDate, endDate) {
  if (startDate && (!dateKey || dateKey < startDate)) return false;
  if (endDate && (!dateKey || dateKey > endDate)) return false;
  return true;
}

function parseCoord(value) {
  if (value == null || value === '') return null;
  const num = Number.parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(num) ? num : null;
}

function buildDashboardFromXml(parsed, { startDate, endDate } = {}) {
  const payload = parsed?.DataPayload || parsed || {};
  let visits = pickItems(payload, 'Visits', 'Visit');
  let answers = pickItems(payload, 'VisitAnswers', 'Answer');

  if (startDate || endDate) {
    visits = visits.filter(v => inDateRange(visitDateKey(field(v, 'VisitDate')), startDate, endDate));
    const visitIds = new Set(visits.map(v => field(v, 'ID')).filter(Boolean));
    answers = answers.filter(a => visitIds.has(field(a, 'VisitId')));
  }

  const visitIdToRep = new Map();
  const delegateVisitCount = new Map();
  const delegateAnswerCount = new Map();
  const delegateSet = new Set();
  const visitTrendMap = new Map();

  visits.forEach(v => {
    const id = field(v, 'ID');
    const repId = field(v, 'SalesRepId');
    if (id && repId !== undefined) {
      visitIdToRep.set(id, repId);
    }
    if (repId !== undefined) {
      delegateSet.add(repId);
      delegateVisitCount.set(repId, (delegateVisitCount.get(repId) || 0) + 1);
    }
    const dateKey = visitDateKey(field(v, 'VisitDate'));
    if (dateKey) {
      visitTrendMap.set(dateKey, (visitTrendMap.get(dateKey) || 0) + 1);
    }
  });

  answers.forEach(a => {
    const visitId = field(a, 'VisitId');
    const repId = visitIdToRep.get(visitId);
    if (repId !== undefined) {
      delegateAnswerCount.set(repId, (delegateAnswerCount.get(repId) || 0) + 1);
    }
  });

  const totalVisits = visits.length;
  const totalSamples = answers.length;
  const totalDelegates = delegateSet.size;
  const avgSamplesPerVisit = totalVisits > 0 ? totalSamples / totalVisits : 0;

  const visitTrend = Array.from(visitTrendMap.entries())
    .map(([date, visitCount]) => ({ date, visitCount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const samplesByDelegate = Array.from(delegateAnswerCount.entries())
    .map(([delegateId, value]) => ({ label: `مندوب ${delegateId}`, value }))
    .sort((a, b) => b.value - a.value);

  const delegatePerformance = Array.from(delegateSet)
    .map(delegateId => ({
      delegate: `مندوب ${delegateId}`,
      visits: delegateVisitCount.get(delegateId) || 0,
      samples: delegateAnswerCount.get(delegateId) || 0
    }))
    .sort((a, b) => b.visits - a.visits);

  const geoData = visits
    .map(v => {
      const latitude = parseCoord(field(v, 'Latitude'));
      const longitude = parseCoord(field(v, 'Longitude'));
      if (latitude == null || longitude == null) return null;
      return {
        latitude,
        longitude,
        label: `مندوب ${field(v, 'SalesRepId') || 'غير معروف'}`,
        value: 1
      };
    })
    .filter(Boolean);

  return {
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
  };
}

module.exports = {
  asArray,
  field,
  pickItems,
  buildDashboardFromXml,
};
