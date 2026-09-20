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

function asSortedCounts(counts) {
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function buildGeoPoints(visits, getRepName) {
  return visits
    .map(v => {
      const latitude = parseCoord(field(v, 'Latitude'));
      const longitude = parseCoord(field(v, 'Longitude'));
      if (latitude == null || longitude == null) return null;
      return {
        latitude,
        longitude,
        label: getRepName(field(v, 'SalesRepId')),
        outOfRange: field(v, 'OutRange') === '1',
        value: 1
      };
    })
    .filter(Boolean);
}

function buildDashboardFromXml(parsed, { startDate, endDate, repNameMap, customerNameMap } = {}) {
  const repNames = repNameMap instanceof Map ? repNameMap : new Map();
  const custNames = customerNameMap instanceof Map ? customerNameMap : new Map();
  const getRepName = (repId) => {
    if (!repId) return 'غير معروف';
    const name = repNames.get(String(repId));
    return name && name.trim() !== '' ? name : `مندوب ${repId}`;
  };
  const getCustomerName = (custId) => {
    if (!custId) return '-';
    const name = custNames.get(String(custId));
    return name && name.trim() !== '' ? name : custId;
  };

  const normalizeFilterDate = (d) => {
    if (!d) return d;
    const s = String(d).trim();
    if (/^\d{8}$/.test(s)) {
      return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
    }
    return s.slice(0,10);
  };
  const start = normalizeFilterDate(startDate);
  const end = normalizeFilterDate(endDate);

  const payload = parsed?.DataPayload || parsed || {};
  const questions = pickItems(payload, 'Questions', 'Question');
  const options = pickItems(payload, 'QuestionOptions', 'Option');
  let visits = pickItems(payload, 'Visits', 'Visit');
  let answers = pickItems(payload, 'VisitAnswers', 'Answer');

  if (start || end) {
    visits = visits.filter(v => inDateRange(visitDateKey(field(v, 'VisitDate')), start, end));
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

  const optionById = new Map();
  options.forEach(o => {
    const optionId = field(o, 'OptionId');
    if (!optionId) return;
    optionById.set(optionId, {
      questionId: field(o, 'QuestionId'),
      text: field(o, 'OptionText') || optionId,
      order: Number(field(o, 'DisplayOrder') || 0)
    });
  });

  const questionById = new Map();
  questions.forEach(q => {
    const questionId = field(q, 'QuestionId');
    if (!questionId) return;
    questionById.set(questionId, {
      text: field(q, 'QuestionText') || `سؤال ${questionId}`,
      type: field(q, 'QuestionType')
    });
  });

  const findQuestionId = (predicate) => {
    for (const [id, q] of questionById.entries()) {
      if (predicate(q, id)) return id;
    }
    return undefined;
  };

  const ratingQuestionId = findQuestionId(q => q.type === 'dropdown') || '1';
  const competitorQuestionId = findQuestionId(q => q.type === 'radio') || '2';
  const stockQuestionId = findQuestionId(q => q.type === 'checklist') || '3';
  const notesQuestionId = findQuestionId(q => q.type === 'text') || '4';

  const countOptionsFor = (answerList, questionId) => {
    const counts = new Map();
    answerList.forEach(a => {
      if (field(a, 'QuestionId') !== questionId) return;
      const optionId = field(a, 'SelectedOptionId');
      if (!optionId) return;
      const option = optionById.get(optionId);
      const label = option?.text || `اختيار ${optionId}`;
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return asSortedCounts(counts);
  };

  const countOptions = (questionId) => countOptionsFor(answers, questionId);

  const ratingDistribution = countOptions(ratingQuestionId);
  const competitorDistribution = countOptions(competitorQuestionId);
  const stockoutItems = countOptions(stockQuestionId);

  const visitById = new Map();
  visits.forEach(v => {
    const id = field(v, 'ID');
    if (id) visitById.set(id, v);
  });

  const buildNotes = (answerList) =>
    answerList
      .filter(a => field(a, 'QuestionId') === notesQuestionId && field(a, 'AnswerText'))
      .map(a => {
        const visitId = field(a, 'VisitId');
        const visit = visitById.get(visitId) || {};
        const repId = field(visit, 'SalesRepId') || visitIdToRep.get(visitId);
        const custId = field(visit, 'CustomerID');
        return {
          visitId,
          salesRepId: getRepName(repId),
          customerId: getCustomerName(custId),
          visitDate: visitDateKey(field(visit, 'VisitDate')),
          note: field(a, 'AnswerText'),
          createdAt: field(a, 'CreatedAt') || ''
        };
      })
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const notes = buildNotes(answers).slice(0, 20);

  const totalVisits = visits.length;
  const totalSamples = answers.length;
  const totalDelegates = delegateSet.size;
  const avgSamplesPerVisit = totalVisits > 0 ? totalSamples / totalVisits : 0;

  const customers = new Set(visits.map(v => field(v, 'CustomerID')).filter(Boolean));
  const visitsWithAnswers = new Set(answers.map(a => field(a, 'VisitId')).filter(Boolean));
  const completedVisits = visits.filter(v => visitsWithAnswers.has(field(v, 'ID'))).length;
  const formCompletionRate = totalVisits > 0 ? Number(((completedVisits / totalVisits) * 100).toFixed(1)) : 0;

  const outOfRangeVisits = visits.filter(v => field(v, 'OutRange') === '1').length;
  const outOfRangeRate = totalVisits > 0 ? Number(((outOfRangeVisits / totalVisits) * 100).toFixed(1)) : 0;

  const visitTrend = Array.from(visitTrendMap.entries())
    .map(([date, visitCount]) => ({ date, visitCount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const samplesByDelegate = Array.from(delegateAnswerCount.entries())
    .map(([delegateId, value]) => ({ label: getRepName(delegateId), value }))
    .sort((a, b) => b.value - a.value);

  const delegatePerformance = Array.from(delegateSet)
    .map(delegateId => ({
      delegate: getRepName(delegateId),
      visits: delegateVisitCount.get(delegateId) || 0,
      samples: delegateAnswerCount.get(delegateId) || 0
    }))
    .sort((a, b) => b.visits - a.visits);

  const geoData = buildGeoPoints(visits, getRepName);

  const visitsByRep = new Map();
  visits.forEach(v => {
    const repId = field(v, 'SalesRepId');
    if (repId === undefined) return;
    if (!visitsByRep.has(repId)) visitsByRep.set(repId, []);
    visitsByRep.get(repId).push(v);
  });

  const answersByRep = new Map();
  answers.forEach(a => {
    const repId = visitIdToRep.get(field(a, 'VisitId'));
    if (repId === undefined) return;
    if (!answersByRep.has(repId)) answersByRep.set(repId, []);
    answersByRep.get(repId).push(a);
  });

  const delegates = Array.from(delegateSet).map(delegateId => {
    const repVisits = visitsByRep.get(delegateId) || [];
    const repAnswers = answersByRep.get(delegateId) || [];
    const repVisitIds = new Set(repVisits.map(v => field(v, 'ID')).filter(Boolean));
    const repAnsweredVisitIds = new Set(
      repAnswers.map(a => field(a, 'VisitId')).filter(id => repVisitIds.has(id))
    );
    const repCompleted = repAnsweredVisitIds.size;
    const repOutOfRange = repVisits.filter(v => field(v, 'OutRange') === '1').length;
    const repTrendMap = new Map();
    repVisits.forEach(v => {
      const dateKey = visitDateKey(field(v, 'VisitDate'));
      if (dateKey) repTrendMap.set(dateKey, (repTrendMap.get(dateKey) || 0) + 1);
    });

    return {
      name: getRepName(delegateId),
      totals: {
        totalVisits: repVisits.length,
        totalSamples: repAnswers.length,
        avgSamplesPerVisit: Number(
          (repVisits.length > 0 ? repAnswers.length / repVisits.length : 0).toFixed(2)
        ),
        uniqueCustomers: new Set(repVisits.map(v => field(v, 'CustomerID')).filter(Boolean)).size,
        formCompletionRate: repVisits.length > 0
          ? Number(((repCompleted / repVisits.length) * 100).toFixed(1))
          : 0,
        completedVisits: repCompleted,
        outOfRangeRate: repVisits.length > 0
          ? Number(((repOutOfRange / repVisits.length) * 100).toFixed(1))
          : 0,
        outOfRangeVisits: repOutOfRange
      },
      visitTrend: Array.from(repTrendMap.entries())
        .map(([date, visitCount]) => ({ date, visitCount }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      ratingDistribution: countOptionsFor(repAnswers, ratingQuestionId),
      competitorDistribution: countOptionsFor(repAnswers, competitorQuestionId),
      stockoutItems: countOptionsFor(repAnswers, stockQuestionId),
      geoData: buildGeoPoints(repVisits, getRepName),
      notes: buildNotes(repAnswers).slice(0, 20)
    };
  }).sort((a, b) => b.totals.totalVisits - a.totals.totalVisits);

  return {
    totals: {
      totalVisits,
      totalSamples,
      totalDelegates,
      avgSamplesPerVisit: Number(avgSamplesPerVisit.toFixed(2)),
      uniqueCustomers: customers.size,
      formCompletionRate,
      outOfRangeRate,
      completedVisits,
      outOfRangeVisits
    },
    visitTrend,
    samplesByDelegate,
    delegatePerformance,
    delegates,
    geoData,
    ratingDistribution,
    competitorDistribution,
    stockoutItems,
    notes
  };
}

module.exports = {
  asArray,
  field,
  pickItems,
  buildDashboardFromXml,
};
