import { createClient } from '@supabase/supabase-js';
import type { TradeLog, TradeLogEntry, CsvTradeRow, FeeBreakdown } from '../types/tradingLog';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

// ─── LocalStorage fallback ───────────────────────────────────────────────────
const LS_LOGS = 'trade_logs_v1';
const LS_ENTRIES = 'trade_log_entries_v1';

function loadLocalLogs(): TradeLog[] {
  try { return JSON.parse(localStorage.getItem(LS_LOGS) || '[]'); } catch { return []; }
}
function saveLocalLogs(logs: TradeLog[]) {
  localStorage.setItem(LS_LOGS, JSON.stringify(logs));
}
function loadLocalEntries(): TradeLogEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_ENTRIES) || '[]'); } catch { return []; }
}
function saveLocalEntries(entries: TradeLogEntry[]) {
  localStorage.setItem(LS_ENTRIES, JSON.stringify(entries));
}

// ─── Fee schedule (matches Python script) ────────────────────────────────────
const FEE_SCHEDULE: Record<string, { commission: number; exchange: number; nfa: number; clearing: number }> = {
  MES: { commission: 0.35, exchange: 0.35, nfa: 0.02, clearing: 0.19 },
};

function normalizeSymbol(symbol: string): string {
  const s = (symbol || '').trim().toUpperCase();
  if (s.startsWith('MES')) return 'MES';
  return s;
}

export function calcFees(symbol: string, qty: number): FeeBreakdown {
  const root = normalizeSymbol(symbol);
  const fee = FEE_SCHEDULE[root];
  if (!fee) {
    return { commission: 0, exchange: 0, nfa: 0, clearing: 0, perSideTotal: 0, sides: 0, root };
  }
  const perSideTotal = fee.commission + fee.exchange + fee.nfa + fee.clearing;
  const sides = qty * 2;
  return {
    commission: +(fee.commission * sides).toFixed(4),
    exchange: +(fee.exchange * sides).toFixed(4),
    nfa: +(fee.nfa * sides).toFixed(4),
    clearing: +(fee.clearing * sides).toFixed(4),
    perSideTotal,
    sides,
    root,
  };
}

// ─── CSV Parsing ─────────────────────────────────────────────────────────────
function parsePnl(raw: string): number {
  const s = raw.replace('$', '').replace(',', '').trim();
  if (s.startsWith('(') && s.endsWith(')')) return -parseFloat(s.slice(1, -1));
  return parseFloat(s);
}

function parseDurationSecs(duration: string): number {
  // NinjaTrader format: "9min 28sec" or "1hr 3min 12sec"
  let secs = 0;
  const hr = duration.match(/(\d+)hr/);
  const min = duration.match(/(\d+)min/);
  const sec = duration.match(/(\d+)sec/);
  if (hr) secs += parseInt(hr[1]) * 3600;
  if (min) secs += parseInt(min[1]) * 60;
  if (sec) secs += parseInt(sec[1]);
  return secs;
}

export function parseCsv(text: string): CsvTradeRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });

    return {
      symbol: row['symbol'],
      qty: parseInt(row['qty']) || 1,
      buyPrice: parseFloat(row['buyPrice']),
      sellPrice: parseFloat(row['sellPrice']),
      buyTime: row['boughtTimestamp'],
      sellTime: row['soldTimestamp'],
      duration: row['duration'],
      grossPnl: parsePnl(row['pnl']),
    };
  }).filter((r) => r.symbol && !isNaN(r.buyPrice));
}

export function buildLogFromCsvRows(
  csvRows: CsvTradeRow[],
  date: string
): { log: TradeLog; entries: TradeLogEntry[] } {
  const logId = `log_${date}_${Date.now()}`;

  let totalGross = 0;
  let totalFees = 0;

  const entries: TradeLogEntry[] = csvRows.map((row, i) => {
    const fb = calcFees(row.symbol, row.qty);
    const fees = +fb.commission + fb.exchange + fb.nfa + fb.clearing;
    const netPnl = row.grossPnl - fees;
    totalGross += row.grossPnl;
    totalFees += fees;

    return {
      id: `entry_${logId}_${i}`,
      logId,
      symbol: row.symbol,
      qty: row.qty,
      buyPrice: row.buyPrice,
      sellPrice: row.sellPrice,
      buyTime: row.buyTime,
      sellTime: row.sellTime,
      durationSecs: parseDurationSecs(row.duration),
      grossPnl: row.grossPnl,
      fees: +fees.toFixed(4),
      netPnl: +netPnl.toFixed(2),
      feeBreakdown: fb,
      sortOrder: i,
    };
  });

  const log: TradeLog = {
    id: logId,
    date,
    grossPnl: +totalGross.toFixed(2),
    feesTotal: +totalFees.toFixed(4),
    netPnl: +(totalGross - totalFees).toFixed(2),
    tradeCount: entries.length,
    entries,
  };

  return { log, entries };
}

// ─── Supabase CRUD ───────────────────────────────────────────────────────────

