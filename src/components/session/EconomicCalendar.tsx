import { useMemo } from 'react';
import { Calendar } from 'lucide-react';

const CALENDAR_CONFIG = {
  colorTheme: 'dark',
  isTransparent: true,
  width: '100%',
  height: '100%',
  locale: 'zh_CN',
  importanceFilter: '0,1',
  countryFilter: 'us',
};

export function EconomicCalendar() {
  const src = useMemo(
    () =>
      `https://s.tradingview.com/embed-widget/economic-calendar/?locale=zh_CN#${encodeURIComponent(JSON.stringify(CALENDAR_CONFIG))}`,
    []
  );

  return (
    <div className="econ-calendar">
      <div className="econ-header">
        <Calendar size={14} />
        <span>今日美元数据</span>
      </div>
      <div className="econ-iframe-wrap">
        <iframe
          src={src}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Economic Calendar"
        />
      </div>
    </div>
  );
}
