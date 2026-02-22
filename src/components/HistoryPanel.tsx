import { Trash2, Clock, TrendingUp, TrendingDown, XCircle, AlertTriangle } from 'lucide-react';
import type { CheckSession } from '../types/decisionTree';

interface HistoryPanelProps {
  sessions: CheckSession[];
  onClear: () => void;
  onClose: () => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

function getResultBadge(type?: string) {
  switch (type) {
    case 'go':
      return <span className="history-badge badge-go">通过</span>;
    case 'caution':
      return <span className="history-badge badge-caution">谨慎</span>;
    case 'no-go':
      return <span className="history-badge badge-nogo">拒绝</span>;
    default:
      return <span className="history-badge badge-unknown">未完成</span>;
  }
}

export function HistoryPanel({ sessions, onClear, onClose }: HistoryPanelProps) {
  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-panel animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <h2>检查历史</h2>
          <div className="history-header-actions">
            {sessions.length > 0 && (
              <button className="history-clear-btn" onClick={onClear}>
                <Trash2 size={14} />
                清空
              </button>
            )}
            <button className="history-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="history-empty">
            <Clock size={48} className="history-empty-icon" />
            <p>暂无历史记录</p>
            <p className="history-empty-sub">完成一次检查后记录会出现在这里</p>
          </div>
        ) : (
          <div className="history-list">
            {sessions.map((session) => (
              <div key={session.id} className="history-item">
                <div className="history-item-header">
                  <div className="history-item-left">
                    {session.result?.type === 'no-go' ? (
                      <XCircle size={16} className="trend-nogo" />
                    ) : session.result?.type === 'caution' ? (
                      <AlertTriangle size={16} className="trend-caution" />
                    ) : session.tradeDirection?.includes('多') || session.tradeDirection?.includes('Long') ? (
                      <TrendingUp size={16} className="trend-up" />
                    ) : session.tradeDirection?.includes('空') || session.tradeDirection?.includes('Short') ? (
                      <TrendingDown size={16} className="trend-down" />
                    ) : null}
                    <span className="history-direction">
                      {session.result?.type === 'no-go' || session.result?.type === 'caution'
                        ? session.result.title.replace(/^[🚫⚠️✅]\s*/, '')
                        : `${session.tradeDirection?.includes('多') || session.tradeDirection?.includes('Long') ? '做多' : '做空'}${session.pair ? ` · ${session.pair}` : ''}`}
                    </span>
                  </div>
                  <div className="history-item-right">
                    {getResultBadge(session.result?.type)}
                  </div>
                </div>
                <div className="history-item-meta">
                  <Clock size={12} />
                  <span>{formatTime(session.startTime)}</span>
                  <span className="history-steps">{session.decisions.length} 步</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

