const express        = require('express');
const router         = express.Router();
const pool           = require('../db');
const { adminAuth }  = require('../adminAuth');
const logAdminAction = require('../logAdminAction');

// GET /api/refunds  (admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.queryR(
      `SELECT * FROM refunds ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /refunds:', err.message);
    res.status(500).json({ error: 'Failed to fetch refunds' });
  }
});

// POST /api/refunds  (admin — create)
router.post('/', adminAuth, async (req, res) => {
  const {
    order_id, customer_name, customer_email, customer_phone,
    product_name, amount_ngn, amount_usd, reason, status,
    payment_method, bank_name, account_number, account_name, notes,
  } = req.body;

  if (!customer_name) return res.status(400).json({ error: 'customer_name required' });

  try {
    const { rows } = await pool.queryR(
      `INSERT INTO refunds
         (order_id, customer_name, customer_email, customer_phone,
          product_name, amount_ngn, amount_usd, reason, status,
          payment_method, bank_name, account_number, account_name, notes, issued_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        order_id || '', customer_name.trim(),
        customer_email || '', customer_phone || '',
        product_name || '',
        Number(amount_ngn) || 0, Number(amount_usd) || 0,
        reason || '', status || 'pending',
        payment_method || 'Bank Transfer',
        bank_name || '', account_number || '', account_name || '',
        notes || '', req.adminName,
      ],
    );
    await logAdminAction(
      req.adminName, 'Created refund',
      `${customer_name}${order_id ? ` (Order ${order_id})` : ''} — ₦${Number(amount_ngn)||0}`,
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /refunds:', err.message);
    res.status(500).json({ error: 'Failed to create refund' });
  }
});

// PATCH /api/refunds/:id  (admin — update)
router.patch('/:id', adminAuth, async (req, res) => {
  const allowed = [
    'order_id', 'customer_name', 'customer_email', 'customer_phone',
    'product_name', 'amount_ngn', 'amount_usd', 'reason', 'status',
    'payment_method', 'bank_name', 'account_number', 'account_name', 'notes',
  ];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values     = fields.map(f => req.body[f]);
  values.push(req.params.id);

  try {
    const { rows } = await pool.queryR(
      `UPDATE refunds SET ${setClauses}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values,
    );
    if (!rows.length) return res.status(404).json({ error: 'Refund not found' });
    await logAdminAction(req.adminName, 'Updated refund', `#${req.params.id}${req.body.status ? ` → ${req.body.status}` : ''}`);
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /refunds/:id:', err.message);
    res.status(500).json({ error: 'Failed to update refund' });
  }
});

// DELETE /api/refunds/:id  (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await pool.queryR('DELETE FROM refunds WHERE id = $1', [req.params.id]);
    await logAdminAction(req.adminName, 'Deleted refund', `#${req.params.id}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /refunds/:id:', err.message);
    res.status(500).json({ error: 'Failed to delete refund' });
  }
});

module.exports = router;
