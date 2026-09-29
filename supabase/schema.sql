-- DoorTrack Database Schema for Supabase / PostgreSQL
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  doors INTEGER NOT NULL DEFAULT 0,
  yes_count INTEGER NOT NULL DEFAULT 0,
  no_count INTEGER NOT NULL DEFAULT 0,
  not_home_count INTEGER NOT NULL DEFAULT 0,
  items_sold INTEGER NOT NULL DEFAULT 0,
  earnings NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'kr',
  earnings_per_item NUMERIC(10, 2) NOT NULL DEFAULT 20,
  note TEXT,
  experiment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  earnings_per_item NUMERIC(10, 2) NOT NULL DEFAULT 20,
  price_per_item NUMERIC(10, 2) NOT NULL DEFAULT 50,
  currency TEXT NOT NULL DEFAULT 'kr',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial settings
INSERT INTO user_settings (id, earnings_per_item, price_per_item, currency)
VALUES ('default', 20.00, 50.00, 'kr')
ON CONFLICT (id) DO NOTHING;
