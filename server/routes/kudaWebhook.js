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

// ── Debug ring buffer ────────────────────────────────────────────────────────
// Last 5 incoming webhook attempts (headers + redacted body + result).
// Surfaced via the /diagnostic endpoint so the admin can see EXACTLY what
// Kuda sends — header names, payload shape, anything — without needing to
// open Vercel logs. Lives in memory for the life of the function instance.
const _recentAttempts = [];
function recordAttempt(req, result, detail) {
  // Strip headers Vercel injects that aren't useful
  const skip = new Set(['cookie', 'x-vercel-id', 'x-vercel-deployment-url', 'x-vercel-forwarded-for', 'x-forwarded-for', 'x-real-ip', 'x-forwarded-host', 'x-forwarded-proto']);
  const headers = {};
  for (const [k, v] of Object.entries(req.headers || {})) {
    if (!skip.has(k.toLowerCase())) headers[k] = v;
  }
  _recentAttempts.unshift({
    at:      new Date().toISOString(),
    result,                                       // 'accepted' | 'rejected:bad-signature' | 'rejected:no-secret' | 'rejected:no-ref'
    detail,                                       // free-text reason
    headers,
    body:    req.body || null,
  });
  if (_recentAttempts.length > 5) _recentAttempts.length = 5;
}
function getRecentAttempts() { return _recentAttempts; }
module.exports.getRecentAttempts = getRecentAttempts;

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
  // 1. Verify the secret (if configured)
  const expected   = process.env.KUDA_WEBHOOK_SECRET;
  const presented  = extractSignature(req.headers);
  // Discovery / bootstrap mode: when KUDA_WEBHOOK_ALLOW_UNVERIFIED=true is set
  // in Vercel env, we accept webhooks even when signature verification fails.
  // Use this ONLY long enough to see what Kuda actually sends (visible in the
  // diagnostic 'Recent webhook attempts' panel) so we can lock verification
  // down, then unset the flag.
  const allowUnverified = String(process.env.KUDA_WEBHOOK_ALLOW_UNVERIFIED || '').toLowerCase() === 'true';

  let signatureOk = false;
  if (expected && safeEqual(presented, expected)) signatureOk = true;

  if (!signatureOk) {
    const reason = !expected ? 'no-secret' : 'bad-signature';
    if (!allowUnverified) {
      console.warn(`[kuda-webhook] Rejected — ${reason}. Set KUDA_WEBHOOK_ALLOW_UNVERIFIED=true temporarily to bootstrap.`);
      recordAttempt(req, `rejected:${reason}`, !expected
        ? 'KUDA_WEBHOOK_SECRET env var not set on this deploy'
        : `Expected secret in header. Headers we look at: x-kuda-signature, kuda-signature, signature, x-webhook-secret. Got: "${(presented || '').slice(0, 20)}..."`);
      return res.status(!expected ? 503 : 401).json({ error: !expected ? 'Webhook not configured' : 'Invalid signature' });
    }
    // Discovery mode: log it loudly but continue
    console.warn(`[kuda-webhook] ACCEPTED UNVERIFIED (${reason}) — KUDA_WEBHOOK_ALLOW_UNVERIFIED=true. Lock this down once we know Kuda's auth model.`);
  }

  // 2. Pull the transaction out of the payload.
  const body    = req.body || {};
  const txData  = body.Data || body.data || body.transactionData || body;

  // 3. Only process credits
  const txType = String(txData.TransactionType || txData.transactionType || txData.type || 'credit').toLowerCase();
  if (txType && !txType.includes('credit') && txType !== 'c') {
    recordAttempt(req, 'accepted:ignored', `non-credit event (${txType}) — acknowledged without write`);
    return res.json({ ok: true, ignored: true, reason: `non-credit (${txType})` });
  }

  const t = normaliseTransaction(txData);
  if (!t.transaction_ref) {
    console.warn('[kuda-webhook] Skipped — no transaction reference in payload');
    recordAttempt(req, 'rejected:no-ref', 'no transaction reference field found in payload');
    return res.status(400).json({ error: 'Missing transaction reference' });
  }

  // 4. Idempotent insert
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

    const verifTag = signatureOk ? '' : ' (UNVERIFIED)';
    console.log(`[kuda-webhook] ${inserted ? 'inserted' : 'duplicate'}${verifTag} — ref=${t.transaction_ref} amount=${t.amount_ngn}`);
    recordAttempt(req, `accepted:${inserted ? 'inserted' : 'duplicate'}${signatureOk ? '' : ':unverified'}`, `ref=${t.transaction_ref} amount=₦${t.amount_ngn}${signatureOk ? '' : ' — accepted in discovery mode'}`);
    res.json({ ok: true, inserted });
  } catch (err) {
    console.error('[kuda-webhook] DB error:', err.message);
    recordAttempt(req, 'error:db', err.message);
    res.status(500).json({ error: 'Failed to persist webhook event' });
  }
});

module.exports = router;
module.exports.getRecentAttempts = getRecentAttempts;
