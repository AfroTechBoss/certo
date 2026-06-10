import { useState, useEffect } from 'react';
import { Modal } from '../components/Modal.jsx';
import { authFetch } from '../lib/auth.js';
import { PROD_CATS } from '../lib/constants.js';
import { inputS, primaryBtn, actionBtn } from '../lib/styles.js';
import { toAxes } from '../../../lib/variants.js';

// Edit an existing product. Loads the full product from /api/products/:id
// then PATCHes it back. NOTE: this does NOT re-apply the +7% margin —
// stored prices already include the markup (the create modal applies it once).
//
// onDone receives the raw API row.

export function ProductEditModal({ productId, onClose, onDone }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading,   setLoading]   = useState(true);
  const [form,      setForm]      = useState(null);
  const [busy,      setBusy]      = useState(false);
  const [err,       setErr]       = useState('');

  const rate = (() => {
    try { return parseInt(localStorage.getItem('certo_rate') || '1590', 10) || 1590; }
    catch (_) { return 1590; }
  })();

  useEffect(() => {
    authFetch(`/api/products/${productId}`)
      .then(r => r.json())
      .then(p => {
        // Auto-convert any legacy {colors, storages} shape to the new {axes} shape.
        // For axis-image data, also convert images-array into the newline-joined
        // string the textarea expects.
        const axes = toAxes(p.variants, p.usd_price).map(ax => ({
          ...ax,
          options: ax.options.map(o => ({
            ...o,
            images: Array.isArray(o.images) ? o.images.join('\n') : (o.images || ''),
          })),
        }));

        setForm({
          name:           p.name           || '',
          subtitle:       p.subtitle       || '',
          category:       p.category       || 'iPhone',
          usd_price:      p.usd_price      ?? 0,
          stock_count:    p.stock_count    ?? 0,
          in_stock:       p.in_stock       !== false,
          condition:      p.condition      || 'New',
          condition_note: p.condition_note || '',
          listing_status: p.listing_status || 'live',
          featured:       p.featured       || false,
          badge:          p.badge          || '',
          delivery_days:  p.delivery_days  || '',
          apple_url:      p.apple_url      || '',
          image_urls:     Array.isArray(p.image_urls)  ? p.image_urls  : [],
          overview:       Array.isArray(p.overview)    ? p.overview    : [],
          specs:          Array.isArray(p.specs)       ? p.specs       : [],
          includes:       Array.isArray(p.includes)    ? p.includes    : [],
          features:       Array.isArray(p.features)    ? p.features    : [],
          tech_specs:     Array.isArray(p.tech_specs)  ? p.tech_specs  : [],
          variants:       { axes },
        });
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, [productId]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── list-field helpers ────────────────────────────────────────────────────
  const addItem    = (key)         => set(key, [...form[key], '']);
  const setItem    = (key, i, val) => set(key, form[key].map((v, j) => j === i ? val : v));
  const removeItem = (key, i)      => set(key, form[key].filter((_, j) => j !== i));

  // ── N-axis variant helpers ────────────────────────────────────────────────
  // The form keeps axes as an array under form.variants.axes. Helpers mutate
  // immutably so React picks up the change. Slugify the label into a stable id
  // when an axis is first created; admins can rename the label freely after.
  const slug = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('axis-' + Date.now().toString(36));

  const updateAxes = (mut) => set('variants', { ...form.variants, axes: mut(form.variants.axes) });

  const addAxis = () => updateAxes(axes => [...axes, {
    id:      'axis-' + Date.now().toString(36),
    label:   '',
    options: [],
  }]);
  const removeAxis = (ai) => updateAxes(axes => axes.filter((_, j) => j !== ai));
  const setAxis    = (ai, k, v) => updateAxes(axes => axes.map((a, j) => j === ai ? { ...a, [k]: v } : a));

  const addOption    = (ai)     => updateAxes(axes => axes.map((a, j) => j !== ai ? a : { ...a, options: [...a.options, { id: 'opt-' + Date.now().toString(36), name: '', price_delta_usd: 0, in_stock: true, hex: '', images: '' }] }));
  const removeOption = (ai, oi) => updateAxes(axes => axes.map((a, j) => j !== ai ? a : { ...a, options: a.options.filter((_, k) => k !== oi) }));
  const setOption    = (ai, oi, k, v) => updateAxes(axes => axes.map((a, j) => j !== ai ? a : {
    ...a,
    options: a.options.map((o, k2) => k2 !== oi ? o : { ...o, [k]: v }),
  }));

  const submit = async () => {
    if (!form.name.trim()) { setErr('Product name is required.'); setActiveTab('basic'); return; }
    setErr(''); setBusy(true);
    try {
      // Serialise the N-axis shape: ensure ids exist, normalise option fields,
      // drop empty axes/options so the DB stays clean.
      const axes = form.variants.axes
        .map(a => ({
          id:      a.id || slug(a.label),
          label:   String(a.label || '').trim(),
          options: a.options
            .filter(o => String(o.name || '').trim().length > 0)
            .map(o => ({
              id:              o.id || slug(o.name),
              name:            String(o.name).trim(),
              price_delta_usd: Number(o.price_delta_usd) || 0,
              in_stock:        o.in_stock !== false,
              ...(o.hex ? { hex: o.hex } : {}),
              ...(typeof o.images === 'string' && o.images.trim()
                ? { images: o.images.split('\n').map(s => s.trim()).filter(Boolean) }
                : Array.isArray(o.images) && o.images.length
                  ? { images: o.images }
                  : {}),
            })),
        }))
        .filter(a => a.label && a.options.length > 0);
      const variants = axes.length ? { axes } : [];

      const res = await authFetch(`/api/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name:           form.name.trim(),
          subtitle:       form.subtitle.trim(),
          category:       form.category,
          usd_price:      Number(form.usd_price),
          stock_count:    Number(form.stock_count),
          in_stock:       form.in_stock,
          condition:      form.condition,
          condition_note: form.condition_note,
          listing_status: form.listing_status,
          featured:       form.featured,
          badge:          form.badge.trim(),
          delivery_days:  form.delivery_days.trim(),
          apple_url:      form.apple_url.trim(),
          image_urls:     form.image_urls.filter(Boolean),
          overview:       form.overview.filter(s => s.trim()),
          specs:          form.specs.filter(s => s.trim()),
          includes:       form.includes.filter(s => s.trim()),
          features:       form.features.filter(s => s.trim()),
          tech_specs:     form.tech_specs.filter(s => s.trim()),
          variants,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || 'Update failed'); setBusy(false); return; }
      onDone(json);
      onClose();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const TABS = [
    { id: 'basic',      label: 'Basic Info' },
    { id: 'condition',  label: 'Condition' },
    { id: 'images',     label: 'Images' },
    { id: 'variants',   label: 'Variants' },
    { id: 'overview',   label: 'Overview' },
    { id: 'specs',      label: 'Quick Specs' },
    { id: 'includes',   label: "What's in the Box" },
    { id: 'features',   label: 'Features' },
    { id: 'tech_specs', label: 'Tech Specs' },
  ];

  const L  = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 };
  const I  = { ...inputS, width: '100%', boxSizing: 'border-box' };
  const TA = { ...I, resize: 'vertical', fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.6 };

  const ListEditor = ({ fieldKey, placeholder }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {form[fieldKey].map((val, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={val} onChange={e => setItem(fieldKey, i, e.target.value)} placeholder={placeholder} style={{ ...I, flex: 1 }}/>
          <button onClick={() => removeItem(fieldKey, i)} style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      ))}
      <button onClick={() => addItem(fieldKey)} style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent-tint)', color: 'var(--accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>+ Add item</button>
    </div>
  );

  return (
    <Modal
      title="Edit Product"
      subtitle={form?.name || (loading ? 'Loading…' : 'Product')}
      onClose={onClose}
      width={800}
      footer={
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={submit} disabled={busy || loading || !form} style={{ ...primaryBtn, flex: 1, opacity: (busy || loading || !form) ? 0.7 : 1 }}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
          <button onClick={onClose} style={{ ...actionBtn, flex: 1, justifyContent: 'center' }}>Cancel</button>
        </div>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>Loading product…</div>
      ) : !form ? (
        <div style={{ color: 'oklch(50% 0.18 25)', padding: '20px 0' }}>{err || 'Failed to load product.'}</div>
      ) : (
        <>
          {err && (
            <div style={{ fontSize: 12.5, color: 'oklch(50% 0.18 25)', padding: '10px 14px', background: 'oklch(97% 0.03 25)', borderRadius: 9, border: '1px solid oklch(85% 0.1 25)', marginBottom: 12 }}>
              {err}
            </div>
          )}

          <div style={{ display: 'flex', gap: 0, minHeight: 480 }}>
            {/* Sidebar */}
            <div style={{ width: 168, flexShrink: 0, borderRight: '1px solid var(--border)', marginLeft: -20, marginTop: -20, marginBottom: -20, paddingTop: 8 }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '9px 16px', fontSize: 13.5, border: 'none', cursor: 'pointer', borderRadius: 0,
                  fontWeight: activeTab === t.id ? 700 : 400,
                  color:      activeTab === t.id ? 'var(--accent)' : 'var(--text)',
                  background: activeTab === t.id ? 'var(--accent-tint)' : 'transparent',
                  fontFamily: 'var(--font-body)',
                }}>{t.label}</button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeTab === 'basic' && <>
                <div><label style={L}>Product Name</label><input value={form.name} onChange={e => set('name', e.target.value)} style={I}/></div>
                <div><label style={L}>Subtitle / Storage / Color</label><input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="e.g. 256GB · Desert Titanium" style={I}/></div>
                <div>
                  <label style={L}>Category</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)} style={{ ...I, cursor: 'pointer' }}>
                    {PROD_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={L}>USD Price</label><input type="number" min="0" step="0.01" value={form.usd_price} onChange={e => set('usd_price', e.target.value)} style={I}/></div>
                  <div><label style={L}>Stock Count</label><input type="number" min="0" value={form.stock_count} onChange={e => set('stock_count', e.target.value)} style={I}/></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={L}>Condition</label>
                    <select value={form.condition} onChange={e => set('condition', e.target.value)} style={{ ...I, cursor: 'pointer' }}>
                      <option value="New">New</option>
                      <option value="Refurb">Refurb</option>
                    </select>
                  </div>
                  <div>
                    <label style={L}>Listing Status</label>
                    <select value={form.listing_status} onChange={e => set('listing_status', e.target.value)} style={{ ...I, cursor: 'pointer' }}>
                      <option value="live">🟢 Live (on sale)</option>
                      <option value="out_of_stock">Out of stock</option>
                      <option value="coming_soon">Coming soon</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={L}>Badge Label</label><input value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="e.g. New model" style={I}/></div>
                  <div><label style={L}>Delivery Estimate</label><input value={form.delivery_days} onChange={e => set('delivery_days', e.target.value)} placeholder="10–18 business days" style={I}/></div>
                </div>
                <div><label style={L}>Apple.com URL</label><input value={form.apple_url} onChange={e => set('apple_url', e.target.value)} placeholder="https://www.apple.com/shop/buy-iphone/…" style={I}/></div>
                <div style={{ display: 'flex', gap: 20, padding: '10px 14px', background: 'var(--bg-alt)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={form.in_stock} onChange={e => set('in_stock', e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--accent)' }}/>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>In stock</span>
                  </label>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--accent)' }}/>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Featured ★</span>
                  </label>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 12px', background: 'var(--bg-alt)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  {form.usd_price ? <>
                    Customers see: <strong style={{ color: 'var(--text)' }}>${(Number(form.usd_price) * 1.07).toFixed(2)}</strong>
                    {' · '}₦{Math.round(Number(form.usd_price) * 1.07 * rate).toLocaleString('en-NG')}
                    <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--accent)' }}>+7% margin applied</span>
                  </> : 'Enter a price to see customer-facing amount'}
                </div>
              </>}

              {activeTab === 'condition' && (
                <div>
                  <label style={L}>Condition Note (shown on product page)</label>
                  <textarea value={form.condition_note} onChange={e => set('condition_note', e.target.value)} rows={7} style={TA}/>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.65 }}>
                    This text appears in the condition box on the product detail page. Describe sourcing, warranty status, and any cosmetic notes.
                  </div>
                </div>
              )}

              {activeTab === 'images' && (
                <div>
                  <label style={L}>Image URLs (one per line)</label>
                  <ListEditor fieldKey="image_urls" placeholder="https://store.storeimages.cdn-apple.com/…"/>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.65 }}>
                    The first image is the main display image; additional images appear as thumbnails in the gallery.
                  </div>
                </div>
              )}

              {activeTab === 'variants' && <>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.65, padding: '10px 14px', background: 'var(--bg-alt)', borderRadius: 9, border: '1px solid var(--border)' }}>
                  Add one axis per choice the customer has to make. Each option's <strong>price delta</strong> is added to the base USD price above — e.g. <em>M5 Pro: +$200</em>. Final price = base + sum of selected deltas across all axes (matches how Apple's configurator works).
                  <br/><br/>
                  Tick <strong>Hex / image fields</strong> on a colour axis so the shop renders swatches and swaps gallery images when the customer changes colour.
                </div>

                {form.variants.axes.map((ax, ai) => {
                  const isColorAxis = ax.options.some(o => o.hex);
                  return (
                    <div key={ax.id || ai} style={{ padding: 16, background: 'var(--bg-alt)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ ...L, marginBottom: 4 }}>Axis label</label>
                          <input value={ax.label} onChange={e => setAxis(ai, 'label', e.target.value)} placeholder="Chip / Screen / RAM / SSD / Color…" style={I}/>
                        </div>
                        <button onClick={() => removeAxis(ai)} style={{ alignSelf: 'flex-end', padding: '6px 12px', borderRadius: 8, border: '1px solid oklch(85% 0.1 25)', background: 'transparent', color: 'oklch(50% 0.18 25)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Remove axis</button>
                      </div>

                      {ax.options.map((o, oi) => (
                        <div key={o.id || oi} style={{ padding: 12, background: 'var(--bg)', borderRadius: 9, border: '1px solid var(--border)', marginBottom: 8 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr auto', gap: 8, marginBottom: 8 }}>
                            <div><label style={{ ...L, marginBottom: 4 }}>Option name</label><input value={o.name} onChange={e => setOption(ai, oi, 'name', e.target.value)} placeholder="M5 Pro / 16&quot; / 1TB" style={I}/></div>
                            <div><label style={{ ...L, marginBottom: 4 }}>Price delta (USD)</label><input type="number" step="0.01" value={o.price_delta_usd} onChange={e => setOption(ai, oi, 'price_delta_usd', e.target.value)} placeholder="0, 200, …" style={I}/></div>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
                                <input type="checkbox" checked={o.in_stock !== false} onChange={e => setOption(ai, oi, 'in_stock', e.target.checked)} style={{ width: 14, height: 14, accentColor: 'var(--accent)' }}/>
                                In stock
                              </label>
                            </div>
                          </div>

                          {/* Hex + images live on the option but only matter for colour-type axes.
                              Auto-treated as colour axis if ANY option has a hex value. */}
                          <details open={!!o.hex || isColorAxis}>
                            <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 6, userSelect: 'none' }}>
                              Hex + images (colour swatches)
                            </summary>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                              <input value={o.hex || ''} onChange={e => setOption(ai, oi, 'hex', e.target.value)} placeholder="#888888 (leave blank to skip swatch)" style={{ ...I, flex: 1 }}/>
                              <input type="color" value={/^#[0-9a-f]{6}$/i.test(o.hex || '') ? o.hex : '#888888'} onChange={e => setOption(ai, oi, 'hex', e.target.value)} style={{ width: 32, height: 34, padding: 2, border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', flexShrink: 0 }}/>
                            </div>
                            <textarea value={o.images} onChange={e => setOption(ai, oi, 'images', e.target.value)} rows={2} placeholder="One image URL per line" style={{ ...TA, marginBottom: 6 }}/>
                          </details>

                          <button onClick={() => removeOption(ai, oi)} style={{ fontSize: 12, color: 'oklch(50% 0.18 25)', border: 'none', background: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}>Remove option</button>
                        </div>
                      ))}

                      <button onClick={() => addOption(ai)} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add option</button>
                    </div>
                  );
                })}

                <button onClick={addAxis} style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid var(--accent)', background: 'var(--accent-tint)', color: 'var(--accent)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add axis</button>
              </>}

              {activeTab === 'overview'   && <><label style={L}>Overview Bullets</label><ListEditor fieldKey="overview"   placeholder="e.g. 48MP Fusion camera system"/></>}
              {activeTab === 'specs'      && <><label style={L}>Quick Specs</label>      <ListEditor fieldKey="specs"      placeholder="e.g. A18 Pro chip · 6-core CPU"/></>}
              {activeTab === 'includes'   && <><label style={L}>What's in the Box</label><ListEditor fieldKey="includes"   placeholder="e.g. iPhone with iOS 18"/></>}
              {activeTab === 'features'   && <><label style={L}>Features</label>         <ListEditor fieldKey="features"   placeholder="e.g. Face ID for secure authentication"/></>}
              {activeTab === 'tech_specs' && <><label style={L}>Tech Specs</label>       <ListEditor fieldKey="tech_specs" placeholder="e.g. 6.3-inch Super Retina XDR display"/></>}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
