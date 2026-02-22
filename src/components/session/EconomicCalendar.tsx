import { Calendar } from 'lucide-react';

export function EconomicCalendar() {
  return (
    <div className="econ-calendar">
      <div className="econ-header">
        <Calendar size={14} />
        <span>今日美元数据</span>
      </div>
      <div className="econ-iframe-wrap">
        <iframe
          src="/tv-calendar.html"
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Economic Calendar"
        />
      </div>
    </div>
  );
}
