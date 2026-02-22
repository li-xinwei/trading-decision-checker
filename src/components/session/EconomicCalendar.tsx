import { Calendar } from 'lucide-react';

const CALENDAR_URL =
  'https://sslecal2.investing.com?' +
  'columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&' +
  'features=datepicker,timezone&' +
  'countries=5&' +
  'calType=day&' +
  'timeZone=55&' +
  'lang=12';

export function EconomicCalendar() {
  return (
    <div className="econ-calendar">
      <div className="econ-header">
        <Calendar size={14} />
        <span>今日美元数据</span>
        <a
          href="https://www.investing.com/economic-calendar/"
          target="_blank"
          rel="noopener noreferrer"
          className="econ-link"
        >
          Investing.com
        </a>
      </div>
      <div className="econ-iframe-wrap">
        <iframe
          src={CALENDAR_URL}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="Economic Calendar"
          allowTransparency
        />
      </div>
    </div>
  );
}
