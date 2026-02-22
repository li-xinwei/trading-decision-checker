import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SessionTimer } from './SessionTimer';

describe('SessionTimer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows formatted elapsed time after interval tick', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    render(<SessionTimer startedAt={now - 3600000} ended={false} />);

    act(() => { vi.advanceTimersByTime(1000); });

    expect(screen.getByText('01:00:01')).toBeInTheDocument();
  });

  it('shows ended label when ended', () => {
    render(
      <SessionTimer startedAt={1000} ended endedAt={61000} />
    );

    expect(screen.getByText('已结束')).toBeInTheDocument();
    expect(screen.getByText('00:01:00')).toBeInTheDocument();
  });

  it('applies active class when running', () => {
    const { container } = render(
      <SessionTimer startedAt={Date.now()} ended={false} />
    );

    expect(container.querySelector('.session-timer.active')).toBeTruthy();
  });

  it('applies ended class when finished', () => {
    const { container } = render(
      <SessionTimer startedAt={1000} ended endedAt={2000} />
    );

    expect(container.querySelector('.session-timer.ended')).toBeTruthy();
  });
});
