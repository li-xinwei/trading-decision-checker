import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, History, RotateCcw } from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionCard } from '../components/QuestionCard';
import { ResultCard } from '../components/ResultCard';
import { HistoryPanel } from '../components/HistoryPanel';
import { useDecisionTree } from '../hooks/useDecisionTree';
import { useTradingSystem } from '../hooks/useTradingSystem';

export function CheckPage() {
  const navigate = useNavigate();
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

  return (
    <div className="app">
      <header className="page-header">
        <div className="page-header-left">
          <button className="page-back-btn" onClick={() => navigate('/')}>
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
          <ResultCard
            result={result}
            decisions={decisions}
            onReset={reset}
            onBack={goBack}
          />
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
