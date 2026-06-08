// ─── PII redaction helpers (server-side logging) ─────────────────────────────
//
// Server logs end up in Vercel's log aggregator, GitHub Actions, and any
// downstream tooling. Never log raw emails, phones, or addresses in production.
// Use these helpers when you need a log line that identifies a user without
// leaking their data.

// "adaeze@example.com" → "ad***@example.com"
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

// "+2348001234567" → "+234***4567"
function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '***';
  return phone.slice(0, 4) + '***' + digits.slice(-4);
}

// Strip PII fields from any object before logging. Returns a shallow copy.
// Useful when logging request bodies for debugging.
function redact(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const SENSITIVE = ['customer_email', 'email', 'customer_phone', 'phone',
                     'customer_name', 'name', 'address', 'password', 'account_number'];
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE.includes(k)) out[k] = '[redacted]';
    else out[k] = v;
  }
  return out;
}

module.exports = { maskEmail, maskPhone, redact };
