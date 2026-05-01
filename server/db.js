require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

// Pool-compatible wrapper using sql.query for parameterised calls
const pool = {
  async query(text, params) {
    const rows = await sql.query(text, params || []);
    return { rows };
  },
  async connect() {
    return {
      query:   async (text, params) => { const rows = await sql.query(text, params || []); return { rows }; },
      release: () => {},
    };
  },
  async end() {},
};

module.exports = pool;
