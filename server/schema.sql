-- Certo Database Schema (canonical — run on a fresh DB or via migrate.sql for upgrades)

CREATE TABLE IF NOT EXISTS products (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  subtitle       TEXT,
  category       TEXT NOT NULL,
  listing_type   TEXT NOT NULL DEFAULT 'New',
  listing_status TEXT DEFAULT 'live',
  apple_url      TEXT,
  image_urls     TEXT[],
  usd_price      NUMERIC(10,2),
  in_stock       BOOLEAN DEFAULT true,
  featured       BOOLEAN DEFAULT false,
  badge          TEXT,
  delivery_days  TEXT DEFAULT '10–18 business days',
  condition      TEXT DEFAULT 'new',
  condition_note TEXT,
  description    TEXT,
  overview       TEXT[],
  specs          TEXT[],
  includes       TEXT[],
  features       JSONB DEFAULT '[]',
  tech_specs     JSONB DEFAULT '[]',
  stock_count    INTEGER DEFAULT 1,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id                TEXT PRIMARY KEY,
  customer_name     TEXT NOT NULL,
  customer_email    TEXT NOT NULL,
  customer_phone    TEXT NOT NULL,
  address           TEXT NOT NULL,
  state             TEXT,
  product_id        TEXT,
  product_name      TEXT NOT NULL,
  product_subtitle  TEXT,
  product_image_url TEXT,
  apple_url         TEXT,
  applecare         TEXT DEFAULT 'none',
  qty               INTEGER DEFAULT 1,
  usd_price         NUMERIC(10,2) NOT NULL,
  ngn_price         NUMERIC(14,2) NOT NULL,
  forex_rate        NUMERIC(10,2) NOT NULL,
  status            TEXT DEFAULT 'Order Confirmed',
  flagged           BOOLEAN DEFAULT false,
  flag_reason       TEXT,
  notes             TEXT,
  email_sent        BOOLEAN DEFAULT false,
  items             JSONB DEFAULT '[]',
  payment_method    TEXT DEFAULT 'Paystack',
  coupon_code       TEXT,
  coupon_discount   NUMERIC(10,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_status_idx  ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_flagged_idx ON orders(flagged) WHERE flagged = true;

CREATE TABLE IF NOT EXISTS coupons (
  id             SERIAL PRIMARY KEY,
  code           TEXT UNIQUE NOT NULL,
  description    TEXT,
  discount_type  TEXT NOT NULL DEFAULT 'fixed',   -- 'fixed' | 'percent'
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  applies_to     TEXT NOT NULL DEFAULT 'both',     -- 'delivery' | 'service' | 'both'
  max_uses       INTEGER,
  used_count     INTEGER NOT NULL DEFAULT 0,
  expires_at     TIMESTAMPTZ,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
