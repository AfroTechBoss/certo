const express      = require('express');
const router       = express.Router();
const pool         = require('../db');
const { adminAuth }= require('../adminAuth');
const logAdminAction = require('../logAdminAction');

// GET /api/blog  (public — list published posts)
router.get('/', async (req, res) => {
  try {
    const { category, featured, limit = 100, search } = req.query;
    let where = "WHERE published = true";
    const params = [];

    if (category) {
      params.push(category);
      where += ` AND category = $${params.length}`;
    }
    if (featured === 'true') {
      where += ' AND featured = true';
    }
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      where += ` AND (title ILIKE $${params.length} OR excerpt ILIKE $${params.length})`;
    }

    params.push(Number(limit));
    const { rows } = await pool.queryR(
      `SELECT id, slug, title, excerpt, category, read_time, post_date, featured, tags,
              related_categories, emoji, image_url, sections, published, created_at, updated_at
       FROM blog_posts ${where}
       ORDER BY featured DESC, created_at DESC
       LIMIT $${params.length}`,
      params,
    );
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(rows);
  } catch (err) {
    console.error('GET /blog:', err.message);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/blog/admin  (admin — slim list of all posts including unpublished)
//
// IMPORTANT: this endpoint deliberately OMITS:
//   - sections (very large JSONB per post)
//   - image_url body when it is a base64 data URI (can be 1-2MB per post;
//     just send a placeholder marker — the editor fetches the full row separately)
// Including either makes the Blog tab in admin take 5-30+ seconds to load
// when posts have uploaded cover images.
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.queryR(
      `SELECT
         id, slug, title, excerpt, category, read_time, post_date,
         featured, published, emoji, tags, related_categories,
         created_at, updated_at,
         CASE
           WHEN image_url LIKE 'data:%' THEN NULL
           ELSE image_url
         END AS image_url,
         (image_url IS NOT NULL AND image_url <> '') AS has_image
       FROM blog_posts
       ORDER BY created_at DESC`
    );
    res.set('Cache-Control', 'no-store');
    res.json(rows);
  } catch (err) {
    console.error('GET /blog/admin:', err.message);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/blog/admin/:id  (admin — single full post by id, for the editor)
router.get('/admin/:id', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.queryR(
      `SELECT * FROM blog_posts WHERE id = $1`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Post not found' });
    res.set('Cache-Control', 'no-store');
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /blog/admin/:id:', err.message);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// GET /api/blog/:slug  (public — single post with full sections)
router.get('/:slug', async (req, res) => {
  try {
    const { rows } = await pool.queryR(
      `SELECT * FROM blog_posts WHERE slug = $1 AND published = true`,
      [req.params.slug],
    );
    if (!rows.length) return res.status(404).json({ error: 'Post not found' });
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/blog  (admin — create)
router.post('/', adminAuth, async (req, res) => {
  const {
    slug, title, excerpt, category, read_time, post_date,
    featured, tags, related_categories, emoji, image_url, sections, published,
  } = req.body;
  if (!slug || !title) return res.status(400).json({ error: 'slug and title required' });

  try {
    const { rows } = await pool.queryR(
      `INSERT INTO blog_posts
         (slug, title, excerpt, category, read_time, post_date, featured, tags,
          related_categories, emoji, image_url, sections, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        slug.trim(), title.trim(), excerpt || '', category || 'Buying Guide',
        read_time || '5 min read', post_date || new Date().toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }),
        featured || false,
        JSON.stringify(Array.isArray(tags) ? tags : []),
        JSON.stringify(Array.isArray(related_categories) ? related_categories : []),
        emoji || '📝',
        image_url || '',
        JSON.stringify(Array.isArray(sections) ? sections : []),
        published !== false,
      ],
    );
    await logAdminAction(req.adminName, 'Created blog post', `"${title}" — /${slug}`);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'A post with that slug already exists' });
    console.error('POST /blog:', err.message);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PATCH /api/blog/:id  (admin — update)
router.patch('/:id', adminAuth, async (req, res) => {
  const allowed = ['title', 'excerpt', 'category', 'read_time', 'post_date',
                   'featured', 'tags', 'related_categories', 'emoji', 'image_url', 'sections', 'published'];
  const fields  = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values     = fields.map(f => {
    const v = req.body[f];
    if (f === 'tags' || f === 'related_categories' || f === 'sections') return JSON.stringify(v);
    return v;
  });
  values.push(req.params.id);

  try {
    const { rows } = await pool.queryR(
      `UPDATE blog_posts SET ${setClauses}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values,
    );
    if (!rows.length) return res.status(404).json({ error: 'Post not found' });
    await logAdminAction(req.adminName, 'Updated blog post', `"${rows[0].title}"`);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// DELETE /api/blog/:id  (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { rows: pre } = await pool.queryR('SELECT title FROM blog_posts WHERE id = $1', [req.params.id]);
    await pool.queryR('DELETE FROM blog_posts WHERE id = $1', [req.params.id]);
    await logAdminAction(req.adminName, 'Deleted blog post', `"${pre[0]?.title || req.params.id}"`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = router;
