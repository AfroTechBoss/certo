require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');
const { Pool } = require('pg');

// Use standard pg wire protocol — works from CLI (Neon HTTP driver times out outside Express)
const pgUrl = (process.env.DATABASE_URL || '').replace('channel_binding=require', 'channel_binding=disable');
const pool = new Pool({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });

const SHEETS_DIR = path.join(__dirname, '..', 'spreadsheets');

// Navigation boilerplate to strip from full text
const NAV_MARKER = 'Apple Store Shop Shop the Latest';
const FOOTER_MARKERS = [
  'Copyright ©', 'Apple Footer', 'More ways to shop',
  'Shop online or visit', 'Find an Apple Store',
];

function cleanFullText(raw) {
  if (!raw) return '';
  // Strip from nav marker onwards to remove the top nav
  const navIdx = raw.indexOf(NAV_MARKER);
  let cleaned = navIdx > 0 ? raw.substring(0, navIdx) : raw;

  // Also strip from footer markers
  for (const marker of FOOTER_MARKERS) {
    const idx = cleaned.lastIndexOf(marker);
    if (idx > 100) cleaned = cleaned.substring(0, idx);
  }

  return cleaned.replace(/\s{2,}/g, ' ').trim();
}

function extractProductName(fullText) {
  if (!fullText) return '';
  // Apple page title format: "Product Name - Apple"
  const appleIdx = fullText.indexOf(' - Apple');
  if (appleIdx > 0 && appleIdx < 200) {
    return fullText.substring(0, appleIdx).trim();
  }
  // Fallback: first 100 chars up to a newline or period
  return fullText.split(/[\n\r]/)[0].substring(0, 120).trim();
}

function extractPrice(fullText) {
  if (!fullText) return null;
  // Match patterns like $1,199.00 or $999.00 — first occurrence
  const match = fullText.match(/\$(\d{1,2},?\d{3}(?:\.\d{2})?|\d{2,3}(?:\.\d{2})?)/);
  if (match) {
    return parseFloat(match[1].replace(',', ''));
  }
  return null;
}

function filterImageUrls(rawUrls) {
  if (!rawUrls) return [];
  // Split by pipe and filter to real product images
  return rawUrls
    .split('|')
    .map(u => u.trim())
    .filter(u => u.includes('store.storeimages.cdn-apple.com'))
    .map(u => {
      // Decode HTML entities
      u = u.replace(/&amp;/g, '&');
      // Upgrade thumbnail size to a proper display size
      u = u.replace(/wid=\d+/, 'wid=800').replace(/hei=\d+/, 'hei=800');
      return u;
    })
    .filter((u, i, arr) => arr.indexOf(u) === i) // dedupe
    .slice(0, 5); // max 5 images
}

function categoryToType(category) {
  const map = {
    'iPhone': 'iPhone',
    'Mac': 'MacBook',
    'iPad': 'iPad',
    'Watch': 'Watch',
    'AirPods': 'AirPods',
    'Apple TV': 'Apple TV',
    'HomePod': 'HomePod',
    'Accessories': 'Accessories',
  };
  return map[category] || category;
}

function deliveryDays(category) {
  if (['AirPods', 'Watch', 'Apple TV', 'HomePod', 'Accessories'].includes(category)) return '8–15 business days';
  if (['iPhone', 'iPad'].includes(category)) return '10–18 business days';
  return '12–20 business days';
}

function conditionFromListingType(lt) {
  return (lt || '').toLowerCase().includes('refurb') ? 'refurb' : 'new';
}

function conditionNote(listing, category) {
  if (listing.toLowerCase().includes('refurb')) {
    return 'Apple Certified Refurbished. Fully tested to Apple standards. Minor cosmetic marks may be present. Includes new accessories. Covered by Apple\'s one-year limited warranty.';
  }
  if (['Mac'].includes(category)) {
    return 'Sealed box. Apple US retail unit. US warranty included.';
  }
  return 'Sealed box, never activated. Ships directly from Apple US. Full Apple US warranty intact.';
}

