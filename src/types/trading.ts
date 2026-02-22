export interface TradingSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  status: 'active' | 'ended';
  notes?: string;
}

export interface Trade {
  id: string;
  sessionId: string;
  setupType: string;
  direction: string;
  entryPlan?: string;
  stopLoss?: string;
  takeProfit?: string;
  status: 'active' | 'closed';
  result?: 'win' | 'loss' | 'breakeven';
  pnlRR?: number;
  review?: string;
  checkSessionId?: string;
  openedAt: number;
  closedAt?: number;
}

export interface DailySummary {
  id: string;
  date: string;
  rawNotes: string;
  aiSummary?: string;
  sessionIds: string[];
  createdAt: number;
}
