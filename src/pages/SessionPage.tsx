import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, StopCircle, ClipboardCheck } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { SessionTimer } from '../components/session/SessionTimer';
import { TradeList } from '../components/session/TradeList';
import { EconomicCalendar } from '../components/session/EconomicCalendar';

export function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [endNotes, setEndNotes] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // eslint-disable-next-line react-hooks/purity -- ID generation is intentionally one-time impure
  const generatedId = useRef(id === 'new' ? `session_${Date.now()}` : id!);
  const sessionId = id === 'new' ? generatedId.current : id!;

  const {
    session,
    trades,
    loading,
    startSession,
    endSession,
    closeTrade,
    refreshTrades,
  } = useSession(sessionId);

  useEffect(() => {
    if (id === 'new' && !session && !loading) {
      startSession().then(() => {
        navigate(`/session/${sessionId}`, { replace: true });
      });
    }
  }, [id, session, loading, startSession, sessionId, navigate]);

  useEffect(() => {
    if (!session || session.status !== 'active') return;
    const interval = setInterval(refreshTrades, 10000);
    return () => clearInterval(interval);
  }, [session, refreshTrades]);

  const handleEnd = async () => {
    await endSession(endNotes);
    setShowEndConfirm(false);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">加载中...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app">
        <div className="loading-screen">
          <p>正在创建 Session...</p>
        </div>
      </div>
    );
  }

  const isActive = session.status === 'active';

  return (
    <div className="session-page">
      <header className="page-header">
        <div className="page-header-left">
          <button className="page-back-btn" onClick={() => navigate('/')}>
            <ChevronLeft size={16} />
            返回
          </button>
        </div>
        <div className="session-header-center">
          <SessionTimer
            startedAt={session.startedAt}
            ended={!isActive}
            endedAt={session.endedAt}
          />
        </div>
        <div className="header-actions">
          {isActive && (
            <button
              className="header-btn end-session-btn"
              onClick={() => setShowEndConfirm(true)}
            >
              <StopCircle size={14} />
              <span>结束</span>
            </button>
          )}
        </div>
      </header>

      <div className="session-content">
        <div className="session-main-no-chart">
          {isActive && (
            <button
              className="check-trade-btn"
              onClick={() => navigate(`/check?sessionId=${session.id}`)}
            >
              <ClipboardCheck size={16} />
              开单检查
            </button>
          )}
          <TradeList trades={trades} onClose={closeTrade} />
          <EconomicCalendar />
        </div>
      </div>

      {showEndConfirm && (
        <div className="modal-overlay" onClick={() => setShowEndConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>结束交易 Session</h3>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label>Session 笔记（可选）</label>
                <textarea
                  value={endNotes}
                  onChange={(e) => setEndNotes(e.target.value)}
                  placeholder="今天的交易 session 有什么感想..."
                  rows={3}
                  className="modal-textarea"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={() => setShowEndConfirm(false)}>
                取消
              </button>
              <button className="modal-confirm-btn danger" onClick={handleEnd}>
                确认结束
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
