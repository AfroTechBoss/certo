import { describe, it, expect } from 'vitest';
import {
  toAxes,
  defaultSelection,
  totalPriceUsd,
  activeImages,
  selectionInStock,
  buildCartVariant,
} from '../variants.js';

describe('toAxes — normalise legacy {colors, storages} to {axes}', () => {
  it('returns the existing axes array unchanged when already in new shape', () => {
    const axes = [{ id: 'chip', label: 'Chip', options: [{ id: 'm5', name: 'M5', price_delta_usd: 0, in_stock: true }] }];
    expect(toAxes({ axes }, 1000)).toEqual(axes);
  });

  it('converts {colors, storages} to two axes', () => {
    const result = toAxes({
      colors:   [{ id: 'silver', name: 'Silver', hex: '#E3E3E3', images: ['x'] }],
      storages: [
        { id: '256', size: '256GB', price_usd: 1000 },
        { id: '512', size: '512GB', price_usd: 1200 },
      ],
    }, 1000);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('color');
    expect(result[0].options[0].hex).toBe('#E3E3E3');
    expect(result[1].id).toBe('storage');
    // Old 256GB was the base ($1000) → delta = 0; 512GB was +$200
    expect(result[1].options[0].price_delta_usd).toBe(0);
    expect(result[1].options[1].price_delta_usd).toBe(200);
  });

  it('handles strings-of-newlines image format from the admin textarea', () => {
    const result = toAxes({
      colors: [{ id: 'a', name: 'A', images: 'url1\nurl2\n' }],
    }, 1000);
    expect(result[0].options[0].images).toEqual(['url1', 'url2']);
  });

  it('returns empty array when no variants', () => {
    expect(toAxes(null, 0)).toEqual([]);
    expect(toAxes({}, 0)).toEqual([]);
  });
});

describe('defaultSelection picks first in-stock option per axis', () => {
  it('skips out-of-stock options', () => {
    const axes = [{
      id: 'chip', label: 'Chip',
      options: [
        { id: 'm5',     name: 'M5',     in_stock: false },
        { id: 'm5-pro', name: 'M5 Pro', in_stock: true  },
      ],
    }];
    expect(defaultSelection(axes)).toEqual({ chip: 'm5-pro' });
  });

  it('falls back to first option if all are out of stock', () => {
    const axes = [{
      id: 'chip', label: 'Chip',
      options: [
        { id: 'm5',     name: 'M5',     in_stock: false },
        { id: 'm5-pro', name: 'M5 Pro', in_stock: false },
      ],
    }];
    expect(defaultSelection(axes)).toEqual({ chip: 'm5' });
  });
});

describe('totalPriceUsd — additive across axes', () => {
  const axes = [
    { id: 'chip',   label: 'Chip',   options: [{ id: 'm5', name: 'M5', price_delta_usd: 0 }, { id: 'm5-pro', name: 'M5 Pro', price_delta_usd: 200 }] },
    { id: 'screen', label: 'Screen', options: [{ id: '14', name: '14"', price_delta_usd: 0 }, { id: '16', name: '16"', price_delta_usd: 300 }] },
    { id: 'ssd',    label: 'SSD',    options: [{ id: '512', name: '512GB', price_delta_usd: 0 }, { id: '1tb', name: '1TB', price_delta_usd: 200 }] },
  ];

  it('returns base when nothing selected', () => {
    expect(totalPriceUsd(1599, axes, {})).toBe(1599);
  });
  it('adds deltas for every selected option', () => {
    expect(totalPriceUsd(1599, axes, { chip: 'm5-pro', screen: '16', ssd: '1tb' })).toBe(1599 + 200 + 300 + 200);
  });
  it('falls back to 0 when base price is missing', () => {
    expect(totalPriceUsd(undefined, axes, { chip: 'm5-pro' })).toBe(200);
  });
});

describe('activeImages — first axis with images wins', () => {
  it('returns the selected colour-axis images', () => {
    const axes = [
      { id: 'color', label: 'Color', options: [
        { id: 'silver', name: 'Silver', images: ['silver1', 'silver2'] },
        { id: 'space',  name: 'Space',  images: ['space1'] },
      ]},
    ];
    expect(activeImages(axes, { color: 'space' })).toEqual(['space1']);
  });
  it('returns null when no axis has images', () => {
    expect(activeImages([{ id: 'chip', label: 'Chip', options: [{ id: 'm5', name: 'M5' }] }], { chip: 'm5' })).toBeNull();
  });
});

describe('selectionInStock — every selected option must be in stock', () => {
  const axes = [
    { id: 'a', label: 'A', options: [{ id: 'a1', name: 'A1', in_stock: true }, { id: 'a2', name: 'A2', in_stock: false }] },
    { id: 'b', label: 'B', options: [{ id: 'b1', name: 'B1', in_stock: true }] },
  ];
  it('passes when every selected option is in stock', () => {
    expect(selectionInStock(axes, { a: 'a1', b: 'b1' })).toBe(true);
  });
  it('fails when any selected option is out of stock', () => {
    expect(selectionInStock(axes, { a: 'a2', b: 'b1' })).toBe(false);
  });
});

describe('buildCartVariant — produces a cart-friendly summary', () => {
  it('records every axis selection and exposes color/storage at top level for legacy code', () => {
    const axes = [
      { id: 'color',   label: 'Color',   options: [{ id: 'silver', name: 'Silver', hex: '#E3E3E3', price_delta_usd: 0 }] },
      { id: 'storage', label: 'Storage', options: [{ id: '1tb',    name: '1TB',    price_delta_usd: 200 }] },
      { id: 'chip',    label: 'Chip',    options: [{ id: 'm5pro',  name: 'M5 Pro', price_delta_usd: 300 }] },
    ];
    const cart = buildCartVariant(axes, { color: 'silver', storage: '1tb', chip: 'm5pro' }, 1599 + 0 + 200 + 300);
    expect(cart.color).toBe('Silver');
    expect(cart.color_hex).toBe('#E3E3E3');
    expect(cart.storage).toBe('1TB');
    expect(cart.selection.chip.value).toBe('M5 Pro');
    expect(cart.price_usd).toBe(2099);
    expect(cart.id).toBe('silver_1tb_m5pro');
  });
});
