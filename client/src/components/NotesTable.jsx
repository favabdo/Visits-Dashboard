import React from 'react';

const NotesTable = ({ notes }) => {
  if (!notes || notes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">آخر ملاحظات المندوبين</h3>
        <p className="text-gray-500">لا توجد ملاحظات لعرضها</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
      <h3 className="text-lg font-bold text-gray-800 mb-4">آخر ملاحظات المندوبين</h3>
      <table className="min-w-full text-sm text-right">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="py-2 px-3 font-medium">التاريخ</th>
            <th className="py-2 px-3 font-medium">المندوب</th>
            <th className="py-2 px-3 font-medium">العميل</th>
            <th className="py-2 px-3 font-medium">الزيارة</th>
            <th className="py-2 px-3 font-medium">الملاحظة</th>
          </tr>
        </thead>
        <tbody>
          {notes.map((row, index) => (
            <tr key={`${row.visitId}-${index}`} className="border-b border-gray-100">
              <td className="py-2 px-3 whitespace-nowrap">{row.visitDate || '-'}</td>
              <td className="py-2 px-3">{row.salesRepId}</td>
              <td className="py-2 px-3">{row.customerId}</td>
              <td className="py-2 px-3">{row.visitId}</td>
              <td className="py-2 px-3 text-gray-800">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NotesTable;
