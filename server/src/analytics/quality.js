// Data quality layer: surfaces problems instead of hiding them behind empty charts.
// `label` is plain Arabic for any screen; `technical` keeps the stored-procedure
// wording for the diagnostics table, so IDs never leak into prose summaries.

function issue(list, code, label, technical, severity, count, examples) {
  if (!count) return;
  list.push({ code, label, technical, severity, count, examples: examples.slice(0, 5) });
}

const orUnknown = (text, fallback) => text || fallback;

function detectQualityIssues(model) {
  const { questions, options, visits, answers, label, index } = model;
  const found = [];

  const missingQuestionText = questions.filter(q => !q.id || q.text === 'سؤال بدون نص');
  issue(found, 'question_missing_text', 'أسئلة بدون نص معروض', 'أسئلة بدون نص', 'medium',
    missingQuestionText.length, missingQuestionText.map(q => `سؤال (${q.id ?? 'بدون مُعرِّف'})`));

  const missingType = questions.filter(q => !q.type);
  issue(found, 'question_missing_type', 'أسئلة بدون نوع محدد', 'أسئلة بدون QuestionType', 'medium',
    missingType.length, missingType.map(q => q.text));

  const optionless = questions.filter(q => q.id && !q.optionIds.length && !q.type.match(/text/i));
  issue(found, 'question_without_options', 'أسئلة اختيارية بلا خيارات', 'أسئلة بلا QuestionOptions', 'low',
    optionless.length, optionless.map(q => q.text));

  const orphanOptions = options.filter(o => !o.questionKnown);
  issue(found, 'option_without_question', 'خيارات مرتبطة بسؤال غير موجود', 'Option بدون Question مقابل', 'high',
    orphanOptions.length, orphanOptions.map(o => `${o.text} (QuestionId: ${o.questionId ?? 'فارغ'})`));

  const duplicateOptionKeys = new Map();
  options.forEach(o => duplicateOptionKeys.set(o.key, (duplicateOptionKeys.get(o.key) || 0) + 1));
  const dupOptions = Array.from(duplicateOptionKeys.entries()).filter(([, n]) => n > 1);
  issue(found, 'duplicate_option_id', 'خيار مكرر لنفس السؤال', 'OptionId مكرر داخل نفس السؤال', 'high',
    dupOptions.length, dupOptions.map(([key]) => {
      const [qid, optionId] = key.split('::');
      return `${label.option(qid, optionId) || optionId} (QuestionId: ${qid})`;
    }));

  const missingVisitId = visits.filter(v => v.idWasMissing);
  issue(found, 'visit_missing_id', 'زيارات بدون مُعرِّف', 'زيارات بلا ID', 'high',
    missingVisitId.length, missingVisitId.map(v => `${v.date || 'تاريخ غير معروف'} · ${label.customer(v.customerId)}`));

  const duplicateVisitIds = new Map();
  visits.forEach(v => {
    if (v.idWasMissing) return;
    duplicateVisitIds.set(v.id, (duplicateVisitIds.get(v.id) || 0) + 1);
  });
  const dupVisits = Array.from(duplicateVisitIds.entries()).filter(([, n]) => n > 1);
  issue(found, 'duplicate_visit_id', 'زيارات مكررة بنفس المُعرِّف', 'زيارات مكررة بنفس الـ ID', 'high',
    dupVisits.length, dupVisits.map(([id, n]) => `زيارة ${id} مكررة ${n} مرات`));

  const noCustomer = visits.filter(v => !v.customerId);
  issue(found, 'visit_missing_customer', 'زيارات بلا عميل', 'زيارات بلا CustomerID', 'medium',
    noCustomer.length, noCustomer.map(v => `زيارة ${v.id} · ${v.date || 'بدون تاريخ'}`));

  const noRep = visits.filter(v => !v.repId);
  issue(found, 'visit_missing_rep', 'زيارات بلا مندوب', 'زيارات بلا SalesRepId', 'medium',
    noRep.length, noRep.map(v => `زيارة ${v.id} · ${v.date || 'بدون تاريخ'}`));

  const badDates = visits.filter(v => !v.dateValid);
  issue(found, 'visit_invalid_date', 'تواريخ زيارات غير صالحة', 'تاريخ غير قابل للتفسير', 'high',
    badDates.length, badDates.map(v => `${v.dateRaw || 'فارغ'} (زيارة ${v.id})`));

  const noCoords = visits.filter(v => v.latitude == null && v.longitude == null);
  issue(found, 'visit_missing_coordinates', 'زيارات بلا إحداثيات', 'Latitude/Longitude غائبين', 'low',
    noCoords.length, noCoords.map(v => `${label.rep(v.repId)} · ${v.date || 'بدون تاريخ'}`));

  const badCoords = visits.filter(v => (v.latitude != null || v.longitude != null) && !v.coordinatesValid);
  issue(found, 'visit_invalid_coordinates', 'إحداثيات خارج النطاق الجغرافي', 'Latitude/Longitude غير صالحة', 'high',
    badCoords.length, badCoords.map(v => `${v.latitude},${v.longitude} (زيارة ${v.id})`));

  const noAddress = visits.filter(v => !v.address);
  issue(found, 'visit_missing_address', 'زيارات بلا عنوان', 'Address فارغ', 'low',
    noAddress.length, noAddress.map(v => `زيارة ${v.id}`));

  const unknownStatus = visits.filter(v => v.statusRaw != null && v.status == null);
  issue(found, 'unexpected_status', 'قيم حالة غير متوقعة', 'قيمة Status خارج 0/1', 'medium',
    unknownStatus.length, unknownStatus.map(v => `${v.statusRaw} (زيارة ${v.id})`));

  const missingStatus = visits.filter(v => v.statusRaw == null);
  issue(found, 'visit_missing_status', 'زيارات بلا حالة', 'Status غائب', 'low',
    missingStatus.length, missingStatus.map(v => `زيارة ${v.id}`));

  const unknownOutRange = visits.filter(v => v.outRangeRaw != null && v.outRange == null);
  issue(found, 'unexpected_outrange', 'قيم «خارج النطاق» غير متوقعة', 'قيمة OutRange خارج 0/1', 'medium',
    unknownOutRange.length, unknownOutRange.map(v => `${v.outRangeRaw} (زيارة ${v.id})`));

  const orphanAnswers = answers.filter(a => !a.visitKnown);
  issue(found, 'orphan_answer', 'إجابات بلا زيارة مقابلة', 'VisitAnswer بدون Visit', 'high',
    orphanAnswers.length, orphanAnswers.map(a => `${orUnknown(label.question(a.questionId), 'سؤال غير معروف')} (VisitId: ${a.visitId ?? 'فارغ'})`));

  const answersUnknownQuestion = answers.filter(a => !a.questionKnown);
  issue(found, 'answer_without_question', 'إجابات مرتبطة بسؤال غير موجود', 'Answer يشير إلى Question غير موجود', 'high',
    answersUnknownQuestion.length, answersUnknownQuestion.map(a => `QuestionId: ${a.questionId ?? 'فارغ'} · VisitId: ${a.visitId ?? 'فارغ'}`));

  const optionAnswers = answers.filter(a => a.kind === 'option');
  const unknownOptions = optionAnswers.filter(a => !a.optionKnown);
  issue(found, 'answer_option_not_found', 'إجابة تشير إلى خيار غير موجود', 'SelectedOptionId غير موجود في QuestionOptions', 'high',
    unknownOptions.length, unknownOptions.map(a => `${orUnknown(label.question(a.questionId), 'سؤال غير معروف')} → OptionId: ${a.optionId}`));

  const misplacedOptions = unknownOptions.filter(a =>
    a.questionKnown && options.some(o => o.id === a.optionId && o.questionId !== a.questionId)
  );
  issue(found, 'answer_option_wrong_question', 'إجابة تخير خياراً من سؤال آخر', 'اختيار لا ينتمي للسؤال المُجيب عنه', 'high',
    misplacedOptions.length, misplacedOptions.map(a => `${orUnknown(label.question(a.questionId), 'سؤال غير معروف')} → OptionId: ${a.optionId}`));

  const emptyAnswers = answers.filter(a => a.kind === 'empty');
  issue(found, 'answer_empty', 'إجابات فارغة بلا اختيار وبلا نص', 'إجابة بلا SelectedOptionId وبلا AnswerText', 'medium',
    emptyAnswers.length, emptyAnswers.map(a => `${orUnknown(label.question(a.questionId), 'سؤال غير معروف')} · VisitId: ${a.visitId ?? 'فارغ'}`));

  const answerKeys = new Map();
  answers.forEach(a => {
    if (a.kind !== 'option') return;
    const key = `${a.visitId}|${a.questionId}|${a.optionId}`;
    answerKeys.set(key, (answerKeys.get(key) || 0) + 1);
  });
  const dupAnswers = Array.from(answerKeys.entries()).filter(([, n]) => n > 1);
  issue(found, 'duplicate_answer', 'نفس الاختيار مسجل مرتين في الزيارة', 'Answer مكرر داخل نفس الزيارة', 'medium',
    dupAnswers.length, dupAnswers.map(([key, n]) => {
      const [visitId, questionId, optionId] = key.split('|');
      return `${label.option(questionId, optionId) || optionId} ×${n} (زيارة ${visitId})`;
    }));

  const unansweredQuestions = questions.filter(q => q.id && !index.answersByQuestion.get(q.id)?.length);
  issue(found, 'question_no_answers', 'أسئلة بلا أي إجابات في الفترة', 'سؤال بدون أي Answer', 'low',
    unansweredQuestions.length, unansweredQuestions.map(q => q.text));

  const total = visits.length;
  const rate = (count, base) => (base > 0 ? Number(((count * 100) / base).toFixed(1)) : 0);

  return {
    issues: found.sort((a, b) => b.count - a.count),
    summary: {
      issueTypes: found.length,
      affectedRecords: found.reduce((sum, item) => sum + item.count, 0),
      highSeverityTypes: found.filter(i => i.severity === 'high').length,
      completeness: {
        withCoordinates: rate(visits.filter(v => v.coordinatesValid).length, total),
        withAddress: rate(visits.filter(v => v.address).length, total),
        withStatus: rate(visits.filter(v => v.status != null).length, total),
        withValidDate: rate(visits.filter(v => v.dateValid).length, total),
        withCustomer: rate(visits.filter(v => v.customerId).length, total),
        withRep: rate(visits.filter(v => v.repId).length, total),
      },
    },
  };
}

module.exports = { detectQualityIssues };
