const { field, pickItems } = require('../utils/visitXml');

// Normalisation layer: the stored procedure's XML becomes typed entities with
// explicit relationships. IDs stay internal; every consumer works with labels.

const str = value => {
  if (value == null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
};

const num = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

// Latitude/longitude arrive with either a dot or a comma decimal separator.
const coord = value => {
  const parsed = num(str(value) == null ? null : String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function toIsoDate(value) {
  const raw = str(value);
  if (!raw) return null;
  let candidate = null;
  if (/^\d{8}/.test(raw)) candidate = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  else if (DATE_PATTERN.test(raw.slice(0, 10))) candidate = raw.slice(0, 10);
  if (!candidate) return null;

  const [, year, month, day] = DATE_PATTERN.exec(candidate) || [];
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const real =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);
  return { iso: candidate, real };
}

// Tri-state read: 1 / 0 when the column exists, null when the data has nothing.
function readFlag(value) {
  const raw = str(value);
  if (raw == null) return null;
  if (/^(1|true|yes|y)$/i.test(raw)) return 1;
  if (/^(0|false|no|n)$/i.test(raw)) return 0;
  return null;
}

// A rough area name from a free-text address: the first meaningful segment.
function areaFromAddress(address) {
  const text = str(address);
  if (!text) return null;
  const part = text.split(/[،,\-|/]/).map(p => p.trim()).find(p => p.length > 1);
  return part || null;
}

function normalizeDataset(parsed, { repNameMap, customerNameMap, startDate, endDate } = {}) {
  const repNames = repNameMap instanceof Map ? repNameMap : new Map();
  const custNames = customerNameMap instanceof Map ? customerNameMap : new Map();

  const payload = (parsed && (parsed.DataPayload || parsed)) || {};
  const rawQuestions = pickItems(payload, 'Questions', 'Question');
  const rawOptions = pickItems(payload, 'QuestionOptions', 'Option');
  const rawVisits = pickItems(payload, 'Visits', 'Visit');
  const rawAnswers = pickItems(payload, 'VisitAnswers', 'Answer');

  const questions = rawQuestions.map((q, index) => {
    const id = str(field(q, 'QuestionId'));
    return {
      id,
      position: index,
      text: str(field(q, 'QuestionText')) || 'سؤال بدون نص',
      type: str(field(q, 'QuestionType')) || '',
      required: readFlag(field(q, 'IsRequired')),
      active: readFlag(field(q, 'IsActive')),
      optionIds: [],
    };
  });

  const questionById = new Map();
  questions.forEach(q => {
    if (q.id) questionById.set(q.id, q);
  });

  const options = [];
  const optionByKey = new Map();
  rawOptions.forEach((o, index) => {
    const questionId = str(field(o, 'QuestionId'));
    const optionId = str(field(o, 'OptionId'));
    if (!optionId) return;
    const option = {
      key: `${questionId}::${optionId}`,
      id: optionId,
      questionId,
      text: str(field(o, 'OptionText')) || 'خيار بدون نص',
      order: num(field(o, 'DisplayOrder')) ?? index,
      questionKnown: questionId != null && questionById.has(questionId),
    };
    options.push(option);
    if (!optionByKey.has(option.key)) optionByKey.set(option.key, option);
    const question = questionId != null ? questionById.get(questionId) : null;
    if (question) question.optionIds.push(optionId);
  });

  const customers = new Map();
  const reps = new Map();
  const ensure = (store, id, name) => {
    if (!store.has(id)) store.set(id, { id, name, unresolvedName: false });
    const entity = store.get(id);
    if (name) entity.name = name;
    else entity.unresolvedName = true;
    return entity;
  };

  const visits = rawVisits.map((v, index) => {
    const id = str(field(v, 'ID'));
    const customerId = str(field(v, 'CustomerID'));
    const repId = str(field(v, 'SalesRepId'));
    const date = toIsoDate(field(v, 'VisitDate'));
    const latitude = coord(field(v, 'Latitude'));
    const longitude = coord(field(v, 'Longitude'));
    const address = str(field(v, 'Address'));

    const customer = customerId ? ensure(customers, customerId, custNames.get(customerId)) : null;
    const rep = repId ? ensure(reps, repId, repNames.get(repId)) : null;

    return {
      id: id || `visit-index-${index}`,
      idWasMissing: id == null,
      customerId,
      repId,
      date: date ? date.iso : null,
      dateRaw: str(field(v, 'VisitDate')),
      dateValid: Boolean(date && date.real),
      latitude,
      longitude,
      coordinatesValid:
        latitude != null &&
        longitude != null &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180 &&
        !(latitude === 0 && longitude === 0),
      address,
      area: areaFromAddress(address),
      outRange: readFlag(field(v, 'OutRange')),
      outRangeRaw: str(field(v, 'OutRange')),
      status: readFlag(field(v, 'Status')),
      statusRaw: str(field(v, 'Status')),
      answers: [],
    };
  });

  const visitById = new Map();
  visits.forEach(v => visitById.set(v.id, v));

  const answers = rawAnswers.map((a, index) => {
    const visitId = str(field(a, 'VisitId'));
    const questionId = str(field(a, 'QuestionId'));
    const optionId = str(field(a, 'SelectedOptionId'));
    const text = str(field(a, 'AnswerText'));
    const createdAt = toIsoDate(field(a, 'CreatedAt'));
    const visit = visitId != null ? visitById.get(visitId) : null;
    const option = optionId != null ? optionByKey.get(`${questionId}::${optionId}`) : null;

    const answer = {
      id: str(field(a, 'AnswerId')) || `${visitId ?? 'na'}:${questionId ?? 'na'}:${optionId ?? 'text'}:${index}`,
      visitId,
      questionId,
      optionId,
      text,
      createdAt: createdAt ? createdAt.iso : null,
      createdAtRaw: str(field(a, 'CreatedAt')),
      date: visit ? visit.date : (createdAt ? createdAt.iso : null),
      kind: optionId != null ? 'option' : text != null ? 'text' : 'empty',
      visitKnown: Boolean(visit),
      questionKnown: questionId != null && questionById.has(questionId),
      optionKnown: Boolean(option),
      optionText: option ? option.text : null,
    };

    if (visit) visit.answers.push(answer);
    return answer;
  });

  // Optional date window, applied before anything is indexed.
  const boundKey = value => {
    const raw = str(value);
    if (!raw) return null;
    const parsedDate = toIsoDate(raw);
    return parsedDate ? parsedDate.iso : raw.slice(0, 10);
  };
  const fromKey = boundKey(startDate);
  const toKey = boundKey(endDate);

  let keptVisits = visits;
  let keptAnswers = answers;
  if (fromKey || toKey) {
    keptVisits = visits.filter(
      v => v.date && (!fromKey || v.date >= fromKey) && (!toKey || v.date <= toKey)
    );
    const keptIds = new Set(keptVisits.map(v => v.id));
    keptAnswers = answers.filter(a => keptIds.has(a.visitId));
  }

  const keptVisitById = new Map();
  keptVisits.forEach(v => keptVisitById.set(v.id, v));
  const keptCustomerIds = new Set(keptVisits.map(v => v.customerId).filter(Boolean));
  const keptRepIds = new Set(keptVisits.map(v => v.repId).filter(Boolean));
  const keptCustomers = new Map(
    Array.from(customers.entries()).filter(([id]) => keptCustomerIds.has(id))
  );
  const keptReps = new Map(
    Array.from(reps.entries()).filter(([id]) => keptRepIds.has(id))
  );

  // Indexes every analytics section reads from.
  const indexBy = (list, keyFn) => {
    const map = new Map();
    list.forEach(item => {
      const key = keyFn(item);
      if (key == null) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  };

  const customerList = Array.from(keptCustomers.values()).map(c => ({
    ...c,
    name: c.name || 'عميل بدون اسم',
  }));
  const repList = Array.from(keptReps.values()).map(r => ({
    ...r,
    name: r.name || 'مندوب بدون اسم',
  }));

  return {
    window: { start: fromKey, end: toKey },
    questions,
    options,
    visits: keptVisits,
    answers: keptAnswers,
    customers: customerList,
    reps: repList,
    index: {
      questionById,
      optionByKey,
      visitById: keptVisitById,
      customerById: new Map(customerList.map(c => [c.id, c])),
      repById: new Map(repList.map(r => [r.id, r])),
      answersByVisit: indexBy(keptAnswers, a => a.visitId),
      answersByQuestion: indexBy(keptAnswers, a => a.questionId),
      visitsByCustomer: indexBy(keptVisits, v => v.customerId),
      visitsByRep: indexBy(keptVisits, v => v.repId),
      visitsByArea: indexBy(keptVisits, v => v.area),
      visitsByDate: indexBy(keptVisits, v => v.date),
    },
    label: {
      question: id => (questionById.get(id) || {}).text || null,
      option: (questionId, optionId) =>
        (optionByKey.get(`${questionId}::${optionId}`) || {}).text || null,
      customer: id => (keptCustomers.get(id) || {}).name || 'عميل بدون اسم',
      rep: id => (keptReps.get(id) || {}).name || 'مندوب بدون اسم',
      answer: a =>
        a.kind === 'option'
          ? a.optionText || 'خيار غير معروف'
          : a.kind === 'text'
            ? a.text
            : null,
    },
    sourceCounts: {
      questions: rawQuestions.length,
      options: rawOptions.length,
      visits: rawVisits.length,
      answers: rawAnswers.length,
    },
  };
}

module.exports = { normalizeDataset, toIsoDate, readFlag, areaFromAddress };
