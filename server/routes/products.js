const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, condition, in_stock, featured, limit, page, search, sort } = req.query;
    const CARD_COLS = 'id,name,subtitle,category,listing_type,apple_url,image_urls,usd_price,in_stock,featured,badge,delivery_days,condition,condition_note,stock_count,created_at,updated_at';
    let where = 'WHERE 1=1';
    const params = [];

    if (category) {
      params.push(category);
      where += ` AND category = $${params.length}`;
    }
    if (condition) {
      params.push(condition);
      where += ` AND condition = $${params.length}`;
    }
    if (in_stock === 'true') where += ' AND in_stock = true';
    if (featured === 'true')  where += ' AND featured = true';
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      where += ` AND name ILIKE $${params.length}`;
    }

    // Total count for pagination header
    const { rows: countRows } = await pool.queryR(`SELECT COUNT(*) FROM products ${where}`, params);
    const total = parseInt(countRows[0].count, 10);
    res.setHeader('X-Total-Count', total);
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');

    const orderBy = sort === 'price_asc'  ? 'usd_price ASC'
                  : sort === 'price_desc' ? 'usd_price DESC'
                  : 'featured DESC, created_at ASC';

    const perPage = Math.min(parseInt(limit, 10) || 18, 1000);
    const offset  = (Math.max(parseInt(page, 10) || 1, 1) - 1) * perPage;
    params.push(perPage); const limitIdx  = params.length;
    params.push(offset);  const offsetIdx = params.length;

    const { rows } = await pool.queryR(
      `SELECT ${CARD_COLS} FROM products ${where} ORDER BY ${orderBy} LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params,
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.queryR('SELECT * FROM products WHERE id = $1', [req.params.id]);
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

    const { rows } = await pool.queryR(
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
