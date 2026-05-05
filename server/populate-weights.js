// One-time script: parse weight_kg from tech_specs JSONB and store it on each product.
// Run once after adding the weight_kg column:
//   node server/populate-weights.js

require('dotenv').config();
const pool = require('./db');

/**
 * Parse a product's tech_specs JSONB array and return its weight in kg.
 * Handles all the messy formats Apple uses:
 *   "Weight: 9.87 pounds (4.48 kg)⁴"  → 4.48
 *   "Weight: Weight: 2.3 ounces (66 g)²" → 0.066
 *   "Weight: 0.51 pound (0.230 kg)"    → 0.230
 *   "Weight: 1.485 oz. / 42.1 g"       → 0.042
 *   "Weight: (case) 69g (bud) 8.7g (total) 77.7g" → 0.078  (uses "total")
 *   Multiple weight rows (components)  → sum
 */
function parseWeightKg(techSpecs) {
  if (!Array.isArray(techSpecs)) return null;

  // Collect every item that mentions "weight"
  const weightItems = [];
  for (const section of techSpecs) {
    const items = Array.isArray(section.items) ? section.items : [];
    for (const item of items) {
      if (typeof item === 'string' && item.toLowerCase().includes('weight')) {
        weightItems.push(item);
      }
    }
  }
  if (weightItems.length === 0) return null;

  // Explicit "(total)" marker wins immediately (e.g. Powerbeats)
  for (const item of weightItems) {
    const m = item.match(/\(total\)\s*([\d.]+)\s*g/i);
    if (m) return round(parseFloat(m[1]) / 1000);
  }

  // Parse each weight row in order of reliability
  const kgValues = [];
  for (const item of weightItems) {
    // kg in parentheses: "9.87 pounds (4.48 kg)⁴ ..."  — most reliable
    const kgParen = item.match(/\(([\d.]+)\s*kg\)/i);
    if (kgParen) { kgValues.push(parseFloat(kgParen[1])); continue; }

    // bare kg after colon or "weight": "Weight: 0.230 kg"
    const kgColon = item.match(/(?:weight|:)\s*([\d.]+)\s*kg\b/i);
    if (kgColon) { kgValues.push(parseFloat(kgColon[1])); continue; }

    // any kg value
    const kgAny = item.match(/([\d.]+)\s*kg/i);
    if (kgAny) { kgValues.push(parseFloat(kgAny[1])); continue; }

    // grams in parentheses: "(66 g)²" or "(19.15 grams)"
    const gParen = item.match(/\(([\d.]+)\s*g(?:rams?)?\)/i);
    if (gParen) { kgValues.push(parseFloat(gParen[1]) / 1000); continue; }

    // "oz. / 42.1 g" — slash-separated oz / g listing
    const gSlash = item.match(/\/\s*([\d.]+)\s*g(?:\s|$)/i);
    if (gSlash) { kgValues.push(parseFloat(gSlash[1]) / 1000); continue; }

    // bare grams: "69g" or "49.75 g"  (guard > 1 to skip noise)
    const gBare = item.match(/([\d.]+)\s*g(?:rams?)?\b/i);
    if (gBare && parseFloat(gBare[1]) > 1) {
      kgValues.push(parseFloat(gBare[1]) / 1000);
    }
  }

  if (kgValues.length === 0) return null;
  // Single value → return it; multiple (separate components) → sum them
  return round(kgValues.reduce((a, b) => a + b, 0));
}

function round(n) { return Math.round(n * 10000) / 10000; }

async function run() {
  const { rows } = await pool.queryR(
    'SELECT id, name, tech_specs FROM products WHERE tech_specs IS NOT NULL AND tech_specs != \'[]\'::jsonb',
  );
  console.log(`\nParsing weights for ${rows.length} products…\n`);

  let updated = 0, skipped = 0;
  for (const row of rows) {
    const kg = parseWeightKg(row.tech_specs);
    const label = (row.name || '').slice(0, 60).padEnd(62);
    if (kg !== null && kg > 0) {
      await pool.queryR('UPDATE products SET weight_kg = $1 WHERE id = $2', [kg, row.id]);
      console.log(`  ✓  ${label}  ${kg} kg`);
      updated++;
    } else {
      console.log(`  –  ${label}  (no weight found)`);
      skipped++;
    }
  }

  console.log(`\n──────────────────────────────────────`);
  console.log(`  Updated : ${updated}`);
  console.log(`  Skipped : ${skipped}`);
  console.log(`──────────────────────────────────────\n`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