function badgeForProduct(listing, name) {
  if (listing.toLowerCase().includes('refurb')) return 'Grade A Refurb';
  if (name.toLowerCase().includes('iphone') || name.toLowerCase().includes('ipad')) return 'Serial Verified';
  return 'Warranty Included';
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

async function parseSheet(filename) {
  const filePath = path.join(SHEETS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`  Skipping missing file: ${filename}`);
    return [];
  }
  const html  = fs.readFileSync(filePath, 'utf8');
  const root  = parse(html);
  const rows  = root.querySelectorAll('tr');

  const products = [];
  let skipped = 0;

  for (let i = 1; i < rows.length; i++) { // skip header row
    const cells = rows[i].querySelectorAll('td');
    if (cells.length < 3) { skipped++; continue; }

    const category   = (cells[0]?.text || '').trim();
    const listingType= (cells[1]?.text || '').trim();
    const appleUrl   = (cells[2]?.text || '').trim();
    const fullText   = (cells[3]?.text || '').trim();
    const rawImages  = (cells[4]?.text || '').trim();

    if (!category || !appleUrl || !appleUrl.startsWith('http')) { skipped++; continue; }

    const name    = extractProductName(fullText);
    const cleaned = cleanFullText(fullText);
    const price   = extractPrice(fullText);
    const images  = filterImageUrls(rawImages);

    if (!name) { skipped++; continue; }

    const id = slugify(`${category}-${name}-${listingType}`);

    products.push({
      id,
      name,
      subtitle:      '',
      category,
      listing_type:  listingType || 'New',
      apple_url:     appleUrl,
      image_urls:    images,
      usd_price:     price,
      in_stock:      true,
      featured:      false,
      badge:         badgeForProduct(listingType, name),
      delivery_days: deliveryDays(category),
      condition:     conditionFromListingType(listingType),
      condition_note:conditionNote(listingType, category),
      description:   cleaned,
      overview:      [],
      specs:         [],
      includes:      [],
      features:      [],
      tech_specs:    [],
      stock_count:   1,
    });
  }

  console.log(`  ${filename}: ${products.length} products parsed, ${skipped} rows skipped`);
  return products;
}

async function run() {
  const client = await pool.connect();
  try {
    // Run schema — strip line comments, split on ;
    const rawSchema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const noComments = rawSchema.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
    const statements = noComments.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of statements) {
      await client.query(stmt);
    }
    console.log('Schema applied.');

    const files = [
      'iPhone.html',
      'Mac.html',
      'iPad.html',
      'Watch.html',
      'AirPods.html',
      'Apple TV.html',
      'HomePod.html',
      'Accessories.html',
    ];

    let totalInserted = 0;
    let totalSkipped  = 0;

    for (const file of files) {
      console.log(`\nParsing ${file}...`);
      const products = await parseSheet(file);

      for (const p of products) {
        try {
          await client.query(`
            INSERT INTO products (
              id, name, subtitle, category, listing_type, apple_url,
              image_urls, usd_price, in_stock, featured, badge, delivery_days,
              condition, condition_note, description, overview, specs,
              includes, features, tech_specs, stock_count
            ) VALUES (
              $1,$2,$3,$4,$5,$6,
              $7,$8,$9,$10,$11,$12,
              $13,$14,$15,$16,$17,
              $18,$19,$20,$21
            )
            ON CONFLICT (id) DO UPDATE SET
              name         = EXCLUDED.name,
              listing_type = EXCLUDED.listing_type,
              apple_url    = EXCLUDED.apple_url,
              image_urls   = EXCLUDED.image_urls,
              usd_price    = EXCLUDED.usd_price,
              badge        = EXCLUDED.badge,
              condition    = EXCLUDED.condition,
              condition_note = EXCLUDED.condition_note,
              description  = EXCLUDED.description,
              updated_at   = NOW()
          `, [
            p.id, p.name, p.subtitle, p.category, p.listing_type, p.apple_url,
            p.image_urls, p.usd_price, p.in_stock, p.featured, p.badge, p.delivery_days,
            p.condition, p.condition_note, p.description, p.overview, p.specs,
            p.includes, JSON.stringify(p.features), JSON.stringify(p.tech_specs), p.stock_count,
          ]);
          totalInserted++;
        } catch (err) {
          console.error(`  Failed to insert ${p.id}:`, err.message);
          totalSkipped++;
        }
      }
    }

    console.log(`\nDone. Inserted/updated: ${totalInserted}, failed: ${totalSkipped}`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
