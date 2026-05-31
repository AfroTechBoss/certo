require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const fs        = require('fs');
const crypto    = require('crypto');
const pool      = require('./db');
const { generateToken, parseAccounts } = require('./adminAuth');

const app  = express();
const PORT = process.env.PORT || 3000;

// CORS — only accept requests from the live site, preview domain, and local dev
const allowedOrigins = [
  'https://certo.ng',
  'https://www.certo.ng',
  'https://preview.certo.ng',
  'https://beta.certo.ng',
  'http://localhost:3000',
  'http://localhost:5173',
];
app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server (no origin) and known origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
}));

app.use(express.json());

// ── Rate limiting ────────────────────────────────────────────────────────────
// Login: 10 attempts per 15 min per IP — brute-force protection
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});
// General public endpoints: 60 req/min per IP
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Slow down.' },
});

// Admin login — validates password against ADMIN_ACCOUNTS (format: "Name:pass,Name2:pass2")
// Returns a signed 30-day token (name embedded) + the admin's display name
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  if (!process.env.ADMIN_SECRET)  return res.status(500).json({ error: 'ADMIN_SECRET not configured' });

  const accounts = parseAccounts();
  if (!accounts.length) return res.status(500).json({ error: 'ADMIN_ACCOUNTS not configured' });

  // Constant-time comparison to prevent timing-based enumeration
  let matchedName = null;
  for (const acct of accounts) {
    try {
      if (acct.password.length === password.length &&
          crypto.timingSafeEqual(Buffer.from(acct.password), Buffer.from(password))) {
        matchedName = acct.name;
        break;
      }
    } catch { /* length mismatch → skip */ }
  }

  if (!matchedName) return res.status(401).json({ error: 'Incorrect password' });

  // Fire-and-forget login log
  try {
    const logAdminAction = require('./logAdminAction');
    logAdminAction(matchedName, 'Signed in', '').catch(() => {});
  } catch(_) {}

  res.json({ token: generateToken(matchedName), name: matchedName });
});

// Serve Vite-built frontend
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// API routes — public routes get the general rate limiter
app.use('/api/products',      publicLimiter, require('./routes/products'));
app.use('/api/orders',        publicLimiter, require('./routes/orders'));
app.use('/api/coupons',       publicLimiter, require('./routes/coupons'));
app.use('/api/contact',       publicLimiter, require('./routes/contact'));
app.use('/api/certificates',  publicLimiter, require('./routes/certificates'));
app.use('/api/analytics',     publicLimiter, require('./routes/analytics'));
app.use('/api/admin/logs',    require('./routes/adminLog'));

// POST /api/admin/event  — lightweight client-side event logger
// The dashboard calls this for actions that happen entirely on the frontend
// (e.g. opening an order detail, overriding the forex rate)
const { adminAuth: _adminAuth } = require('./adminAuth');
const _logEvent = require('./logAdminAction');
app.post('/api/admin/event', _adminAuth, (req, res) => {
  const { action, details } = req.body;
  if (!action) return res.status(400).json({ error: 'action required' });
  _logEvent(req.adminName, action, details || '').catch(() => {});
  res.json({ ok: true });
});

// Health check — used by dashboard uptime monitor
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: Date.now() });
});

// Public config — exposes non-secret keys needed by the frontend
app.get('/api/config', (req, res) => {
  res.json({
    flutterwaveKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
    helioPayLink:   process.env.HELIO_PAY_LINK      || '',
    moonpayKey:     process.env.MOONPAY_PUBLIC_KEY  || '',
    moonpayWallet:  process.env.MOONPAY_WALLET      || '',
    moonpaySandbox: process.env.MOONPAY_SANDBOX !== 'false',
    testMode:       process.env.TEST_MODE === 'true',
  });
});

