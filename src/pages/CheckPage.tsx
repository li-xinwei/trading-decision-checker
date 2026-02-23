import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, History, RotateCcw } from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionCard } from '../components/QuestionCard';
import { ResultCard } from '../components/ResultCard';
import { HistoryPanel } from '../components/HistoryPanel';
import { useDecisionTree } from '../hooks/useDecisionTree';
import { useTradingSystem } from '../hooks/useTradingSystem';
import { createTrade } from '../lib/supabase';
import type { Trade } from '../types/trading';

export function CheckPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const { system } = useTradingSystem();
  const {
    currentNode,
    decisions,
    result,
    history,
    progress,
    currentStep,
    selectOption,
    goBack,
    reset,
    clearHistory,
  } = useDecisionTree(system.treeConfig);

  const [showHistory, setShowHistory] = useState(false);
  const [tradeCreated, setTradeCreated] = useState(false);

  useEffect(() => {
    if (!result || result.type !== 'go' || !sessionId || tradeCreated) return;

    const setupDecision = decisions.find((d) => d.nodeId === 'choose_setup');
    const directionDecision = decisions[decisions.length - 1];

    const trade: Trade = {
      id: `trade_${Date.now()}`,
      sessionId,
      setupType: setupDecision?.answer || 'unknown',
      direction: directionDecision?.answer?.includes('做多') ? '做多' : '做空',
      entryPlan: result.executionPlan?.entry,
      stopLoss: result.executionPlan?.stopLoss,
      takeProfit: result.executionPlan?.takeProfit,
      status: 'active',
      openedAt: Date.now(),
    };

    createTrade(trade).then(() => {
      setTradeCreated(true);
    });
  }, [result, sessionId, decisions, tradeCreated]);

  const backPath = sessionId ? `/session/${sessionId}` : '/';

  return (
    <div className="app">
      <header className="page-header">
        <div className="page-header-left">
          <button className="page-back-btn" onClick={() => navigate(backPath)}>
            <ChevronLeft size={18} />
            返回
          </button>
        </div>
        <span className="page-title">开单检查</span>
        <div className="header-actions">
          <button
            className={`header-btn ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            title="历史记录"
          >
            <History size={16} />
            <span>历史</span>
          </button>
          {decisions.length > 0 && (
            <button className="header-btn reset-btn" onClick={reset} title="重新开始">
              <RotateCcw size={16} />
              <span>重来</span>
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        {!result && currentNode && (
          <>
            <ProgressBar
              progress={progress}
              currentStep={currentStep}
              category={currentNode.category}
            />
            <QuestionCard
              node={currentNode}
              onSelect={selectOption}
              onBack={goBack}
              canGoBack={decisions.length > 0}
            />
          </>
        )}

        {result && (
          <div>
            {tradeCreated && sessionId && (
              <div className="trade-created-banner animate-in">
                <span>交易已添加到 Session</span>
                <button onClick={() => navigate(`/session/${sessionId}`)}>
                  返回 Session
                </button>
              </div>
            )}
            <ResultCard
              result={result}
              decisions={decisions}
              onReset={reset}
              onBack={goBack}
            />
          </div>
        )}

        {!result && !currentNode && (
          <div className="welcome-card">
            <h2>开单前检查</h2>
            <p>根据交易系统逐步筛选，确认是否满足入场条件</p>
            <button className="start-btn" onClick={reset}>
              开始检查
            </button>
          </div>
        )}
      </main>

      {showHistory && (
        <HistoryPanel
          sessions={history}
          onClear={clearHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
