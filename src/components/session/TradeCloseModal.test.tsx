import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TradeCloseModal } from './TradeCloseModal';
import type { Trade } from '../../types/trading';

const mockTrade: Trade = {
  id: 't1',
  sessionId: 's1',
  setupType: '回调setup',
  direction: '做多',
  status: 'active',
  openedAt: Date.now(),
};

describe('TradeCloseModal', () => {
  it('renders trade info in header', () => {
    render(
      <TradeCloseModal trade={mockTrade} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );

    expect(screen.getByText(/做多/)).toBeInTheDocument();
    expect(screen.getByText(/回调setup/)).toBeInTheDocument();
  });

  it('shows result options', () => {
    render(
      <TradeCloseModal trade={mockTrade} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );

    expect(screen.getByText('盈利')).toBeInTheDocument();
    expect(screen.getByText('亏损')).toBeInTheDocument();
    expect(screen.getByText('持平')).toBeInTheDocument();
  });

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn();
    render(
      <TradeCloseModal trade={mockTrade} onConfirm={vi.fn()} onCancel={onCancel} />
    );

    fireEvent.click(screen.getByText('取消'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onConfirm with selected result', () => {
    const onConfirm = vi.fn();
    render(
      <TradeCloseModal trade={mockTrade} onConfirm={onConfirm} onCancel={vi.fn()} />
    );

    fireEvent.click(screen.getByText('亏损'));
    fireEvent.click(screen.getByText('确认平仓'));
    expect(onConfirm).toHaveBeenCalledWith('loss', undefined, undefined);
  });

  it('passes PnL and review when provided', () => {
    const onConfirm = vi.fn();
    render(
      <TradeCloseModal trade={mockTrade} onConfirm={onConfirm} onCancel={vi.fn()} />
    );

    const pnlInput = screen.getByPlaceholderText('例如 1.5 或 -1');
    fireEvent.change(pnlInput, { target: { value: '2.0' } });

    const reviewInput = screen.getByPlaceholderText(/简单记录/);
    fireEvent.change(reviewInput, { target: { value: '好交易' } });

    fireEvent.click(screen.getByText('确认平仓'));
    expect(onConfirm).toHaveBeenCalledWith('win', 2.0, '好交易');
  });
});
