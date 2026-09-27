// Insights engine: turns computed metrics into plain-language observations.
// Every statement below is derived from a number already in the analytics result —
// no causes are invented, and a rule stays silent when the data cannot support it.

const { round1 } = require('./metrics');

const CONCENTRATION = 60;
const LOW_RESPONSE_RATE = 50;
const MIN_SAMPLE = 3;
const OUTLIER_FACTOR = 2;
const ACTIVITY_SHIFT = 25;
const INACTIVE_DAYS = 60;

function buildInsights(analytics) {
  const found = [];
  const push = (level, topic, text) => found.push({ level, topic, text });

  const { overview, questions, customers, salesReps, geography, text, trends, quality } = analytics;
  const answered = questions.list.filter(q => q.shape !== 'text' && q.shape !== 'unanswered');

  answered.forEach(question => {
    if (question.concentration >= CONCENTRATION && question.responseCount >= MIN_SAMPLE) {
      push('info', 'تركز الإجابات',
        `سؤال «${question.text}»: ${question.mostSelected.percentage}% من إجاباته على خيار «${question.mostSelected.label}» (${question.mostSelected.count} من ${question.responseCount}).`);
    }
    if (question.responseCount > 0 && question.responseRate < LOW_RESPONSE_RATE && overview.totals.visits >= MIN_SAMPLE) {
      push('watch', 'نقص استجابة',
        `سؤال «${question.text}» لم يُجب عنه في ${question.missingResponseRate}% من الزيارات (${question.visitsCovered} من ${overview.totals.visits}).`);
    }
  });

  questions.list.filter(q => q.shape === 'unanswered').forEach(question =>
    push('watch', 'سؤال بلا إجابات', `سؤال «${question.text}» لم يسجّل أي إجابة في هذه الفترة.`));

  const overallOut = overview.totals.outOfRangeRate;
  geography.outOfRange.byArea.forEach(area => {
    if (overallOut > 0 && area.rate >= overallOut * OUTLIER_FACTOR && area.count >= MIN_SAMPLE) {
      push('alert', 'خارج النطاق',
        `منطقة «${area.area}» فيها ${area.count} زيارات خارج النطاق (${area.rate}%) مقابل ${overallOut}% على مستوى اللوحة.`);
    }
  });

  const avgAreaVisits = geography.areas.length
    ? overview.totals.visits / geography.areas.length
    : 0;
  geography.gaps.slice(0, 3).forEach(area =>
    push('watch', 'فجوة تغطية',
      `منطقة «${area.area}» بها ${area.visits} زيارة فقط، أقل من نصف متوسط المناطق (${round1(avgAreaVisits)}).`));

  text.repeatedIssues.slice(0, 5).forEach(issue =>
    push('alert', 'ملاحظة متكررة',
      `العميل «${issue.customer}» تكررت عنده نفس النقطة (${issue.term}) في ${issue.count} ملاحظات.`));

  questions.list
    .filter(q => q.shape === 'multi')
    .forEach(question => {
      (question.distribution || []).slice(0, 3).forEach(option => {
        if (option.count >= MIN_SAMPLE) {
          push('info', 'نمط متكرر',
            `«${option.label}» ظهر في ${option.count} إجابة على سؤال «${question.text}» (${option.percentage}%).`);
        }
      });
    });

  trends.perRep.forEach(rep => {
    if (rep.change && rep.change.changePercentage != null && Math.abs(rep.change.changePercentage) >= ACTIVITY_SHIFT) {
      const direction = rep.change.changePercentage > 0 ? 'ارتفع' : 'انخفض';
      push(rep.change.changePercentage < 0 ? 'watch' : 'info', 'نشاط المندوب',
        `نشاط «${rep.name}» ${direction} ${Math.abs(rep.change.changePercentage)}% بين نصفي الفترة (${rep.change.first} ثم ${rep.change.second}).`);
    }
  });

  if (customers.totals.inactive > 0) {
    const stale = customers.list
      .filter(c => c.daysSinceLastVisit != null && c.daysSinceLastVisit > INACTIVE_DAYS)
      .sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);
    if (stale.length) {
      push('watch', 'عملاء غير نشطين',
        `${stale.length} عميل آخر زيارة لهم منذ أكثر من ${INACTIVE_DAYS} يوم، أقدمها «${stale[0].name}» منذ ${stale[0].daysSinceLastVisit} يوم.`);
    }
  }

  if (customers.totals.withFollowUp > 0 && overview.totals.customers > 0 &&
      customers.totals.withFollowUp / overview.totals.customers >= 0.2) {
    push('alert', 'طلبات متابعة',
      `${customers.totals.withFollowUp} من ${overview.totals.customers} عميل عندهم ملاحظات تحتاج متابعة (${Math.round((customers.totals.withFollowUp / overview.totals.customers) * 100)}%).`);
  }

  if (customers.totals.withoutAnswers > 0) {
    push('watch', 'زيارات بلا بيانات',
      `${customers.totals.withoutAnswers} عميل زياراتهم مسجّلة بدون أي إجابة على الاستمارة.`);
  }

  quality.issues.filter(i => i.severity === 'high').slice(0, 5).forEach(issue =>
    push('alert', 'جودة البيانات', `${issue.label}: ${issue.count} سجل — الأمثلة والمراجع التفصيلية في شاشة جودة البيانات.`));

  if (trends.visits.change && trends.visits.change.changePercentage != null &&
      Math.abs(trends.visits.change.changePercentage) >= ACTIVITY_SHIFT) {
    const direction = trends.visits.change.changePercentage > 0 ? 'ارتفعت' : 'انخفضت';
    push('info', 'اتجاه الزيارات',
      `${direction} الزيارات ${Math.abs(trends.visits.change.changePercentage)}% بين نصفي الفترة (${trends.visits.change.first} ثم ${trends.visits.change.second}).`);
  }

  if (trends.visits.peak && trends.visits.low && trends.visits.peak.count > trends.visits.low.count * 3) {
    push('info', 'ذروة ونشاط منخفض',
      `أعلى يوم ${trends.visits.peak.period} بـ ${trends.visits.peak.count} زيارة، وأقل يوم ${trends.visits.low.period} بـ ${trends.visits.low.count}.`);
  }

  const levels = { alert: 0, watch: 1, info: 2 };
  return found.sort((a, b) => levels[a.level] - levels[b.level]);
}

module.exports = { buildInsights };
