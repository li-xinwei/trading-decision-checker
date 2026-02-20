import { useState } from 'react';
import { Header } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { QuestionCard } from './components/QuestionCard';
import { ResultCard } from './components/ResultCard';
import { HistoryPanel } from './components/HistoryPanel';
import { useDecisionTree } from './hooks/useDecisionTree';
import { tradingDecisionTree } from './data/tradingTree';
import './App.css';

function App() {
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
  } = useDecisionTree(tradingDecisionTree);

  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="app">
      <Header
        onReset={reset}
        onToggleHistory={() => setShowHistory(!showHistory)}
        showHistory={showHistory}
        hasProgress={decisions.length > 0}
      />

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
            <h2>欢迎使用交易决策检查系统</h2>
            <p>点击开始进行开单前的系统性检查</p>
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

export default App;
