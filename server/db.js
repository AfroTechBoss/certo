require('dotenv').config();
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Local dev only: Neon uses a WebSocket connection whose TLS cert can't be verified
// against the local system cert store. Safe to bypass locally; Vercel is unaffected.
if (!process.env.VERCEL) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Use WebSocket transport in Node.js (edge runtimes provide their own WebSocket)
neonConfig.webSocketConstructor = ws;

// channel_binding=require is not needed for the Neon WS driver
const pgUrl = (process.env.DATABASE_URL || '').replace('channel_binding=require', 'channel_binding=disable');

const pool = new Pool({ connectionString: pgUrl });

pool.on('error', (err) => {
  console.error('[pool] idle client error:', err.message);
});

// Query with automatic retry on transient errors (covers Neon cold start)
// Neon can take up to ~10s to wake from sleep; we allow 4 attempts with exponential backoff
async function query(sql, params) {
  const RETRIES = 4;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      return await pool.query(sql, params);
    } catch (err) {
      const transient = err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT'
        || err.code === '57P01' // Neon: connection terminated by admin
        || !err.code
        || err.message?.includes('timeout')
        || err.message?.includes('terminated')
        || err.message?.includes('ECONNRESET')
        || err.message?.includes('connection')
        || err.message?.includes('fetch failed'); // Neon WS fetch error
      if (transient && attempt < RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s
        console.warn(`[db] ${err.code || err.message?.slice(0, 60)} — attempt ${attempt}/${RETRIES}, retrying in ${delay}ms…`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

pool.queryR = query;

// Auto-migrate: add variants column if it doesn't exist
pool.queryR(`ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'`).catch(() => {});

// Auto-migrate: add variant columns to orders if they don't exist
pool.queryR(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS variant_id TEXT`).catch(() => {});
pool.queryR(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS variant_color TEXT`).catch(() => {});
pool.queryR(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS variant_storage TEXT`).catch(() => {});
pool.queryR(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS variant_color_hex TEXT`).catch(() => {});

// Auto-migrate: admin soft-delete (hide) for orders
pool.queryR(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_hidden BOOLEAN DEFAULT false`).catch(() => {});

module.exports = pool;
