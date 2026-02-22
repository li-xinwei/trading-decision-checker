import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryPanel } from './HistoryPanel';
import type { CheckSession } from '../types/decisionTree';

const mockSessions: CheckSession[] = [
  {
    id: 's1',
    startTime: Date.now() - 60000,
    endTime: Date.now(),
    decisions: [
      { nodeId: 'q1', question: 'Q1?', answer: 'Yes', category: 'Cat', timestamp: Date.now() },
    ],
    result: {
      id: 'r1',
      type: 'go',
      title: 'GO: 做多 回调',
      message: 'ok',
      suggestions: [],
    },
    tradeDirection: '做多 (Long)',
    pair: 'EURUSD',
  },
  {
    id: 's2',
    startTime: Date.now() - 120000,
    endTime: Date.now() - 60000,
    decisions: [
      { nodeId: 'q1', question: 'Q1?', answer: 'No', category: 'Cat', timestamp: Date.now() },
    ],
    result: {
      id: 'r2',
      type: 'no-go',
      title: '没通过：铁丝网形态',
      message: 'blocked',
      suggestions: ['wait'],
    },
  },
];

describe('HistoryPanel', () => {
  it('renders session list', () => {
    render(
      <HistoryPanel sessions={mockSessions} onClear={vi.fn()} onClose={vi.fn()} />
    );

    expect(screen.getByText('检查历史')).toBeInTheDocument();
    expect(screen.getByText(/做多/)).toBeInTheDocument();
  });

  it('shows empty state when no sessions', () => {
    render(
      <HistoryPanel sessions={[]} onClear={vi.fn()} onClose={vi.fn()} />
    );

    expect(screen.getByText('暂无历史记录')).toBeInTheDocument();
  });

  it('calls onClear when clear button clicked', () => {
    const onClear = vi.fn();
    render(
      <HistoryPanel sessions={mockSessions} onClear={onClear} onClose={vi.fn()} />
    );

    fireEvent.click(screen.getByText('清空'));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <HistoryPanel sessions={mockSessions} onClear={vi.fn()} onClose={onClose} />
    );

    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows result badges', () => {
    render(
      <HistoryPanel sessions={mockSessions} onClear={vi.fn()} onClose={vi.fn()} />
    );

    expect(screen.getByText('通过')).toBeInTheDocument();
    expect(screen.getByText('拒绝')).toBeInTheDocument();
  });

  it('shows no-go reason as title', () => {
    render(
      <HistoryPanel sessions={mockSessions} onClear={vi.fn()} onClose={vi.fn()} />
    );

    expect(screen.getByText(/铁丝网形态/)).toBeInTheDocument();
  });
});
