import React, { useMemo, useState } from 'react';
import { nf } from '../../utils/format';

// Sortable analytics table: columns declare either `render` or a value key.
export default function Table({
  columns,
  rows = [],
  initialSort,
  emptyText = 'لا توجد بيانات في هذه الفترة',
  onRowClick,
  dense = false,
}) {
  const [sort, setSort] = useState(initialSort || null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find(item => item.key === sort.key);
    if (!column) return rows;
    const value = row => (column.sortValue ? column.sortValue(row) : row[column.key]);
    return [...rows].sort((a, b) => {
      const left = value(a);
      const right = value(b);
      if (left == null) return 1;
      if (right == null) return -1;
      if (typeof left === 'number' && typeof right === 'number') {
        return sort.dir === 'asc' ? left - right : right - left;
      }
      const compare = String(left).localeCompare(String(right), 'ar');
      return sort.dir === 'asc' ? compare : -compare;
    });
  }, [columns, rows, sort]);

  if (!rows.length) {
    return <p className="py-6 text-center text-[12px] text-muted">{emptyText}</p>;
  }

  const toggle = key =>
    setSort(current => {
      if (!current || current.key !== key) return { key, dir: 'desc' };
      if (current.dir === 'desc') return { key, dir: 'asc' };
      return null;
    });

  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-right">
        <thead>
          <tr className="border-b border-line">
            {columns.map(column => {
              const active = sort?.key === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  className={`whitespace-nowrap px-2.5 py-2 text-[11px] font-bold text-muted ${
                    column.align === 'center' ? 'text-center' : 'text-start'
                  }`}
                >
                  {column.sortable === false ? (
                    column.label
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggle(column.key)}
                      className={`inline-flex items-center gap-1 transition-colors hover:text-ink ${
                        active ? 'text-accent' : ''
                      }`}
                    >
                      {column.label}
                      <span aria-hidden="true" className="text-[9px] opacity-70">
                        {active ? (sort.dir === 'desc' ? '▼' : '▲') : '◆'}
                      </span>
                    </button>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, index) => (
            <tr
              key={row.id ?? row.key ?? row.name ?? row.label ?? index}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-line/70 last:border-0 ${
                onRowClick ? 'cursor-pointer transition-colors hover:bg-accent-soft/50' : ''
              } ${dense ? '' : 'bg-panel'}`}
            >
              {columns.map(column => (
                <td
                  key={column.key}
                  className={`px-2.5 text-[12.5px] text-ink ${dense ? 'py-1.5' : 'py-2.5'} ${
                    column.align === 'center' ? 'text-center' : 'text-start'
                  } ${column.numeric ? 'tabular-nums' : ''}`}
                >
                  {column.render
                    ? column.render(row)
                    : row[column.key] == null
                      ? '—'
                      : typeof row[column.key] === 'number'
                        ? nf(row[column.key])
                        : String(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
