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
  suggestions: ['Set stop loss', 'Log the trade'],
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

  it('renders suggestions', () => {
    render(
      <ResultCard result={goResult} decisions={mockDecisions} onReset={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.getByText('Set stop loss')).toBeInTheDocument();
    expect(screen.getByText('Log the trade')).toBeInTheDocument();
  });

  it('renders decision summary', () => {
    render(
      <ResultCard result={goResult} decisions={mockDecisions} onReset={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.getByText('Direction?')).toBeInTheDocument();
    expect(screen.getByText('Long')).toBeInTheDocument();
    expect(screen.getByText('Trend?')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
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
