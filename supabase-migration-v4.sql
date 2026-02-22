-- V4: Add entry_price and exit_price columns to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_price REAL;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_price REAL;
