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
  const questions = pickItems(payload, 'Questions', 'Question');
  const options = pickItems(payload, 'QuestionOptions', 'Option');
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

  const countOptions = (questionId) => {
    const counts = new Map();
    answers.forEach(a => {
      if (field(a, 'QuestionId') !== questionId) return;
      const optionId = field(a, 'SelectedOptionId');
      if (!optionId) return;
      const option = optionById.get(optionId);
      const label = option?.text || `اختيار ${optionId}`;
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  };

  const ratingDistribution = countOptions(ratingQuestionId);
  const competitorDistribution = countOptions(competitorQuestionId);
  const stockoutItems = countOptions(stockQuestionId);

  const notes = answers
    .filter(a => field(a, 'QuestionId') === notesQuestionId && field(a, 'AnswerText'))
    .map(a => {
      const visitId = field(a, 'VisitId');
      const visit = visits.find(v => field(v, 'ID') === visitId) || {};
      return {
        visitId,
        salesRepId: field(visit, 'SalesRepId') || visitIdToRep.get(visitId) || '-',
        customerId: field(visit, 'CustomerID') || '-',
        visitDate: visitDateKey(field(visit, 'VisitDate')),
        note: field(a, 'AnswerText'),
        createdAt: field(a, 'CreatedAt') || ''
      };
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 20);

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
        outOfRange: field(v, 'OutRange') === '1',
        value: 1
      };
    })
    .filter(Boolean);

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
