// ─── Pricing helpers (pure, testable) ────────────────────────────────────────
//
// Constants and pure functions that compute order totals + coupon discounts.
// Single source of truth — used by Checkout.jsx (UI) and the test suite.
//
// All amounts are in USD unless the variable name ends in Ngn.

export const SERVICE_FEE        = 35;   // USD — flat per order
export const DANGEROUS_FEE_UNIT = 40;   // USD — per unit (lithium battery carriage surcharge)

// ────────────────────────────────────────────────────────────────────────────
// Coupon discount
// ────────────────────────────────────────────────────────────────────────────
//
// applies_to options:
//   'all'      → discount applies against (itemsSubtotal + service + dangerous + delivery)
//   'product'  → only itemsSubtotal
//   'service'  → only the $35 service fee
//   'delivery' → only the delivery fee
//   'fees'     → service + delivery (excludes products and dangerous goods)
//
// discount_type:
//   'percent' → value is the percentage (e.g. 10 = 10% off)
//   'fixed'   → value is in NGN (we store coupon amounts as ₦). We convert to USD
//               at `rate` before applying. This is the bug we hit on 2026-06-02:
//               a ₦100,000 fixed coupon was being treated as $100,000 and wiping
//               the entire order. There's a test for this case in the suite.
//
// Always clamps the resulting discount to the discountable base (you can't
// discount more than the base allows).

export function calcCouponDiscount(coupon, parts, rate) {
  if (!coupon) return 0;

  const { itemsSubtotal = 0, deliveryFeeUsd = 0, dangerousFee = 0 } = parts;
  const at = coupon.applies_to;

  let base;
  switch (at) {
    case 'product':  base = itemsSubtotal; break;
    case 'delivery': base = deliveryFeeUsd; break;
    case 'service':  base = SERVICE_FEE; break;
    case 'fees':     base = SERVICE_FEE + deliveryFeeUsd; break;
    case 'all':
    default:         base = itemsSubtotal + SERVICE_FEE + dangerousFee + deliveryFeeUsd;
  }

  if (coupon.discount_type === 'fixed') {
    // discount_value is in NGN — convert to USD using the locked rate
    const discountUsd = rate > 0 ? Number(coupon.discount_value) / rate : 0;
    return Math.min(discountUsd, base);
  }

  // percent
  const pct = Number(coupon.discount_value) / 100;
  return Math.max(0, base * pct);
}

// ────────────────────────────────────────────────────────────────────────────
// Order total (USD + NGN)
// ────────────────────────────────────────────────────────────────────────────
//
// parts must include:
//   itemsSubtotal  (USD)
//   dangerousFee   (USD, computed as qty * DANGEROUS_FEE_UNIT)
//   deliveryFeeUsd (USD)
// coupon is optional. rate is ₦ per $1.

export function calcOrderTotal(parts, coupon, rate) {
  const { itemsSubtotal = 0, dangerousFee = 0, deliveryFeeUsd = 0 } = parts;
  const discount = calcCouponDiscount(coupon, parts, rate);

  const subtotalUsd = itemsSubtotal + SERVICE_FEE + dangerousFee + deliveryFeeUsd;
  const totalUsd    = Math.max(0, subtotalUsd - discount);
  const totalNgn    = totalUsd * rate;

  return { totalUsd, totalNgn, discountUsd: discount };
}
