import { BarChart3, RotateCcw, History } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onToggleHistory: () => void;
  showHistory: boolean;
  hasProgress: boolean;
}

export function Header({ onReset, onToggleHistory, showHistory, hasProgress }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <BarChart3 size={28} className="header-icon" />
        <div>
          <h1 className="header-title">Trading Portal</h1>
          <p className="header-subtitle">系统化开单前检查清单</p>
        </div>
      </div>
      <div className="header-actions">
        <button
          className={`header-btn ${showHistory ? 'active' : ''}`}
          onClick={onToggleHistory}
          title="历史记录"
        >
          <History size={18} />
          <span>历史</span>
        </button>
        {hasProgress && (
          <button className="header-btn reset-btn" onClick={onReset} title="重新开始">
            <RotateCcw size={18} />
            <span>重来</span>
          </button>
        )}
      </div>
    </header>
  );
}

