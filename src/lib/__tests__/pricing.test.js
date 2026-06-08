import { describe, it, expect } from 'vitest';
import { calcCouponDiscount, calcOrderTotal, SERVICE_FEE, DANGEROUS_FEE_UNIT } from '../pricing.js';

// ─── Test fixtures ───────────────────────────────────────────────────────────
const RATE = 1590; // ₦ per $1 — typical Certo rate

// A "small order": 1 iPhone @ $1000 + AppleCare $99 + 1 dangerous goods fee +
// $20 delivery. Numbers chosen so all components are non-trivial.
const smallParts = {
  itemsSubtotal:  1099,   // $1000 + $99 AppleCare
  dangerousFee:   DANGEROUS_FEE_UNIT,  // 1 unit
  deliveryFeeUsd: 20,
};
// Expected gross before any coupon: 1099 + 35 + 40 + 20 = 1194

describe('calcCouponDiscount', () => {
  it('returns 0 when no coupon is supplied', () => {
    expect(calcCouponDiscount(null, smallParts, RATE)).toBe(0);
    expect(calcCouponDiscount(undefined, smallParts, RATE)).toBe(0);
  });

  it('percent coupon on "all" discounts the full order base', () => {
    const coupon = { discount_type: 'percent', discount_value: 10, applies_to: 'all' };
    // 10% of (1099 + 35 + 40 + 20) = 119.40
    expect(calcCouponDiscount(coupon, smallParts, RATE)).toBeCloseTo(119.40, 2);
  });

  it('percent coupon on "product" only discounts the items subtotal', () => {
    const coupon = { discount_type: 'percent', discount_value: 10, applies_to: 'product' };
    // 10% of 1099 = 109.90
    expect(calcCouponDiscount(coupon, smallParts, RATE)).toBeCloseTo(109.90, 2);
  });

  it('percent coupon on "service" only takes 10% of $35', () => {
    const coupon = { discount_type: 'percent', discount_value: 10, applies_to: 'service' };
    expect(calcCouponDiscount(coupon, smallParts, RATE)).toBeCloseTo(3.50, 2);
  });

  it('percent coupon on "fees" sums service + delivery', () => {
    const coupon = { discount_type: 'percent', discount_value: 10, applies_to: 'fees' };
    // 10% of (35 + 20) = 5.50
    expect(calcCouponDiscount(coupon, smallParts, RATE)).toBeCloseTo(5.50, 2);
  });

  it('unknown applies_to value falls back to "all"', () => {
    const coupon = { discount_type: 'percent', discount_value: 10, applies_to: 'pizza' };
    expect(calcCouponDiscount(coupon, smallParts, RATE)).toBeCloseTo(119.40, 2);
  });

  // ── The bug regression test ────────────────────────────────────────────────
  // 2026-06-02: a ₦100,000 fixed coupon was treated as $100,000 and wiped the
  // whole order. Fix: convert NGN → USD at the locked rate first.
  it('fixed coupon: ₦100,000 converts to ~$62.89 at 1590, not $100,000', () => {
    const coupon = { discount_type: 'fixed', discount_value: 100_000, applies_to: 'all' };
    const result = calcCouponDiscount(coupon, smallParts, RATE);
    // 100000 / 1590 = 62.8930...
    expect(result).toBeCloseTo(62.89, 2);
    // CRITICAL: must NOT wipe the order
    expect(result).toBeLessThan(smallParts.itemsSubtotal);
  });

  it('fixed coupon is clamped to the applicable base (cannot go negative)', () => {
    // ₦5,000,000 ≈ $3144 — much bigger than the $1194 order. Should clamp to the base.
    const coupon = { discount_type: 'fixed', discount_value: 5_000_000, applies_to: 'all' };
    const base = smallParts.itemsSubtotal + SERVICE_FEE + smallParts.dangerousFee + smallParts.deliveryFeeUsd;
    expect(calcCouponDiscount(coupon, smallParts, RATE)).toBeCloseTo(base, 2);
  });

  it('fixed coupon at rate=0 returns 0 (no division-by-zero crash)', () => {
    const coupon = { discount_type: 'fixed', discount_value: 100_000, applies_to: 'all' };
    expect(calcCouponDiscount(coupon, smallParts, 0)).toBe(0);
  });
});

describe('calcOrderTotal', () => {
  it('with no coupon: USD = items + service + dangerous + delivery', () => {
    const { totalUsd, totalNgn, discountUsd } = calcOrderTotal(smallParts, null, RATE);
    expect(totalUsd).toBeCloseTo(1194, 2);   // 1099 + 35 + 40 + 20
    expect(totalNgn).toBeCloseTo(1194 * RATE, 0);
    expect(discountUsd).toBe(0);
  });

  it('with 10% off "all", USD reduces by 10% of subtotal', () => {
    const coupon = { discount_type: 'percent', discount_value: 10, applies_to: 'all' };
    const { totalUsd } = calcOrderTotal(smallParts, coupon, RATE);
    expect(totalUsd).toBeCloseTo(1194 * 0.9, 2);
  });

  it('with a ₦100,000 fixed coupon on "all", customer still pays meaningful money', () => {
    // Regression of the bug — verify the WHOLE pipeline (not just the discount fn)
    const coupon = { discount_type: 'fixed', discount_value: 100_000, applies_to: 'all' };
    const { totalUsd, totalNgn } = calcOrderTotal(smallParts, coupon, RATE);
    // 1194 - 62.89 ≈ 1131.11
    expect(totalUsd).toBeCloseTo(1131.11, 1);
    // Must NOT be ~0 NGN
    expect(totalNgn).toBeGreaterThan(1_700_000); // > ₦1.7M
  });

  it('never returns a negative total', () => {
    // Comically-large coupon clamped to base → total clamped to 0
    const coupon = { discount_type: 'fixed', discount_value: 999_999_999, applies_to: 'all' };
    const { totalUsd, totalNgn } = calcOrderTotal(smallParts, coupon, RATE);
    expect(totalUsd).toBeGreaterThanOrEqual(0);
    expect(totalNgn).toBeGreaterThanOrEqual(0);
  });

  it('empty cart with no coupon = just the service fee', () => {
    const emptyParts = { itemsSubtotal: 0, dangerousFee: 0, deliveryFeeUsd: 0 };
    const { totalUsd } = calcOrderTotal(emptyParts, null, RATE);
    expect(totalUsd).toBe(SERVICE_FEE);
  });
});