export async function saveTradeLog(log: TradeLog, entries: TradeLogEntry[]): Promise<boolean> {
  if (!supabase) {
    const logs = loadLocalLogs().filter((l) => l.date !== log.date);
    logs.unshift({ ...log, entries: undefined });
    saveLocalLogs(logs);

    const existing = loadLocalEntries().filter((e) => e.logId !== log.id);
    saveLocalEntries([...entries, ...existing]);
    return true;
  }

  // Upsert the log header
  const { error: logErr } = await supabase.from('trade_logs').upsert({
    id: log.id,
    date: log.date,
    gross_pnl: log.grossPnl,
    fees_total: log.feesTotal,
    net_pnl: log.netPnl,
    trade_count: log.tradeCount,
    summary_note: log.summaryNote ?? null,
  });
  if (logErr) { console.error('Save log error:', logErr.message); return false; }

  // Delete old entries for this log then insert fresh
  await supabase.from('trade_log_entries').delete().eq('log_id', log.id);

  const rows = entries.map((e) => ({
    id: e.id,
    log_id: e.logId,
    symbol: e.symbol,
    qty: e.qty,
    buy_price: e.buyPrice,
    sell_price: e.sellPrice,
    buy_time: e.buyTime,
    sell_time: e.sellTime,
    duration_secs: e.durationSecs ?? null,
    gross_pnl: e.grossPnl,
    fees: e.fees,
    net_pnl: e.netPnl,
    fee_breakdown: e.feeBreakdown ?? null,
    entry_reason: e.entryReason ?? null,
    exit_reason: e.exitReason ?? null,
    reflection: e.reflection ?? null,
    sort_order: e.sortOrder,
  }));

  const { error: entErr } = await supabase.from('trade_log_entries').insert(rows);
  if (entErr) { console.error('Save entries error:', entErr.message); return false; }
  return true;
}

export async function fetchTradeLogs(): Promise<TradeLog[]> {
  if (!supabase) return loadLocalLogs();
  const { data, error } = await supabase
    .from('trade_logs')
    .select('*')
    .order('date', { ascending: false })
    .limit(200);
  if (error) { console.error('Fetch logs error:', error.message); return loadLocalLogs(); }
  return (data || []).map(mapLogRow);
}

export async function fetchTradeLogWithEntries(logId: string): Promise<TradeLog | null> {
  if (!supabase) {
    const log = loadLocalLogs().find((l) => l.id === logId) ?? null;
    if (!log) return null;
    return { ...log, entries: loadLocalEntries().filter((e) => e.logId === logId) };
  }
  const [{ data: logData }, { data: entData }] = await Promise.all([
    supabase.from('trade_logs').select('*').eq('id', logId).single(),
    supabase.from('trade_log_entries').select('*').eq('log_id', logId).order('sort_order'),
  ]);
  if (!logData) return null;
  return { ...mapLogRow(logData), entries: (entData || []).map(mapEntryRow) };
}

export async function updateEntryAnnotations(
  entryId: string,
  patch: { entryReason?: string; exitReason?: string; reflection?: string }
): Promise<boolean> {
  // Always update local first as optimistic write
  const all = loadLocalEntries();
  const idx = all.findIndex((e) => e.id === entryId);
  if (idx >= 0) { all[idx] = { ...all[idx], ...patch }; saveLocalEntries(all); }

  if (!supabase) return true;
  const { error } = await supabase.from('trade_log_entries').update({
    entry_reason: patch.entryReason ?? null,
    exit_reason: patch.exitReason ?? null,
    reflection: patch.reflection ?? null,
  }).eq('id', entryId);
  if (error) { console.error('Update entry error:', error.message); return false; }
  return true;
}

export async function updateLogSummaryNote(logId: string, note: string): Promise<boolean> {
  const logs = loadLocalLogs();
  const idx = logs.findIndex((l) => l.id === logId);
  if (idx >= 0) { logs[idx] = { ...logs[idx], summaryNote: note }; saveLocalLogs(logs); }
  if (!supabase) return true;
  const { error } = await supabase.from('trade_logs').update({ summary_note: note }).eq('id', logId);
  if (error) { console.error('Update note error:', error.message); return false; }
  return true;
}

export async function deleteTradeLog(logId: string): Promise<boolean> {
  const logs = loadLocalLogs().filter((l) => l.id !== logId);
  saveLocalLogs(logs);
  const entries = loadLocalEntries().filter((e) => e.logId !== logId);
  saveLocalEntries(entries);
  if (!supabase) return true;
  const { error } = await supabase.from('trade_logs').delete().eq('id', logId);
  if (error) { console.error('Delete log error:', error.message); return false; }
  return true;
}

// ─── Row mappers ─────────────────────────────────────────────────────────────
function mapLogRow(r: Record<string, unknown>): TradeLog {
  return {
    id: r.id as string,
    date: r.date as string,
    grossPnl: Number(r.gross_pnl),
    feesTotal: Number(r.fees_total),
    netPnl: Number(r.net_pnl),
    tradeCount: Number(r.trade_count),
    summaryNote: (r.summary_note as string) || undefined,
  };
}

function mapEntryRow(r: Record<string, unknown>): TradeLogEntry {
  return {
    id: r.id as string,
    logId: r.log_id as string,
    symbol: r.symbol as string,
    qty: Number(r.qty),
    buyPrice: Number(r.buy_price),
    sellPrice: Number(r.sell_price),
    buyTime: r.buy_time as string,
    sellTime: r.sell_time as string,
    durationSecs: r.duration_secs != null ? Number(r.duration_secs) : undefined,
    grossPnl: Number(r.gross_pnl),
    fees: Number(r.fees),
    netPnl: Number(r.net_pnl),
    feeBreakdown: (r.fee_breakdown as FeeBreakdown) || undefined,
    entryReason: (r.entry_reason as string) || undefined,
    exitReason: (r.exit_reason as string) || undefined,
    reflection: (r.reflection as string) || undefined,
    sortOrder: Number(r.sort_order),
  };
}
