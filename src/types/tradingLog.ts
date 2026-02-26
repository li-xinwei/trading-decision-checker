export interface FeeBreakdown {
  commission: number;
  exchange: number;
  nfa: number;
  clearing: number;
  perSideTotal: number;
  sides: number;
  root: string;
}

export interface TradeLogEntry {
  id: string;
  logId: string;
  symbol: string;
  qty: number;
  buyPrice: number;
  sellPrice: number;
  buyTime: string;
  sellTime: string;
  durationSecs?: number;
  grossPnl: number;
  fees: number;
  netPnl: number;
  feeBreakdown?: FeeBreakdown;
  entryReason?: string;
  exitReason?: string;
  reflection?: string;
  sortOrder: number;
}

export interface TradeLog {
  id: string;
  date: string; // 'YYYY-MM-DD'
  grossPnl: number;
  feesTotal: number;
  netPnl: number;
  tradeCount: number;
  summaryNote?: string;
  entries?: TradeLogEntry[];
}

// Raw row from CSV (matches NinjaTrader performance export columns)
export interface CsvTradeRow {
  symbol: string;
  qty: number;
  buyPrice: number;
  sellPrice: number;
  buyTime: string;
  sellTime: string;
  duration: string;
  grossPnl: number;
}
