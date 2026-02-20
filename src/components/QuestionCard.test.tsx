import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionCard } from './QuestionCard';
import type { TreeNode } from '../types/decisionTree';

const mockNode: TreeNode = {
  id: 'test_node',
  question: 'Is the trend aligned?',
  description: 'Check the higher timeframe',
  category: 'Trend',
  options: [
    { label: 'Yes, aligned', value: 'yes', nextNodeId: 'next' },
    { label: 'No, counter', value: 'no', nextNodeId: 'result_bad', icon: '📉' },
  ],
};

describe('QuestionCard', () => {
  it('renders question and description', () => {
    render(
      <QuestionCard node={mockNode} onSelect={vi.fn()} onBack={vi.fn()} canGoBack={false} />
    );
    expect(screen.getByText('Is the trend aligned?')).toBeInTheDocument();
    expect(screen.getByText('Check the higher timeframe')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(
      <QuestionCard node={mockNode} onSelect={vi.fn()} onBack={vi.fn()} canGoBack={false} />
    );
    expect(screen.getByText('Trend')).toBeInTheDocument();
  });

  it('renders all option buttons', () => {
    render(
      <QuestionCard node={mockNode} onSelect={vi.fn()} onBack={vi.fn()} canGoBack={false} />
    );
    expect(screen.getByText('Yes, aligned')).toBeInTheDocument();
    expect(screen.getByText('No, counter')).toBeInTheDocument();
  });

  it('renders option icon when provided', () => {
    render(
      <QuestionCard node={mockNode} onSelect={vi.fn()} onBack={vi.fn()} canGoBack={false} />
    );
    expect(screen.getByText('📉')).toBeInTheDocument();
  });

  it('calls onSelect with correct value when option clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <QuestionCard node={mockNode} onSelect={onSelect} onBack={vi.fn()} canGoBack={false} />
    );

    await user.click(screen.getByText('Yes, aligned'));
    expect(onSelect).toHaveBeenCalledWith('yes');

    await user.click(screen.getByText('No, counter'));
    expect(onSelect).toHaveBeenCalledWith('no');
  });

  it('shows back button when canGoBack is true', () => {
    render(
      <QuestionCard node={mockNode} onSelect={vi.fn()} onBack={vi.fn()} canGoBack={true} />
    );
    expect(screen.getByText('← 返回上一步')).toBeInTheDocument();
  });

  it('hides back button when canGoBack is false', () => {
    render(
      <QuestionCard node={mockNode} onSelect={vi.fn()} onBack={vi.fn()} canGoBack={false} />
    );
    expect(screen.queryByText('← 返回上一步')).not.toBeInTheDocument();
  });

  it('calls onBack when back button clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <QuestionCard node={mockNode} onSelect={vi.fn()} onBack={onBack} canGoBack={true} />
    );

    await user.click(screen.getByText('← 返回上一步'));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
