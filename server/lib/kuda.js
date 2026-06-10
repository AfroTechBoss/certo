// ─── Kuda Business Open API client ───────────────────────────────────────────
//
// Documentation: https://kudabank.gitbook.io/kudabank-api/
//
// The Open API is a single endpoint that dispatches on a `ServiceType` string.
// Two we use:
//   - ADMIN_LOGIN            → exchange (email + apiKey) for a JWT
//   - ADMIN_MAIN_ACCOUNT_TRANSACTIONS → list main-account transactions
//
// Token caching: the JWT lives in memory for ~50 min (Kuda issues ~60-min
// tokens). On Vercel's Fluid Compute the same function instance can serve
// many requests, so this saves a round trip per sync. Cold start = fresh token.
//
// Required env:
//   KUDA_EMAIL         the email on your Kuda Business account
//   KUDA_API_KEY       generated in Kuda dashboard → Developer
//   KUDA_TRACKING_REF  tracking reference for the main account
//   KUDA_BASE_URL      (optional) override; defaults to live URL below.
//                      Sandbox: https://kuda-openapi-uat.kudabank.com/v2.1
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');

const DEFAULT_BASE = 'https://kuda-openapi.kuda.com/v2.1';
const TOKEN_TTL_MS = 50 * 60 * 1000; // refresh shortly before Kuda's 60-min expiry

let _cachedToken = null;
let _cachedExpiry = 0;

function _baseUrl() {
  return (process.env.KUDA_BASE_URL || DEFAULT_BASE).replace(/\/+$/, '');
}

function _newRequestRef() {
  // Kuda requires a unique-per-request reference. Their docs say 10–16 digits.
  return crypto.randomInt(1_000_000_000, 9_999_999_999).toString();
}

// Low-level: POST to the single Open API endpoint with a ServiceType + data
async function _call(serviceType, data = {}, token = null) {
  const body = {
    ServiceType: serviceType,
    RequestRef: _newRequestRef(),
    Data: data,
  };
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(_baseUrl() + '/', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  // Kuda returns JSON even on errors — try to parse, fall back to status text
  let json;
  try { json = await res.json(); }
  catch (_) { throw new Error(`Kuda ${serviceType}: HTTP ${res.status} (non-JSON response)`); }

  if (!res.ok || json.Status === false || json.status === false) {
    const msg = json.Message || json.message || `HTTP ${res.status}`;
    throw new Error(`Kuda ${serviceType}: ${msg}`);
  }
  return json;
}

// Get + cache the JWT.
// CRITICAL: Kuda's auth flow is NOT the dispatcher pattern. It has its own
// endpoint /Account/GetToken that takes { email, apiKey } directly (no
// ServiceType wrapper). Only post-login calls go through the dispatcher.
// Earlier versions of this client tried to log in via the dispatcher with
// ServiceType: 'ADMIN_LOGIN', which Kuda rejects as 401 + HTML error page.
async function getToken() {
  const now = Date.now();
  if (_cachedToken && now < _cachedExpiry) return _cachedToken;

  const email  = process.env.KUDA_EMAIL;
  const apiKey = process.env.KUDA_API_KEY;
  if (!email || !apiKey) {
    throw new Error('Kuda credentials missing (set KUDA_EMAIL + KUDA_API_KEY in env)');
  }

  const res = await fetch(_baseUrl() + '/Account/GetToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, apiKey }),
  });

  const text = (await res.text()).trim();

  // Kuda's live API returns the JWT as a PLAIN STRING body — not JSON.
  // (Their docs and Postman collection wrap it in JSON; the live endpoint
  //  does not. Confirmed against a real live account on 2026-06-09.)
  // A JWT is three base64url segments separated by dots, starting with eyJ.
  if (/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(text)) {
    if (!res.ok) throw new Error(`Kuda /Account/GetToken: HTTP ${res.status} (token-shaped body but error status)`);
    _cachedToken  = text;
    _cachedExpiry = now + TOKEN_TTL_MS;
    return text;
  }

  // Older / sandbox-region shape: JSON wrapper around the token.
  let json;
  try { json = JSON.parse(text); }
  catch (_) {
    const snippet = text.slice(0, 120).replace(/\s+/g, ' ');
    throw new Error(`Kuda /Account/GetToken: HTTP ${res.status} (unexpected body: "${snippet}…")`);
  }

  if (!res.ok || json.status === false || json.Status === false) {
    const msg = json.message || json.Message || `HTTP ${res.status}`;
    throw new Error(`Kuda /Account/GetToken: ${msg}`);
  }

  const token =
    json?.data?.token ||
    json?.Data?.token ||
    json?.token ||
    json?.access_token;
  if (!token) throw new Error('Kuda /Account/GetToken succeeded but no token in response');

  _cachedToken  = token;
  _cachedExpiry = now + TOKEN_TTL_MS;
  return token;
}

