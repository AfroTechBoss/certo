// ─── Product marketing-code generator ────────────────────────────────────────
//
// 5-digit codes are printed on receipts + used in social-media campaigns so
// they need to be:
//   1. Stable (reused codes confuse customers tracking old orders)
//   2. Compact (10000-99999 — 90k slots)
//   3. Reusable AFTER a product is deleted (so we don't run out)
//
// The "lowest available" algorithm gives all three: when product #10004 is
// deleted, the next new product gets code #10004 again.

/**
 * Given an array of already-used codes, return the lowest unused integer in
 * [10000, 99999]. Throws when the pool is exhausted.
 *
 * @param {Array<number|string>} usedCodes — values from products.code (DB row)
 * @returns {number} the lowest unused 5-digit code
 */
function pickNextCode(usedCodes) {
  const used = new Set((usedCodes || []).map(Number).filter(n => Number.isFinite(n)));
  for (let c = 10000; c <= 99999; c++) {
    if (!used.has(c)) return c;
  }
  throw new Error('No available 5-digit product codes');
}

module.exports = { pickNextCode };
