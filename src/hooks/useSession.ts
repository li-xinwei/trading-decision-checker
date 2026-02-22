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

  const load = useCallback(async () => {
    setLoading(true);
    const s = await fetchSessionById(sessionId);
    setSession(s);
    if (s) {
      const t = await fetchTradesBySession(sessionId);
      setTrades(t);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

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
      pnlRR?: number,
      review?: string
    ) => {
      await closeTradeApi(tradeId, result, pnlRR, review);
      setTrades((prev) =>
        prev.map((t) =>
          t.id === tradeId
            ? { ...t, status: 'closed', result, pnlRR, review, closedAt: Date.now() }
            : t
        )
      );
    },
    []
  );

  const refreshTrades = useCallback(async () => {
    const t = await fetchTradesBySession(sessionId);
    setTrades(t);
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
