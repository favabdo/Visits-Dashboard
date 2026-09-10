import React from 'react';
import Panel, { EmptyState } from './Panel';

const HEADERS = ['التاريخ', 'المندوب', 'العميل', 'الزيارة', 'الملاحظة'];

const NotesTable = ({ notes }) => {
  if (!notes || notes.length === 0) {
    return (
      <Panel title="آخر ملاحظات المندوبين">
        <EmptyState text="لا توجد ملاحظات" />
      </Panel>
    );
  }

  return (
    <Panel title="آخر ملاحظات المندوبين">
      <div className="-mx-2 overflow-x-auto">
        <table className="min-w-full border-collapse text-right text-sm">
          <thead>
            <tr className="border-b border-line">
              {HEADERS.map(label => (
                <th
                  key={label}
                  className="whitespace-nowrap px-3 pb-3 text-[11px] font-bold uppercase tracking-wide text-muted"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {notes.map((row, index) => (
              <tr
                key={`${row.visitId}-${index}`}
                className="border-b border-line/70 transition-colors last:border-b-0 hover:bg-panel-soft"
              >
                <td className="whitespace-nowrap px-3 py-3 tabular-nums text-muted">
                  {row.visitDate || '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-semibold text-ink">
                  {row.salesRepId}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-muted">{row.customerId}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  <span className="rounded-lg bg-accent-soft px-2 py-0.5 text-xs font-semibold tabular-nums text-accent">
                    {row.visitId}
                  </span>
                </td>
                <td className="min-w-[14rem] px-3 py-3 leading-relaxed text-ink">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
};

export default NotesTable;
