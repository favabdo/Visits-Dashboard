import React from 'react';

export default function Panel({ title, children, className = '' }) {
  return (
    <section className={`bg-panel border border-line rounded-sm p-5 ${className}`}>
      {title && (
        <h2 className="text-[13px] font-semibold text-ink mb-4">{title}</h2>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ text = 'لا توجد بيانات لعرضها' }) {
  return <p className="text-sm text-muted py-8 text-center">{text}</p>;
}
