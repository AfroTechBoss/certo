require('dotenv').config();
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Use WebSocket transport in Node.js (edge runtimes provide their own WebSocket)
neonConfig.webSocketConstructor = ws;

// channel_binding=require is not needed for the Neon WS driver
const pgUrl = (process.env.DATABASE_URL || '').replace('channel_binding=require', 'channel_binding=disable');

// On Vercel the system cert store is fine; locally Node may fail to verify Neon's cert
const pool = new Pool({
  connectionString: pgUrl,
  ssl: process.env.VERCEL ? true : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('[pool] idle client error:', err.message);
});

// Query with automatic retry on transient errors (covers Neon cold start)
async function query(sql, params) {
  const RETRIES = 3;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      return await pool.query(sql, params);
    } catch (err) {
      const transient = err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT'
        || !err.code
        || err.message?.includes('timeout') || err.message?.includes('terminated') || err.message?.includes('ECONNRESET');
      if (transient && attempt < RETRIES) {
        const delay = 1000 * attempt; // 1s, 2s
        console.warn(`[db] ${err.code || err.message?.slice(0, 50)} — attempt ${attempt}/${RETRIES}, retrying in ${delay}ms…`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

pool.queryR = query;
module.exports = pool;
