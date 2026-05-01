const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { sendOrderConfirmation, sendStatusUpdate } = require('../email');

function generateOrderId() {
  const now  = new Date();
  const mmdd = String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `CRT-${mmdd}${now.getFullYear().toString().slice(2)}-${rand}`;
}

// POST /api/orders  (create new order)
router.post('/', async (req, res) => {
  const {
    customer_name, customer_email, customer_phone,
    address, state,
    product_id, product_name, product_subtitle, product_image_url, apple_url,
    applecare,
    qty,
    usd_price, ngn_price, forex_rate,
  } = req.body;

  if (!customer_name || !customer_email || !customer_phone || !address || !product_name || !usd_price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = generateOrderId();

  try {
    const { rows } = await pool.query(`
      INSERT INTO orders (
        id, customer_name, customer_email, customer_phone,
        address, state,
        product_id, product_name, product_subtitle, product_image_url, apple_url,
        applecare, qty, usd_price, ngn_price, forex_rate
      ) VALUES (
        $1,$2,$3,$4,
        $5,$6,
        $7,$8,$9,$10,$11,
        $12,$13,$14,$15,$16
      ) RETURNING *
    `, [
      id, customer_name, customer_email, customer_phone,
      address, state,
      product_id, product_name, product_subtitle, product_image_url, apple_url,
      applecare || 'none', qty || 1, usd_price, ngn_price, forex_rate,
    ]);

    const order = rows[0];

    // Send confirmation email (non-blocking)
    sendOrderConfirmation(order)
      .then(() => pool.query('UPDATE orders SET email_sent = true WHERE id = $1', [id]))
      .catch(err => console.error('Email send failed for', id, ':', err.message));

    res.status(201).json({ id: order.id, order });
  } catch (err) {
    console.error('POST /orders:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders  (admin — all orders)
router.get('/', async (req, res) => {
  try {
    const { status, flagged, search, timeframe, limit = 200 } = req.query;
    let q = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      if (status === 'open') {
        q += ` AND status NOT IN ('Delivered', 'Cancelled')`;
      } else {
        params.push(status);
        q += ` AND status = $${params.length}`;
      }
    }
    if (flagged === 'true') {
      q += ' AND flagged = true';
    }
    if (search) {
      params.push(`%${search}%`);
      const n = params.length;
      q += ` AND (id ILIKE $${n} OR customer_name ILIKE $${n} OR customer_phone ILIKE $${n} OR address ILIKE $${n} OR product_name ILIKE $${n})`;
    }
    if (timeframe && timeframe !== 'all') {
      const intervals = {
        today:  '1 day',
        week:   '7 days',
        month:  '30 days',
        year:   '365 days',
      };
      if (intervals[timeframe]) {
        q += ` AND created_at >= NOW() - INTERVAL '${intervals[timeframe]}'`;
      }
    }

    q += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/stats  (admin revenue stats)
router.get('/stats', async (req, res) => {
  try {
    const { timeframe } = req.query;
    let where = '1=1';
    if (timeframe && timeframe !== 'all') {
      const intervals = { today: '1 day', week: '7 days', month: '30 days', year: '365 days' };
      if (intervals[timeframe]) where = `created_at >= NOW() - INTERVAL '${intervals[timeframe]}'`;
    }

    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int                                    AS total_orders,
        COUNT(*) FILTER (WHERE status != 'Delivered' AND status != 'Cancelled')::int AS active_orders,
        COUNT(*) FILTER (WHERE status = 'Delivered')::int AS delivered,
        COUNT(*) FILTER (WHERE flagged = true)::int      AS flagged,
        COALESCE(SUM(usd_price), 0)::numeric             AS revenue_usd,
        COALESCE(SUM(ngn_price), 0)::numeric             AS revenue_ngn,
        COALESCE(AVG(usd_price), 0)::numeric             AS avg_order_usd,
        COALESCE(AVG(ngn_price), 0)::numeric             AS avg_order_ngn
      FROM orders WHERE ${where}
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /orders/stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/orders/:id  (public — order tracking)
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, customer_name, product_name, product_subtitle, product_image_url,
              status, created_at, updated_at, applecare, qty
       FROM orders WHERE id = $1`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /orders/:id:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PATCH /api/orders/:id  (admin — update status, flag, notes)
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['status', 'flagged', 'flag_reason', 'notes'];
    const fields  = Object.keys(req.body).filter(k => allowed.includes(k));
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

    // Fetch previous status before update (to detect status changes)
    const prevResult = await pool.query('SELECT status FROM orders WHERE id = $1', [req.params.id]);
    const prevStatus = prevResult.rows[0]?.status;

    const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values = fields.map(f => req.body[f]);
    values.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE orders SET ${setClauses}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values,
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });

    const updated = rows[0];

    // Send status-change email for key milestones (non-blocking)
    const emailStatuses = ['Arrived in Nigeria', 'Out for Delivery', 'Delivered'];
    if (req.body.status && req.body.status !== prevStatus && emailStatuses.includes(req.body.status)) {
      sendStatusUpdate(updated)
        .catch(err => console.error('Status email failed for', updated.id, ':', err.message));
    }

    res.json(updated);
  } catch (err) {
    console.error('PATCH /orders/:id:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

module.exports = router;
