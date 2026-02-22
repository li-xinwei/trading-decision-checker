import { useState } from 'react';
import { TrendingUp, TrendingDown, X, CheckCircle, MinusCircle } from 'lucide-react';
import type { Trade } from '../../types/trading';
import { TradeCloseModal } from './TradeCloseModal';

interface TradeListProps {
  trades: Trade[];
  onClose: (
    tradeId: string,
    result: 'win' | 'loss' | 'breakeven',
    entryPrice: number,
    exitPrice: number,
    review?: string
  ) => void;
}

function formatPnl(trade: Trade): string {
  if (trade.entryPrice != null && trade.exitPrice != null) {
    const isLong = trade.direction === '做多';
    const pts = isLong
      ? trade.exitPrice - trade.entryPrice
      : trade.entryPrice - trade.exitPrice;
    const rounded = +pts.toFixed(2);
    return `${rounded > 0 ? '+' : ''}${rounded}pt`;
  }
  if (trade.pnlRR != null) {
    return `${trade.pnlRR > 0 ? '+' : ''}${trade.pnlRR}R`;
  }
  return '—';
}

export function TradeList({ trades, onClose }: TradeListProps) {
  const [closingId, setClosingId] = useState<string | null>(null);

  const activeTrades = trades.filter((t) => t.status === 'active');
  const closedTrades = trades.filter((t) => t.status === 'closed');

  return (
    <div className="trade-list-container">
      {activeTrades.length > 0 && (
        <div className="trade-section">
          <h4 className="trade-section-title">
            进行中的交易
            <span className="trade-count">{activeTrades.length}</span>
          </h4>
          <div className="trade-items">
            {activeTrades.map((trade) => (
              <div key={trade.id} className="trade-item active">
                <div className="trade-item-left">
                  <span className={`trade-direction ${trade.direction === '做多' ? 'long' : 'short'}`}>
                    {trade.direction === '做多' ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    {trade.direction}
                  </span>
                  <span className="trade-setup">{trade.setupType}</span>
                </div>
                <div className="trade-item-right">
                  <button
                    className="trade-close-btn"
                    onClick={() => setClosingId(trade.id)}
                  >
                    平仓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {closedTrades.length > 0 && (
        <div className="trade-section">
          <h4 className="trade-section-title">
            已完成
            <span className="trade-count">{closedTrades.length}</span>
          </h4>
          <div className="trade-items">
            {closedTrades.map((trade) => (
              <div key={trade.id} className="trade-item closed">
                <div className="trade-item-left">
                  <span className="trade-result-icon">
                    {trade.result === 'win' && <CheckCircle size={14} className="result-win" />}
                    {trade.result === 'loss' && <X size={14} className="result-loss" />}
                    {trade.result === 'breakeven' && <MinusCircle size={14} className="result-be" />}
                  </span>
                  <span className="trade-setup">{trade.direction} {trade.setupType}</span>
                </div>
                <div className="trade-item-right">
                  <span className={`trade-pnl ${trade.result}`}>
                    {formatPnl(trade)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {trades.length === 0 && (
        <div className="trade-empty">
          <p>暂无交易记录</p>
          <p className="trade-empty-sub">通过开单检查后会自动添加</p>
        </div>
      )}

      {closingId && (
        <TradeCloseModal
          trade={trades.find((t) => t.id === closingId)!}
          onConfirm={(result, entryPrice, exitPrice, review) => {
            onClose(closingId, result, entryPrice, exitPrice, review);
            setClosingId(null);
          }}
          onCancel={() => setClosingId(null)}
        />
      )}
    </div>
  );
}
