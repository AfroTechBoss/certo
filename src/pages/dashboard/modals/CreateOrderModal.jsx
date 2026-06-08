import { useState } from 'react';
import { Modal } from '../components/Modal.jsx';
import { authFetch } from '../lib/auth.js';
import { NG_STATES } from '../lib/constants.js';
import { inputS, primaryBtn, actionBtn } from '../lib/styles.js';

// Phone / walk-in order entry. Mirrors most of the public Checkout flow but
// skips delivery-fee + dangerous-goods + coupon math — the admin just types
// the negotiated total and we record it.
//
// Required props:
//   products : full product list (used by the search picker + variant chooser)
//   rate     : current ₦/$ rate (defaults to localStorage 'certo_rate' if missing)
// onDone receives the raw API row (the new order).

const APPLECARE_OPTIONS = ['none', 'AppleCare+', 'AppleCare+ with Theft and Loss'];
const PAYMENT_METHODS   = ['Cash / Bank Transfer', 'Flutterwave', 'WhatsApp (USD/Crypto)', 'MoonPay', 'Other'];

export function CreateOrderModal({ onClose, onDone, products, rate }) {
  const [form, setForm] = useState({
    // Customer
    customer_name: '', customer_email: '', customer_phone: '',
    // Delivery
    address: '', state: 'Lagos',
    // Product
    product_id: '', product_name: '', product_subtitle: '', apple_url: '',
    usd_price: '', variant_id: '', variant_color: '', variant_storage: '', variant_color_hex: '',
    applecare: 'none', qty: 1,
    // Order
    payment_method: 'Cash / Bank Transfer',
    initial_status: 'Order Confirmed',
    notes: '',
  });
  const [productQ,   setProductQ]   = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const liveRate = rate || (() => {
    try { return parseInt(localStorage.getItem('certo_rate') || '1590', 10) || 1590; }
    catch (_) { return 1590; }
  })();
  const usdNum   = parseFloat(form.usd_price) || 0;
  const ngnTotal = usdNum * liveRate;

  const filteredProds = (products || []).filter(p =>
    !productQ.trim() || (p.name + ' ' + (p.subtitle || '')).toLowerCase().includes(productQ.toLowerCase())
  ).slice(0, 12);

  const pickProduct = (p) => {
    const price = p.usdPrice || p.usd_price || 0;
    set('product_id',       p.id);
    set('product_name',     p.name);
    set('product_subtitle', p.subtitle || '');
    set('apple_url',        p.appleUrl || p.apple_url || '');
    set('usd_price',        String(price));
    set('variant_id',       '');
    set('variant_color',    '');
    set('variant_storage',  '');
    set('variant_color_hex','');
    setProductQ(p.name + (p.subtitle ? ' — ' + p.subtitle : ''));
    setShowPicker(false);
  };

  const pickStorage = (s) => {
    set('variant_id',      s.id);
    set('variant_storage', s.size || s.label || '');
    set('usd_price',       String(s.price_usd || s.usdPrice || form.usd_price));
  };

  const pickColor = (c) => {
    set('variant_color',     c.name);
    set('variant_color_hex', c.hex || '');
  };

  const selectedProd = (products || []).find(p => p.id === form.product_id) || null;
  const hasColors    = selectedProd?.variants?.colors?.length  > 0;
  const hasStorages  = selectedProd?.variants?.storages?.length > 0;

  const submit = async () => {
    if (!form.customer_name.trim())  { setErr('Customer name is required.');   return; }
    if (!form.customer_phone.trim()) { setErr('Customer phone is required.');  return; }
    if (!form.address.trim())        { setErr('Delivery address is required.'); return; }
    if (!form.product_name.trim())   { setErr('Select or enter a product.');    return; }
    if (!form.usd_price)             { setErr('Price is required.');            return; }
    setErr(''); setBusy(true);
    try {
      const res = await authFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_name:     form.customer_name.trim(),
          // Fallback email so the orders table is never NULL — only used if customer skips it
          customer_email:    form.customer_email.trim() || `phone+${form.customer_phone.replace(/\D/g, '')}@certo.ng`,
          customer_phone:    form.customer_phone.trim(),
          address:           form.address.trim(),
          state:             form.state,
          product_id:        form.product_id || null,
          product_name:      form.product_name.trim(),
          product_subtitle:  form.product_subtitle.trim(),
          apple_url:         form.apple_url.trim(),
          product_image_url: '',
          applecare:         form.applecare,
          qty:               Number(form.qty) || 1,
          usd_price:         parseFloat(form.usd_price),
          ngn_price:         parseFloat(form.usd_price) * liveRate,
          forex_rate:        liveRate,
          payment_method:    form.payment_method,
          initial_status:    form.initial_status,
          variant_id:        form.variant_id   || null,
          variant_color:     form.variant_color || null,
          variant_storage:   form.variant_storage || null,
          variant_color_hex: form.variant_color_hex || null,
          items: [{
            product_id:        form.product_id || '',
            name:              form.product_name.trim(),
            subtitle:          form.product_subtitle.trim(),
            usd_price:         parseFloat(form.usd_price),
            qty:               Number(form.qty) || 1,
            applecare:         form.applecare,
            apple_url:         form.apple_url.trim(),
            variant_color:     form.variant_color || null,
            variant_storage:   form.variant_storage || null,
            variant_color_hex: form.variant_color_hex || null,
          }],
        }),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || 'Failed to create order'); setBusy(false); return; }
      onDone(json.order || json);
      onClose();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const L = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 };
  const I = { ...inputS, width: '100%', boxSizing: 'border-box' };
  const SectionHeader = ({ label }) => (
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ flex: 1, height: 1, background: 'var(--border)' }}/> {label} <span style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
    </div>
  );

  return (
    <Modal
      title="New order"
      subtitle="Phone / walk-in"
      onClose={onClose}
      width={640}
      footer={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {usdNum > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 'auto' }}>
              Total: <strong style={{ color: 'var(--text)' }}>${usdNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} · ₦{ngnTotal.toLocaleString('en-NG')}</strong>
            </span>
          )}
          <button onClick={onClose} style={{ ...actionBtn }}>Cancel</button>
          <button onClick={submit} disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Creating…' : 'Create order'}
          </button>
        </div>
      }
    >
      {err && (
        <div style={{
          fontSize: 12.5, color: 'oklch(50% 0.18 25)',
          padding: '10px 14px', background: 'oklch(97% 0.03 25)',
          borderRadius: 9, border: '1px solid oklch(85% 0.1 25)',
          marginBottom: 16,
        }}>{err}</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Customer */}
        <div>
          <SectionHeader label="Customer"/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}><label style={L}>Full Name *</label><input value={form.customer_name} onChange={e => set('customer_name', e.target.value)} placeholder="e.g. Chidi Ozo" style={I}/></div>
            <div><label style={L}>Phone *</label><input value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} placeholder="+234 800 000 0000" style={I}/></div>
            <div><label style={L}>Email</label><input value={form.customer_email} onChange={e => set('customer_email', e.target.value)} placeholder="optional" style={I}/></div>
          </div>
        </div>

        {/* Delivery */}
        <div>
          <SectionHeader label="Delivery"/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}><label style={L}>Address *</label><input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, area, city" style={I}/></div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={L}>State *</label>
              <select value={form.state} onChange={e => set('state', e.target.value)} style={{ ...I, cursor: 'pointer' }}>
                {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Product */}
        <div>
          <SectionHeader label="Product"/>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <label style={L}>Search products *</label>
            <input
              value={productQ}
              onChange={e => {
                setProductQ(e.target.value);
                setShowPicker(true);
                if (!e.target.value) {
                  set('product_id', '');
                  set('product_name', '');
                  set('usd_price', '');
                }
              }}
              onFocus={() => setShowPicker(true)}
              placeholder="Type to search, or enter product name manually below"
              style={I}
            />
            {showPicker && productQ && filteredProds.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 10, boxShadow: '0 8px 32px rgba(26,23,20,0.15)',
                maxHeight: 200, overflowY: 'auto', marginTop: 4,
              }}>
                {filteredProds.map(p => (
                  <div key={p.id}
                    onMouseDown={() => pickProduct(p)}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                    {p.subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.subtitle}</div>}
                    <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>
                      ${(p.usdPrice || p.usd_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!form.product_id && (
            <div style={{ marginBottom: 12 }}>
              <label style={L}>Product name (manual)</label>
              <input value={form.product_name} onChange={e => set('product_name', e.target.value)} placeholder="e.g. iPhone 16 Pro Max" style={I}/>
            </div>
          )}

          {hasColors && (
            <div style={{ marginBottom: 12 }}>
              <label style={L}>Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedProd.variants.colors.map(c => (
                  <button key={c.id}
                    onMouseDown={() => pickColor(c)}
                    style={{
                      padding: '6px 14px', borderRadius: 8,
                      border: `2px solid ${form.variant_color === c.name ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.variant_color === c.name ? 'var(--accent-tint)' : 'var(--bg)',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {c.hex && <span style={{ width: 12, height: 12, borderRadius: '50%', background: c.hex, border: '1px solid rgba(0,0,0,0.15)', display: 'inline-block' }}/>}
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {hasStorages && (
            <div style={{ marginBottom: 12 }}>
              <label style={L}>Storage / Size</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedProd.variants.storages.filter(s => s.in_stock !== false).map(s => (
                  <button key={s.id}
                    onMouseDown={() => pickStorage(s)}
                    style={{
                      padding: '6px 14px', borderRadius: 8,
                      border: `2px solid ${form.variant_id === s.id ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.variant_id === s.id ? 'var(--accent-tint)' : 'var(--bg)',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}
                  >
                    {s.size} · ${Number(s.price_usd).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><label style={L}>USD Price *</label><input type="number" min="0" step="0.01" value={form.usd_price} onChange={e => set('usd_price', e.target.value)} style={I}/></div>
            <div><label style={L}>Qty</label><input type="number" min="1" value={form.qty} onChange={e => set('qty', e.target.value)} style={I}/></div>
            <div>
              <label style={L}>AppleCare</label>
              <select value={form.applecare} onChange={e => set('applecare', e.target.value)} style={{ ...I, cursor: 'pointer' }}>
                {APPLECARE_OPTIONS.map(o => <option key={o} value={o}>{o === 'none' ? 'None' : o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div>
          <SectionHeader label="Payment"/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={L}>Payment Method</label>
              <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} style={{ ...I, cursor: 'pointer' }}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={L}>Initial Status</label>
              <select value={form.initial_status} onChange={e => set('initial_status', e.target.value)} style={{ ...I, cursor: 'pointer' }}>
                <option value="Order Confirmed">Order Confirmed</option>
                <option value="Payment Pending">Payment Pending</option>
              </select>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}
