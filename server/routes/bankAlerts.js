const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { adminAuth } = require('../adminAuth');
const logAdminAction = require('../logAdminAction');
const { getCreditTransactions, getToken } = require('../lib/kuda');

// All routes here require an admin session
router.use(adminAuth);

// GET /api/admin/bank-alerts/diagnostic — what's actually wrong with the Kuda setup?
// Returns a per-step report so the admin can see WHICH piece is broken without
// having to read server logs.
router.get('/diagnostic', async (req, res) => {
  const report = {
    env: {
      KUDA_EMAIL:        process.env.KUDA_EMAIL        ? 'set ✓' : 'MISSING ✗',
      KUDA_API_KEY:      process.env.KUDA_API_KEY      ? 'set ✓' : 'MISSING ✗',
      KUDA_TRACKING_REF: process.env.KUDA_TRACKING_REF ? 'set ✓' : 'MISSING ✗',
      KUDA_BASE_URL:     process.env.KUDA_BASE_URL     || '(default: live)',
    },
    login:    null,
    nextStep: null,
  };

  // Step 1: are the env vars present?
  const missing = ['KUDA_EMAIL', 'KUDA_API_KEY', 'KUDA_TRACKING_REF']
    .filter(k => !process.env[k]);
  if (missing.length) {
    report.nextStep = `Add ${missing.join(', ')} to Vercel Environment Variables, then redeploy.`;
    return res.json(report);
  }

  // Step 2: can we log in to Kuda?
  try {
    const token = await getToken();
    report.login = token ? `ok (token length ${token.length})` : 'no token returned';
    report.nextStep = token
      ? 'All looks good. Try Sync now.'
      : 'Kuda returned no token — check that the API key matches the email.';
  } catch (err) {
    report.login = `FAILED — ${err.message}`;
    report.nextStep = 'Kuda rejected our login. Double-check KUDA_EMAIL + KUDA_API_KEY.';
  }

  res.json(report);
});

// GET /api/admin/bank-alerts — list the most recent N alerts.
// Query params:
//   limit   (default 100)
//   matched ('true' | 'false' | 'all' — default 'all')
//   search  (free text — narration / sender name / reference)
router.get('/', async (req, res) => {
  try {
    const { limit = 100, matched = 'all', search } = req.query;
    const params = [];
    const where = ['1=1'];

    if (matched === 'true')  where.push('matched_order_id IS NOT NULL');
    if (matched === 'false') where.push('matched_order_id IS NULL');
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const n = params.length;
      where.push(`(narration ILIKE $${n} OR sender_name ILIKE $${n} OR transaction_ref ILIKE $${n})`);
    }

    params.push(Math.min(parseInt(limit, 10) || 100, 500));
    const limitN = params.length;

    const { rows } = await pool.queryR(
      `SELECT id, transaction_ref, amount_ngn, narration, sender_name, sender_account,
              sender_bank, balance_after, transaction_at,
              matched_order_id, matched_by, matched_at, notes, created_at
         FROM bank_alerts
        WHERE ${where.join(' AND ')}
        ORDER BY transaction_at DESC
        LIMIT $${limitN}`,
      params,
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /admin/bank-alerts:', err.message);
    res.status(500).json({ error: 'Failed to fetch bank alerts' });
  }
});

// POST /api/admin/bank-alerts/sync — fetch the latest transactions from Kuda
// and upsert them into the bank_alerts table. Returns counts so the UI can show
// "X new alerts since last sync". Idempotent — re-syncing the same window is safe.
//
// Body (all optional):
//   hours  number of hours of history to fetch (default 24, max 168 = 7d)
router.post('/sync', async (req, res) => {
  const hours = Math.min(Math.max(Number(req.body?.hours) || 24, 1), 168);

  try {
    const endDate   = new Date();
    const startDate = new Date(endDate.getTime() - hours * 3600 * 1000);

    const credits = await getCreditTransactions({ startDate, endDate });
    let inserted = 0;
    let skipped  = 0;

    for (const c of credits) {
      if (!c.transaction_ref) { skipped++; continue; }

      const result = await pool.queryR(
        `INSERT INTO bank_alerts
           (transaction_ref, amount_ngn, narration, sender_name, sender_account,
            sender_bank, balance_after, transaction_at, raw)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (transaction_ref) DO NOTHING
         RETURNING id`,
        [
          c.transaction_ref, c.amount_ngn, c.narration, c.sender_name,
          c.sender_account, c.sender_bank, c.balance_after, c.transaction_at,
          JSON.stringify(c.raw || {}),
        ],
      );
      if (result.rows.length) inserted++;
      else skipped++;
    }

    res.json({
      ok: true,
      windowHours: hours,
      fetched: credits.length,
      inserted,
      skipped,
    });
  } catch (err) {
    console.error('POST /admin/bank-alerts/sync:', err.message);
    res.status(502).json({
      error: 'Kuda sync failed',
      message: err.message,
      hint: 'Verify KUDA_EMAIL, KUDA_API_KEY, and KUDA_TRACKING_REF env vars are set correctly.',
    });
  }
});

// PATCH /api/admin/bank-alerts/:id — update notes or mark-as-matched
router.patch('/:id', async (req, res) => {
  const { matched_order_id, notes } = req.body;
  const allowedFields = [];
  const values = [];

  if (matched_order_id !== undefined) {
    // Allow clearing the match by sending null/empty
    const v = matched_order_id ? String(matched_order_id).trim() : null;
    allowedFields.push(`matched_order_id = $${values.length + 1}`);
    values.push(v);
    if (v) {
      allowedFields.push(`matched_by = $${values.length + 1}`);
      values.push(req.adminName || 'Admin');
      allowedFields.push(`matched_at = NOW()`);
    } else {
      allowedFields.push(`matched_by = NULL`);
      allowedFields.push(`matched_at = NULL`);
    }
  }
  if (notes !== undefined) {
    allowedFields.push(`notes = $${values.length + 1}`);
    values.push(String(notes || ''));
  }

  if (!allowedFields.length) return res.status(400).json({ error: 'Nothing to update' });

  try {
    values.push(req.params.id);
    const { rows } = await pool.queryR(
      `UPDATE bank_alerts SET ${allowedFields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values,
    );
    if (!rows.length) return res.status(404).json({ error: 'Alert not found' });

    if (matched_order_id) {
      await logAdminAction(req.adminName, 'Matched bank alert', `Alert #${req.params.id} → order ${matched_order_id}`);
    } else if (matched_order_id === '' || matched_order_id === null) {
      await logAdminAction(req.adminName, 'Cleared bank-alert match', `Alert #${req.params.id}`);
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /admin/bank-alerts/:id:', err.message);
    res.status(500).json({ error: 'Failed to update bank alert' });
  }
});

module.exports = router;
