const { detectQualityIssues } = require('./quality');
const { analyzeText } = require('./text');
const { buildInsights } = require('./insights');
const { classifyNote } = require('../utils/textRules');
const {
  round1, share, bump, topFromCounts, series, halves, extremes,
  weekdayDistribution, durationMinutes,
} = require('./metrics');

// Analytics engine. Reads only the normalised model, so a question or option
// added to the stored procedure shows up here with no code change.

const ACTIVE_WINDOW_DAYS = 30;

function addDays(dateKey, days) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const daysBetween = (from, to) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

function windowOf(visits) {
  const dates = visits.map(v => v.date).filter(Boolean).sort();
  if (!dates.length) return { start: null, end: null, days: 0 };
  return { start: dates[0], end: dates[dates.length - 1], days: daysBetween(dates[0], dates[dates.length - 1]) + 1 };
}

// A readable area name: the address segment when present, otherwise a coarse
// coordinate cell so unmapped visits still group somewhere.
function areaLabel(visit) {
  if (visit.area) return visit.area;
  if (visit.coordinatesValid) return `منطقة (${round1(visit.latitude)}, ${round1(visit.longitude)})`;
  return 'بدون موقع محدد';
}

function buildAnalytics(model) {
  const { visits, answers, questions, options, customers, reps, index, label } = model;
  const quality = detectQualityIssues(model);
  const text = analyzeText(model);
  const window = windowOf(visits);

  const completed = visits.filter(v => (v.status != null ? v.status === 1 : (index.answersByVisit.get(v.id) || []).length > 0));
  const pending = visits.filter(v => v.status === 0);
  const statusUnknown = visits.filter(v => v.status == null);
  const outOfRange = visits.filter(v => v.outRange === 1);

  const answersPerVisit = visits.map(v => (index.answersByVisit.get(v.id) || []).length);
  const responseRate = share(answers.length, visits.length * Math.max(questions.length, 1));

  const perCustomer = customers.map(customer => {
    const own = index.visitsByCustomer.get(customer.id) || [];
    const ownAnswers = own.flatMap(v => index.answersByVisit.get(v.id) || []);
    const notes = ownAnswers.filter(a => a.kind === 'text' && a.text);
    const signals = notes.map(n => classifyNote(n.text));
    const lastVisit = own.map(v => v.date).filter(Boolean).sort().pop() || null;
    return {
      id: customer.id,
      name: customer.name,
      visits: own.length,
      completed: own.filter(v => (v.status != null ? v.status === 1 : (index.answersByVisit.get(v.id) || []).length > 0)).length,
      completionRate: share(own.filter(v => (v.status != null ? v.status === 1 : (index.answersByVisit.get(v.id) || []).length > 0)).length, own.length),
      outOfRange: own.filter(v => v.outRange === 1).length,
      answers: ownAnswers.length,
      reps: Array.from(new Set(own.map(v => v.repId).filter(Boolean).map(id => label.rep(id)))),
      firstVisit: own.map(v => v.date).filter(Boolean).sort()[0] || null,
      lastVisit,
      daysSinceLastVisit: lastVisit && window.end ? daysBetween(lastVisit, window.end) : null,
      areas: Array.from(new Set(own.map(areaLabel))),
      notesCount: notes.length,
      followUpCount: signals.filter(s => s.followUp).length,
      negativeCount: signals.filter(s => s.negative).length,
      noAnswers: own.length > 0 && ownAnswers.length === 0,
      allOutOfRange: own.length > 0 && own.every(v => v.outRange === 1),
    };
  });

  const perRep = reps.map(rep => {
    const own = index.visitsByRep.get(rep.id) || [];
    const ownAnswers = own.flatMap(v => index.answersByVisit.get(v.id) || []);
    const ownCustomers = new Set(own.map(v => v.customerId).filter(Boolean));
    const optionAnswers = ownAnswers.filter(a => a.kind === 'option' && a.optionKnown);
    const answerCounts = new Map();
    optionAnswers.forEach(a => bump(answerCounts, `${a.questionId}|${a.optionId}`));
    const activity = series(own, v => v.date, 'week');
    const durations = own
      .map(v => durationMinutes(index.answersByVisit.get(v.id) || []))
      .filter(min => min != null);

    return {
      id: rep.id,
      name: rep.name,
      visits: own.length,
      completed: own.filter(v => (v.status != null ? v.status === 1 : (index.answersByVisit.get(v.id) || []).length > 0)).length,
      uniqueCustomers: ownCustomers.size,
      avgVisitsPerCustomer: ownCustomers.size ? round1(own.length / ownCustomers.size) : 0,
      completionRate: share(own.filter(v => (v.status != null ? v.status === 1 : (index.answersByVisit.get(v.id) || []).length > 0)).length, own.length),
      outOfRangeRate: share(own.filter(v => v.outRange === 1).length, own.length),
      answers: ownAnswers.length,
      responseRate: own.length ? round1(ownAnswers.length / own.length) : 0,
      questionsAnswered: new Set(ownAnswers.map(a => a.questionId)).size,
      mostCommonAnswers: Array.from(answerCounts.entries())
        .map(([key, count]) => {
          const [questionId, optionId] = key.split('|');
          return { question: label.question(questionId), option: label.option(questionId, optionId), count, percentage: share(count, optionAnswers.length) };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
      areas: topFromCounts(new Map(Array.from(own.reduce((map, v) => (bump(map, areaLabel(v)), map), new Map()).entries())), own.length, 6),
      coverage: {
        points: own.filter(v => v.coordinatesValid).length,
        areas: new Set(own.map(areaLabel)).size,
      },
      activitySeries: activity,
      activityTrend: halves(activity),
      avgVisitMinutes: durations.length ? round1(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
      notesCount: ownAnswers.filter(a => a.kind === 'text').length,
    };
  });

  const perQuestion = questions.map(question => {
    const own = index.answersByQuestion.get(question.id) || [];
    const optionAnswers = own.filter(a => a.kind === 'option');
    const textAnswers = own.filter(a => a.kind === 'text');
    const counts = new Map();
    optionAnswers.forEach(a => bump(counts, a.optionId));

    const rows = (question.optionIds.length ? question.optionIds : Array.from(counts.keys()))
      .map((optionId, order) => ({
        optionId,
        label: label.option(question.id, optionId) || 'خيار غير مسمى',
        count: counts.get(optionId) || 0,
        displayOrder: order + 1,
      }));
    const distribution = rows
      .sort((a, b) => b.count - a.count || a.displayOrder - b.displayOrder)
      .map((row, position) => ({
        label: row.label,
        count: row.count,
        percentage: share(row.count, own.length),
        rank: position + 1,
      }));
    const picked = distribution.filter(d => d.count > 0);
    const visitsWithAnswer = new Set(own.map(a => a.visitId)).size;

    const byRep = new Map();
    const byArea = new Map();
    const byCustomer = new Map();
    own.forEach(a => {
      const visit = index.visitById.get(a.visitId);
      if (!visit) return;
      bump(byRep, label.rep(visit.repId));
      bump(byArea, areaLabel(visit));
      if (visit.customerId) bump(byCustomer, label.customer(visit.customerId));
    });

    return {
      id: question.id,
      text: question.text,
      type: question.type,
      required: question.required,
      active: question.active,
      shape: optionAnswers.length ? (new Set(optionAnswers.map(a => a.visitId)).size < optionAnswers.length ? 'multi' : 'single') : textAnswers.length ? 'text' : 'unanswered',
      responseCount: own.length,
      visitsCovered: visitsWithAnswer,
      responseRate: share(visitsWithAnswer, visits.length),
      missingResponseRate: visits.length ? round1(100 - (visitsWithAnswer * 100) / visits.length) : 0,
      optionCount: question.optionIds.length,
      distribution,
      mostSelected: picked[0] || null,
      leastSelected: picked.length > 1 ? picked[picked.length - 1] : null,
      concentration: picked[0] ? picked[0].percentage : 0,
      trend: series(own, a => a.date, 'week'),
      byRep: topFromCounts(byRep, own.length, 8),
      byArea: topFromCounts(byArea, own.length, 8),
      byCustomer: topFromCounts(byCustomer, own.length, 8),
    };
  });

  const perOption = [];
  options.forEach(option => {
    if (!option.questionKnown) return;
    const own = (index.answersByQuestion.get(option.questionId) || []).filter(a => a.optionId === option.id);
    if (!own.length) {
      perOption.push({ question: label.question(option.questionId), label: option.text, count: 0, percentage: 0, firstSeen: null, lastSeen: null, byRep: [], byArea: [] });
      return;
    }
    const byRep = new Map();
    const byArea = new Map();
    own.forEach(a => {
      const visit = index.visitById.get(a.visitId);
      if (!visit) return;
      bump(byRep, label.rep(visit.repId));
      bump(byArea, areaLabel(visit));
    });
    const dates = own.map(a => a.date).filter(Boolean).sort();
    const questionAnswers = (index.answersByQuestion.get(option.questionId) || []).length;
    perOption.push({
      question: label.question(option.questionId),
      label: option.text,
      count: own.length,
      percentage: share(own.length, questionAnswers),
      shareOfAllAnswers: share(own.length, answers.length),
      firstSeen: dates[0] || null,
      lastSeen: dates[dates.length - 1] || null,
      trend: series(own, a => a.date, 'week'),
      byRep: topFromCounts(byRep, own.length, 6),
      byArea: topFromCounts(byArea, own.length, 6),
    });
  });
  perOption.sort((a, b) => b.count - a.count);

  const areaGroups = new Map();
  visits.forEach(v => {
    const area = areaLabel(v);
    if (!areaGroups.has(area)) areaGroups.set(area, []);
    areaGroups.get(area).push(v);
  });
  const areaStats = Array.from(areaGroups.entries())
    .map(([area, own]) => {
      const count = own.length;
      return {
        area,
        visits: count,
        percentage: share(count, visits.length),
        customers: new Set(own.map(v => v.customerId).filter(Boolean)).size,
        reps: Array.from(new Set(own.map(v => label.rep(v.repId)))),
        outOfRange: own.filter(v => v.outRange === 1).length,
        outOfRangeRate: share(own.filter(v => v.outRange === 1).length, own.length),
        answers: own.flatMap(v => index.answersByVisit.get(v.id) || []).length,
      };
    })
    .sort((a, b) => b.visits - a.visits);
  const avgAreaVisits = areaStats.length ? visits.length / areaStats.length : 0;
  areaStats.forEach(area => {
    area.underCovered = area.visits < avgAreaVisits / 2;
    area.repeatHeavy = area.visits > 0 && area.customers > 0 && area.visits / area.customers > 1.5;
  });

  const located = visits.filter(v => v.coordinatesValid);
  const geoPoints = located.slice(0, 4000).map(v => ({
    latitude: v.latitude,
    longitude: v.longitude,
    area: areaLabel(v),
    customer: label.customer(v.customerId),
    rep: label.rep(v.repId),
    date: v.date,
    outOfRange: v.outRange === 1,
  }));

  // ~0.01 degrees is roughly a kilometre: enough to read field density.
  const densityCells = new Map();
  located.forEach(v => {
    const key = `${Math.round(v.latitude * 100)}:${Math.round(v.longitude * 100)}`;
    if (!densityCells.has(key)) densityCells.set(key, []);
    densityCells.get(key).push(v);
  });
  const geoDensity = Array.from(densityCells.entries())
    .map(([key, own]) => {
      const [latKey, lngKey] = key.split(':');
      return {
        latitude: Number(latKey) / 100,
        longitude: Number(lngKey) / 100,
        visits: own.length,
        customers: new Set(own.map(v => v.customerId).filter(Boolean)).size,
        outOfRange: own.filter(v => v.outRange === 1).length,
        areas: Array.from(new Set(own.map(areaLabel))).slice(0, 3),
      };
    })
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 25);

  const visitSeriesDay = series(visits, v => v.date, 'day');
  const visitSeriesWeek = series(visits, v => v.date, 'week');
  const visitSeriesMonth = series(visits, v => v.date, 'month');
  const answerSeriesWeek = series(answers, a => a.date, 'week');

  const customerVisitFrequency = new Map();
  perCustomer.forEach(c => bump(customerVisitFrequency, `${c.visits} زيارة`));

  const overview = {
    window,
    totals: {
      visits: visits.length,
      completedVisits: completed.length,
      pendingVisits: pending.length,
      statusUnknownVisits: statusUnknown.length,
      completionRate: share(completed.length, visits.length),
      outOfRangeVisits: outOfRange.length,
      outOfRangeRate: share(outOfRange.length, visits.length),
      customers: customers.length,
      activeCustomers: perCustomer.filter(c => c.daysSinceLastVisit != null && c.daysSinceLastVisit <= ACTIVE_WINDOW_DAYS).length,
      inactiveCustomers: perCustomer.filter(c => c.daysSinceLastVisit != null && c.daysSinceLastVisit > ACTIVE_WINDOW_DAYS).length,
      reps: reps.length,
      questions: questions.length,
      answeredQuestions: perQuestion.filter(q => q.responseCount > 0).length,
      options: options.length,
      answers: answers.length,
      notesCount: text.notesCount,
      answersPerVisit: visits.length ? round1(answers.length / visits.length) : 0,
      responseRate,
      avgVisitMinutes: (() => {
        const d = visits.map(v => durationMinutes(index.answersByVisit.get(v.id) || [])).filter(x => x != null);
        return d.length ? round1(d.reduce((a, b) => a + b, 0) / d.length) : null;
      })(),
      areas: areaStats.length,
    },
    headline: {
      mostCommonAnswer: perOption[0] ? { question: perOption[0].question, option: perOption[0].label, count: perOption[0].count, percentage: perOption[0].percentage } : null,
      mostRequestedProduct: (() => {
        const multi = perQuestion.filter(q => q.shape === 'multi' && q.mostSelected);
        multi.sort((a, b) => b.responseCount - a.responseCount);
        return multi[0] ? { question: multi[0].text, option: multi[0].mostSelected.label, count: multi[0].mostSelected.count } : null;
      })(),
      mostCommonComplaint: text.complaints[0] || null,
      mostCommonTopic: text.keywords[0] || null,
      busiestRep: perRep.length ? [...perRep].sort((a, b) => b.visits - a.visits)[0].name : null,
      busiestArea: areaStats[0] ? areaStats[0].area : null,
      followUpCustomers: perCustomer.filter(c => c.followUpCount > 0).length,
      negativeFeedbackCustomers: perCustomer.filter(c => c.negativeCount > 0).length,
    },
    visitsTrendWeek: visitSeriesWeek,
    visitsTrendChange: halves(visitSeriesWeek),
    questionCoverage: perQuestion.map(question => ({
      text: question.text,
      type: question.type,
      shape: question.shape,
      responseCount: question.responseCount,
      visitsCovered: question.visitsCovered,
      responseRate: question.responseRate,
      missingResponseRate: question.missingResponseRate,
      concentration: question.concentration,
      leadingOption: question.mostSelected
        ? { label: question.mostSelected.label, count: question.mostSelected.count, percentage: question.mostSelected.percentage }
        : null,
    })),
    dataQuality: quality.summary,
  };

  const visitsSection = {
    totals: overview.totals,
    daily: visitSeriesDay,
    weekly: visitSeriesWeek,
    monthly: visitSeriesMonth,
    dailyChange: halves(visitSeriesDay),
    weeklyChange: halves(visitSeriesWeek),
    monthlyChange: halves(visitSeriesMonth),
    byRep: topFromCounts(new Map(perRep.map(r => [r.name, r.visits])), visits.length, 20),
    byCustomer: perCustomer.slice(0, 20).map(c => ({ label: c.name, count: c.visits, percentage: share(c.visits, visits.length) })),
    byArea: areaStats.map(a => ({ label: a.area, count: a.visits, percentage: a.percentage })),
    frequencyDistribution: topFromCounts(customerVisitFrequency, customers.length, 10),
    repeatCustomers: perCustomer.filter(c => c.visits > 1).length,
    duplicateVisits: quality.issues.find(i => i.code === 'duplicate_visit_id')?.count || 0,
    sameDayRepeatVisits: (() => {
      const keys = new Map();
      visits.forEach(v => bump(keys, `${v.customerId}|${v.date}`));
      return Array.from(keys.values()).filter(n => n > 1).length;
    })(),
    weekdayDistribution: weekdayDistribution(visits, v => v.date),
    avgVisitMinutes: overview.totals.avgVisitMinutes,
    missingData: {
      withoutCoordinates: visits.filter(v => !v.coordinatesValid).length,
      withoutAddress: visits.filter(v => !v.address).length,
      withoutStatus: statusUnknown.length,
      withoutAnswers: visits.filter(v => !(index.answersByVisit.get(v.id) || []).length).length,
    },
  };

  const trends = {
    window,
    visits: { daily: visitSeriesDay, weekly: visitSeriesWeek, monthly: visitSeriesMonth, change: halves(visitSeriesWeek), ...extremes(visitSeriesDay) },
    answers: { weekly: answerSeriesWeek, change: halves(answerSeriesWeek) },
    lowActivityDays: visitSeriesDay.filter(d => d.count <= (visits.length / Math.max(visitSeriesDay.length, 1)) / 2).slice(0, 10),
    activeDayCount: visitSeriesDay.length,
    perQuestion: perQuestion.filter(q => q.trend.length > 1).map(q => ({
      text: q.text,
      trend: q.trend,
      change: halves(q.trend),
    })).filter(entry => entry.change),
    perRep: perRep.filter(r => r.activityTrend).map(r => ({ name: r.name, change: r.activityTrend })),
    weekdayDistribution: visitsSection.weekdayDistribution,
  };

  const crossAnalysis = {
    questionByRep: perQuestion.filter(q => q.byRep.length).map(q => ({ question: q.text, reps: q.byRep })),
    questionByArea: perQuestion.filter(q => q.byArea.length).map(q => ({ question: q.text, areas: q.byArea })),
    questionByCustomer: perQuestion.filter(q => q.byCustomer.length).map(q => ({ question: q.text, customers: q.byCustomer })),
    optionByRep: perOption.filter(o => o.count && o.byRep.length).slice(0, 30).map(o => ({ question: o.question, option: o.label, reps: o.byRep })),
    optionByArea: perOption.filter(o => o.count && o.byArea.length).slice(0, 30).map(o => ({ question: o.question, option: o.label, areas: o.byArea })),
    optionTrends: perOption.filter(o => o.count && o.trend.length > 1).slice(0, 20).map(o => ({ question: o.question, option: o.label, trend: o.trend, change: halves(o.trend) })),
    customerByRep: perCustomer.filter(c => c.reps.length).slice(0, 40).map(c => ({ customer: c.name, visits: c.visits, reps: c.reps })),
    repByArea: perRep.filter(r => r.areas.length).map(r => ({ rep: r.name, visits: r.visits, areas: r.areas })),
  };

  const analytics = {
    generatedAt: new Date().toISOString(),
    sourceCounts: model.sourceCounts,
    overview,
    visits: visitsSection,
    customers: {
      totals: {
        customers: customers.length,
        active: overview.totals.activeCustomers,
        inactive: overview.totals.inactiveCustomers,
        withFollowUp: perCustomer.filter(c => c.followUpCount > 0).length,
        withNegativeNotes: perCustomer.filter(c => c.negativeCount > 0).length,
        withoutAnswers: perCustomer.filter(c => c.noAnswers).length,
      },
      list: perCustomer.sort((a, b) => b.visits - a.visits),
      mostVisited: perCustomer.slice().sort((a, b) => b.visits - a.visits).slice(0, 10),
      leastVisited: perCustomer.slice().sort((a, b) => a.visits - b.visits).slice(0, 10),
      needingFollowUp: perCustomer.filter(c => c.followUpCount > 0).sort((a, b) => b.followUpCount - a.followUpCount).slice(0, 20),
      negativeFeedback: perCustomer.filter(c => c.negativeCount > 0).sort((a, b) => b.negativeCount - a.negativeCount).slice(0, 20),
      unusual: perCustomer.filter(c => c.allOutOfRange || c.noAnswers || (c.daysSinceLastVisit != null && c.daysSinceLastVisit > ACTIVE_WINDOW_DAYS * 2)).slice(0, 20),
    },
    salesReps: {
      totals: {
        reps: reps.length,
        avgVisitsPerRep: reps.length ? round1(visits.length / reps.length) : 0,
        avgCompletionRate: reps.length ? round1(perRep.reduce((s, r) => s + r.completionRate, 0) / reps.length) : 0,
        avgOutOfRangeRate: reps.length ? round1(perRep.reduce((s, r) => s + r.outOfRangeRate, 0) / reps.length) : 0,
      },
      list: perRep.sort((a, b) => b.visits - a.visits),
    },
    questions: { count: perQuestion.length, list: perQuestion },
    options: { count: perOption.length, list: perOption },
    trends,
    geography: {
      areas: areaStats,
      points: geoPoints,
      density: geoDensity,
      coverage: {
        areas: areaStats.length,
        locatedVisits: visits.filter(v => v.coordinatesValid).length,
        locatedShare: share(visits.filter(v => v.coordinatesValid).length, visits.length),
        unlocatedVisits: visits.filter(v => !v.coordinatesValid).length,
      },
      outOfRange: {
        total: outOfRange.length,
        rate: share(outOfRange.length, visits.length),
        byArea: areaStats.filter(a => a.outOfRange).sort((a, b) => b.outOfRangeRate - a.outOfRangeRate).slice(0, 10)
          .map(a => ({ area: a.area, count: a.outOfRange, rate: a.outOfRangeRate })),
      },
      gaps: areaStats.filter(a => a.underCovered).slice(0, 15),
      repeatHeavy: areaStats.filter(a => a.repeatHeavy).slice(0, 15),
    },
    crossAnalysis,
    text,
    quality,
  };

  analytics.insights = buildInsights(analytics);
  return analytics;
}

module.exports = { buildAnalytics };
