import { useState, useEffect, useCallback } from 'react';
import type { TradingSession, Trade } from '../types/trading';
import {
  fetchSessionById,
  fetchTradesBySession,
  createSession as createSessionApi,
  endSession as endSessionApi,
  closeTrade as closeTradeApi,
  createTrade as createTradeApi,
} from '../lib/supabase';

export function useSession(sessionId: string) {
  const [session, setSession] = useState<TradingSession | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchSessionById(sessionId).then((s) => {
      if (cancelled) return;
      setSession(s);
      if (s) {
        fetchTradesBySession(sessionId).then((t) => {
          if (!cancelled) {
            setTrades(t);
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [sessionId]);

  const startSession = useCallback(async () => {
    const newSession: TradingSession = {
      id: sessionId,
      startedAt: Date.now(),
      status: 'active',
    };
    await createSessionApi(newSession);
    setSession(newSession);
  }, [sessionId]);

  const endCurrentSession = useCallback(
    async (notes?: string) => {
      await endSessionApi(sessionId, notes);
      setSession((prev) =>
        prev ? { ...prev, status: 'ended', endedAt: Date.now(), notes } : prev
      );
    },
    [sessionId]
  );

  const addTrade = useCallback(
    async (trade: Trade) => {
      await createTradeApi(trade);
      setTrades((prev) => [trade, ...prev]);
    },
    []
  );

  const closeTrade = useCallback(
    async (
      tradeId: string,
      result: 'win' | 'loss' | 'breakeven',
      entryPrice?: number,
      exitPrice?: number,
      review?: string
    ) => {
      await closeTradeApi(tradeId, result, entryPrice, exitPrice, review);
      setTrades((prev) =>
        prev.map((t) =>
          t.id === tradeId
            ? {
                ...t,
                status: 'closed' as const,
                result,
                entryPrice,
                exitPrice,
                review,
                closedAt: Date.now(),
              }
            : t
        )
      );
    },
    []
  );

  const refreshTrades = useCallback(async () => {
    const fresh = await fetchTradesBySession(sessionId);
    setTrades((prev) => {
      const localClosed = new Map(
        prev.filter((t) => t.status === 'closed').map((t) => [t.id, t])
      );
      return fresh.map((t) => {
        if (t.status === 'active' && localClosed.has(t.id)) {
          return localClosed.get(t.id)!;
        }
        return t;
      });
    });
  }, [sessionId]);

  return {
    session,
    trades,
    loading,
    startSession,
    endSession: endCurrentSession,
    addTrade,
    closeTrade,
    refreshTrades,
  };
}
