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

// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Certo server running on http://localhost:${PORT}`);
});
