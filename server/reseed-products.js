/**
 * server/reseed-products.js
 * -----------------------------------------------------------
 * One-time script: wipes the products table and re-inserts all
 * 260 rows from the CSV export.
 *
 * Usage (from project root):
 *   node server/reseed-products.js
 *
 * Requires DATABASE_URL in .env (or environment).
 * -----------------------------------------------------------
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const pool = require('./db');

const CSV_PATH = path.join(__dirname, '..', '..', 'Downloads', 'Copy of products (1) - products (1).csv');

// Weight lookup by category — used as fallback when tech_specs carry no weight data
const CATEGORY_WEIGHT_KG = {
  iPhone:      0.25,
  iPad:        0.65,
  Mac:         3.0,
  AirPods:     0.1,
  Watch:       0.1,
  'Apple TV':  0.5,
  HomePod:     1.4,
  Accessories: 0.35,
};

// Parse weight from tech_specs JSON array (same logic as populate-weights.js)
function parseWeightFromTechSpecs(techSpecs) {
  if (!Array.isArray(techSpecs)) return null;
  const text = techSpecs.map(s => {
    const items = Array.isArray(s.items) ? s.items.join(' ') : '';
    const section = s.section || '';
    return `${section} ${items}`;
  }).join(' ');

  // kg explicit
  const kgMatch = text.match(/[\d.]+\s*kg/i);
  if (kgMatch) return parseFloat(kgMatch[0]);

  // grams — avoid "total" weight (multi-item sums); prefer individual weights
  const gMatches = [...text.matchAll(/(\d+\.?\d*)\s*g(?:rams?)?\b/gi)];
  if (gMatches.length) {
    const vals = gMatches.map(m => parseFloat(m[1])).filter(v => v > 0 && v < 5000);
    if (vals.length) return Math.max(...vals) / 1000;
  }

  // lbs
  const lbsMatch = text.match(/([\d.]+)\s*(?:pounds?|lbs?)\b/i);
  if (lbsMatch) return parseFloat(lbsMatch[1]) * 0.453592;

  return null;
}

function safeJson(val) {
  if (!val || val.trim() === '' || val.trim() === '[]' || val.trim() === '{}') return null;
  try { return JSON.parse(val); } catch { return null; }
}

function safeStr(val) {
  return (val || '').trim() || null;
}

async function main() {
  // 1. Read & parse CSV
  console.log('Reading CSV…');
  let csvText;
  try {
    csvText = fs.readFileSync(CSV_PATH, 'utf8');
  } catch (e) {
    // Try alternate common locations
    const alt = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads', 'Copy of products (1) - products (1).csv');
    csvText = fs.readFileSync(alt, 'utf8');
  }

  const rows = parse(csvText, {
    columns:          true,
    skip_empty_lines: true,
    relax_quotes:     true,
    relax_column_count: true,
  });

  console.log(`Parsed ${rows.length} rows from CSV`);

  // 2. Truncate existing products
  console.log('Truncating products table…');
  await pool.queryR('TRUNCATE TABLE products RESTART IDENTITY CASCADE');
  console.log('Table cleared.');

  // 3. Insert rows in batches of 20
  let inserted = 0;
  let failed   = 0;

  for (const row of rows) {
    try {
      const techSpecs   = safeJson(row.tech_specs)   || [];
      const imageUrls   = safeJson(row.image_urls)   || [];
      const overview    = safeJson(row.overview)     || [];
      const specs       = safeJson(row.specs)        || [];
      const includes    = safeJson(row.includes)     || [];
      const features    = safeJson(row.features)     || [];
      const inStock     = row.in_stock === 'true' || row.in_stock === true;
      const featured    = row.featured  === 'true' || row.featured  === true;
      const stockCount  = parseInt(row.stock_count, 10) || (inStock ? 1 : 0);
      const usdPrice    = parseFloat(row.usd_price)  || 0;
      const category    = safeStr(row.category)      || 'Accessories';

      // Determine weight: try tech_specs first, fall back to category default
      const weightFromSpecs = parseWeightFromTechSpecs(techSpecs);
      const weightKg = weightFromSpecs !== null
        ? parseFloat(weightFromSpecs.toFixed(3))
        : (CATEGORY_WEIGHT_KG[category] || 0.35);

      // TEXT[] columns: pass JS array directly (pg auto-converts)
      // JSONB columns: must JSON.stringify — Neon WS driver doesn't auto-serialize
      await pool.queryR(`
        INSERT INTO products (
          id, name, subtitle, category, listing_type, apple_url,
          image_urls, usd_price, in_stock, featured, badge,
          delivery_days, condition, condition_note,
          description, overview, specs, includes, features, tech_specs,
          stock_count, listing_status, weight_kg,
          created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,
          $7,$8,$9,$10,$11,
          $12,$13,$14,
          $15,$16,$17,$18,$19,$20,
          $21,$22,$23,
          $24,$25
        )
        ON CONFLICT (id) DO UPDATE SET
          name          = EXCLUDED.name,
          subtitle      = EXCLUDED.subtitle,
          category      = EXCLUDED.category,
          listing_type  = EXCLUDED.listing_type,
          apple_url     = EXCLUDED.apple_url,
          image_urls    = EXCLUDED.image_urls,
          usd_price     = EXCLUDED.usd_price,
          in_stock      = EXCLUDED.in_stock,
          featured      = EXCLUDED.featured,
          badge         = EXCLUDED.badge,
          delivery_days = EXCLUDED.delivery_days,
          condition     = EXCLUDED.condition,
          condition_note= EXCLUDED.condition_note,
          description   = EXCLUDED.description,
          overview      = EXCLUDED.overview,
          specs         = EXCLUDED.specs,
          includes      = EXCLUDED.includes,
          features      = EXCLUDED.features,
          tech_specs    = EXCLUDED.tech_specs,
          stock_count   = EXCLUDED.stock_count,
          listing_status= EXCLUDED.listing_status,
          weight_kg     = EXCLUDED.weight_kg,
          updated_at    = EXCLUDED.updated_at
      `, [
        row.id,
        row.name,
        safeStr(row.subtitle),
        category,
        safeStr(row.listing_type) || 'New',
        safeStr(row.apple_url),
        imageUrls,                      // TEXT[]
        usdPrice,
        inStock,
        featured,
        safeStr(row.badge) || '',
        safeStr(row.delivery_days) || '10–18 business days',
        safeStr(row.condition) || 'new',
        safeStr(row.condition_note),
        safeStr(row.description),
        overview,                       // TEXT[]
        specs,                          // TEXT[]
        includes,                       // TEXT[]
        JSON.stringify(features),       // JSONB — Neon WS driver needs explicit stringify
        JSON.stringify(techSpecs),      // JSONB — Neon WS driver needs explicit stringify
        stockCount,
        'live',
        weightKg,
        row.created_at || new Date().toISOString(),
        row.updated_at || new Date().toISOString(),
      ]);

      inserted++;
      if (inserted % 20 === 0) console.log(`  …${inserted} inserted`);
    } catch (err) {
      failed++;
      console.error(`  ✗ Failed row "${row.id}": ${err.message}`);
    }
  }

  console.log(`\nDone. ✅  Inserted: ${inserted}  |  Failed: ${failed}`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
