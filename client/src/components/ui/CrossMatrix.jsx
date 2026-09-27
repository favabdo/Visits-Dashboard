import React, { useMemo, useState } from 'react';
import { nf, pf } from '../../utils/format';

/**
 * Cross-tab heat matrix: rows are one dimension (a question, an option, a rep),
 * columns are the other dimension, cells are share within the row.
 */
export default function CrossMatrix({ groups = [], columnsLimit = 6, emptyText = 'لا توجد علاقات متقاطعة في هذه الفترة' }) {
  const [threshold, setThreshold] = useState(0);

  const { columns, rows } = useMemo(() => {
    const totals = new Map();
    groups.forEach(group => {
      (group.parts || []).forEach(part => {
        totals.set(part.label, (totals.get(part.label) || 0) + (part.count || 0));
      });
    });
    const picked = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, columnsLimit)
      .map(([label]) => label);
    const built = groups
      .map(group => {
        const map = new Map((group.parts || []).map(part => [part.label, part]));
        const sum = (group.parts || []).reduce((acc, part) => acc + (part.count || 0), 0);
        return {
          label: group.label,
          note: group.note,
          total: sum,
          cells: picked.map(name => map.get(name) || null),
        };
      })
      .filter(row => row.total >= threshold)
      .sort((a, b) => b.total - a.total);
    return { columns: picked, rows: built };
  }, [groups, columnsLimit, threshold]);

  if (!groups.length || !columns.length) {
    return <p className="py-6 text-center text-[12px] text-muted">{emptyText}</p>;
  }

  const maxCell = Math.max(...rows.flatMap(row => row.cells.map(cell => (cell ? cell.percentage : 0))), 1);

  return (
    <div className="space-y-3">
      <div className="-mx-1 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-right">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="px-2.5 py-2 text-[11px] font-bold text-muted">
                البند
              </th>
              {columns.map(column => (
                <th
                  key={column}
                  scope="col"
                  className="max-w-[110px] truncate px-2 py-2 text-center text-[11px] font-bold text-muted"
                  title={column}
                >
                  {column}
                </th>
              ))}
              <th scope="col" className="px-2.5 py-2 text-center text-[11px] font-bold text-muted">
                الإجمالي
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label} className="border-b border-line/70 last:border-0">
                <th scope="row" className="max-w-[190px] px-2.5 py-2 text-start">
                  <span className="block truncate text-[12.5px] font-semibold text-ink" title={row.label}>
                    {row.label}
                  </span>
                  {row.note ? <span className="block text-[10px] text-muted">{row.note}</span> : null}
                </th>
                {row.cells.map((cell, index) => {
                  const share = cell ? cell.percentage : 0;
                  const intensity = share / maxCell;
                  return (
                    <td key={columns[index]} className="px-1.5 py-1.5 text-center">
                      <span
                        className={`mx-auto flex h-9 w-full max-w-[74px] items-center justify-center rounded-lg text-[11.5px] font-bold tabular-nums ${
                          intensity > 0.66 ? 'text-white' : 'text-ink'
                        }`}
                        style={{
                          backgroundColor: cell
                            ? `color-mix(in srgb, var(--color-accent) ${Math.round(18 + intensity * 72)}%, var(--color-panel-soft))`
                            : 'var(--color-panel-soft)',
                        }}
                        title={cell ? `${cell.count} · ${pf(cell.percentage)}` : 'لا توجد استجابات'}
                      >
                        {cell ? pf(share) : '—'}
                      </span>
                    </td>
                  );
                })}
                <td className="px-2.5 py-2 text-center text-[12px] font-bold text-ink tabular-nums">
                  {nf(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <label className="flex items-center gap-2.5 text-[11px] text-muted">
        <span className="whitespace-nowrap">إخفاء الصفوف أقل من</span>
        <input
          type="range"
          min={0}
          max={40}
          step={5}
          value={threshold}
          onChange={event => setThreshold(Number(event.target.value))}
          className="h-1 flex-1 accent-accent"
        />
        <b className="tabular-nums text-ink">{nf(threshold)}</b>
      </label>
    </div>
  );
}
