// ─── Variants — shared schema + helpers ──────────────────────────────────────
//
// Certo's variant model is "N independent axes, additive pricing":
//
//   product.variants = {
//     axes: [
//       {
//         id:    'chip',                 // stable slug
//         label: 'Chip',                  // shown to the customer
//         options: [
//           {
//             id:               'm5-pro',           // stable
//             name:             'M5 Pro',           // shown
//             price_delta_usd:  200,                // added to base price
//             in_stock:         true,
//
//             // Only meaningful when this axis is a "color/finish" — driven by
//             // whether `hex` is present. The shop renders a swatch.
//             hex:              '#1F1F1F',
//             // Only meaningful for the image-driving axis (typically color).
//             // Each entry is a URL the shop sends through /api/img.
//             images:           ['https://...'],
//           },
//           ...
//         ],
//       },
//       ...
//     ],
//   }
//
// Final price = product.base_usd_price (or product.usdPrice / usd_price)
//             + Σ option.price_delta_usd for every selected option
//
// Out-of-stock options are rendered as disabled chips and block "Add to cart".
//
// Backward compatibility — there's an older shape still in the DB:
//   product.variants = { colors: [...], storages: [...] }
//
// `toAxes()` accepts either shape and always returns the new {axes} form, so
// the rest of the codebase never has to branch on shape.

// ── normalise old → new shape ───────────────────────────────────────────────
export function toAxes(variants, basePrice) {
  if (!variants || typeof variants !== 'object') return [];

  // New shape: already a list of axes
  if (Array.isArray(variants.axes)) return variants.axes;

  // Old shape: {colors, storages}
  const axes = [];
  if (Array.isArray(variants.colors) && variants.colors.length) {
    axes.push({
      id:    'color',
      label: 'Color',
      options: variants.colors.map(c => ({
        id:              c.id || c.name,
        name:            c.name || '',
        hex:             c.hex || null,
        images:          Array.isArray(c.images) ? c.images : (typeof c.images === 'string' ? c.images.split('\n').map(s => s.trim()).filter(Boolean) : []),
        price_delta_usd: 0,
        in_stock:        c.in_stock !== false,
      })),
    });
  }
  if (Array.isArray(variants.storages) && variants.storages.length) {
    // The old shape put the *absolute* price on each storage option; convert
    // to a delta against the base price so the new additive maths still works.
    const base = Number(basePrice) || 0;
    axes.push({
      id:    'storage',
      label: 'Storage',
      options: variants.storages.map(s => ({
        id:              s.id || s.size,
        name:            s.size || s.name || '',
        price_delta_usd: Number(s.price_usd ?? base) - base,
        in_stock:        s.in_stock !== false,
      })),
    });
  }
  return axes;
}

// ── pick a default selection (first in-stock option per axis) ────────────────
export function defaultSelection(axes) {
  const sel = {};
  for (const axis of axes) {
    const firstInStock = axis.options.find(o => o.in_stock !== false) || axis.options[0];
    if (firstInStock) sel[axis.id] = firstInStock.id;
  }
  return sel;
}

// ── resolve { axisId → optionId } → array of full option objects ─────────────
export function resolveSelection(axes, selection) {
  const out = [];
  for (const axis of axes) {
    const opt = axis.options.find(o => o.id === selection?.[axis.id]);
    if (opt) out.push({ axis, option: opt });
  }
  return out;
}

// ── compute price ───────────────────────────────────────────────────────────
export function totalPriceUsd(basePrice, axes, selection) {
  let total = Number(basePrice) || 0;
  for (const { option } of resolveSelection(axes, selection)) {
    total += Number(option.price_delta_usd) || 0;
  }
  return total;
}

// ── find the "image-driving" axis (first axis whose options have images) ────
// Returns the active option's images, or null. Used by the gallery.
export function activeImages(axes, selection) {
  for (const axis of axes) {
    const opt = axis.options.find(o => o.id === selection?.[axis.id]);
    if (opt && Array.isArray(opt.images) && opt.images.length) return opt.images;
  }
  return null;
}

// ── stock check (returns false if any selected option is out of stock) ──────
export function selectionInStock(axes, selection) {
  for (const { option } of resolveSelection(axes, selection)) {
    if (option.in_stock === false) return false;
  }
  return true;
}

// ── build a cart "variant" record summarising the selection ─────────────────
export function buildCartVariant(axes, selection, totalUsd) {
  const resolved = resolveSelection(axes, selection);
  return {
    id:        resolved.map(({ option }) => option.id).join('_') || 'default',
    selection: resolved.reduce((acc, { axis, option }) => {
      acc[axis.id] = { name: axis.label, value: option.name, optionId: option.id };
      return acc;
    }, {}),
    price_usd: totalUsd,
    // Convenience: also expose color/storage names at the top level so any
    // legacy code that reads variant.color / variant.storage still works.
    color:     resolved.find(({ axis }) => axis.id === 'color')?.option?.name   || null,
    color_hex: resolved.find(({ axis }) => axis.id === 'color')?.option?.hex    || null,
    storage:   resolved.find(({ axis }) => axis.id === 'storage')?.option?.name || null,
  };
}

