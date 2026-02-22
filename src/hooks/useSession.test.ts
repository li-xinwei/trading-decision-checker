import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mockFetchSessionById = vi.fn();
const mockFetchTradesBySession = vi.fn();
const mockCreateSession = vi.fn();
const mockEndSession = vi.fn();
const mockCloseTrade = vi.fn();
const mockCreateTrade = vi.fn();

vi.mock('../lib/supabase', () => ({
  fetchSessionById: (...args: unknown[]) => mockFetchSessionById(...args),
  fetchTradesBySession: (...args: unknown[]) => mockFetchTradesBySession(...args),
  createSession: (...args: unknown[]) => mockCreateSession(...args),
  endSession: (...args: unknown[]) => mockEndSession(...args),
  closeTrade: (...args: unknown[]) => mockCloseTrade(...args),
  createTrade: (...args: unknown[]) => mockCreateTrade(...args),
}));

const { useSession } = await import('./useSession');

describe('useSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSessionById.mockResolvedValue(null);
    mockFetchTradesBySession.mockResolvedValue([]);
    mockCreateSession.mockResolvedValue(true);
    mockEndSession.mockResolvedValue(true);
    mockCloseTrade.mockResolvedValue(true);
    mockCreateTrade.mockResolvedValue(true);
  });

  it('loads session data on mount', async () => {
    const session = { id: 's1', startedAt: 1000, status: 'active' as const };
    mockFetchSessionById.mockResolvedValue(session);
    mockFetchTradesBySession.mockResolvedValue([]);

    const { result } = renderHook(() => useSession('s1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toEqual(session);
    expect(result.current.trades).toEqual([]);
  });

  it('handles missing session', async () => {
    mockFetchSessionById.mockResolvedValue(null);

    const { result } = renderHook(() => useSession('nonexistent'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
  });

  it('startSession creates and sets session', async () => {
    const { result } = renderHook(() => useSession('s2'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.startSession();
    });

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: 's2', status: 'active' })
    );
    expect(result.current.session).not.toBeNull();
    expect(result.current.session?.id).toBe('s2');
  });

  it('endSession updates session status', async () => {
    const session = { id: 's3', startedAt: 1000, status: 'active' as const };
    mockFetchSessionById.mockResolvedValue(session);
    mockFetchTradesBySession.mockResolvedValue([]);

    const { result } = renderHook(() => useSession('s3'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.endSession('good session');
    });

    expect(mockEndSession).toHaveBeenCalledWith('s3', 'good session');
    expect(result.current.session?.status).toBe('ended');
  });

  it('closeTrade updates trade in list', async () => {
    const trade = {
      id: 't1',
      sessionId: 's4',
      setupType: 'pullback',
      direction: '做多',
      status: 'active' as const,
      openedAt: 1000,
    };
    const session = { id: 's4', startedAt: 1000, status: 'active' as const };
    mockFetchSessionById.mockResolvedValue(session);
    mockFetchTradesBySession.mockResolvedValue([trade]);

    const { result } = renderHook(() => useSession('s4'));
    await waitFor(() => expect(result.current.trades).toHaveLength(1));

    await act(async () => {
      await result.current.closeTrade('t1', 'win', 1.5, 'good entry');
    });

    expect(mockCloseTrade).toHaveBeenCalledWith('t1', 'win', 1.5, 'good entry');
    expect(result.current.trades[0].status).toBe('closed');
    expect(result.current.trades[0].result).toBe('win');
    expect(result.current.trades[0].pnlRR).toBe(1.5);
  });
});
