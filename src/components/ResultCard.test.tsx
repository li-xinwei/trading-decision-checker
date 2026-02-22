import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultCard } from './ResultCard';
import type { ResultNode, DecisionRecord } from '../types/decisionTree';

const goResult: ResultNode = {
  id: 'result_go',
  type: 'go',
  title: 'All clear!',
  message: 'You may proceed with this trade.',
  suggestions: [],
  executionPlan: {
    entry: '突破单挂在信号K极值外',
    stopLoss: '趋势起点',
    takeProfit: '趋势极值',
    notes: '注意仓位控制',
  },
};

const noGoResult: ResultNode = {
  id: 'result_nogo',
  type: 'no-go',
  title: 'Do not trade',
  message: 'Conditions are not met.',
  suggestions: ['Wait for better setup'],
};

const mockDecisions: DecisionRecord[] = [
  { nodeId: 'q1', question: 'Direction?', answer: 'Long', category: 'Direction', timestamp: 1000 },
  { nodeId: 'q2', question: 'Trend?', answer: 'Yes', category: 'Trend', timestamp: 2000 },
];

describe('ResultCard', () => {
  it('renders go result with title and message', () => {
    render(
      <ResultCard result={goResult} decisions={mockDecisions} onReset={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.getByText('All clear!')).toBeInTheDocument();
    expect(screen.getByText('You may proceed with this trade.')).toBeInTheDocument();
  });

  it('renders no-go result', () => {
    render(
      <ResultCard result={noGoResult} decisions={mockDecisions} onReset={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.getByText('Do not trade')).toBeInTheDocument();
  });

  it('renders execution plan for GO results', () => {
    render(
      <ResultCard result={goResult} decisions={mockDecisions} onReset={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.getByText('执行方案')).toBeInTheDocument();
    expect(screen.getByText('突破单挂在信号K极值外')).toBeInTheDocument();
    expect(screen.getByText('趋势起点')).toBeInTheDocument();
    expect(screen.getByText('趋势极值')).toBeInTheDocument();
    expect(screen.getByText('注意仓位控制')).toBeInTheDocument();
  });

  it('renders suggestions for non-GO results', () => {
    render(
      <ResultCard result={noGoResult} decisions={mockDecisions} onReset={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.getByText('Wait for better setup')).toBeInTheDocument();
  });

  it('decision path is collapsed by default and expandable', async () => {
    const user = userEvent.setup();
    render(
      <ResultCard result={goResult} decisions={mockDecisions} onReset={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.queryByText('Direction?')).not.toBeInTheDocument();

    await user.click(screen.getByText(/决策路径/));
    expect(screen.getByText('Direction?')).toBeInTheDocument();
    expect(screen.getByText('Long')).toBeInTheDocument();
  });

  it('calls onReset when new check button clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(
      <ResultCard result={goResult} decisions={mockDecisions} onReset={onReset} onBack={vi.fn()} />
    );

    await user.click(screen.getByText('新的检查'));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('calls onBack when back button clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <ResultCard result={goResult} decisions={mockDecisions} onReset={vi.fn()} onBack={onBack} />
    );

    await user.click(screen.getByText('← 返回修改'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('applies correct CSS class for go result', () => {
    const { container } = render(
      <ResultCard result={goResult} decisions={[]} onReset={vi.fn()} onBack={vi.fn()} />
    );
    expect(container.querySelector('.result-bg-go')).toBeInTheDocument();
  });

  it('applies correct CSS class for no-go result', () => {
    const { container } = render(
      <ResultCard result={noGoResult} decisions={[]} onReset={vi.fn()} onBack={vi.fn()} />
    );
    expect(container.querySelector('.result-bg-nogo')).toBeInTheDocument();
  });
});
