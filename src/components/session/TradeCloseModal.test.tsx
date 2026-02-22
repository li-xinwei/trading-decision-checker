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

  it('shows entry and exit price inputs', () => {
    render(
      <TradeCloseModal trade={mockTrade} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );

    expect(screen.getByText('开仓价')).toBeInTheDocument();
    expect(screen.getByText('平仓价')).toBeInTheDocument();
  });

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn();
    render(
      <TradeCloseModal trade={mockTrade} onConfirm={vi.fn()} onCancel={onCancel} />
    );

    fireEvent.click(screen.getByText('取消'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('disables confirm until prices filled', () => {
    render(
      <TradeCloseModal trade={mockTrade} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );

    const btn = screen.getByText('确认平仓');
    expect(btn).toBeDisabled();
  });

  it('auto-computes win for long trade with higher exit', () => {
    const onConfirm = vi.fn();
    render(
      <TradeCloseModal trade={mockTrade} onConfirm={onConfirm} onCancel={vi.fn()} />
    );

    fireEvent.change(screen.getByPlaceholderText(/5890/), { target: { value: '5890' } });
    fireEvent.change(screen.getByPlaceholderText(/5895/), { target: { value: '5895' } });

    expect(screen.getByText('盈利')).toBeInTheDocument();
    expect(screen.getByText(/\+5.*点/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('确认平仓'));
    expect(onConfirm).toHaveBeenCalledWith('win', 5890, 5895, undefined);
  });

  it('auto-computes loss for long trade with lower exit', () => {
    render(
      <TradeCloseModal trade={mockTrade} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );

    fireEvent.change(screen.getByPlaceholderText(/5890/), { target: { value: '5890' } });
    fireEvent.change(screen.getByPlaceholderText(/5895/), { target: { value: '5885' } });

    expect(screen.getByText('亏损')).toBeInTheDocument();
  });

  it('passes review when provided', () => {
    const onConfirm = vi.fn();
    render(
      <TradeCloseModal trade={mockTrade} onConfirm={onConfirm} onCancel={vi.fn()} />
    );

    fireEvent.change(screen.getByPlaceholderText(/5890/), { target: { value: '5890' } });
    fireEvent.change(screen.getByPlaceholderText(/5895/), { target: { value: '5895' } });
    fireEvent.change(screen.getByPlaceholderText(/简单记录/), { target: { value: '好交易' } });

    fireEvent.click(screen.getByText('确认平仓'));
    expect(onConfirm).toHaveBeenCalledWith('win', 5890, 5895, '好交易');
  });
});
