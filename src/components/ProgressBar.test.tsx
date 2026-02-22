import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('renders step number and category', () => {
    render(<ProgressBar progress={30} currentStep={3} category="Setup验证" />);

    expect(screen.getByText('步骤 3')).toBeInTheDocument();
    expect(screen.getByText('Setup验证')).toBeInTheDocument();
  });

  it('sets progress bar width', () => {
    const { container } = render(
      <ProgressBar progress={60} currentStep={6} category="Cat" />
    );

    const fill = container.querySelector('.progress-fill') as HTMLElement;
    expect(fill.style.width).toBe('60%');
  });

  it('handles zero progress', () => {
    const { container } = render(
      <ProgressBar progress={0} currentStep={1} category="开始" />
    );

    const fill = container.querySelector('.progress-fill') as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });
});
