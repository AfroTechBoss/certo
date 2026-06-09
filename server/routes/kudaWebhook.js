// ─── Kuda Webhook ────────────────────────────────────────────────────────────
//
// Kuda Business pushes credit-alert events here the instant a customer's
// transfer lands in our account. Way better than polling — alerts appear in
// the admin Bank Alerts tab in real time, with zero clicks.
//
// Setup (one-time, in Kuda's dashboard):
//   1. Settings → Webhooks (or Developer → Webhooks)
//   2. URL:     https://www.certo.ng/api/webhooks/kuda
//                (use the preview domain first to test, then switch to prod)
//   3. Secret:  generate a long random string, paste into the dashboard AND
//                Vercel env vars as KUDA_WEBHOOK_SECRET
//   4. Events:  enable "credit alert" / "transaction notification"
//
// Verification model:
//   Kuda's default model: they send the secret hash back in a header so the
//   server can confirm it's really them. We compare in constant time and
//   reject anything that doesn't match. Supported header names — we check all:
//     - "x-kuda-signature"
//     - "kuda-signature"
//     - "signature"
//     - "x-webhook-secret"
//
// Idempotency:
//   bank_alerts.transaction_ref is UNIQUE. ON CONFLICT DO NOTHING means Kuda
//   can retry the same event a hundred times — we'll insert it exactly once.

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const pool    = require('../db');
const { _internals: { normaliseTransaction } } = require('../lib/kuda');

// Constant-time string compare, so even an attacker timing our response
// can't infer how much of their guess was correct.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

// Pull the signature from whichever header Kuda happens to be using.
function extractSignature(headers) {
  return (
    headers['x-kuda-signature'] ||
    headers['kuda-signature']   ||
    headers['signature']        ||
    headers['x-webhook-secret'] ||
    ''
  );
}

router.post('/', express.json({ limit: '256kb' }), async (req, res) => {
  // 1. Verify the secret
  const expected  = process.env.KUDA_WEBHOOK_SECRET;
  const presented = extractSignature(req.headers);
  if (!expected) {
    console.warn('[kuda-webhook] Rejected — KUDA_WEBHOOK_SECRET env var not set');
    return res.status(503).json({ error: 'Webhook not configured' });
  }
  if (!safeEqual(presented, expected)) {
    console.warn('[kuda-webhook] Rejected — bad signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Pull the transaction out of the payload.
  // Kuda payload shapes seen in the wild:
  //   - The transaction directly: { TransactionReference, Amount, ... }
  //   - Wrapped:                   { Data: { ... } }
  //   - Event-style:               { EventType: 'credit_alert', Data: { ... } }
  const body    = req.body || {};
  const txData  = body.Data || body.data || body.transactionData || body;

  // 3. Only process credits — debits and other event types are ignored
  const txType = String(txData.TransactionType || txData.transactionType || txData.type || 'credit').toLowerCase();
  if (txType && !txType.includes('credit') && txType !== 'c') {
    // Acknowledge so Kuda doesn't retry — but don't write anything.
    return res.json({ ok: true, ignored: true, reason: `non-credit (${txType})` });
  }

  const t = normaliseTransaction(txData);
  if (!t.transaction_ref) {
    console.warn('[kuda-webhook] Skipped — no transaction reference in payload');
    return res.status(400).json({ error: 'Missing transaction reference' });
  }

  // 4. Idempotent insert. If we've already seen this transaction_ref
  //    (because Kuda retried, or because the admin pulled via Sync first),
  //    ON CONFLICT DO NOTHING keeps the original row.
  try {
    const result = await pool.queryR(
      `INSERT INTO bank_alerts
         (transaction_ref, amount_ngn, narration, sender_name, sender_account,
          sender_bank, balance_after, transaction_at, raw)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (transaction_ref) DO NOTHING
       RETURNING id`,
      [
        t.transaction_ref, t.amount_ngn, t.narration, t.sender_name,
        t.sender_account, t.sender_bank, t.balance_after, t.transaction_at,
        JSON.stringify(t.raw || {}),
      ],
    );
    const inserted = result.rows.length > 0;

    console.log(`[kuda-webhook] ${inserted ? 'inserted' : 'duplicate'} — ref=${t.transaction_ref} amount=${t.amount_ngn}`);
    res.json({ ok: true, inserted });
  } catch (err) {
    console.error('[kuda-webhook] DB error:', err.message);
    res.status(500).json({ error: 'Failed to persist webhook event' });
  }
});

module.exports = router;
