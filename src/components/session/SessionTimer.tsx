import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface SessionTimerProps {
  startedAt: number;
  ended?: boolean;
  endedAt?: number;
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export function SessionTimer({ startedAt, ended, endedAt }: SessionTimerProps) {
  const [liveElapsed, setLiveElapsed] = useState(0);

  useEffect(() => {
    if (ended) return;
    const interval = setInterval(() => {
      setLiveElapsed(Date.now() - startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, ended]);

  const elapsed = ended && endedAt ? endedAt - startedAt : liveElapsed;

  return (
    <div className={`session-timer ${ended ? 'ended' : 'active'}`}>
      <Clock size={16} />
      <span className="timer-value">{formatDuration(elapsed)}</span>
      {ended && <span className="timer-label">已结束</span>}
    </div>
  );
}
