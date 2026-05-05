const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { adminAuth } = require('../adminAuth');
const logAdminAction = require('../logAdminAction');

// POST /api/coupons/validate  (public — check a code before applying)
router.post('/validate', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });
  try {
    const { rows } = await pool.queryR(
      `SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)`, [code]
    );
    if (!rows.length) return res.status(404).json({ error: 'Coupon not found' });
    const c = rows[0];
    if (!c.is_active) return res.status(410).json({ error: 'This coupon is no longer active' });
    if (c.expires_at && new Date(c.expires_at) < new Date()) return res.status(410).json({ error: 'This coupon has expired' });
    if (c.max_uses !== null && c.used_count >= c.max_uses) return res.status(410).json({ error: 'This coupon has reached its usage limit' });
    res.json({
      id: c.id, code: c.code, description: c.description,
      discount_type: c.discount_type, discount_value: Number(c.discount_value),
      applies_to: c.applies_to,
    });
  } catch (err) {
    console.error('POST /coupons/validate:', err);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// GET /api/coupons  (admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.queryR(`SELECT * FROM coupons ORDER BY created_at DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// POST /api/coupons  (admin — create)
router.post('/', adminAuth, async (req, res) => {
  const { code, description, discount_type, discount_value, applies_to, max_uses, expires_at } = req.body;
  if (!code || !discount_type || discount_value == null || !applies_to)
    return res.status(400).json({ error: 'Missing required fields' });
  try {
    const { rows } = await pool.queryR(
      `INSERT INTO coupons (code, description, discount_type, discount_value, applies_to, max_uses, expires_at)
       VALUES (UPPER($1), $2, $3, $4, $5, $6, $7) RETURNING *`,
      [code, description || '', discount_type, discount_value, applies_to,
       max_uses || null, expires_at || null]
    );
    logAdminAction(req.adminName, 'Created coupon', `Code: ${rows[0].code}, ${discount_type} discount of ${discount_value} on ${applies_to}`).catch(() => {});
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'A coupon with that code already exists' });
    console.error('POST /coupons:', err);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// PATCH /api/coupons/:id  (admin — update)
router.patch('/:id', adminAuth, async (req, res) => {
  const allowed = ['description', 'discount_type', 'discount_value', 'applies_to', 'max_uses', 'is_active', 'expires_at'];
  const fields  = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = [...fields.map(f => req.body[f]), req.params.id];
  try {
    const { rows } = await pool.queryR(
      `UPDATE coupons SET ${setClauses} WHERE id = $${values.length} RETURNING *`, values
    );
    if (!rows.length) return res.status(404).json({ error: 'Coupon not found' });
    const isToggle = fields.length === 1 && fields[0] === 'is_active';
    const action = isToggle ? (rows[0].is_active ? 'Enabled coupon' : 'Disabled coupon') : 'Updated coupon';
    logAdminAction(req.adminName, action, `Code: ${rows[0].code}`).catch(() => {});
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// DELETE /api/coupons/:id  (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { rows: pre } = await pool.queryR('SELECT code FROM coupons WHERE id = $1', [req.params.id]);
    await pool.queryR('DELETE FROM coupons WHERE id = $1', [req.params.id]);
    logAdminAction(req.adminName, 'Deleted coupon', `Code: ${pre[0]?.code || req.params.id}`).catch(() => {});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

module.exports = router;
