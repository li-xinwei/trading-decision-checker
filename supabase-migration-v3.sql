-- Trading Sessions
CREATE TABLE IF NOT EXISTS trading_sessions (
  id TEXT PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  notes TEXT
);

ALTER TABLE trading_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access on trading_sessions"
  ON trading_sessions FOR ALL USING (true) WITH CHECK (true);

-- Trades
CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES trading_sessions(id),
  setup_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  entry_plan TEXT,
  stop_loss TEXT,
  take_profit TEXT,
  status TEXT DEFAULT 'active',
  result TEXT,
  pnl_rr REAL,
  review TEXT,
  check_session_id TEXT,
  opened_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  screenshot_url TEXT
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access on trades"
  ON trades FOR ALL USING (true) WITH CHECK (true);

-- Daily Summaries
CREATE TABLE IF NOT EXISTS daily_summaries (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  raw_notes TEXT,
  ai_summary TEXT,
  session_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access on daily_summaries"
  ON daily_summaries FOR ALL USING (true) WITH CHECK (true);
