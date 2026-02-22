import { createClient } from '@supabase/supabase-js';
import type { CheckSession, TradingSystemData } from '../types/decisionTree';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
  return data?.data as TradingSystemData ?? null;
}

export async function saveTradingSystem(system: TradingSystemData): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('trading_systems')
    .upsert({
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
