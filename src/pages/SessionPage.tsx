import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, StopCircle, ClipboardCheck } from 'lucide-react';
import { useLogout } from '../hooks/useAuth';
import { useSession } from '../hooks/useSession';
import { SessionTimer } from '../components/session/SessionTimer';
import { TradeList } from '../components/session/TradeList';
import { TradingViewWidget } from '../components/session/TradingViewWidget';
import { EconomicCalendar } from '../components/session/EconomicCalendar';

export function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const logout = useLogout();
  const [endNotes, setEndNotes] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const sessionId = id === 'new' ? `session_${Date.now()}` : id!;

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
      startSession();
    }
  }, [id, session, loading, startSession]);

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
        <div className="loading-screen">Session 不存在</div>
      </div>
    );
  }

  const isActive = session.status === 'active';

  return (
    <div className="session-page">
      <header className="page-header">
        <div className="page-header-left">
          <button className="page-back-btn" onClick={() => navigate('/')}>
            <ChevronLeft size={18} />
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
              <StopCircle size={16} />
              <span>结束</span>
            </button>
          )}
          <button className="header-btn" onClick={logout} title="登出">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="session-content">
        <div className="session-main">
          <div className="session-chart-area">
            <TradingViewWidget />
          </div>
          <div className="session-sidebar">
            <div className="session-sidebar-section">
              {isActive && (
                <button
                  className="check-trade-btn"
                  onClick={() =>
                    navigate(`/check?sessionId=${session.id}`)
                  }
                >
                  <ClipboardCheck size={18} />
                  开单检查
                </button>
              )}
            </div>
            <div className="session-sidebar-section">
              <TradeList trades={trades} onClose={closeTrade} />
            </div>
            <div className="session-sidebar-section">
              <EconomicCalendar />
            </div>
          </div>
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
                  rows={4}
                  className="modal-textarea"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel-btn"
                onClick={() => setShowEndConfirm(false)}
              >
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
