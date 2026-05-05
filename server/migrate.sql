-- Certo production migration — run once on the Neon dashboard SQL editor
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS guards

-- products: add listing_status and weight columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS listing_status TEXT DEFAULT 'live';
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_kg      NUMERIC(8,3);

-- orders: add columns introduced after the initial schema
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items           JSONB   DEFAULT '[]';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method  TEXT    DEFAULT 'Paystack';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code     TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC(10,2) DEFAULT 0;

-- coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id             SERIAL PRIMARY KEY,
  code           TEXT UNIQUE NOT NULL,
  description    TEXT,
  discount_type  TEXT NOT NULL DEFAULT 'fixed',
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  applies_to     TEXT NOT NULL DEFAULT 'both',
  max_uses       INTEGER,
  used_count     INTEGER NOT NULL DEFAULT 0,
  expires_at     TIMESTAMPTZ,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id         SERIAL PRIMARY KEY,
  admin_name TEXT NOT NULL,
  action     TEXT NOT NULL,
  details    TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_logs_created_idx ON admin_logs(created_at DESC);
