/**
 * update-specs.js
 * Re-parses all 8 product spreadsheets and populates the structured fields
 * (overview, specs, includes, tech_specs) for every product in the DB.
 *
 * Run once from the repo root:
 *   node server/update-specs.js
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const pool = require('./db');

const SHEETS_DIR = path.join(__dirname, '..', 'spreadsheets');

// ─── Text helpers ─────────────────────────────────────────────────────────────

/** Strip HTML tags, decode common entities, collapse whitespace. */
function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Split a prose block into sentence bullets.
 * Breaks at ". " where the next char is uppercase/digit/quote.
 */
function splitSentences(text, maxCount = 10) {
  if (!text || !text.trim()) return [];
  return text
    .split(/\.\s+(?=[A-Z\d"'])/)
    .map(s => s.replace(/\s+/g, ' ').replace(/\.$/, '').trim())
    .filter(s => s.length > 25 && !/^[\d¹²³⁴⁵⁶⁷⁸⁹⁰\s*]+$/.test(s))
    .slice(0, maxCount);
}

/**
 * Split a run-on string into list items.
 * Splits wherever a lowercase letter / digit / close-paren / comma
 * is immediately followed by a space then an uppercase letter.
 * Then merges any fragments that are too short or end with prepositions/articles
 * back into their neighbours so multi-word product names stay intact.
 */
function splitIntoItems(text, maxLen = 500) {
  if (!text || !text.trim()) return [];

  // Cap length to avoid runaway sections (e.g. AirPods comparison tables)
  const capped = text.length > maxLen ? text.substring(0, maxLen) : text;

  const raw = capped
    .split(/(?<=[a-z,\)\d¹²³⁴⁵⁶⁷⁸⁹⁰])\s+(?=[A-Z])/)
    .map(s => s.replace(/\s+/g, ' ').replace(/\*+$/, '').trim())
    .filter(s => s.length > 1);

  // Merge fragments that are too short or whose predecessor ends with
  // a word that implies continuation (preposition / article / number).
  const CONTINUATION_END = /\b(to|for|with|and|or|of|in|at|by|on|a|an|the|via|from|\d+)\s*$/i;
  const MIN = 10; // items shorter than this get merged into the previous

  const merged = [];
  for (const item of raw) {
    const prev = merged.length > 0 ? merged[merged.length - 1] : null;
    const shouldMerge = prev !== null && (
      item.length < MIN ||                  // current fragment too short
      prev.length <= MIN ||                 // previous fragment too short (needs appending)
      CONTINUATION_END.test(prev)           // previous ends with article/preposition/number
    );
    if (shouldMerge) {
      merged[merged.length - 1] += ' ' + item;
    } else {
      merged.push(item);
    }
  }

  return merged.filter(s => s.length > 2 && s.length < 300);
}

/** Parse the Highlights block into bullet strings. */
function parseHighlights(text) {
  if (!text || !text.trim()) return [];
  const sentences = splitSentences(text, 12);
  if (sentences.length >= 2) return sentences;
  const items = splitIntoItems(text);
  if (items.length > 0) return items.slice(0, 12);
  return text.length > 5 ? [text.trim()] : [];
}

// Known Apple tech-spec section names (longest first so longer names match before subsets)
const SECTION_NAMES = [
  'Size and Weight', 'Dimensions and Weight', 'Weight and Dimensions',
  'Cellular and Wireless', 'Connections and Expansion', 'Video Support',
  'Audio Playback', 'Video Playback', 'Video Calling', 'Video Recording',
  'Photo Specifications', 'Front Camera', 'Rear Camera',
  'Keyboard and Trackpad', 'Health and Safety',
  'System Requirements', 'Manufacturer Information', 'Package Contents',
  'Operating System', 'Built-in Apps', 'Free Apps from Apple',
  'Supported Formats', 'Model Number',
  'Display', 'Chip', 'Memory', 'Storage', 'Sensors', 'Location',
  'Connectivity', 'Communication', 'Camera', 'Power', 'Battery',
  'Wireless', 'Performance', 'Audio', 'Video', 'Connector',
  'Accessibility', 'SIM Card', 'General', 'Safety', 'Payment',
  'Controls', 'Batteries', 'Form Factor', 'Dimensions', 'Colors',
].sort((a, b) => b.length - a.length);

const SECTION_RE = new RegExp(
  `\\b(${SECTION_NAMES.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'g',
);

/** Parse Tech Specs text into [{ section, items }]. */
function parseTechSpecs(text) {
  if (!text || !text.trim()) return [];

  SECTION_RE.lastIndex = 0;
  const sectionMatches = [...text.matchAll(SECTION_RE)];

  if (sectionMatches.length === 0) {
    const items = splitIntoItems(text);
    return items.length > 0 ? [{ section: 'Specifications', items }] : [];
  }

  const sections = [];

  // Preamble text before first recognised section name
  if (sectionMatches[0].index > 0) {
    const preamble = text.substring(0, sectionMatches[0].index).trim();
    if (preamble) {
      const items = splitIntoItems(preamble);
      if (items.length > 0) sections.push({ section: 'Details', items });
    }
  }

  for (let i = 0; i < sectionMatches.length; i++) {
    const m   = sectionMatches[i];
    const end = i + 1 < sectionMatches.length ? sectionMatches[i + 1].index : text.length;
    const body = text.substring(m.index + m[0].length, end).trim();
    const items = splitIntoItems(body);
    if (items.length > 0) {
      sections.push({ section: m[1], items });
    }
  }

  return sections;
}

// ─── Main info extractor ──────────────────────────────────────────────────────

/**
 * Extract { overview, specs, includes, tech_specs } from the raw product page text.
 *
 * Apple's spreadsheet text is a single flat string with the structure:
 *   [Product Name] - Apple  [nav boilerplate ~3000 chars]
 *   Product Information
 *     Overview  [prose paragraphs]
 *     Highlights  [key-value spec bullets]   ← optional
 *     What’s in the Box  [item list]
 *     Tech Specs  [section → items]
 *     Compatibility  [long device list]
 *
 * Note: the apostrophe in "What's in the Box" is U+2019 (curly right quote),
 * not the plain ASCII apostrophe U+0027.
 */
function extractProductInfo(fullText) {
  const empty = { overview: [], specs: [], includes: [], tech_specs: [] };
  if (!fullText) return empty;

  const piIdx = fullText.indexOf('Product Information');
  if (piIdx === -1) return empty;

  const section = fullText.substring(piIdx + 'Product Information'.length);

  // Marker positions (relative to `section`)
  const OV = section.indexOf('Overview');
  const HL = section.indexOf('Highlights');
  // Apple uses U+2019 (right single quotation mark) in "What’s in the Box"
  const WITB_MARKER = 'What’s in the Box';
  const WB = section.indexOf(WITB_MARKER);
  const TS = section.indexOf('Tech Specs');
  const CM = section.indexOf('Compatibility');

  // ── Overview ────────────────────────────────────────────────────────────────
  let overview = [];
  if (OV !== -1) {
    const start = OV + 'Overview'.length;
    const candidates = [HL, WB, TS, CM].filter(x => x !== -1 && x > OV).sort((a, b) => a - b);
    const end = candidates[0] ?? section.length;
    const text = section.substring(start, end).trim();

    overview = splitSentences(text, 8);
    if (overview.length < 2) {
      const items = splitIntoItems(text).filter(s => s.length > 20).slice(0, 8);
      if (items.length > overview.length) overview = items;
    }
  }

  // ── Specs (Highlights) ───────────────────────────────────────────────────────
  let specs = [];
  if (HL !== -1) {
    const hlEnd = [WB, TS, CM].filter(x => x !== -1 && x > HL).sort((a, b) => a - b)[0];
    if (hlEnd !== undefined) {
      specs = parseHighlights(section.substring(HL + 'Highlights'.length, hlEnd).trim());
    }
  }
  // Fallback: reuse first few overview bullets as specs
  if (specs.length === 0 && overview.length > 0) {
    specs = overview.slice(0, 4);
  }

  // ── Includes (What's in the Box) ─────────────────────────────────────────────
  let includes = [];
  if (WB !== -1) {
    const wbEnd = [TS, CM].filter(x => x !== -1 && x > WB).sort((a, b) => a - b)[0] ?? section.length;
    // Cap at 350 chars — longer sections usually contain comparison tables, not box contents
    const text = section.substring(WB + WITB_MARKER.length, wbEnd).trim();
    includes = splitIntoItems(text, 350);
  }

  // ── Tech Specs ────────────────────────────────────────────────────────────────
  let tech_specs = [];
  if (TS !== -1) {
    const tsEnd = CM !== -1 && CM > TS ? CM : section.length;
    const text = section.substring(TS + 'Tech Specs'.length, tsEnd).trim();
    tech_specs = parseTechSpecs(text);
  }

  return { overview, specs, includes, tech_specs };
}

// ─── Spreadsheet row parser ───────────────────────────────────────────────────

/**
 * Parse one .html spreadsheet file.
 * Returns [{ apple_url, overview, specs, includes, tech_specs }, …]
 */
function parseSheet(filename) {
  const filePath = path.join(SHEETS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`  Skipping missing file: ${filename}`);
    return [];
  }

  const html = fs.readFileSync(filePath, 'utf8');
  const trMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  const results = [];
  let skipped = 0;

  for (let i = 1; i < trMatches.length; i++) { // skip header row
    const cells = [...trMatches[i][1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map(m => stripHtml(m[1]));

    if (cells.length < 4) { skipped++; continue; }

    const appleUrl = cells[2]?.trim();
    const fullText = cells[3]?.trim();

    if (!appleUrl || !appleUrl.startsWith('http')) { skipped++; continue; }
    if (!fullText) { skipped++; continue; }

    const info = extractProductInfo(fullText);
    results.push({ apple_url: appleUrl, ...info });
  }

  console.log(`  ${filename}: ${results.length} rows parsed, ${skipped} skipped`);
  return results;
}

// ─── DB updater ───────────────────────────────────────────────────────────────

async function run() {
  const files = [
    'iPhone.html', 'Mac.html', 'iPad.html', 'Watch.html',
    'AirPods.html', 'Apple TV.html', 'HomePod.html', 'Accessories.html',
  ];

  let allRows = [];
  for (const file of files) {
    console.log(`\nParsing ${file}…`);
    allRows = allRows.concat(parseSheet(file));
  }

  console.log(`\nTotal rows parsed: ${allRows.length}`);

  // Quick sanity check on the first few rows
  const sample = allRows.find(r => r.includes.length > 0);
  if (sample) {
    console.log('\nSample with includes:');
    console.log('  URL:', sample.apple_url.substring(0, 60));
    console.log('  includes:', sample.includes);
    console.log('  overview[0]:', sample.overview[0]);
    console.log('  tech_specs sections:', sample.tech_specs.map(s => s.section));
  }

  console.log('\nUpdating DB…');

  const client = await pool.connect();
  let updated = 0;
  let notFound = 0;
  let failed = 0;

  try {
    for (const row of allRows) {
      try {
        // neon pool wrapper returns { rows } not { rowCount }, so we use RETURNING id
        // to detect whether a matching row was found.
        // overview/specs/includes are text[] — pass as plain JS arrays
        // tech_specs is jsonb — pass as JSON string
        const result = await client.query(
          `UPDATE products
              SET overview   = $1,
                  specs      = $2,
                  includes   = $3,
                  tech_specs = $4::jsonb,
                  updated_at = NOW()
            WHERE apple_url  = $5
            RETURNING id`,
          [
            row.overview,
            row.specs,
            row.includes,
            JSON.stringify(row.tech_specs),
            row.apple_url,
          ],
        );
        const rows = Array.isArray(result) ? result : (result.rows || []);
        if (rows.length === 0) notFound++;
        else updated++;
      } catch (err) {
        console.error(`  Failed for ${row.apple_url}: ${err.message}`);
        failed++;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`\n✓ Done.`);
  console.log(`  Updated    : ${updated}`);
  console.log(`  Not in DB  : ${notFound}`);
  console.log(`  Errors     : ${failed}`);
}

run().catch(err => { console.error(err); process.exit(1); });
