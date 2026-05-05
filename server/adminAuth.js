// Admin authentication helpers
// Token format: "{expiry}.{base64url(name)}.{hmac_sha256_hex}"
// Stateless — the name is embedded and signed, works on Vercel serverless

const crypto = require('crypto');

const b64enc = (s) => Buffer.from(s).toString('base64url');
const b64dec = (s) => { try { return Buffer.from(s, 'base64url').toString('utf8'); } catch { return ''; } };

function _sign(payload) {
  return crypto
    .createHmac('sha256', process.env.ADMIN_SECRET || '')
    .update(payload)
    .digest('hex');
}

// Generate a 30-day signed token that carries the admin's name
function generateToken(name) {
  const expiry  = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const encoded = b64enc(name || 'Admin');
  const payload = `${expiry}.${encoded}`;
  return `${payload}.${_sign(payload)}`;
}

// Verify token and return { name } on success, or null on failure
function verifyToken(token) {
  if (!token || !process.env.ADMIN_SECRET) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [expiry, encoded, sig] = parts;
  if (Date.now() > parseInt(expiry, 10)) return null; // expired
  const payload  = `${expiry}.${encoded}`;
  const expected = _sign(payload);
  try {
    const valid = crypto.timingSafeEqual(
      Buffer.from(sig,      'hex'),
      Buffer.from(expected, 'hex'),
    );
    if (!valid) return null;
  } catch { return null; }
  return { name: b64dec(encoded) };
}

// Express middleware — protects admin routes and exposes req.adminName
function adminAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : '';
  const result = verifyToken(token);
  if (!result) return res.status(401).json({ error: 'Unauthorized' });
  req.adminName = result.name;
  next();
}

// Parse ADMIN_ACCOUNTS env var: "Chidile:pass1,Emmanuella:pass2"
function parseAccounts() {
  return (process.env.ADMIN_ACCOUNTS || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)
    .map(e => {
      const idx = e.indexOf(':');
      if (idx === -1) return null;
      return { name: e.slice(0, idx).trim(), password: e.slice(idx + 1) };
    })
    .filter(Boolean);
}

module.exports = { adminAuth, generateToken, verifyToken, parseAccounts };
