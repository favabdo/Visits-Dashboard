import React, { useState } from 'react';

const Sidebar = ({ onDateChange }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onDateChange({ startDate, endDate });
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    onDateChange({ startDate: '', endDate: '' });
  };

  return (
    <aside className="w-full shrink-0 border-b border-line bg-panel lg:sticky lg:top-[73px] lg:h-[calc(100vh-73px)] lg:w-64 lg:border-b-0 lg:border-e">
      <div className="p-5">
        <h2 className="text-[13px] font-semibold text-ink mb-4">نطاق التاريخ</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
          <div>
            <label className="block text-xs text-muted mb-1.5">من</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-paper border border-line rounded-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">إلى</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-paper border border-line rounded-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="col-span-2 w-full bg-accent text-panel text-sm py-2 px-4 rounded-sm hover:bg-accent-hover lg:col-span-1"
          >
            تطبيق
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="col-span-2 w-full text-sm text-muted py-1 hover:text-ink lg:col-span-1"
          >
            مسح الفترة
          </button>
        </form>
      </div>
    </aside>
  );
};

export default Sidebar;
