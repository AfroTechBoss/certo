require('dotenv').config();
const { Pool } = require('pg');

const pgUrl = (process.env.DATABASE_URL || '').replace('channel_binding=require', 'channel_binding=disable');

const pool = new Pool({
  connectionString: pgUrl,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10000,  // wait up to 10s for a connection (covers Neon cold start)
  idleTimeoutMillis:       20000,  // release idle connections after 20s
  keepAlive:               true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[pool] idle client error:', err.message);
});

// Query with automatic retry on transient connection errors (ECONNRESET, ECONNREFUSED)
async function query(sql, params) {
  const RETRIES = 2;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      return await pool.query(sql, params);
    } catch (err) {
      const transient = err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT';
      if (transient && attempt < RETRIES) {
        console.warn(`[db] ${err.code} on attempt ${attempt}, retrying…`);
        await new Promise(r => setTimeout(r, 300 * attempt));
        continue;
      }
      throw err;
    }
  }
}

pool.queryR = query;   // retry-enabled query
module.exports = pool;
