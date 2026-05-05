const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { adminAuth } = require('../adminAuth');

// GET /api/admin/logs  (admin — activity log)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.queryR(
      `SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 500`,
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// DELETE /api/admin/logs  (admin — clear all logs)
router.delete('/', adminAuth, async (req, res) => {
  try {
    await pool.queryR('DELETE FROM admin_logs');
    const log = require('../logAdminAction');
    log(req.adminName, 'Cleared activity log', '').catch(() => {});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

module.exports = router;