// ── Startup migrations ───────────────────────────────────────────────────────
// Idempotent — safe to run on every cold start; uses IF NOT EXISTS / IF NOT EXISTS column
async function runMigrations() {
  try {
    // Add status_timeline JSONB column to orders (tracks a timestamped log of every status change)
    await pool.queryR(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_timeline JSONB DEFAULT '[]'`);

    // Certificates table
    await pool.queryR(`
      CREATE TABLE IF NOT EXISTS certificates (
        id                TEXT PRIMARY KEY,
        order_id          TEXT NOT NULL,
        product_index     INTEGER NOT NULL DEFAULT 0,
        product_name      TEXT NOT NULL DEFAULT '',
        product_subtitle  TEXT DEFAULT '',
        variant_color     TEXT,
        variant_storage   TEXT,
        serial_number     TEXT NOT NULL DEFAULT '',
        apple_order_ref   TEXT NOT NULL DEFAULT '',
        chain_of_custody  JSONB NOT NULL DEFAULT '[]',
        status            TEXT NOT NULL DEFAULT 'draft',
        published_at      TIMESTAMPTZ,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        recipient_name    TEXT NOT NULL DEFAULT '',
        recipient_address TEXT NOT NULL DEFAULT '',
        recipient_state   TEXT NOT NULL DEFAULT '',
        usd_price         NUMERIC NOT NULL DEFAULT 0,
        ngn_price         NUMERIC NOT NULL DEFAULT 0,
        forex_rate        NUMERIC NOT NULL DEFAULT 0
      )
    `);

    // Analytics events table
    await pool.queryR(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id           BIGSERIAL PRIMARY KEY,
        event_type   VARCHAR(50)  NOT NULL,
        page         VARCHAR(500),
        product_id   VARCHAR(100),
        product_name VARCHAR(255),
        session_id   VARCHAR(100),
        country      VARCHAR(10),
        region       VARCHAR(100),
        city         VARCHAR(150),
        referrer     VARCHAR(500),
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await pool.queryR(`CREATE INDEX IF NOT EXISTS ae_created_idx  ON analytics_events (created_at DESC)`);
    await pool.queryR(`CREATE INDEX IF NOT EXISTS ae_type_idx     ON analytics_events (event_type)`);
    await pool.queryR(`CREATE INDEX IF NOT EXISTS ae_session_idx  ON analytics_events (session_id)`);
    await pool.queryR(`CREATE INDEX IF NOT EXISTS ae_page_idx     ON analytics_events (page)`);

    console.log('[migrations] ✓ schema up to date');
  } catch (err) {
    console.error('[migrations] error:', err.message);
  }
}
// Fire-and-forget on every cold start — idempotent so safe to run concurrently
runMigrations().catch(() => {});
// ─────────────────────────────────────────────────────────────────────────────

// ── Flutterwave ──────────────────────────────────────────────────────────────

// POST /api/flutterwave/verify — called by the frontend after Flutterwave fires the callback
// Verifies the transaction server-side with Flutterwave's API before promoting the order to confirmed
app.post('/api/flutterwave/verify', async (req, res) => {
  const { transaction_id, orderId } = req.body;
  if (!transaction_id || !orderId) return res.status(400).json({ error: 'Missing transaction_id or orderId' });

  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: 'Flutterwave secret key not configured' });

  try {
    const fRes = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transaction_id)}/verify`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const fData = await fRes.json();

    if (!fRes.ok || fData.status !== 'success' || fData.data?.status !== 'successful') {
      console.warn('[flutterwave] Verification failed for', transaction_id, JSON.stringify(fData?.data?.status));
      return res.status(402).json({ error: 'Payment not confirmed by Flutterwave', detail: fData?.data?.status });
    }

    // Payment verified — promote the order to confirmed + record timestamp in status_timeline
    const { rows } = await pool.queryR(
      `UPDATE orders
       SET status = 'Order Confirmed',
           status_timeline = COALESCE(status_timeline, '[]'::jsonb) ||
             jsonb_build_array(jsonb_build_object('status', 'Order Confirmed', 'timestamp', NOW()::text)),
           updated_at = NOW()
       WHERE id = $1 AND status = 'Payment Pending' RETURNING *`,
      [orderId],
    );

    if (!rows.length) {
      // Already confirmed (double-submit) — safe to treat as success
      return res.json({ ok: true, alreadyConfirmed: true });
    }

    const updated = rows[0];

    // Await the email before responding — on Vercel serverless, fire-and-forget is killed
    // when res.json() closes the response, so the email must complete inside the request lifecycle
    const { sendOrderConfirmation } = require('./email');
    try {
      await sendOrderConfirmation(updated);
      await pool.queryR('UPDATE orders SET email_sent = true WHERE id = $1', [orderId]);
      console.log('[flutterwave] Confirmation email sent for', orderId);
    } catch (err) {
      console.error('[email] confirmation failed for', orderId, ':', err.message);
      // Don't fail the response — payment is confirmed regardless of email
    }

    res.json({ ok: true, order: updated });
  } catch (err) {
    console.error('[flutterwave] verify error:', err.message);
    res.status(500).json({ error: 'Verification request failed' });
  }
});

