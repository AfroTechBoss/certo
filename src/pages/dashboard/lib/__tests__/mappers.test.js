import { describe, it, expect } from 'vitest';
import { mapOrder, mapProduct, mapCoupon, buildRevenueSeries } from '../mappers.js';

// These mappers stand between the API's snake_case payload and the dashboard's
// camelCase UI shape. Any breakage here means orders, products, or coupons
// render with garbled data — silently. Tests guard the contract.

describe('mapOrder', () => {
  const baseRow = {
    id: 'CRT-052926-7896',
    customer_name: 'Adaeze Okoye',
    customer_phone: '+234 800 000 0000',
    customer_email: 'adaeze@example.com',
    product_name: 'iPhone 15 Pro',
    product_subtitle: '256GB · Natural Titanium',
    apple_url: 'https://apple.com/...',
    product_image_url: '',
    status: 'Order Confirmed',
    payment_method: 'Flutterwave',
    ngn_price: '1745820',
    usd_price: '1098',
    flagged: false,
    admin_hidden: false,
    address: '14 Karimu Kotun St',
    state: 'Lagos',
    created_at: '2026-05-29T10:00:00Z',
  };

  it('coerces string prices to numbers (Postgres NUMERIC returns strings)', () => {
    const o = mapOrder(baseRow);
    expect(o.ngn).toBe(1745820);
    expect(o.usd).toBe(1098);
    expect(typeof o.ngn).toBe('number');
    expect(typeof o.usd).toBe('number');
  });

  it('synthesises a single-item items array when items is missing', () => {
    const o = mapOrder(baseRow);
    expect(Array.isArray(o.items)).toBe(true);
    expect(o.items).toHaveLength(1);
    expect(o.items[0].name).toBe('iPhone 15 Pro');
    expect(o.items[0].usd_price).toBe(1098);
  });

  it('preserves the API items array when present', () => {
    const o = mapOrder({
      ...baseRow,
      items: [
        { name: 'iPhone 15 Pro',  usd_price: 1098, qty: 1 },
        { name: 'AirPods Pro 2', usd_price: 249,  qty: 1 },
      ],
    });
    expect(o.items).toHaveLength(2);
    expect(o.items[1].name).toBe('AirPods Pro 2');
  });

  it('joins address + state into a display string', () => {
    expect(mapOrder(baseRow).address).toBe('14 Karimu Kotun St, Lagos');
    expect(mapOrder({ ...baseRow, state: null }).address).toBe('14 Karimu Kotun St');
    expect(mapOrder({ ...baseRow, address: null, state: null }).address).toBe('—');
  });

  it('exposes flagged + admin_hidden as booleans', () => {
    const flagged = mapOrder({ ...baseRow, flagged: true, admin_hidden: true });
    expect(flagged.flag).toBe(true);
    expect(flagged.admin_hidden).toBe(true);
  });

  it('defaults payment_method to "Paystack" when missing', () => {
    const o = mapOrder({ ...baseRow, payment_method: undefined });
    expect(o.payment_method).toBe('Paystack');
  });
});

describe('mapProduct', () => {
  const baseRow = {
    id: 'prod-abc123',
    name: 'iPhone 15 Pro',
    subtitle: '256GB · Natural Titanium',
    category: 'iPhone',
    condition: 'New',
    usd_price: '1098',
    stock_count: '5',
    listing_status: 'live',
    featured: true,
    sort_order: 3,
    code: 10042,
    in_stock: true,
  };

  it('renames category → type for dashboard consumers', () => {
    expect(mapProduct(baseRow).type).toBe('iPhone');
  });

  it('coerces numeric strings (usd_price, stock_count) to numbers', () => {
    const p = mapProduct(baseRow);
    expect(p.usdPrice).toBe(1098);
    expect(p.stock).toBe(5);
  });

  it('stringifies the 5-digit code (UI displays it as text)', () => {
    expect(mapProduct(baseRow).code).toBe('10042');
    expect(typeof mapProduct(baseRow).code).toBe('string');
  });

  it('returns code=null when the product has no code yet', () => {
    expect(mapProduct({ ...baseRow, code: null }).code).toBeNull();
  });

  it('inStock is true unless in_stock is explicitly false', () => {
    expect(mapProduct({ ...baseRow, in_stock: undefined }).inStock).toBe(true);
    expect(mapProduct({ ...baseRow, in_stock: false }).inStock).toBe(false);
  });
});

describe('mapCoupon', () => {
  it('renames DB columns to the dashboard shape (discount_type → type, etc.)', () => {
    const c = mapCoupon({
      id: 1, code: 'SAVE20',
      discount_type: 'percent', discount_value: '20',
      applies_to: 'all', is_active: true,
      used_count: '3', max_uses: '50',
      expires_at: null,
    });
    expect(c.type).toBe('percent');
    expect(c.value).toBe(20);
    expect(c.active).toBe(true);
    expect(c.uses).toBe(3);
    expect(c.max_uses).toBe(50);
  });

  it('handles "no expiry" gracefully', () => {
    const c = mapCoupon({ id: 1, code: 'TEST', expires_at: null });
    expect(c.expires).toBe('No expiry');
    expect(c.expires_raw).toBeNull();
  });
});

describe('buildRevenueSeries', () => {
  it('always returns 7 buckets (today + 6 days back), even with no orders', () => {
    const series = buildRevenueSeries([]);
    expect(series).toHaveLength(7);
    expect(series.every(d => d.ngn === 0)).toBe(true);
  });

  it('handles null input gracefully', () => {
    const series = buildRevenueSeries(null);
    expect(series).toHaveLength(7);
  });

  it('skips orders without a created_at (avoids "Invalid Date" buckets)', () => {
    const series = buildRevenueSeries([
      { ngn_price: 100_000 },                     // no created_at
      { ngn_price: 200_000, created_at: null },   // null
    ]);
    expect(series.reduce((s, d) => s + d.ngn, 0)).toBe(0);
  });
});
