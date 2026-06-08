const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { adminAuth } = require('../adminAuth');
const logAdminAction = require('../logAdminAction');

// ── Helpers ──────────────────────────────────────────────────────────────────

const { pickNextCode } = require('../lib/productCode');

// Returns the lowest available 5-digit code (10000–99999) not currently in use.
// Pure logic lives in lib/productCode.js so it can be unit-tested.
async function nextAvailableCode() {
  const { rows } = await pool.queryR(
    'SELECT code FROM products WHERE code IS NOT NULL ORDER BY code ASC'
  );
  return pickNextCode(rows.map(r => r.code));
}

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, condition, in_stock, featured, limit, page, search, sort } = req.query;
    const CARD_COLS = 'id,name,subtitle,category,listing_type,apple_url,image_urls,usd_price,in_stock,featured,badge,delivery_days,condition,condition_note,stock_count,listing_status,created_at,updated_at,variants,sort_order,code';
    // admin=true only honoured when a valid admin token is present
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    let isAdmin = false;
    if (req.query.admin === 'true' && token) {
      try { require('../adminAuth').verifyToken(token); isAdmin = true; } catch(_) {}
    }
    let where = isAdmin ? 'WHERE 1=1' : "WHERE listing_status != 'hidden'";
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
      const s = search.trim();
      // Exact 5-digit code match takes priority; otherwise search by name
      if (/^\d{5}$/.test(s)) {
        params.push(parseInt(s, 10));
        where += ` AND code = $${params.length}`;
      } else {
        params.push(`%${s}%`);
        where += ` AND (name ILIKE $${params.length} OR code::text ILIKE $${params.length})`;
      }
    }

    // Total count for pagination header
    const { rows: countRows } = await pool.queryR(`SELECT COUNT(*) FROM products ${where}`, params);
    const total = parseInt(countRows[0].count, 10);
    res.setHeader('X-Total-Count', total);
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');

    const orderBy = sort === 'price_asc'    ? 'usd_price ASC'
                  : sort === 'price_desc'   ? 'usd_price DESC'
                  : sort === 'best_sellers' ? 'order_count DESC, sort_order ASC, featured DESC'
                  : 'sort_order ASC, featured DESC, created_at ASC';

    const perPage = Math.min(parseInt(limit, 10) || 18, 1000);
    const offset  = (Math.max(parseInt(page, 10) || 1, 1) - 1) * perPage;
    params.push(perPage); const limitIdx  = params.length;
    params.push(offset);  const offsetIdx = params.length;

    // For best_sellers sort we need the order count per product
    const cols = sort === 'best_sellers'
      ? `${CARD_COLS}, COALESCE((SELECT COUNT(*) FROM orders WHERE product_id = products.id), 0) AS order_count`
      : `${CARD_COLS}, sort_order`;

    const { rows } = await pool.queryR(
      `SELECT ${cols} FROM products ${where} ORDER BY ${orderBy} LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params,
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/products  (admin — create new product)
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      name, subtitle, category, usd_price, in_stock, featured, badge,
      delivery_days, condition, condition_note, stock_count, listing_status,
      overview, specs, includes, features, tech_specs, image_urls, variants,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Name required' });

    const id   = 'prod-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const code = await nextAvailableCode();

    const { rows } = await pool.queryR(`
      INSERT INTO products (
        id, name, subtitle, category, usd_price, in_stock, featured, badge,
        delivery_days, condition, condition_note, stock_count, listing_status,
        overview, specs, includes, features, tech_specs, image_urls, variants, code
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,
        $14,$15,$16,$17,$18,$19,$20,$21
      ) RETURNING *
    `, [
      id,
      name, subtitle || '', category || 'iPhone',
      usd_price || 0, in_stock !== false, featured || false, badge || '',
      delivery_days || '10–18 business days',
      condition || 'New', condition_note || '', stock_count || 0,
      listing_status || 'live',
      overview || [], specs || [], includes || [], features || [],
      tech_specs || [], image_urls || [], variants || [], code,
    ]);

    await logAdminAction(req.adminName, 'Created product', `"${name}" — $${usd_price} — code #${code}`);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /products:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PATCH /api/products/reorder  (admin — bulk-update sort_order)
// ⚠️ Must be defined BEFORE PATCH /:id or Express will treat "reorder" as an id
router.patch('/reorder', adminAuth, async (req, res) => {
  const { order } = req.body; // [{id, sort_order}, ...]
  if (!Array.isArray(order) || !order.length) return res.status(400).json({ error: 'order array required' });
  try {
    await Promise.all(
      order.map(({ id, sort_order }) =>
        pool.queryR('UPDATE products SET sort_order = $1 WHERE id = $2', [sort_order, id])
      )
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /products/reorder:', err);
    res.status(500).json({ error: 'Failed to reorder products' });
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
router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const allowed = [
      'name','subtitle','usd_price','in_stock','featured','badge',
      'delivery_days','condition','condition_note','stock_count',
      'overview','specs','includes','features','tech_specs','description',
      'listing_status','weight_kg','variants','image_urls','apple_url',
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
    const p = rows[0];

    // Build a human-readable summary of exactly what changed
    const changes = fields.map(f => {
      const val = req.body[f];
      if (f === 'listing_status') return `Listing → ${val}`;
      if (f === 'usd_price')      return `Price → $${val}`;
      if (f === 'in_stock')       return `In stock → ${val}`;
      if (f === 'stock_count')    return `Stock count → ${val}`;
      if (f === 'featured')       return `Featured → ${val}`;
      if (f === 'condition')      return `Condition → ${val}`;
      if (f === 'badge')          return `Badge → "${val}"`;
      if (f === 'delivery_days')  return `Delivery days → "${val}"`;
      if (f === 'weight_kg')      return `Weight → ${val} kg`;
      if (f === 'variants')       return 'Variants updated';
      return f;
    }).join(' | ');

    const action = fields.length === 1 && fields[0] === 'listing_status'
      ? `Set product ${req.body.listing_status}`
      : 'Updated product';

    await logAdminAction(req.adminName, action, `"${p.name}" — ${changes}`);
    res.json(p);
  } catch (err) {
    console.error('PATCH /products/:id:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id  (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { rows: pre } = await pool.queryR('SELECT name FROM products WHERE id = $1', [req.params.id]);
    if (!pre.length) return res.status(404).json({ error: 'Product not found' });
    await pool.queryR('DELETE FROM products WHERE id = $1', [req.params.id]);
    await logAdminAction(req.adminName, 'Deleted product', `"${pre[0].name}"`);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /products/:id:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
