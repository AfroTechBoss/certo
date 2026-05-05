// Fire-and-forget helper — writes one row to admin_logs
// Never throws; any DB error is swallowed and printed to console

const pool = require('./db');

async function logAdminAction(adminName, action, details) {
  try {
    await pool.queryR(
      `INSERT INTO admin_logs (admin_name, action, details) VALUES ($1, $2, $3)`,
      [adminName || 'Unknown', action || '', details || ''],
    );
  } catch (err) {
    console.error('[adminLog] failed:', err.message);
  }
}

module.exports = logAdminAction;
