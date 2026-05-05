// Admin authentication helpers
// Token format: "<expiry_ms>.<hmac_sha256_hex>"
// Stateless — works on Vercel serverless (no in-memory sessions needed)

const crypto = require('crypto');

function _sign(expiry) {
  return crypto
    .createHmac('sha256', process.env.ADMIN_SECRET || '')
    .update(String(expiry))
    .digest('hex');
}

function generateToken() {
  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  return `${expiry}.${_sign(expiry)}`;
}

function verifyToken(token) {
  if (!token || !process.env.ADMIN_SECRET) return false;
  const dot = token.indexOf('.');
  if (dot === -1) return false;
  const expiry = token.slice(0, dot);
  const sig    = token.slice(dot + 1);
  if (Date.now() > parseInt(expiry, 10)) return false; // expired
  const expected = _sign(expiry);
  try {
    // timingSafeEqual prevents timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(sig.padEnd(64, '0'), 'hex'),
      Buffer.from(expected.padEnd(64, '0'), 'hex'),
    ) && sig === expected;
  } catch { return false; }
}

// Express middleware — attach to any route that should be admin-only
function adminAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

module.exports = { adminAuth, generateToken, verifyToken };