// POST /api/flutterwave/webhook — Flutterwave server-to-server event notification
// Acts as a redundant confirmation path alongside the frontend verify call
app.post('/api/flutterwave/webhook', express.json(), async (req, res) => {
  // Validate the secret hash sent in the verif-hash header
  const hash       = req.headers['verif-hash'];
  const secretHash = process.env.FLW_SECRET_HASH;
  // Reject if secret is not configured OR hash doesn't match — never accept unsigned webhooks
  if (!secretHash || hash !== secretHash) {
    console.warn('[flutterwave] Webhook rejected — hash missing or mismatch');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = req.body;
  if (event?.event === 'charge.completed' && event?.data?.status === 'successful') {
    // tx_ref format: "CRT-MMDDYY-NNNN-timestamp" — extract the orderId (first 3 segments)
    const txRef  = event?.data?.tx_ref || '';
    const parts  = txRef.split('-');
    const orderId = parts.length >= 3 ? parts.slice(0, 3).join('-') : txRef;

    if (orderId) {
      try {
        // Only promotes if still Payment Pending — idempotent if already confirmed by frontend
        const { rows } = await pool.queryR(
          `UPDATE orders
           SET status = 'Order Confirmed',
               status_timeline = COALESCE(status_timeline, '[]'::jsonb) ||
                 jsonb_build_array(jsonb_build_object('status', 'Order Confirmed', 'timestamp', NOW()::text)),
               updated_at = NOW()
           WHERE id = $1 AND status = 'Payment Pending' RETURNING *`,
          [orderId],
        );
        if (rows.length) {
          const { sendOrderConfirmation } = require('./email');
          try {
            await sendOrderConfirmation(rows[0]);
            await pool.queryR('UPDATE orders SET email_sent = true WHERE id = $1', [orderId]);
            console.log('[flutterwave] Webhook confirmed order + email sent for', orderId);
          } catch (err) {
            console.error('[email] webhook confirmation failed for', orderId, ':', err.message);
          }
        }
      } catch (err) {
        console.error('[flutterwave] Webhook DB error:', err.message);
      }
    }
  }

  res.json({ ok: true }); // always 200 so Flutterwave doesn't retry
});
// ─────────────────────────────────────────────────────────────────────────────

// MoonPay URL signing — signs the widget query string with HMAC-SHA256 using the secret key
// The secret key never leaves the server; only the resulting signature is returned
app.get('/api/moonpay-sign', (req, res) => {
  const qs = req.query.query; // full query string, e.g. "?apiKey=...&currencyCode=..."
  if (!qs) return res.status(400).json({ error: 'Missing query string' });
  const secret = process.env.MOONPAY_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: 'MoonPay not configured' });
  const signature = crypto.createHmac('sha256', secret).update(qs).digest('base64');
  res.json({ signature });
});

// Image proxy — proxies any https:// image URL; adds Apple Referer for Apple CDN URLs
// In-memory cache: avoids re-fetching on every request / server restart
const imgCache = new Map(); // normalizedUrl → { buf, ct, ts }
const IMG_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

app.get('/api/img', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('https://')) {
    return res.status(400).end();
  }

  const isAppleCDN = url.startsWith('https://store.storeimages.cdn-apple.com');

  // For Apple CDN images: strip ALL query params (fmt=webp / traceId cause 404s)
  // and request a clean 800px JPEG — works reliably across all Apple Scene7 URLs
  let fetchUrl;
  if (isAppleCDN) {
    try {
      const u = new URL(url);
      u.search = '';
      u.searchParams.set('wid', '800');
      u.searchParams.set('hei', '800');
      u.searchParams.set('fmt', 'jpeg');
      fetchUrl = u.toString();
    } catch (_) {
      fetchUrl = url;
    }
  } else {
    fetchUrl = url;
  }

  const cached = imgCache.get(fetchUrl);
  if (cached && Date.now() - cached.ts < IMG_CACHE_TTL) {
    res.setHeader('Content-Type', cached.ct);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    return res.end(cached.buf);
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept':     'image/webp,image/apng,image/*,*/*;q=0.8',
    };
    // Apple CDN blocks hotlinks without a Referer from apple.com
    if (isAppleCDN) headers['Referer'] = 'https://www.apple.com/';

    const upstream = await fetch(fetchUrl, { headers, signal: AbortSignal.timeout(10000) });
    if (!upstream.ok) return res.status(upstream.status).end();
    const ct  = upstream.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await upstream.arrayBuffer());
    imgCache.set(fetchUrl, { buf, ct, ts: Date.now() });
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.end(buf);
  } catch (err) {
    res.status(502).end();
  }
});

