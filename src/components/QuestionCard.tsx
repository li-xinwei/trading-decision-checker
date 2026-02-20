import { ChevronRight } from 'lucide-react';
import type { TreeNode } from '../types/decisionTree';

interface QuestionCardProps {
  node: TreeNode;
  onSelect: (value: string) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function QuestionCard({ node, onSelect, onBack, canGoBack }: QuestionCardProps) {
  return (
    <div className="question-card animate-in">
      <div className="question-header">
        <span className="question-category-badge">{node.category}</span>
      </div>

      <h2 className="question-title">{node.question}</h2>

      {node.description && (
        <p className="question-description">{node.description}</p>
      )}

      <div className="options-list">
        {node.options.map((option) => (
          <button
            key={option.value}
            className="option-btn"
            onClick={() => onSelect(option.value)}
          >
            <span className="option-content">
              {option.icon && <span className="option-icon">{option.icon}</span>}
              <span className="option-label">{option.label}</span>
            </span>
            <ChevronRight size={18} className="option-arrow" />
          </button>
        ))}
      </div>

      {canGoBack && (
        <button className="back-btn" onClick={onBack}>
          ← 返回上一步
        </button>
      )}
    </div>
  );
}

