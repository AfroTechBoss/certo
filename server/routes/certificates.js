
// Certo — Certificate routes
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { adminAuth } = require('../adminAuth');
const logAdminAction = require('../logAdminAction');

function generateCertId(orderId, productIndex) {
  const parts  = (orderId || '').split('-');
  const suffix = parts.length >= 3 ? parts.slice(1).join('-') : orderId.slice(-8);
  const rand   = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CERT-${suffix}-P${productIndex}-${rand}`;
}

// ── Admin: list all certificates ─────────────────────────────────────────────
router.get('/', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.queryR(
      `SELECT * FROM certificates ORDER BY created_at DESC LIMIT 500`,
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /certificates:', err.message);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// ── Public: verify certificates for an order ──────────────────────────────────
// Only returns published certs, and only if the order status is 'Delivered'
router.get('/verify/:orderId', async (req, res) => {
  try {
    const orderId = (req.params.orderId || '').trim().toUpperCase();
    if (!orderId) return res.status(400).json({ error: 'Order ID required' });

    const { rows: orderRows } = await pool.queryR(
      `SELECT id, status, customer_name FROM orders WHERE id = $1`,
      [orderId],
    );
    if (!orderRows.length) return res.status(404).json({ error: 'Order not found' });
    if (orderRows[0].status !== 'Delivered') {
      return res.status(403).json({ error: 'Certificate is only available after delivery' });
    }

    const { rows } = await pool.queryR(
      `SELECT * FROM certificates WHERE order_id = $1 AND status = 'published' ORDER BY product_index ASC`,
      [orderId],
    );

    res.json({ order: orderRows[0], certificates: rows });
  } catch (err) {
    console.error('GET /certificates/verify/:orderId:', err.message);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// ── Admin: get single certificate ────────────────────────────────────────────
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.queryR(
      `SELECT * FROM certificates WHERE id = $1`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Certificate not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

// ── Admin: create certificate ─────────────────────────────────────────────────
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      order_id,
      product_index    = 0,
      product_name     = '',
      product_subtitle = '',
      variant_color,
      variant_storage,
      serial_number    = '',
      apple_order_ref  = '',
      chain_of_custody = [],
      status           = 'draft',
      recipient_name   = '',
      recipient_address= '',
      recipient_state  = '',
      usd_price        = 0,
      ngn_price        = 0,
      forex_rate       = 0,
    } = req.body;

    if (!order_id) return res.status(400).json({ error: 'order_id is required' });
    const orderId = order_id.trim().toUpperCase();

    // Check order exists
    const { rows: orderRows } = await pool.queryR(
      `SELECT id, customer_name, address, state, usd_price, ngn_price, forex_rate FROM orders WHERE id = $1`,
      [orderId],
    );
    if (!orderRows.length) return res.status(404).json({ error: 'Order not found' });

    // Prevent duplicate for same order+product_index (if already published)
    const { rows: existing } = await pool.queryR(
      `SELECT id, status FROM certificates WHERE order_id = $1 AND product_index = $2`,
      [orderId, product_index],
    );
    if (existing.length && existing[0].status === 'published') {
      return res.status(409).json({ error: 'A published certificate already exists for this product in this order' });
    }

    // Validate required fields if publishing
    if (status === 'published') {
      if (!serial_number.trim() || !apple_order_ref.trim() || !Array.isArray(chain_of_custody) || !chain_of_custody.length) {
        return res.status(400).json({ error: 'serial_number, apple_order_ref and chain_of_custody are required to publish' });
      }
    }

    const id          = generateCertId(orderId, product_index);
    const publishedAt = status === 'published' ? 'NOW()' : null;

    // Use order data as fallback for financial fields
    const order = orderRows[0];
    const finalUsd  = usd_price  || order.usd_price  || 0;
    const finalNgn  = ngn_price  || order.ngn_price  || 0;
    const finalRate = forex_rate || order.forex_rate  || 0;
    const finalRecipient = recipient_name    || order.customer_name || '';
    const finalAddress   = recipient_address || order.address       || '';
    const finalState     = recipient_state   || order.state         || '';

    const { rows } = await pool.queryR(`
      INSERT INTO certificates (
        id, order_id, product_index, product_name, product_subtitle,
        variant_color, variant_storage,
        serial_number, apple_order_ref, chain_of_custody,
        status, published_at,
        recipient_name, recipient_address, recipient_state,
        usd_price, ngn_price, forex_rate
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,
        $8,$9,$10::jsonb,
        $11, ${publishedAt ? 'NOW()' : 'NULL'},
        $12,$13,$14,
        $15,$16,$17
      ) RETURNING *
    `, [
      id, orderId, product_index, product_name, product_subtitle,
      variant_color || null, variant_storage || null,
      serial_number, apple_order_ref, JSON.stringify(Array.isArray(chain_of_custody) ? chain_of_custody : []),
      status,
      finalRecipient, finalAddress, finalState,
      finalUsd, finalNgn, finalRate,
    ]);

    await logAdminAction(
      req.adminName,
      status === 'published' ? 'Published certificate' : 'Created draft certificate',
      `${id} — order ${orderId} — ${product_name}`,
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /certificates:', err.message);
    res.status(500).json({ error: 'Failed to create certificate' });
  }
});

// ── Admin: update certificate ─────────────────────────────────────────────────
router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const { rows: cur } = await pool.queryR(
      `SELECT * FROM certificates WHERE id = $1`, [req.params.id],
    );
    if (!cur.length) return res.status(404).json({ error: 'Certificate not found' });
    const cert = cur[0];

    const newStatus = req.body.status;

    // Cannot re-publish an already-published cert
    if (newStatus === 'published' && cert.status === 'published') {
      return res.status(409).json({ error: 'Certificate has already been published and cannot be published again' });
    }

    // Validate required fields if publishing
    if (newStatus === 'published') {
      const serial = req.body.serial_number !== undefined ? req.body.serial_number : cert.serial_number;
      const ref    = req.body.apple_order_ref !== undefined ? req.body.apple_order_ref : cert.apple_order_ref;
      const coc    = req.body.chain_of_custody !== undefined ? req.body.chain_of_custody : cert.chain_of_custody;
      if (!serial?.trim() || !ref?.trim() || !coc?.length) {
        return res.status(400).json({ error: 'serial_number, apple_order_ref and chain_of_custody are required to publish' });
      }
    }

    const allowed = [
      'product_name', 'product_subtitle', 'serial_number', 'apple_order_ref',
      'chain_of_custody', 'status', 'variant_color', 'variant_storage',
      'recipient_name', 'recipient_address', 'recipient_state',
      'usd_price', 'ngn_price', 'forex_rate',
    ];
    const fields = Object.keys(req.body).filter(k => allowed.includes(k));
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

    const setters = fields.map((f, i) => {
      if (f === 'chain_of_custody') return `${f} = $${i + 1}::jsonb`;
      return `${f} = $${i + 1}`;
    });

    // If transitioning to published, set published_at
    const publishing = newStatus === 'published' && cert.status !== 'published';
    if (publishing) setters.push('published_at = NOW()');
    setters.push('updated_at = NOW()');

    const values = fields.map(f => {
      if (f === 'chain_of_custody') return JSON.stringify(req.body[f]);
      return req.body[f];
    });
    values.push(req.params.id);

    const { rows } = await pool.queryR(
      `UPDATE certificates SET ${setters.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values,
    );

    await logAdminAction(
      req.adminName,
      publishing ? 'Published certificate' : 'Updated certificate',
      `${req.params.id} — order ${cert.order_id}`,
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /certificates/:id:', err.message);
    res.status(500).json({ error: 'Failed to update certificate' });
  }
});

// ── Admin: delete certificate ─────────────────────────────────────────────────
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.queryR(
      `DELETE FROM certificates WHERE id = $1 RETURNING id, order_id`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Certificate not found' });
    await logAdminAction(req.adminName, 'Deleted certificate', `${rows[0].id} — order ${rows[0].order_id}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});

module.exports = router;
