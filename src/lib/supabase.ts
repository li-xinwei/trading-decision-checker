import { createClient } from '@supabase/supabase-js';
import type { CheckSession, TradingSystemData } from '../types/decisionTree';
import type { TradingSession, Trade, DailySummary } from '../types/trading';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==================== Check Sessions (legacy) ====================

interface SessionRow {
  id: string;
  start_time: number;
  end_time: number | null;
  decisions: CheckSession['decisions'];
  result: CheckSession['result'] | null;
  trade_direction: string | null;
  pair: string | null;
}

function toRow(session: CheckSession): SessionRow {
  return {
    id: session.id,
    start_time: session.startTime,
    end_time: session.endTime ?? null,
    decisions: session.decisions,
    result: session.result ?? null,
    trade_direction: session.tradeDirection ?? null,
    pair: session.pair ?? null,
  };
}

function fromRow(row: SessionRow): CheckSession {
  return {
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    decisions: row.decisions,
    result: row.result ?? undefined,
    tradeDirection: row.trade_direction ?? undefined,
    pair: row.pair ?? undefined,
  };
}

export async function fetchSessions(): Promise<CheckSession[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('check_sessions')
    .select('*')
    .order('start_time', { ascending: false })
    .limit(50);
  if (error) {
    console.error('Supabase fetch error:', error.message);
    return null;
  }
  return (data as SessionRow[]).map(fromRow);
}

export async function insertSession(session: CheckSession): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('check_sessions')
    .insert(toRow(session));
  if (error) {
    console.error('Supabase insert error:', error.message);
    return false;
  }
  return true;
}

export async function deleteAllSessions(): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('check_sessions')
    .delete()
    .neq('id', '');
  if (error) {
    console.error('Supabase delete error:', error.message);
    return false;
  }
  return true;
}

// ==================== Trading System ====================

const SYSTEM_ID = 'default';

export async function fetchTradingSystem(): Promise<TradingSystemData | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('trading_systems')
    .select('data')
    .eq('id', SYSTEM_ID)
    .single();
  if (error) {
    console.error('Supabase fetch system error:', error.message);
    return null;
  }
  return (data?.data as TradingSystemData) ?? null;
}

