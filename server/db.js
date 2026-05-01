require('dotenv').config();
const { Pool } = require('pg');

// Standard wire-protocol pool — much lower latency than the Neon HTTP driver
const pgUrl = (process.env.DATABASE_URL || '').replace('channel_binding=require', 'channel_binding=disable');
const pool = new Pool({ connectionString: pgUrl, ssl: { rejectUnauthorized: false }, max: 5 });

module.exports = pool;
