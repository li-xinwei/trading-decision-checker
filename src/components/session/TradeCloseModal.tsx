import { useState } from 'react';
import { X } from 'lucide-react';
import type { Trade } from '../../types/trading';

interface TradeCloseModalProps {
  trade: Trade;
  onConfirm: (
    result: 'win' | 'loss' | 'breakeven',
    pnlRR?: number,
    review?: string
  ) => void;
  onCancel: () => void;
}

export function TradeCloseModal({
  trade,
  onConfirm,
  onCancel,
}: TradeCloseModalProps) {
  const [result, setResult] = useState<'win' | 'loss' | 'breakeven'>('win');
  const [pnlRR, setPnlRR] = useState('');
  const [review, setReview] = useState('');

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>平仓 — {trade.direction} {trade.setupType}</h3>
          <button className="modal-close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>结果</label>
            <div className="result-options">
              {(['win', 'loss', 'breakeven'] as const).map((r) => (
                <button
                  key={r}
                  className={`result-option ${result === r ? 'selected' : ''} ${r}`}
                  onClick={() => setResult(r)}
                >
                  {r === 'win' ? '盈利' : r === 'loss' ? '亏损' : '持平'}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-field">
            <label>盈亏 (R 倍数)</label>
            <input
              type="number"
              step="0.1"
              value={pnlRR}
              onChange={(e) => setPnlRR(e.target.value)}
              placeholder="例如 1.5 或 -1"
              className="modal-input"
            />
          </div>

          <div className="modal-field">
            <label>复盘笔记</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="简单记录这笔交易的得失..."
              rows={3}
              className="modal-textarea"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onCancel}>
            取消
          </button>
          <button
            className="modal-confirm-btn"
            onClick={() =>
              onConfirm(result, pnlRR ? parseFloat(pnlRR) : undefined, review || undefined)
            }
          >
            确认平仓
          </button>
        </div>
      </div>
    </div>
  );
}
