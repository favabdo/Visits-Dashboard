import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Panel, { EmptyState } from './Panel';

const FILTERS = [
  { key: 'all', label: 'كل العملاء' },
  { key: 'followUp', label: 'محتاجين متابعة' },
  { key: 'negative', label: 'ملاحظات سلبية' },
];

const SENTIMENT_STYLE = {
  negative: 'bg-danger-soft text-danger',
  positive: 'bg-success-soft text-success',
  neutral: 'bg-panel-soft text-muted',
};

const SENTIMENT_LABEL = {
  negative: 'سلبية',
  positive: 'إيجابية',
  neutral: 'محايدة',
};

const CustomersPage = () => {
  const { data } = useOutletContext();
  const [filter, setFilter] = useState('all');
  const customers = data?.customers || [];

  const rows = customers.filter(customer => {
    if (filter === 'followUp') return customer.followUpCount > 0;
    if (filter === 'negative') return customer.negativeCount > 0;
    return true;
  });

  const followUpTotal = customers.filter(c => c.followUpCount > 0).length;
  const negativeTotal = customers.filter(c => c.negativeCount > 0).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-ink">العملاء</h2>
          <p className="mt-1 text-sm text-muted">
            {customers.length} عميل · {followUpTotal} محتاجين متابعة · {negativeTotal} بملاحظات سلبية
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === item.key
                  ? 'border-accent bg-accent text-white shadow-glow'
                  : 'border-line bg-panel text-muted hover:border-accent/40 hover:text-accent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <Panel>
        {rows.length === 0 ? (
          <EmptyState text="لا يوجد عملاء مطابقون لهذا التصنيف في الفترة المحددة" />
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="min-w-full border-collapse text-right text-sm">
              <thead>
                <tr className="border-b border-line">
                  {['العميل', 'الزيارات', 'الاستكمال', 'أول زيارة', 'آخر زيارة', 'المندوبون', 'الملاحظات', 'أحدث ملاحظة'].map(
                    label => (
                      <th
                        key={label}
                        className="whitespace-nowrap px-3 pb-3 text-[11px] font-bold uppercase tracking-wide text-muted"
                      >
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map(customer => (
                  <tr
                    key={customer.id}
                    className="border-b border-line/70 transition-colors last:border-b-0 hover:bg-panel-soft"
                  >
                    <td className="px-3 py-3 font-semibold text-ink">{customer.name}</td>
                    <td className="whitespace-nowrap px-3 py-3 tabular-nums text-ink">
                      {customer.visits}
                      {customer.outOfRange > 0 ? (
                        <span className="ms-1.5 rounded-md bg-choco-soft px-1.5 py-0.5 text-[10px] font-bold text-choco">
                          {customer.outOfRange} برّه
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 tabular-nums text-muted">
                      {customer.completionRate}%
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 tabular-nums text-muted" dir="ltr">
                      {customer.firstVisit || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 tabular-nums text-muted" dir="ltr">
                      {customer.lastVisit || '-'}
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {customer.reps.length ? customer.reps.join('، ') : '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="tabular-nums text-muted">{customer.notesCount}</span>
                      {customer.followUpCount > 0 ? (
                        <span className="ms-1.5 rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent">
                          متابعة {customer.followUpCount}
                        </span>
                      ) : null}
                      {customer.negativeCount > 0 ? (
                        <span className="ms-1.5 rounded-md bg-danger-soft px-1.5 py-0.5 text-[10px] font-bold text-danger">
                          سلبية {customer.negativeCount}
                        </span>
                      ) : null}
                    </td>
                    <td className="min-w-[16rem] px-3 py-3">
                      <p className="leading-relaxed text-ink">{customer.lastNote || '—'}</p>
                      {customer.lastNoteSentiment ? (
                        <span
                          className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            SENTIMENT_STYLE[customer.lastNoteSentiment]
                          }`}
                        >
                          {SENTIMENT_LABEL[customer.lastNoteSentiment]}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
};

export default CustomersPage;
