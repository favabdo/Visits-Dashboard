const { classifyNote } = require('./textRules');

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

function pct(value, total) {
  return total > 0 ? Number(((value * 100) / total).toFixed(1)) : 0;
}

const KM_PER_DEG_LAT = 111.32;

// Bounding-box diagonal of a set of coordinates, in km: a cheap read of how wide
// an area a rep actually covers.
function geoCoverage(visits) {
  const points = [];
  visits.forEach(v => {
    const latitude = parseCoord(field(v, 'Latitude'));
    const longitude = parseCoord(field(v, 'Longitude'));
    if (latitude != null && longitude != null) points.push({ latitude, longitude });
  });
  if (!points.length) return { points: 0, spanKm: 0 };

  const lats = points.map(p => p.latitude);
  const lons = points.map(p => p.longitude);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const latKm = (Math.max(...lats) - Math.min(...lats)) * KM_PER_DEG_LAT;
  const lonKm = (Math.max(...lons) - Math.min(...lons)) * KM_PER_DEG_LAT * Math.cos((midLat * Math.PI) / 180);

  return {
    points: points.length,
    spanKm: Number(Math.sqrt(latKm * latKm + lonKm * lonKm).toFixed(1))
  };
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

  const optionsByQuestion = new Map();
  options.forEach(o => {
    const questionId = field(o, 'QuestionId');
    const optionId = field(o, 'OptionId');
    if (!questionId || !optionId) return;
    if (!optionsByQuestion.has(questionId)) optionsByQuestion.set(questionId, []);
    optionsByQuestion.get(questionId).push({
      id: optionId,
      text: field(o, 'OptionText'),
      order: Number(field(o, 'DisplayOrder') || 0)
    });
  });

  // A question's shape is read from its own answers, so any new QuestionType
  // (or renamed one) flows into the analytics engine without a code change.
  const buildQuestions = (answerList) => {
    const totalAnswers = answerList.length;
    return questions
      .map(q => {
        const id = field(q, 'QuestionId');
        const own = answerList.filter(a => field(a, 'QuestionId') === id);
        const hasSelection = own.some(a => field(a, 'SelectedOptionId'));
        const hasText = own.some(a => field(a, 'AnswerText'));

        const answersPerVisit = new Map();
        own.forEach(a => {
          const visitId = field(a, 'VisitId');
          answersPerVisit.set(visitId, (answersPerVisit.get(visitId) || 0) + 1);
        });

        const counts = new Map();
        own.forEach(a => {
          const optionId = field(a, 'SelectedOptionId');
          if (!optionId) return;
          counts.set(optionId, (counts.get(optionId) || 0) + 1);
        });

        const rows = [];
        const seen = new Set();
        (optionsByQuestion.get(id) || []).forEach(o => {
          if (seen.has(o.id)) return;
          seen.add(o.id);
          rows.push({ label: o.text || 'خيار غير مسمى', value: counts.get(o.id) || 0, order: o.order });
        });
        counts.forEach((value, optionId) => {
          if (seen.has(optionId)) return;
          seen.add(optionId);
          rows.push({ label: 'خيار غير مسمى', value, order: 0 });
        });

        const distribution = rows
          .sort((a, b) => b.value - a.value || a.order - b.order)
          .map((row, index) => ({
            label: row.label,
            value: row.value,
            percentage: pct(row.value, own.length),
            rank: index + 1
          }));
        const picked = distribution.filter(row => row.value > 0);

        return {
          id,
          text: field(q, 'QuestionText') || 'سؤال بدون اسم',
          type: field(q, 'QuestionType') || '',
          kind:
            !hasSelection && hasText
              ? 'note'
              : Array.from(answersPerVisit.values()).some(c => c > 1)
                ? 'multi'
                : 'single',
          answeredCount: own.length,
          responsePercentage: pct(own.length, totalAnswers),
          optionCount: (optionsByQuestion.get(id) || []).length,
          distribution,
          mostSelected: picked[0] || null,
          leastSelected: picked.length > 1 ? picked[picked.length - 1] : null
        };
      })
      .filter(q => q.id !== undefined);
  };

  const buildKpis = questionStats => {
    const choice = questionStats.filter(q => q.kind !== 'note');
    const answered = choice
      .filter(q => q.answeredCount > 0)
      .sort((a, b) => b.answeredCount - a.answeredCount);

    const brief = q => ({
      text: q.text,
      answeredCount: q.answeredCount,
      responsePercentage: q.responsePercentage
    });

    const allPicks = [];
    choice.forEach(q => {
      (q.distribution || []).forEach(row => {
        if (row.value > 0)
          allPicks.push({
            question: q.text,
            option: row.label,
            value: row.value,
            percentage: row.percentage
          });
      });
    });
    allPicks.sort((a, b) => b.value - a.value);

    const multi = choice
      .filter(q => q.kind === 'multi' && q.answeredCount > 0)
      .sort((a, b) => b.answeredCount - a.answeredCount)[0];
    const multiTop =
      multi && multi.mostSelected
        ? {
            question: multi.text,
            option: multi.mostSelected.label,
            value: multi.mostSelected.value,
            percentage: multi.mostSelected.percentage
          }
        : null;

    return {
      questionCount: choice.length,
      answeredQuestionCount: answered.length,
      mostAnsweredQuestion: answered[0] ? brief(answered[0]) : null,
      leastAnsweredQuestion: answered.length > 1 ? brief(answered[answered.length - 1]) : null,
      topAnswer: allPicks[0] || null,
      topAnswers: allPicks.slice(0, 3),
      mostRequestedProduct: multiTop
    };
  };

  const questionStats = buildQuestions(answers);
  const noteQuestionIds = new Set(
    questionStats.filter(q => q.kind === 'note').map(q => q.id)
  );

  const visitById = new Map();
  visits.forEach(v => {
    const id = field(v, 'ID');
    if (id) visitById.set(id, v);
  });

  const buildNotes = (answerList) =>
    answerList
      .filter(a => noteQuestionIds.has(field(a, 'QuestionId')) && field(a, 'AnswerText'))
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

  // Status is authoritative when the procedure exposes it; otherwise a visit that
  // carries answers counts as completed.
  const hasStatusColumn = visits.some(v => field(v, 'Status') !== undefined);
  const visitsWithAnswers = new Set(answers.map(a => field(a, 'VisitId')).filter(Boolean));
  const isCompleted = hasStatusColumn
    ? v => field(v, 'Status') === '1'
    : v => visitsWithAnswers.has(field(v, 'ID'));

  const totalVisits = visits.length;
  const totalSamples = answers.length;
  const totalDelegates = delegateSet.size;
  const avgSamplesPerVisit = totalVisits > 0 ? totalSamples / totalVisits : 0;

  const customers = new Set(visits.map(v => field(v, 'CustomerID')).filter(Boolean));
  const completedVisits = visits.filter(isCompleted).length;
  const formCompletionRate = pct(completedVisits, totalVisits);

  const outOfRangeVisits = visits.filter(v => field(v, 'OutRange') === '1').length;
  const outOfRangeRate = pct(outOfRangeVisits, totalVisits);

  const customerStats = (() => {
    const byId = new Map();
    const entry = id => {
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          name: getCustomerName(id),
          visits: 0,
          completed: 0,
          outOfRange: 0,
          firstVisit: null,
          lastVisit: null,
          reps: new Set(),
          notesCount: 0,
          followUpCount: 0,
          negativeCount: 0,
          lastNote: null
        });
      }
      return byId.get(id);
    };

    visits.forEach(v => {
      const id = field(v, 'CustomerID');
      if (!id) return;
      const customer = entry(id);
      customer.visits += 1;
      if (isCompleted(v)) customer.completed += 1;
      if (field(v, 'OutRange') === '1') customer.outOfRange += 1;
      const repId = field(v, 'SalesRepId');
      if (repId !== undefined) customer.reps.add(getRepName(repId));
      const dateKey = visitDateKey(field(v, 'VisitDate'));
      if (dateKey) {
        if (!customer.firstVisit || dateKey < customer.firstVisit) customer.firstVisit = dateKey;
        if (!customer.lastVisit || dateKey > customer.lastVisit) customer.lastVisit = dateKey;
      }
    });

    answers.forEach(a => {
      if (!noteQuestionIds.has(field(a, 'QuestionId'))) return;
      const text = field(a, 'AnswerText');
      if (!text) return;
      const visit = visitById.get(field(a, 'VisitId'));
      const id = visit && field(visit, 'CustomerID');
      if (!id) return;

      const customer = entry(id);
      const signal = classifyNote(text);
      customer.notesCount += 1;
      if (signal.followUp) customer.followUpCount += 1;
      if (signal.negative) customer.negativeCount += 1;

      const createdAt = field(a, 'CreatedAt') || '';
      if (!customer.lastNote || createdAt >= customer.lastNote.at) {
        customer.lastNote = { at: createdAt, text, sentiment: signal.sentiment };
      }
    });

    return Array.from(byId.values())
      .map(customer => ({
        ...customer,
        reps: Array.from(customer.reps),
        completionRate: pct(customer.completed, customer.visits),
        lastNote: customer.lastNote ? customer.lastNote.text : null,
        lastNoteSentiment: customer.lastNote ? customer.lastNote.sentiment : null
      }))
      .sort((a, b) => b.visits - a.visits || String(a.name).localeCompare(String(b.name)));
  })();

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
    const repCompleted = hasStatusColumn
      ? repVisits.filter(v => field(v, 'Status') === '1').length
      : repAnsweredVisitIds.size;
    const repOutOfRange = repVisits.filter(v => field(v, 'OutRange') === '1').length;
    const repTrendMap = new Map();
    repVisits.forEach(v => {
      const dateKey = visitDateKey(field(v, 'VisitDate'));
      if (dateKey) repTrendMap.set(dateKey, (repTrendMap.get(dateKey) || 0) + 1);
    });

    const repQuestions = buildQuestions(repAnswers);

    return {
      name: getRepName(delegateId),
      totals: {
        totalVisits: repVisits.length,
        totalSamples: repAnswers.length,
        avgSamplesPerVisit: Number(
          (repVisits.length > 0 ? repAnswers.length / repVisits.length : 0).toFixed(2)
        ),
        uniqueCustomers: new Set(repVisits.map(v => field(v, 'CustomerID')).filter(Boolean)).size,
        formCompletionRate: pct(repCompleted, repVisits.length),
        completedVisits: repCompleted,
        outOfRangeRate: pct(repOutOfRange, repVisits.length),
        outOfRangeVisits: repOutOfRange
      },
      visitTrend: Array.from(repTrendMap.entries())
        .map(([date, visitCount]) => ({ date, visitCount }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      questions: repQuestions,
      kpis: buildKpis(repQuestions),
      coverage: geoCoverage(repVisits),
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
    customers: customerStats,
    geoData,
    questions: questionStats,
    kpis: buildKpis(questionStats),
    notes
  };
}

module.exports = {
  asArray,
  field,
  pickItems,
  buildDashboardFromXml,
};
