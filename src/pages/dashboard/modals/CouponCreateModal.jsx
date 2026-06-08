import { useState } from 'react';
import { Modal } from '../components/Modal.jsx';
import { authFetch } from '../lib/auth.js';
import { inputS, primaryBtn, actionBtn } from '../lib/styles.js';

// Create a discount code.
// applies_to is one of: 'all' | 'product' | 'service' | 'delivery' | 'fees'.
// onDone receives the raw API response (not yet mapped via mapCoupon).

export function CouponCreateModal({ onClose, onDone }) {
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: '',
    applies_to: 'all',
    max_uses: '',
    expires_at: '',
  });
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const L = {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: 6,
  };
  const I = { ...inputS, width: '100%', boxSizing: 'border-box' };

  const submit = async () => {
    if (!form.code.trim())    { setErr('Coupon code is required.');    return; }
    if (!form.discount_value) { setErr('Discount value is required.'); return; }
    setErr(''); setBusy(true);
    try {
      const res = await authFetch('/api/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code:           form.code.trim().toUpperCase(),
          description:    form.description.trim(),
          discount_type:  form.discount_type,
          discount_value: Number(form.discount_value),
          applies_to:     form.applies_to,
          max_uses:       form.max_uses ? Number(form.max_uses) : null,
          expires_at:     form.expires_at || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || 'Create failed'); setBusy(false); return; }
      onDone(json);
      onClose();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Modal
      title="New coupon"
      onClose={onClose}
      width={480}
      footer={
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={submit}
            disabled={busy}
            style={{ ...primaryBtn, flex: 1, opacity: busy ? 0.7 : 1 }}
          >
            {busy ? 'Creating…' : 'Create coupon'}
          </button>
          <button onClick={onClose} style={{ ...actionBtn, flex: 1, justifyContent: 'center' }}>
            Cancel
          </button>
        </div>
      }
    >
      {err && (
        <div style={{
          fontSize: 12.5,
          color: 'oklch(50% 0.18 25)',
          padding: '10px 14px',
          background: 'oklch(97% 0.03 25)',
          borderRadius: 9,
          border: '1px solid oklch(85% 0.1 25)',
          marginBottom: 14,
        }}>{err}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={L}>Coupon Code *</label>
          <input
            value={form.code}
            onChange={e => set('code', e.target.value.toUpperCase())}
            placeholder="e.g. SAVE20"
            style={I}
          />
        </div>
        <div>
          <label style={L}>Description</label>
          <input
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="e.g. 20% off all iPhones"
            style={I}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={L}>Discount Type *</label>
            <select
              value={form.discount_type}
              onChange={e => set('discount_type', e.target.value)}
              style={{ ...I, cursor: 'pointer' }}
            >
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed amount (₦)</option>
            </select>
          </div>
          <div>
            <label style={L}>Discount Value *</label>
            <input
              type="number" min="0" step="0.01"
              value={form.discount_value}
              onChange={e => set('discount_value', e.target.value)}
              placeholder={form.discount_type === 'percent' ? 'e.g. 20' : 'e.g. 5000'}
              style={I}
            />
          </div>
        </div>
        <div>
          <label style={L}>Applies To</label>
          <select
            value={form.applies_to}
            onChange={e => set('applies_to', e.target.value)}
            style={{ ...I, cursor: 'pointer' }}
          >
            <option value="all">Entire order total</option>
            <option value="product">Product price only</option>
            <option value="service">Service fee only ($35)</option>
            <option value="delivery">Delivery fee only</option>
            <option value="fees">All fees (service + delivery)</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={L}>Max Uses</label>
            <input
              type="number" min="1"
              value={form.max_uses}
              onChange={e => set('max_uses', e.target.value)}
              placeholder="Unlimited"
              style={I}
            />
          </div>
          <div>
            <label style={L}>Expiry Date</label>
            <input
              type="date"
              value={form.expires_at}
              onChange={e => set('expires_at', e.target.value)}
              style={I}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
