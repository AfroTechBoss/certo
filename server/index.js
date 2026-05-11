require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const pool     = require('./db');
const { generateToken, parseAccounts } = require('./adminAuth');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Admin login — validates password against ADMIN_ACCOUNTS (format: "Name:pass,Name2:pass2")
// Returns a signed 30-day token (name embedded) + the admin's display name
app.post('/api/admin/login', (req, res) => {
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

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..')));

// API routes
app.use('/api/products',    require('./routes/products'));
app.use('/api/orders',      require('./routes/orders'));
app.use('/api/coupons',     require('./routes/coupons'));
app.use('/api/contact',     require('./routes/contact'));
app.use('/api/admin/logs',  require('./routes/adminLog'));

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

    // Payment verified — promote the order to confirmed
    const { rows } = await pool.queryR(
      `UPDATE orders SET status = 'Order Confirmed', updated_at = NOW() WHERE id = $1 AND status = 'Payment Pending' RETURNING *`,
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
  if (secretHash && hash !== secretHash) {
    console.warn('[flutterwave] Webhook hash mismatch — ignoring');
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
          `UPDATE orders SET status = 'Order Confirmed', updated_at = NOW() WHERE id = $1 AND status = 'Payment Pending' RETURNING *`,
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

// Image proxy — Apple CDN requires apple.com Referer; we proxy to avoid hotlink blocks
// In-memory cache: avoids re-fetching from Apple on every request / server restart
const imgCache = new Map(); // normalizedUrl → { buf, ct, ts }
const IMG_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

app.get('/api/img', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('https://store.storeimages.cdn-apple.com')) {
    return res.status(400).end();
  }

  // Downscale to 400×400 — cards only need ~300px; product page uses 600px but still fine
  const fetchUrl = url
    .replace(/wid=\d+/, 'wid=400')
    .replace(/hei=\d+/, 'hei=400');

  const cached = imgCache.get(fetchUrl);
  if (cached && Date.now() - cached.ts < IMG_CACHE_TTL) {
    res.setHeader('Content-Type', cached.ct);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    return res.end(cached.buf);
  }

  try {
    const upstream = await fetch(fetchUrl, {
      headers: {
        'Referer':    'https://www.apple.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept':     'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });
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
app.get('/api/forex', async (req, res) => {
  try {
    const resp = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await resp.json();
    const ngn  = data?.rates?.NGN;
    if (!ngn) throw new Error('No NGN rate');
    res.json({ rate: Math.round(ngn) + 100 });
  } catch (err) {
    res.status(500).json({ error: 'Forex fetch failed', rate: null });
  }
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
  const indexPath = path.join(__dirname, '..', 'index.html');
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
  res.sendFile(path.join(__dirname, '..', 'index.html'));
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
