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
app.get('/api/img', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('https://store.storeimages.cdn-apple.com')) {
    return res.status(400).end();
  }
  try {
    const upstream = await fetch(url, {
      headers: {
        'Referer':    'https://www.apple.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept':     'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });
    if (!upstream.ok) return res.status(upstream.status).end();
    const ct  = upstream.headers.get('content-type') || 'image/jpeg';
    const buf = await upstream.arrayBuffer();
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 24 h in browser
    res.end(Buffer.from(buf));
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
    await pool.query('SELECT 1');
    res.json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// /product/:id — server-rendered shell with OG meta tags for link previews
// Social crawlers see the correct image/title; browsers get a JS redirect to /#/product/:id
app.get('/product/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
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
});
