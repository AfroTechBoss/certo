import { useState, useEffect } from 'react';
import { Modal } from '../components/Modal.jsx';
import { authFetch } from '../lib/auth.js';
import { PROD_CATS } from '../lib/constants.js';
import { inputS, primaryBtn, actionBtn } from '../lib/styles.js';

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
        // Normalise variants: colours store images as a newline-joined string for the textarea
        const rawV     = p.variants && !Array.isArray(p.variants) ? p.variants : { colors: [], storages: [] };
        const colors   = (rawV.colors || []).map(c => ({
          ...c,
          images: Array.isArray(c.images) ? c.images.join('\n') : (c.images || ''),
        }));
        const storages = rawV.storages || [];

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
          variants:       { colors, storages },
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

  // ── variant helpers ───────────────────────────────────────────────────────
  const addColor    = () => set('variants', { ...form.variants, colors: [...form.variants.colors, { id: Date.now().toString(36), name: '', hex: '#888888', images: '' }] });
  const removeColor = (i) => set('variants', { ...form.variants, colors: form.variants.colors.filter((_, j) => j !== i) });
  const setColor    = (i, k, v) => set('variants', { ...form.variants, colors: form.variants.colors.map((c, j) => j === i ? { ...c, [k]: v } : c) });

  const addStorage    = () => set('variants', { ...form.variants, storages: [...form.variants.storages, { id: Date.now().toString(36), size: '', price_usd: 0, in_stock: true }] });
  const removeStorage = (i) => set('variants', { ...form.variants, storages: form.variants.storages.filter((_, j) => j !== i) });
  const setStorage    = (i, k, v) => set('variants', { ...form.variants, storages: form.variants.storages.map((s, j) => j === i ? { ...s, [k]: v } : s) });

  const submit = async () => {
    if (!form.name.trim()) { setErr('Product name is required.'); setActiveTab('basic'); return; }
    setErr(''); setBusy(true);
    try {
      const hasVariants = form.variants.colors.length > 0 || form.variants.storages.length > 0;
      const variants = hasVariants ? {
        colors:   form.variants.colors.map(c => ({
          ...c,
          images: typeof c.images === 'string'
            ? c.images.split('\n').map(s => s.trim()).filter(Boolean)
            : (c.images || []),
        })),
        storages: form.variants.storages.map(s => ({ ...s, price_usd: Number(s.price_usd) })),
      } : [];

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
                  Define colors and storage sizes separately. Customers choose their preferred color (which shows that color's images) and their storage size (which sets the price). Leave both empty for products with no variants.
                </div>

                <div>
                  <label style={L}>Colors</label>
                  {form.variants.colors.map((c, i) => (
                    <div key={c.id || i} style={{ padding: 14, background: 'var(--bg-alt)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 10 }}>
                        <div><label style={{ ...L, marginBottom: 4 }}>Color Name</label><input value={c.name} onChange={e => setColor(i, 'name', e.target.value)} placeholder="Desert Titanium" style={I}/></div>
                        <div>
                          <label style={{ ...L, marginBottom: 4 }}>Hex Color</label>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input value={c.hex} onChange={e => setColor(i, 'hex', e.target.value)} placeholder="#888888" style={{ ...I, width: 90 }}/>
                            <input type="color" value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : '#888888'} onChange={e => setColor(i, 'hex', e.target.value)} style={{ width: 32, height: 34, padding: 2, border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', flexShrink: 0 }}/>
                          </div>
                        </div>
                      </div>
                      <label style={{ ...L, marginBottom: 4 }}>Images (one URL per line)</label>
                      <textarea value={c.images} onChange={e => setColor(i, 'images', e.target.value)} rows={3} placeholder="https://store.storeimages.cdn-apple.com/…" style={{ ...TA, marginBottom: 8 }}/>
                      <button onClick={() => removeColor(i)} style={{ fontSize: 12, color: 'oklch(50% 0.18 25)', border: 'none', background: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}>Remove color</button>
                    </div>
                  ))}
                  <button onClick={addColor} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent-tint)', color: 'var(--accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Color</button>
                </div>

                <div>
                  <label style={L}>Storage Sizes & Prices</label>
                  {form.variants.storages.map((s, i) => (
                    <div key={s.id || i} style={{ padding: 14, background: 'var(--bg-alt)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div><label style={{ ...L, marginBottom: 4 }}>Size Label</label><input value={s.size} onChange={e => setStorage(i, 'size', e.target.value)} placeholder="256GB" style={I}/></div>
                        <div><label style={{ ...L, marginBottom: 4 }}>Price (USD)</label><input type="number" min="0" step="0.01" value={s.price_usd} onChange={e => setStorage(i, 'price_usd', e.target.value)} style={I}/></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                          <input type="checkbox" checked={s.in_stock !== false} onChange={e => setStorage(i, 'in_stock', e.target.checked)} style={{ width: 14, height: 14, accentColor: 'var(--accent)' }}/>
                          <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>In stock</span>
                        </label>
                        <button onClick={() => removeStorage(i)} style={{ fontSize: 12, color: 'oklch(50% 0.18 25)', border: 'none', background: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}>Remove</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={addStorage} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent-tint)', color: 'var(--accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add Storage</button>
                </div>
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
