const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const { adminAuth } = require('../adminAuth');

// POST /api/analytics  (public — log a client event)
// Geo is extracted from Vercel's automatic request headers — no external API needed.
router.post('/', async (req, res) => {
  const { event_type, page, product_id, product_name, session_id, referrer } = req.body;
  if (!event_type) return res.status(400).json({ error: 'event_type required' });

  // Vercel injects these automatically on production
  const country = req.headers['x-vercel-ip-country'] || null;
  const region  = req.headers['x-vercel-ip-country-region'] || null;
  let city      = req.headers['x-vercel-ip-city'] || null;
  try { if (city) city = decodeURIComponent(city); } catch(_) {}

  try {
    await pool.queryR(
      `INSERT INTO analytics_events
         (event_type, page, product_id, product_name, session_id, country, region, city, referrer)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        event_type,
        page        || null,
        product_id  || null,
        product_name|| null,
        session_id  || null,
        country, region, city,
        referrer    || null,
      ],
    );
  } catch (err) {
    // Never return 500 for analytics — swallow silently
    console.error('[analytics] insert failed:', err.message);
  }
  res.json({ ok: true });
});

// GET /api/analytics  (admin — aggregated stats)
router.get('/', adminAuth, async (req, res) => {
  const { timeframe = '7days' } = req.query;
  const intervals = { today: '1 day', '7days': '7 days', '30days': '30 days', '90days': '90 days' };
  const interval  = intervals[timeframe] || '7 days';
  const where     = `created_at >= NOW() - INTERVAL '${interval}'`;

  try {
    const [overview, topPages, topProducts, locations, daily, eventBreakdown, topSearches] = await Promise.all([

      // ── Overview numbers ──────────────────────────────────────────────────
      pool.queryR(`
        SELECT
          COUNT(*)::int                                                          AS total_events,
          COUNT(DISTINCT session_id)::int                                        AS unique_sessions,
          COUNT(*) FILTER (WHERE event_type = 'pageview')::int                  AS pageviews,
          COUNT(*) FILTER (WHERE event_type = 'product_view')::int              AS product_views,
          COUNT(*) FILTER (WHERE event_type = 'add_to_cart')::int               AS add_to_cart,
          COUNT(*) FILTER (WHERE event_type = 'checkout_start')::int            AS checkout_starts
        FROM analytics_events WHERE ${where}
      `),

      // ── Top pages ─────────────────────────────────────────────────────────
      pool.queryR(`
        SELECT page, COUNT(*)::int AS views
        FROM analytics_events
        WHERE ${where} AND event_type = 'pageview' AND page IS NOT NULL
        GROUP BY page ORDER BY views DESC LIMIT 10
      `),

      // ── Top products viewed ───────────────────────────────────────────────
      pool.queryR(`
        SELECT product_id, product_name, COUNT(*)::int AS views
        FROM analytics_events
        WHERE ${where} AND event_type = 'product_view' AND product_id IS NOT NULL
        GROUP BY product_id, product_name ORDER BY views DESC LIMIT 10
      `),

      // ── Location breakdown ────────────────────────────────────────────────
      pool.queryR(`
        SELECT
          COALESCE(city, region, country, 'Unknown') AS location,
          country, region, city,
          COUNT(DISTINCT session_id)::int AS sessions
        FROM analytics_events
        WHERE ${where} AND session_id IS NOT NULL
        GROUP BY location, country, region, city
        ORDER BY sessions DESC LIMIT 25
      `),

      // ── Daily trend ───────────────────────────────────────────────────────
      pool.queryR(`
        SELECT
          TO_CHAR(DATE(created_at), 'YYYY-MM-DD')                              AS day,
          COUNT(*) FILTER (WHERE event_type = 'pageview')::int                 AS views,
          COUNT(DISTINCT session_id)::int                                       AS sessions
        FROM analytics_events WHERE ${where}
        GROUP BY day ORDER BY day ASC
      `),

      // ── Event type breakdown ──────────────────────────────────────────────
      pool.queryR(`
        SELECT event_type, COUNT(*)::int AS count
        FROM analytics_events WHERE ${where}
        GROUP BY event_type ORDER BY count DESC
      `),

      // ── Most searched terms ───────────────────────────────────────────────
      pool.queryR(`
        SELECT product_name AS query, COUNT(*)::int AS count
        FROM analytics_events
        WHERE ${where} AND event_type = 'product_search'
          AND product_name IS NOT NULL AND product_name != ''
        GROUP BY product_name ORDER BY count DESC LIMIT 10
      `),
    ]);

    res.json({
      overview:       overview.rows[0],
      topPages:       topPages.rows,
      topProducts:    topProducts.rows,
      locations:      locations.rows,
      daily:          daily.rows,
      eventBreakdown: eventBreakdown.rows,
      topSearches:    topSearches.rows,
    });
  } catch (err) {
    console.error('GET /analytics:', err.message);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