// Fetch the main-account balance.
// Service type confirmed by Kuda API team: ADMIN_RETRIEVE_MAIN_ACCOUNT_BALANCE.
// The 'ADMIN' prefix means it operates on the admin's main account implicitly,
// so no tracking reference / account number is required in the data block.
// Returns ledger + available balance in NGN (after kobo→naira conversion).
async function getMainAccountBalance() {
  const token = await getToken();
  const json  = await _call('ADMIN_RETRIEVE_MAIN_ACCOUNT_BALANCE', {}, token);

  // Tolerate capitalisation drift between docs and live API
  const d = json?.Data || json?.data || json || {};
  const koboToNgn = (v) => (v === undefined || v === null) ? null : Number(v) / 100;
  return {
    ledgerBalance:    koboToNgn(d.ledgerBalance    ?? d.LedgerBalance),
    availableBalance: koboToNgn(d.availableBalance ?? d.AvailableBalance),
    withdrawableBalance: koboToNgn(d.withdrawableBalance ?? d.WithdrawableBalance),
    raw: json,
  };
}

// Fetch incoming credit transactions for the main account between two timestamps.
// Service type confirmed by Kuda API team: ADMIN_ACCOUNT_INFLOW.
// Returns only credits (Kuda has a separate ADMIN_ACCOUNT_OUTFLOW for debits).
async function getCreditTransactions({ startDate, endDate, pageSize = 100 } = {}) {
  const token = await getToken();

  // Dates in Kuda's docs are 'YYYY-MM-DD HH:mm:ss' (UTC).
  const toKudaDate = (d) => {
    const dt = (d instanceof Date) ? d : new Date(d);
    return dt.toISOString().slice(0, 19).replace('T', ' ');
  };

  const json = await _call('ADMIN_ACCOUNT_INFLOW', {
    StartDate:  toKudaDate(startDate),
    EndDate:    toKudaDate(endDate),
    PageNumber: 1,
    PageSize:   pageSize,
  }, token);

  // Response shape varies — try the common Kuda transaction array keys
  const list =
    json?.Data?.accountInflowTransactions   ||
    json?.data?.accountInflowTransactions   ||
    json?.Data?.transactions                ||
    json?.data?.transactions                ||
    json?.Data?.mainAccountTransactions     ||
    json?.data?.mainAccountTransactions     ||
    (Array.isArray(json?.Data) ? json.Data : null) ||
    (Array.isArray(json?.data) ? json.data : null) ||
    [];

  // ADMIN_ACCOUNT_INFLOW already returns credits only, but defensive filter
  // (in case Kuda mixes types in the future or returns empty/odd records)
  const credits = list.filter(t => {
    const type = (t.transactionType || t.TransactionType || t.type || 'credit').toString().toLowerCase();
    return !type || type.includes('credit') || type === 'c';
  });

  return credits.map(normaliseTransaction);
}

// Normalise a Kuda transaction record to our canonical shape used by the DB.
// Kuda's field names aren't consistent across the docs vs the live API, so
// we try both Camel and Pascal versions of each field.
//
// IMPORTANT: Kuda sends monetary values in KOBO (1 NGN = 100 kobo), the same
// convention Flutterwave and Paystack use. We divide by 100 so the DB stores
// values in NGN — confirmed empirically: a ₦100 test transfer arrived as
// 10000 and was displayed as ₦10,000 before this fix.
function normaliseTransaction(t) {
  const pick = (...keys) => {
    for (const k of keys) {
      if (t[k] !== undefined && t[k] !== null && t[k] !== '') return t[k];
    }
    return null;
  };
  const koboToNgn = (raw) => raw === null ? null : Number(raw) / 100;
  return {
    transaction_ref: String(pick('transactionReference', 'TransactionReference', 'reference', 'Reference') || ''),
    amount_ngn:      koboToNgn(pick('amount', 'Amount', 'transactionAmount')) || 0,
    narration:       String(pick('narration', 'Narration', 'remarks', 'Remarks') || ''),
    sender_name:     String(pick('senderName', 'SenderName', 'originatorName') || ''),
    sender_account:  String(pick('senderAccount', 'SenderAccount', 'originatorAccountNumber') || ''),
    sender_bank:     String(pick('senderBank', 'SenderBank', 'originatorBank') || ''),
    balance_after:   koboToNgn(pick('balance', 'Balance', 'balanceAfter')),
    transaction_at:  new Date(pick('transactionDate', 'TransactionDate', 'date') || Date.now()),
    raw:             t,
  };
}

module.exports = {
  getToken,
  getCreditTransactions,
  getMainAccountBalance,
  // Exposed for tests/dev — never call directly in routes
  _internals: { normaliseTransaction },
};
