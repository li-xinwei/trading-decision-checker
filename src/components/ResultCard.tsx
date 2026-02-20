import { CheckCircle, AlertTriangle, XCircle, RotateCcw, Lightbulb } from 'lucide-react';
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

  return (
    <div className={`result-card animate-in ${config.bgClass}`}>
      <div className={`result-icon-wrapper ${config.className}`}>
        <Icon size={48} />
      </div>

      <h2 className="result-title">{result.title}</h2>
      <p className="result-message">{result.message}</p>

      {result.suggestions.length > 0 && (
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

      <div className="decision-summary">
        <h3 className="summary-title">决策路径回顾</h3>
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