// Forex proxy — avoid CORS issues from client
// Tries multiple free APIs in order; falls back to a hardcoded rate so it never 500s
const FOREX_APIS = [
  // Open ER-API — free, no key, reliable v6 endpoint
  { url: 'https://open.er-api.com/v6/latest/USD', extract: d => d?.rates?.NGN },
  // ExchangeRate-API v4 — free open access, no key needed
  { url: 'https://api.exchangerate-api.com/v4/latest/USD', extract: d => d?.rates?.NGN },
  // Fawaz Ahmed's free CDN-backed rates
  { url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', extract: d => d?.usd?.ngn },
];
// Hardcoded last-resort — keeps the UI functional even when all live APIs are down.
// Update this periodically to stay approximate.
const FOREX_FALLBACK = 1680;

app.get('/api/forex', async (req, res) => {
  for (const { url, extract } of FOREX_APIS) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!resp.ok) continue;
      const data = await resp.json();
      const ngn  = extract(data);
      if (ngn && Number(ngn) > 0) {
        return res.json({ rate: Math.round(Number(ngn)) + 100 });
      }
    } catch (err) {
      console.warn('[forex] API failed:', url, err.message);
    }
  }
  // All live APIs failed — serve the hardcoded fallback rather than a 500
  console.warn('[forex] All APIs failed — serving hardcoded fallback rate', FOREX_FALLBACK);
  res.json({ rate: FOREX_FALLBACK, fallback: true });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.queryR('SELECT 1');
    res.json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// /product/:id — inject OG meta tags into index.html for social link previews
// Crawlers see image/title; browsers load the SPA and React navigates to the product
app.get('/product/:id', async (req, res) => {
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  try {
    const { rows } = await pool.queryR(
      'SELECT id, name, subtitle, image_urls, category, usd_price FROM products WHERE id = $1',
      [req.params.id],
    );
    const p = rows[0];
    if (!p) return res.sendFile(indexPath);

    const rawImg = (p.image_urls && p.image_urls[0]) || '';
    const image  = rawImg ? rawImg.replace(/[&?]\.v=[^&]*/, '') : 'https://certo.ng/logo.png';
    const title  = p.name + (p.subtitle ? ` – ${p.subtitle}` : '');
    const desc   = `Buy genuine ${p.name} from Apple US, delivered to Nigeria. $${Number(p.usd_price).toLocaleString()} USD. Serial verified. Full Apple warranty.`;
    const url    = `https://certo.ng/product/${p.id}`;

    const ogTags = [
      `<title>${title} | Certo</title>`,
      `<meta name="description" content="${desc}"/>`,
      `<meta property="og:type"         content="product"/>`,
      `<meta property="og:url"          content="${url}"/>`,
      `<meta property="og:title"        content="${title} | Certo"/>`,
      `<meta property="og:description"  content="${desc}"/>`,
      `<meta property="og:image"        content="${image}"/>`,
      `<meta property="og:image:width"  content="800"/>`,
      `<meta property="og:image:height" content="800"/>`,
      `<meta name="twitter:card"        content="summary_large_image"/>`,
      `<meta name="twitter:title"       content="${title} | Certo"/>`,
      `<meta name="twitter:description" content="${desc}"/>`,
      `<meta name="twitter:image"       content="${image}"/>`,
    ].join('\n  ');

    const html = fs.readFileSync(indexPath, 'utf8').replace('</head>', `  ${ogTags}\n</head>`);
    res.send(html);
  } catch (err) {
    res.sendFile(indexPath);
  }
});

// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// On Vercel: export the app for serverless invocation (no persistent process)
// Locally: start the HTTP server and keep the DB warm with periodic pings
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`Certo server running on http://localhost:${PORT}`);
    setInterval(() => {
      pool.queryR('SELECT 1').catch(() => {});
    }, 4 * 60 * 1000);
  });
}
