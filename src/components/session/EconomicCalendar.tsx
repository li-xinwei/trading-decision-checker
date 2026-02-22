import { useState, useEffect } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';

interface EconEvent {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
}

export function EconomicCalendar() {
  const [events, setEvents] = useState<EconEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchCalendar() {
      try {
        const res = await fetch(
          'https://nfs.faireconomy.media/ff_calendar_thisweek.json'
        );
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();

        const today = new Date().toISOString().split('T')[0];
        const todayEvents = (data as EconEvent[]).filter((e) =>
          e.date?.startsWith(today)
        );
        setEvents(todayEvents);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchCalendar();
  }, []);

  const impactColor = (impact: string) => {
    if (impact === 'High') return 'var(--nogo-color)';
    if (impact === 'Medium') return 'var(--caution-color)';
    return 'var(--text-muted)';
  };

  return (
    <div className="econ-calendar">
      <div className="econ-header">
        <Calendar size={14} />
        <span>今日经济数据</span>
      </div>

      {loading && <div className="econ-loading">加载中...</div>}

      {error && (
        <div className="econ-error">
          <AlertTriangle size={14} />
          <span>日历数据加载失败</span>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="econ-empty">今日无重要数据发布</div>
      )}

      {!loading && events.length > 0 && (
        <div className="econ-list">
          {events.map((ev, i) => (
            <div key={i} className="econ-item">
              <div className="econ-time">
                {ev.date ? new Date(ev.date).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                }) : '—'}
              </div>
              <div
                className="econ-impact-dot"
                style={{ background: impactColor(ev.impact) }}
              />
              <div className="econ-details">
                <span className="econ-country">{ev.country}</span>
                <span className="econ-title">{ev.title}</span>
              </div>
              <div className="econ-values">
                <span className="econ-forecast">预: {ev.forecast || '—'}</span>
                <span className="econ-previous">前: {ev.previous || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
