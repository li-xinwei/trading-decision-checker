import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import type { Trade } from '../../types/trading';

interface TradeCloseModalProps {
  trade: Trade;
  onConfirm: (
    result: 'win' | 'loss' | 'breakeven',
    entryPrice: number,
    exitPrice: number,
    review?: string
  ) => void;
  onCancel: () => void;
}

export function TradeCloseModal({
  trade,
  onConfirm,
  onCancel,
}: TradeCloseModalProps) {
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [review, setReview] = useState('');

  const computed = useMemo(() => {
    const ep = parseFloat(entryPrice);
    const xp = parseFloat(exitPrice);
    if (isNaN(ep) || isNaN(xp)) return null;

    const isLong = trade.direction === '做多';
    const pnlPoints = isLong ? xp - ep : ep - xp;

    let result: 'win' | 'loss' | 'breakeven';
    if (pnlPoints > 0) result = 'win';
    else if (pnlPoints < 0) result = 'loss';
    else result = 'breakeven';

    return { pnlPoints: +pnlPoints.toFixed(2), result };
  }, [entryPrice, exitPrice, trade.direction]);

  const canSubmit = computed !== null;

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
          <div className="modal-price-row">
            <div className="modal-field">
              <label>开仓价</label>
              <input
                type="number"
                step="0.25"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="例如 5890.50"
                className="modal-input"
                autoFocus
              />
            </div>
            <div className="modal-field">
              <label>平仓价</label>
              <input
                type="number"
                step="0.25"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="例如 5895.75"
                className="modal-input"
              />
            </div>
          </div>

          {computed && (
            <div className={`pnl-preview ${computed.result}`}>
              <span className="pnl-preview-label">盈亏</span>
              <span className="pnl-preview-value">
                {computed.pnlPoints > 0 ? '+' : ''}
                {computed.pnlPoints} 点
              </span>
              <span className="pnl-preview-result">
                {computed.result === 'win'
                  ? '盈利'
                  : computed.result === 'loss'
                    ? '亏损'
                    : '持平'}
              </span>
            </div>
          )}

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
            disabled={!canSubmit}
            onClick={() => {
              if (!computed) return;
              onConfirm(
                computed.result,
                parseFloat(entryPrice),
                parseFloat(exitPrice),
                review || undefined
              );
            }}
          >
            确认平仓
          </button>
        </div>
      </div>
    </div>
  );
}
