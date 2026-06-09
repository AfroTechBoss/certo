const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { adminAuth } = require('../adminAuth');
const logAdminAction = require('../logAdminAction');
const { getCreditTransactions, getToken, getMainAccountTrackingRef } = require('../lib/kuda');

// All routes here require an admin session
router.use(adminAuth);

// GET /api/admin/bank-alerts/diagnostic — what's actually wrong with the Kuda setup?
// Returns a per-step report so the admin can see WHICH piece is broken without
// having to read server logs.
router.get('/diagnostic', async (req, res) => {
  // Latest webhook-delivered alert, if any. Tells us whether Kuda has ever
  // successfully POSTed to /api/webhooks/kuda.
  let latestWebhook = null;
  try {
    const { rows } = await pool.queryR(
      `SELECT transaction_at, amount_ngn FROM bank_alerts ORDER BY created_at DESC LIMIT 1`,
    );
    if (rows.length) {
      latestWebhook = `latest alert: ₦${Number(rows[0].amount_ngn).toLocaleString('en-NG')} at ${new Date(rows[0].transaction_at).toLocaleString('en-NG')}`;
    } else {
      latestWebhook = '(no alerts in the DB yet — try a small test payment)';
    }
  } catch (_) { /* fine — diagnostic should be resilient */ }

  const report = {
    env: {
      KUDA_EMAIL:           process.env.KUDA_EMAIL           ? 'set ✓' : 'MISSING ✗',
      KUDA_API_KEY:         process.env.KUDA_API_KEY         ? 'set ✓' : 'MISSING ✗',
      KUDA_TRACKING_REF:    process.env.KUDA_TRACKING_REF    ? 'set ✓' : '(optional — will auto-discover)',
      KUDA_BASE_URL:        process.env.KUDA_BASE_URL        || '(default: live)',
      KUDA_WEBHOOK_SECRET:  process.env.KUDA_WEBHOOK_SECRET  ? 'set ✓' : 'MISSING ✗ (webhooks will reject all incoming events)',
    },
    login:           null,
    trackingRef:     null,
    webhook:         latestWebhook,
    nextStep:        null,
  };

  // Step 1: required env vars present?
  const missingRequired = ['KUDA_EMAIL', 'KUDA_API_KEY'].filter(k => !process.env[k]);
  if (missingRequired.length) {
    report.nextStep = `Add ${missingRequired.join(', ')} to Vercel Environment Variables, then redeploy.`;
    return res.json(report);
  }

  // Step 2: can we log in to Kuda?
  try {
    const token = await getToken();
    report.login = token ? `ok (token length ${token.length})` : 'no token returned';
    if (!token) {
      report.nextStep = 'Kuda returned no token — check that the API key matches the email.';
      return res.json(report);
    }
  } catch (err) {
    report.login    = `FAILED — ${err.message}`;
    report.nextStep = 'Kuda rejected our login. Double-check KUDA_EMAIL + KUDA_API_KEY.';
    return res.json(report);
  }

  // Step 3: can we resolve the main-account tracking reference?
  // If the env var isn't set, this tries Kuda's RETRIEVE_MAIN_ACCOUNT and
  // surfaces whatever it returns so the admin can copy it into env vars
  // (optional — the sync also auto-discovers, so this is purely informational).
  try {
    const ref = await getMainAccountTrackingRef();
    report.trackingRef = `ok — ${ref}`;
    report.nextStep    = process.env.KUDA_TRACKING_REF
      ? 'All looks good. Try Sync now.'
      : `All looks good. (Tip: pin the tracking ref by adding KUDA_TRACKING_REF=${ref} to env vars so we don't have to discover it every cold start.) Try Sync now.`;
  } catch (err) {
    report.trackingRef = `FAILED — ${err.message}`;
    // The "do not have permission" message is Kuda's own — pass on what they want.
    if (/do not have permission/i.test(err.message) || /contact the api team/i.test(err.message)) {
      report.nextStep =
        'Kuda has not granted this API key permission to read main-account data. ' +
        'Email api@kudabank.com (or your Kuda account manager) asking them to enable ' +
        'RETRIEVE_MAIN_ACCOUNT and ADMIN_MAIN_ACCOUNT_TRANSACTIONS for the API key ' +
        'tied to ' + (process.env.KUDA_EMAIL || 'your business email') + '. ' +
        'Once they confirm, click Run diagnostic again — no redeploy needed.';
    } else {
      report.nextStep = 'Login worked but we could not get the main account tracking reference. Check that the Business API has main-account access enabled.';
    }
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
      hint: 'Run the diagnostic (button in the error banner) to see which step failed.',
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