export async function saveTradingSystem(
  system: TradingSystemData
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('trading_systems').upsert({
    id: SYSTEM_ID,
    data: system,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error('Supabase save system error:', error.message);
    return false;
  }
  return true;
}

// ==================== Trading Sessions ====================

const TS_LOCAL_KEY = 'trading_sessions';
const TRADES_LOCAL_KEY = 'trades';

function loadLocalSessions(): TradingSession[] {
  try {
    return JSON.parse(localStorage.getItem(TS_LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalSessions(sessions: TradingSession[]) {
  localStorage.setItem(TS_LOCAL_KEY, JSON.stringify(sessions));
}

function loadLocalTrades(): Trade[] {
  try {
    return JSON.parse(localStorage.getItem(TRADES_LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalTrades(trades: Trade[]) {
  localStorage.setItem(TRADES_LOCAL_KEY, JSON.stringify(trades));
}

export async function createSession(
  session: TradingSession
): Promise<boolean> {
  if (!supabase) {
    const all = loadLocalSessions();
    all.unshift(session);
    saveLocalSessions(all);
    return true;
  }
  const { error } = await supabase.from('trading_sessions').insert({
    id: session.id,
    started_at: new Date(session.startedAt).toISOString(),
    status: session.status,
    notes: session.notes || null,
  });
  if (error) {
    console.error('Create session error:', error.message);
    const all = loadLocalSessions();
    all.unshift(session);
    saveLocalSessions(all);
  }
  return true;
}

export async function endSession(
  id: string,
  notes?: string
): Promise<boolean> {
  const now = Date.now();
  if (!supabase) {
    const all = loadLocalSessions();
    const idx = all.findIndex((s) => s.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], status: 'ended', endedAt: now, notes };
      saveLocalSessions(all);
    }
    return true;
  }
  const { error } = await supabase
    .from('trading_sessions')
    .update({
      status: 'ended',
      ended_at: new Date(now).toISOString(),
      notes: notes || null,
    })
    .eq('id', id);
  if (error) {
    console.error('End session error:', error.message);
  }
  return true;
}

export async function fetchAllTradingSessions(): Promise<TradingSession[]> {
  if (!supabase) return loadLocalSessions();
  const { data, error } = await supabase
    .from('trading_sessions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(100);
  if (error) {
    console.error('Fetch sessions error:', error.message);
    return loadLocalSessions();
  }
  return (data || []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    startedAt: new Date(r.started_at as string).getTime(),
    endedAt: r.ended_at ? new Date(r.ended_at as string).getTime() : undefined,
    status: (r.status as 'active' | 'ended') || 'ended',
    notes: (r.notes as string) || undefined,
  }));
}

export async function fetchSessionById(
  id: string
): Promise<TradingSession | null> {
  if (!supabase) {
    return loadLocalSessions().find((s) => s.id === id) || null;
  }
  const { data, error } = await supabase
    .from('trading_sessions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    return loadLocalSessions().find((s) => s.id === id) || null;
  }
  return {
    id: data.id,
    startedAt: new Date(data.started_at).getTime(),
    endedAt: data.ended_at
      ? new Date(data.ended_at).getTime()
      : undefined,
    status: data.status || 'ended',
    notes: data.notes || undefined,
  };
}

// ==================== Trades ====================

export async function createTrade(trade: Trade): Promise<boolean> {
  if (!supabase) {
    const all = loadLocalTrades();
    all.unshift(trade);
    saveLocalTrades(all);
    return true;
  }
  const { error } = await supabase.from('trades').insert({
    id: trade.id,
    session_id: trade.sessionId,
    setup_type: trade.setupType,
    direction: trade.direction,
    entry_plan: trade.entryPlan || null,
    stop_loss: trade.stopLoss || null,
    take_profit: trade.takeProfit || null,
    status: trade.status,
    opened_at: new Date(trade.openedAt).toISOString(),
  });
  if (error) {
    console.error('Create trade error:', error.message);
    const all = loadLocalTrades();
    all.unshift(trade);
    saveLocalTrades(all);
  }
  return true;
}

export async function closeTrade(
  id: string,
  result: 'win' | 'loss' | 'breakeven',
  entryPrice?: number,
  exitPrice?: number,
  review?: string
): Promise<boolean> {
  const now = Date.now();

  const pnlPoints = entryPrice != null && exitPrice != null
    ? +(exitPrice - entryPrice).toFixed(2)
    : undefined;

  const patch = {
    status: 'closed' as const,
    result,
    entryPrice,
    exitPrice,
    pnlRR: pnlPoints,
    review,
    closedAt: now,
  };

  const all = loadLocalTrades();
  const idx = all.findIndex((t) => t.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...patch };
    saveLocalTrades(all);
  }

  if (!supabase) return true;

  const { error } = await supabase
    .from('trades')
    .update({
      status: 'closed',
      result,
      entry_price: entryPrice ?? null,
      exit_price: exitPrice ?? null,
      pnl_rr: pnlPoints ?? null,
      review: review || null,
      closed_at: new Date(now).toISOString(),
    })
    .eq('id', id);
  if (error) {
    console.error('Close trade error:', error.message);
  }
  return true;
}

export async function fetchTradesBySession(
  sessionId: string
): Promise<Trade[]> {
  if (!supabase) {
    return loadLocalTrades().filter((t) => t.sessionId === sessionId);
  }
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('session_id', sessionId)
    .order('opened_at', { ascending: false });
  if (error) {
    console.error('Fetch trades error:', error.message);
    return loadLocalTrades().filter((t) => t.sessionId === sessionId);
  }
  return (data || []).map(mapTradeRow);
}

export async function fetchAllTrades(): Promise<Trade[]> {
  if (!supabase) return loadLocalTrades();
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('opened_at', { ascending: false });
  if (error) {
    console.error('Fetch all trades error:', error.message);
    return loadLocalTrades();
  }
  return (data || []).map(mapTradeRow);
}

function mapTradeRow(r: Record<string, unknown>): Trade {
  return {
    id: r.id as string,
    sessionId: r.session_id as string,
    setupType: r.setup_type as string,
    direction: r.direction as string,
    entryPlan: (r.entry_plan as string) || undefined,
    stopLoss: (r.stop_loss as string) || undefined,
    takeProfit: (r.take_profit as string) || undefined,
    status: (r.status as 'active' | 'closed') || 'closed',
    result: (r.result as 'win' | 'loss' | 'breakeven') || undefined,
    entryPrice: r.entry_price != null ? Number(r.entry_price) : undefined,
    exitPrice: r.exit_price != null ? Number(r.exit_price) : undefined,
    pnlRR: r.pnl_rr != null ? Number(r.pnl_rr) : undefined,
    review: (r.review as string) || undefined,
    checkSessionId: (r.check_session_id as string) || undefined,
    openedAt: new Date(r.opened_at as string).getTime(),
    closedAt: r.closed_at
      ? new Date(r.closed_at as string).getTime()
      : undefined,
  };
}

// ==================== Daily Summaries ====================

const SUMMARIES_LOCAL_KEY = 'daily_summaries';

function loadLocalSummaries(): DailySummary[] {
  try {
    return JSON.parse(localStorage.getItem(SUMMARIES_LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalSummaries(summaries: DailySummary[]) {
  localStorage.setItem(SUMMARIES_LOCAL_KEY, JSON.stringify(summaries));
}

export async function saveDailySummary(
  summary: DailySummary
): Promise<boolean> {
  if (!supabase) {
    const all = loadLocalSummaries();
    const idx = all.findIndex((s) => s.date === summary.date);
    if (idx >= 0) {
      all[idx] = summary;
    } else {
      all.unshift(summary);
    }
    saveLocalSummaries(all);
    return true;
  }
  const { error } = await supabase.from('daily_summaries').upsert({
    id: summary.id,
    date: summary.date,
    raw_notes: summary.rawNotes,
    ai_summary: summary.aiSummary || null,
    session_ids: summary.sessionIds,
    created_at: new Date(summary.createdAt).toISOString(),
  });
  if (error) {
    console.error('Save summary error:', error.message);
    const all = loadLocalSummaries();
    const idx = all.findIndex((s) => s.date === summary.date);
    if (idx >= 0) all[idx] = summary;
    else all.unshift(summary);
    saveLocalSummaries(all);
  }
  return true;
}

export async function fetchDailySummaries(): Promise<DailySummary[]> {
  if (!supabase) return loadLocalSummaries();
  const { data, error } = await supabase
    .from('daily_summaries')
    .select('*')
    .order('date', { ascending: false })
    .limit(100);
  if (error) {
    console.error('Fetch summaries error:', error.message);
    return loadLocalSummaries();
  }
  return (data || []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    date: r.date as string,
    rawNotes: r.raw_notes as string,
    aiSummary: (r.ai_summary as string) || undefined,
    sessionIds: (r.session_ids as string[]) || [],
    createdAt: new Date(r.created_at as string).getTime(),
  }));
}
