const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, condition, in_stock, featured, limit } = req.query;
    let q = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
      params.push(category);
      q += ` AND category = $${params.length}`;
    }
    if (condition) {
      params.push(condition);
      q += ` AND condition = $${params.length}`;
    }
    if (in_stock === 'true') {
      q += ' AND in_stock = true';
    }
    if (featured === 'true') {
      q += ' AND featured = true';
    }

    q += ' ORDER BY featured DESC, created_at ASC';

    if (limit) {
      const n = parseInt(limit, 10);
      if (n > 0) { params.push(n); q += ` LIMIT $${params.length}`; }
    }

    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /products/:id:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// PATCH /api/products/:id  (admin — update stock, price, etc.)
router.patch('/:id', async (req, res) => {
  try {
    const allowed = [
      'name','subtitle','usd_price','in_stock','featured','badge',
      'delivery_days','condition','condition_note','stock_count',
      'overview','specs','includes','features','tech_specs','description',
    ];
    const fields = Object.keys(req.body).filter(k => allowed.includes(k));
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

    const params = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values = fields.map(f => req.body[f]);
    values.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE products SET ${params}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values,
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /products/:id:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

module.exports = router;
