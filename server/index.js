require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const pool     = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..')));

// API routes
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));

// Public config — exposes non-secret keys needed by the frontend
app.get('/api/config', (req, res) => {
  res.json({
    paystackKey:  process.env.PAYSTACK_PUBLIC_KEY || '',
    helioPayLink: process.env.HELIO_PAY_LINK      || '',
    testMode:     process.env.TEST_MODE === 'true',
  });
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

// /product/:id — server-rendered shell with OG meta tags for link previews
// Social crawlers see the correct image/title; browsers get a JS redirect to /#/product/:id
app.get('/product/:id', async (req, res) => {
  try {
    const { rows } = await pool.queryR(
      'SELECT id, name, subtitle, image_urls, category, usd_price FROM products WHERE id = $1',
      [req.params.id],
    );
    const p = rows[0];
    if (!p) return res.redirect('/#/shop');

    const rawImg = (p.image_urls && p.image_urls[0]) || '';
    const image  = rawImg ? rawImg.replace(/[&?]\.v=[^&]*/, '') : 'https://certo.ng/logo.png';
    const title  = p.name + (p.subtitle ? ` – ${p.subtitle}` : '');
    const desc   = `Buy genuine ${p.name} from Apple US, delivered to Nigeria. $${Number(p.usd_price).toLocaleString()} USD. Serial verified. Full Apple warranty.`;
    const url    = `https://certo.ng/product/${p.id}`;
    const hashUrl = `https://certo.ng/#/product/${encodeURIComponent(p.id)}`;

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title} | Certo</title>
  <meta name="description" content="${desc}"/>
  <meta property="og:type"        content="product"/>
  <meta property="og:url"         content="${url}"/>
  <meta property="og:title"       content="${title} | Certo"/>
  <meta property="og:description" content="${desc}"/>
  <meta property="og:image"       content="${image}"/>
  <meta property="og:image:width"  content="800"/>
  <meta property="og:image:height" content="800"/>
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${title} | Certo"/>
  <meta name="twitter:description" content="${desc}"/>
  <meta name="twitter:image"       content="${image}"/>
  <meta http-equiv="refresh" content="0;url=${hashUrl}"/>
  <script>window.location.replace('${hashUrl}');</script>
</head>
<body style="background:#faf9f7;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;color:#706b60">Redirecting…</div>
</body>
</html>`);
  } catch (err) {
    res.redirect('/#/shop');
  }
});

// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Certo server running on http://localhost:${PORT}`);

  // Ping the DB every 4 minutes to prevent Neon auto-suspend cold starts
  setInterval(() => {
    pool.queryR('SELECT 1').catch(() => {});
  }, 4 * 60 * 1000);
});
