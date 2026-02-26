-- V5: Trading Log System
-- Drop old session-based tables (not used anymore)
-- trade_logs: one row per trading day
CREATE TABLE IF NOT EXISTS trade_logs (
  id            TEXT PRIMARY KEY,
  date          TEXT NOT NULL UNIQUE,   -- 'YYYY-MM-DD'
  gross_pnl     REAL NOT NULL DEFAULT 0,
  fees_total    REAL NOT NULL DEFAULT 0,
  net_pnl       REAL NOT NULL DEFAULT 0,
  trade_count   INTEGER NOT NULL DEFAULT 0,
  summary_note  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- trade_log_entries: one row per individual trade (from CSV)
CREATE TABLE IF NOT EXISTS trade_log_entries (
  id              TEXT PRIMARY KEY,
  log_id          TEXT NOT NULL REFERENCES trade_logs(id) ON DELETE CASCADE,
  symbol          TEXT NOT NULL,
  qty             INTEGER NOT NULL DEFAULT 1,
  buy_price       REAL NOT NULL,
  sell_price      REAL NOT NULL,
  buy_time        TEXT NOT NULL,   -- stored as original string from CSV
  sell_time       TEXT NOT NULL,
  duration_secs   INTEGER,
  gross_pnl       REAL NOT NULL,
  fees            REAL NOT NULL DEFAULT 0,
  net_pnl         REAL NOT NULL,
  fee_breakdown   JSONB,
  entry_reason    TEXT,
  exit_reason     TEXT,
  reflection      TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trade_log_entries_log_id ON trade_log_entries(log_id);
CREATE INDEX IF NOT EXISTS idx_trade_logs_date ON trade_logs(date DESC);
