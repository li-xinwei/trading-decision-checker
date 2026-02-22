import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, RotateCcw, Lightbulb, ChevronDown, ChevronUp, Target, ShieldAlert, TrendingUp } from 'lucide-react';
import type { ResultNode, DecisionRecord } from '../types/decisionTree';

interface ResultCardProps {
  result: ResultNode;
  decisions: DecisionRecord[];
  onReset: () => void;
  onBack: () => void;
}

const resultConfig = {
  go: {
    icon: CheckCircle,
    className: 'result-go',
    bgClass: 'result-bg-go',
  },
  caution: {
    icon: AlertTriangle,
    className: 'result-caution',
    bgClass: 'result-bg-caution',
  },
  'no-go': {
    icon: XCircle,
    className: 'result-nogo',
    bgClass: 'result-bg-nogo',
  },
};

export function ResultCard({ result, decisions, onReset, onBack }: ResultCardProps) {
  const config = resultConfig[result.type];
  const Icon = config.icon;
  const [showPath, setShowPath] = useState(false);

  return (
    <div className={`result-card animate-in ${config.bgClass}`}>
      <div className={`result-icon-wrapper ${config.className}`}>
        <Icon size={48} />
      </div>

      <h2 className="result-title">{result.title}</h2>
      <p className="result-message">{result.message}</p>

      {result.type === 'go' && result.executionPlan && (
        <div className="execution-plan">
          <div className="execution-plan-header">
            <Target size={18} />
            <span>执行方案</span>
          </div>
          <div className="execution-plan-grid">
            <div className="execution-item execution-entry">
              <div className="execution-item-label">
                <TrendingUp size={14} />
                <span>入场</span>
              </div>
              <div className="execution-item-value">{result.executionPlan.entry}</div>
            </div>
            <div className="execution-item execution-sl">
              <div className="execution-item-label">
                <ShieldAlert size={14} />
                <span>止损</span>
              </div>
              <div className="execution-item-value">{result.executionPlan.stopLoss}</div>
            </div>
            <div className="execution-item execution-tp">
              <div className="execution-item-label">
                <Target size={14} />
                <span>止盈</span>
              </div>
              <div className="execution-item-value">{result.executionPlan.takeProfit}</div>
            </div>
          </div>
          {result.executionPlan.notes && (
            <div className="execution-notes">{result.executionPlan.notes}</div>
          )}
        </div>
      )}

      {result.suggestions.length > 0 && result.type !== 'go' && (
        <div className="suggestions-box">
          <div className="suggestions-header">
            <Lightbulb size={16} />
            <span>建议</span>
          </div>
          <ul className="suggestions-list">
            {result.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="decision-summary-toggle" onClick={() => setShowPath(!showPath)}>
        <span className="toggle-text">决策路径（{decisions.length}步）</span>
        {showPath ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {showPath && (
        <div className="decision-summary compact">
          <div className="summary-list">
            {decisions.map((d, i) => (
              <div key={i} className="summary-item">
                <div className="summary-step">{i + 1}</div>
                <div className="summary-content">
                  <div className="summary-question">{d.question}</div>
                  <div className="summary-answer">{d.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="result-actions">
        <button className="back-btn" onClick={onBack}>
          ← 返回修改
        </button>
        <button className="reset-action-btn" onClick={onReset}>
          <RotateCcw size={16} />
          新的检查
        </button>
      </div>
    </div>
  );
}
