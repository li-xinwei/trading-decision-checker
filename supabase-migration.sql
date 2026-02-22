-- Create trading_systems table for storing trading system configuration
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS trading_systems (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE trading_systems ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write (since we use simple password auth on the client)
CREATE POLICY "Allow all access" ON trading_systems
  FOR ALL USING (true) WITH CHECK (true);
