import React from 'react';
import Panel, { EmptyState } from './Panel';

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
      <div className="overflow-x-auto -mx-1">
        <table className="min-w-full text-sm text-right">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 px-2 font-medium">التاريخ</th>
              <th className="py-2 px-2 font-medium">المندوب</th>
              <th className="py-2 px-2 font-medium">العميل</th>
              <th className="py-2 px-2 font-medium">الزيارة</th>
              <th className="py-2 px-2 font-medium">الملاحظة</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((row, index) => (
              <tr key={`${row.visitId}-${index}`} className="border-b border-line/70">
                <td className="py-2.5 px-2 whitespace-nowrap tabular-nums">{row.visitDate || '-'}</td>
                <td className="py-2.5 px-2">{row.salesRepId}</td>
                <td className="py-2.5 px-2">{row.customerId}</td>
                <td className="py-2.5 px-2">{row.visitId}</td>
                <td className="py-2.5 px-2 text-ink">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
};

export default NotesTable;
