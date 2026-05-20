
// Certo — Internal Dashboard
import React from 'react';
import { CERTO_RATE, setCERTO_RATE, PRODUCTS, useResponsive } from '../../data.js';

// Auth helper — reads the token from sessionStorage on every call so it never goes stale
function authFetch(url, opts = {}) {
  let token = '';
  try { token = sessionStorage.getItem('certo_admin_token') || ''; } catch(e) {}
  return fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), 'Authorization': `Bearer ${token}` },
  });
}

// Fire-and-forget client-side event logger — records actions that happen purely in the browser
function logEvent(action, details = '') {
  authFetch('/api/admin/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, details }),
  }).catch(() => {});
}

// Normalise a product row from /api/products into the dashboard UI shape
function normaliseDashProduct(p) {
  const rate = (typeof CERTO_RATE !== 'undefined' ? CERTO_RATE : 1590);
  const usdPrice = parseFloat(p.usd_price) || 0;
  const listingStatus = p.listing_status || (p.in_stock ? 'live' : 'out_of_stock');
  return {
    id:            p.id,
    name:          p.name,
    subtitle:      p.subtitle || '',
    type:          p.category,
    condition:     p.condition,
    conditionNote: p.condition_note || '',
    usdPrice,
    ngnPrice:      Math.round(usdPrice * rate),
    images:        (p.image_urls || []).map(u => u ? `/api/img?url=${encodeURIComponent(u.replace(/[&?]\.v=[^&]*/, ''))}` : null).filter(Boolean),
    rawImages:     (p.image_urls || []),  // un-proxied originals — used for editing and saving
    badge:         p.badge || '',
    deliveryDays:  p.delivery_days || '10–18 business days',
    listingStatus,
    inStock:       listingStatus === 'live',
    featured:      p.featured,
    stock:         p.stock_count || (p.in_stock ? 1 : 0),
    overview:      p.overview || [],
    specs:         p.specs || [],
    includes:      p.includes || [],
    features:      p.features || [],
    techSpecs:     p.tech_specs || [],
    apple_url:     p.apple_url,
    variants: (() => { const v = p.variants; if (!v || Array.isArray(v)) return { colors: [], storages: [] }; return { colors: v.colors || [], storages: v.storages || [] }; })(),
  };
}

// Normalise order rows from API to a consistent shape
function normaliseOrder(o) {
  return {
    id:       o.id,
    customer: o.customer_name,
    email:    o.customer_email,
    phone:    o.customer_phone,
    address:  o.address + (o.state ? `, ${o.state}` : ''),
    product:  o.product_name + (o.product_subtitle ? ` · ${o.product_subtitle}` : ''),
    product_id:    o.product_id,
    product_image: o.product_image_url,
    apple_url:     o.apple_url,
    status:   o.status,
    usd:      Number(o.usd_price),
    ngn:      Number(o.ngn_price),
    date:     o.created_at ? new Date(o.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
    flag:     o.flagged,
    flag_reason: o.flag_reason || '',
    notes:           o.notes || '',
    payment_method:  o.payment_method || 'Flutterwave',
    items:           Array.isArray(o.items) ? o.items : [],
    // Top-level variant fields (populated for single-item orders)
    variant_color:     o.variant_color     || null,
    variant_storage:   o.variant_storage   || null,
    variant_color_hex: o.variant_color_hex || null,
    raw:      o,
  };
}

const ALL_STATUSES = [
  'Payment Pending',
  'Order Confirmed',
  'Purchased from Apple',
  'In Transit to US Partner',
  'Customs Clearance',
  'Arrived in Nigeria',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

const statusColor = (s) => {
  if (s === 'Payment Pending')         return { bg: 'oklch(95% 0.08 70)',   color: 'oklch(42% 0.18 55)'  };
  if (s === 'Delivered')               return { bg: 'oklch(93% 0.06 155)',  color: 'oklch(35% 0.15 155)' };
  if (s === 'Order Confirmed')         return { bg: 'oklch(93% 0.06 250)',  color: 'oklch(40% 0.15 250)' };
  if (s === 'Customs Clearance')       return { bg: 'oklch(96% 0.06 80)',   color: 'oklch(45% 0.15 65)'  };
  if (s === 'Arrived in Nigeria')      return { bg: 'oklch(94% 0.08 155)',  color: 'oklch(38% 0.16 155)' };
  if (s === 'Out for Delivery')        return { bg: 'oklch(95% 0.07 60)',   color: 'oklch(42% 0.18 55)'  };
  if (s === 'In Transit to US Partner')return { bg: 'oklch(94% 0.06 220)',  color: 'oklch(42% 0.14 220)' };
  if (s === 'Purchased from Apple')    return { bg: 'oklch(94% 0.05 30)',   color: 'oklch(44% 0.14 30)'  };
  if (s === 'Cancelled')               return { bg: 'oklch(94% 0.02 0)',    color: 'oklch(45% 0.12 0)'   };
  return { bg: 'oklch(94% 0.03 250)', color: 'oklch(45% 0.12 250)' };
};

// Module-level style constants used by the edit modal — stable references prevent remounts
const MODAL_FLD = {
  padding: '9px 13px', borderRadius: 8, border: '1.5px solid var(--border)',
  background: 'var(--bg-alt)', fontFamily: 'var(--font-body)', fontSize: 13,
  color: 'var(--text)', outline: 'none', boxSizing: 'border-box', width: '100%',
};
const MODAL_LBL = { fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' };
const modalFocus = e => e.target.style.borderColor = 'var(--accent)';
const modalBlur  = e => e.target.style.borderColor = 'var(--border)';

// Defined outside DashboardPage so the component identity is stable across re-renders
const ListEditor = ({ label, listKey, blank = '', editDraft, setListItem, addListItem, removeListItem }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ ...MODAL_LBL, marginBottom: 10 }}>{label}</div>
    {(editDraft[listKey] || []).map((item, i) => (
      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={item} onChange={e => setListItem(listKey, i, e.target.value)}
          onFocus={modalFocus} onBlur={modalBlur}
          style={{ ...MODAL_FLD, flex: 1 }} />
        <button onClick={() => removeListItem(listKey, i)} aria-label="Remove"
          style={{ padding: '0 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, flexShrink: 0 }} aria-hidden="false">×</button>
      </div>
    ))}
    <button onClick={() => addListItem(listKey, blank)}
      style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-tint)', border: '1px dashed var(--accent-tint2)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
      + Add item
    </button>
  </div>
);

// Self-contained ConditionBadge so admin.html doesn't need ShopPage.jsx loaded
const ConditionBadge = ({ condition }) => {
  const styles = {
    new:   { bg: 'oklch(93% 0.06 155)',  color: 'oklch(35% 0.15 155)', label: 'New' },
    refurb:{ bg: 'oklch(94% 0.06 250)',  color: 'oklch(40% 0.15 250)', label: 'Refurbished' },
  };
  const s = styles[condition] || styles.new;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
      fontFamily: 'var(--font-body)', background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
};

const WHATSAPP_NUMBER = '2348057575906';

// ── VariantsEditor — standalone so identity is stable across renders ──────────
const BLANK_COLOR   = () => ({ id: 'c_' + Math.random().toString(36).slice(2, 9), name: '', hex: '#888888', images: [] });
const BLANK_STORAGE = () => ({ id: 's_' + Math.random().toString(36).slice(2, 9), size: '', price_usd: 0, in_stock: true });

const VariantsEditor = ({ editDraft, setEditDraft, fld, lbl, focus, blur }) => {
  const colors   = editDraft.variants?.colors   || [];
  const storages = editDraft.variants?.storages || [];

  const [newColor,   setNewColor]   = React.useState(BLANK_COLOR());
  const [newStorage, setNewStorage] = React.useState(BLANK_STORAGE());

  const setV = (patch) => setEditDraft(d => ({ ...d, variants: { ...(d.variants || {}), ...patch } }));

  // Color helpers
  const setColor = (i, key, val) => setV({ colors: colors.map((c, j) => j === i ? { ...c, [key]: val } : c) });
  const removeColor = (i)        => setV({ colors: colors.filter((_, j) => j !== i) });
  const addColor = () => {
    if (!newColor.name.trim()) return;
    setV({ colors: [...colors, { ...newColor, id: 'c_' + Math.random().toString(36).slice(2, 9) }] });
    setNewColor(BLANK_COLOR());
  };

  // Storage helpers
  const setStorage = (i, key, val) => setV({ storages: storages.map((s, j) => j === i ? { ...s, [key]: val } : s) });
  const removeStorage = (i)        => setV({ storages: storages.filter((_, j) => j !== i) });
  const addStorage = () => {
    if (!newStorage.size.trim()) return;
    setV({ storages: [...storages, { ...newStorage, id: 's_' + Math.random().toString(36).slice(2, 9) }] });
    setNewStorage(BLANK_STORAGE());
  };

  const SectionHead = ({ children }) => (
    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</div>
  );
  const RemoveBtn = ({ onClick }) => (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'oklch(50% 0.18 25)', fontSize: 13, fontFamily: 'var(--font-body)', flexShrink: 0 }}>Remove</button>
  );

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
        Define colors and storage sizes separately. Customers choose their preferred color (which shows that color's images) and their storage size (which sets the price). Leave both empty for products with no variants.
      </p>

      {/* ── COLORS ── */}
      <div style={{ marginBottom: 28 }}>
        <SectionHead>Colors</SectionHead>

        {colors.map((c, i) => (
          <div key={c.id || i} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: c.hex || '#888', border: '2px solid var(--border)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.name || 'Unnamed color'}</span>
              </div>
              <RemoveBtn onClick={() => removeColor(i)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 10, marginBottom: 10 }}>
              <div><label style={lbl}>Color name</label><input value={c.name} onChange={e => setColor(i, 'name', e.target.value)} onFocus={focus} onBlur={blur} style={fld} placeholder="Desert Titanium" /></div>
              <div>
                <label style={lbl}>Hex color</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input value={c.hex || ''} onChange={e => setColor(i, 'hex', e.target.value)} onFocus={focus} onBlur={blur} style={{ ...fld, flex: 1, minWidth: 0 }} placeholder="#C4A882" />
                  <input type="color" value={c.hex || '#888888'} onChange={e => setColor(i, 'hex', e.target.value)}
                    style={{ width: 32, height: 32, padding: 2, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', flexShrink: 0 }} />
                </div>
              </div>
            </div>
            <div>
              <label style={lbl}>Images for this color (one URL per line)</label>
              <textarea value={(c.images || []).join('\n')} onChange={e => setColor(i, 'images', e.target.value.split('\n').map(s => s.trimEnd()))}
                onFocus={focus} onBlur={blur} rows={3} style={{ ...fld, resize: 'vertical', lineHeight: 1.5 }} placeholder="https://store.storeimages.cdn-apple.com/..." />
            </div>
          </div>
        ))}

        {/* Add color form */}
        <div style={{ border: '1.5px dashed var(--border)', borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Color name</label><input value={newColor.name} onChange={e => setNewColor(c => ({ ...c, name: e.target.value }))} onFocus={focus} onBlur={blur} style={fld} placeholder="Desert Titanium" /></div>
            <div>
              <label style={lbl}>Hex color</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input value={newColor.hex} onChange={e => setNewColor(c => ({ ...c, hex: e.target.value }))} onFocus={focus} onBlur={blur} style={{ ...fld, flex: 1, minWidth: 0 }} placeholder="#C4A882" />
                <input type="color" value={newColor.hex} onChange={e => setNewColor(c => ({ ...c, hex: e.target.value }))}
                  style={{ width: 32, height: 32, padding: 2, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', flexShrink: 0 }} />
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Images (one URL per line)</label>
            <textarea value={(newColor.images || []).join('\n')} onChange={e => setNewColor(c => ({ ...c, images: e.target.value.split('\n').map(s => s.trimEnd()) }))}
              onFocus={focus} onBlur={blur} rows={2} style={{ ...fld, resize: 'vertical', lineHeight: 1.5 }} placeholder="https://store.storeimages.cdn-apple.com/..." />
          </div>
          <button onClick={addColor} disabled={!newColor.name.trim()}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: newColor.name.trim() ? 'var(--accent)' : 'var(--border)', color: 'white', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, cursor: newColor.name.trim() ? 'pointer' : 'not-allowed' }}>
            + Add Color
          </button>
        </div>
      </div>

      {/* ── STORAGE SIZES ── */}
      <div>
        <SectionHead>Storage sizes &amp; prices</SectionHead>

        {storages.map((s, i) => (
          <div key={s.id || i} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.size || 'Unnamed'} — ${s.price_usd}</span>
              <RemoveBtn onClick={() => removeStorage(i)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div><label style={lbl}>Size label</label><input value={s.size} onChange={e => setStorage(i, 'size', e.target.value)} onFocus={focus} onBlur={blur} style={fld} placeholder="256GB" /></div>
              <div><label style={lbl}>Price (USD)</label><input type="number" value={s.price_usd} onChange={e => setStorage(i, 'price_usd', Number(e.target.value))} onFocus={focus} onBlur={blur} style={fld} /></div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)' }}>
              <input type="checkbox" checked={s.in_stock !== false} onChange={e => setStorage(i, 'in_stock', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
              In stock
            </label>
          </div>
        ))}

        {/* Add storage form */}
        <div style={{ border: '1.5px dashed var(--border)', borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Size label</label><input value={newStorage.size} onChange={e => setNewStorage(s => ({ ...s, size: e.target.value }))} onFocus={focus} onBlur={blur} style={fld} placeholder="256GB" /></div>
            <div><label style={lbl}>Price (USD)</label><input type="number" value={newStorage.price_usd} onChange={e => setNewStorage(s => ({ ...s, price_usd: Number(e.target.value) }))} onFocus={focus} onBlur={blur} style={fld} /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)' }}>
              <input type="checkbox" checked={newStorage.in_stock !== false} onChange={e => setNewStorage(s => ({ ...s, in_stock: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
              In stock
            </label>
            <button onClick={addStorage} disabled={!newStorage.size.trim()}
              style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: newStorage.size.trim() ? 'var(--accent)' : 'var(--border)', color: 'white', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, cursor: newStorage.size.trim() ? 'pointer' : 'not-allowed' }}>
              + Add Storage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = ({ navigate, subPage = 'orders', liveRate }) => {
  const { isMobile } = useResponsive();

  // ── Auth gate ──────────────────────────────────────────────────────────────
  const [adminToken,    setAdminToken]    = React.useState(() => {
    try { return sessionStorage.getItem('certo_admin_token') || ''; } catch(e) { return ''; }
  });
  const [adminName,     setAdminName]     = React.useState(() => {
    try { return sessionStorage.getItem('certo_admin_name') || ''; } catch(e) { return ''; }
  });
  const [loginPwd,      setLoginPwd]      = React.useState('');
  const [loginErr,      setLoginErr]      = React.useState('');
  const [loginLoading,  setLoginLoading]  = React.useState(false);
  const [showPwd,       setShowPwd]       = React.useState(false);

  const handleLogin = async (e) => {
    e && e.preventDefault();
    if (!loginPwd.trim()) return;
    setLoginLoading(true); setLoginErr('');
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPwd }),
      });
      let d;
      try { d = await r.json(); } catch { throw new Error('Server error — could not connect. Please try again.'); }
      if (!r.ok) throw new Error(d.error || 'Login failed');
      try {
        sessionStorage.setItem('certo_admin_token', d.token);
        sessionStorage.setItem('certo_admin_name',  d.name || '');
      } catch(e) {}
      setAdminToken(d.token);
      setAdminName(d.name || '');
      setLoginPwd('');
      // Immediately load all dashboard data — token is in sessionStorage so authFetch works now
      fetchOrders();
      fetchProducts();
      fetchMessages();
      fetchCoupons();
      fetchLogs();
      fetchCertificates();
    } catch(err) {
      setLoginErr(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('certo_admin_token');
      sessionStorage.removeItem('certo_admin_name');
    } catch(e) {}
    setAdminToken('');
    setAdminName('');
  };

  // ── Login screen JSX (rendered at the bottom after all hooks — see rules-of-hooks note) ──

  const [activeTab,    setActiveTab]    = React.useState(subPage);
  const [forexRate,    setForexRate]    = React.useState(liveRate || CERTO_RATE);
  const [forexInput,   setForexInput]   = React.useState(String(liveRate || CERTO_RATE));
  const [forexSaved,   setForexSaved]   = React.useState(false);
  const [manualOverride, setManualOverride] = React.useState(false);
  const [fetchedAt,  setFetchedAt]  = React.useState(() => {
    try {
      const ts = localStorage.getItem('certo_rate_ts');
      return ts ? new Date(Number(ts)) : null;
    } catch(e) { return null; }
  });
  const [autoRate, setAutoRate] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/forex')
      .then(r => r.json())
      .then(data => {
        if (data.rate) {
          const rate = data.rate;
          const now = new Date();
          setCERTO_RATE(rate);
          setFetchedAt(now);
          setAutoRate(rate);
          if (!manualOverride) { setForexRate(rate); setForexInput(String(rate)); }
          try { localStorage.setItem('certo_rate', String(rate)); localStorage.setItem('certo_rate_ts', String(now.getTime())); } catch(e) {}
        }
      })
      .catch(() => {});
  }, []);

  // Orders — API-driven
  const [orders,          setOrders]          = React.useState([]);
  const [ordersLoading,   setOrdersLoading]   = React.useState(true);
  const [selectedOrder,   setSelectedOrder]   = React.useState(null);
  const [flagReason,          setFlagReason]          = React.useState('');
  const [editingFlagReason,   setEditingFlagReason]   = React.useState(false);
  const [editFlagReasonText,  setEditFlagReasonText]  = React.useState('');
  const [resendState,     setResendState]      = React.useState({}); // { [orderId]: 'loading'|'ok'|'error:msg' }
  const [orderTimeFilter, setOrderTimeFilter]  = React.useState('all');
  const [customFrom,      setCustomFrom]       = React.useState('');
  const [customTo,        setCustomTo]         = React.useState('');

  // Revenue
  const [revCurrency,    setRevCurrency]    = React.useState('ngn'); // 'ngn' | 'usd'
  const [revTimeFilter,  setRevTimeFilter]  = React.useState('all');
  const [revCustomFrom,  setRevCustomFrom]  = React.useState('');
  const [revCustomTo,    setRevCustomTo]    = React.useState('');

  const fetchOrders = React.useCallback(() => {
    setOrdersLoading(true);
    authFetch('/api/orders?limit=500')
      .then(r => r.json())
      .then(data => { setOrders(Array.isArray(data) ? data.map(normaliseOrder) : []); setOrdersLoading(false); })
      .catch(() => setOrdersLoading(false));
  }, []);

  React.useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const [products,       setProducts]       = React.useState([]);
  const [productsLoading, setProductsLoading] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState(null);
  const [editDraft,      setEditDraft]      = React.useState({});
  const [editSection,    setEditSection]    = React.useState('basic');

  const fetchProducts = React.useCallback(() => {
    setProductsLoading(true);
    authFetch('/api/products?limit=1000&admin=true')
      .then(r => r.json())
      .then(rows => {
        setProducts((Array.isArray(rows) ? rows : []).map(normaliseDashProduct));
        setProductsLoading(false);
      })
      .catch(() => setProductsLoading(false));
  }, []);

  React.useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Orders — filter + search state
  const [orderSearch,          setOrderSearch]          = React.useState('');
  const [orderStatusFilter,    setOrderStatusFilter]     = React.useState('all');
  const [orderFlaggedOnly,     setOrderFlaggedOnly]      = React.useState(false);
  const [orderPendingOnly,     setOrderPendingOnly]      = React.useState(false);
  const [productSearch,        setProductSearch]         = React.useState('');

  const [coupons,        setCoupons]        = React.useState([]);
  const [couponsLoading, setCouponsLoading] = React.useState(false);
  const [couponForm,     setCouponForm]     = React.useState(null); // null = closed, {} = open (new), {id,...} = editing
  const [couponSaving,   setCouponSaving]   = React.useState(false);
  const [couponSaveErr,  setCouponSaveErr]  = React.useState('');

  const [messages,        setMessages]        = React.useState([]);
  const [messagesLoading, setMessagesLoading] = React.useState(false);

  const fetchMessages = React.useCallback(() => {
    setMessagesLoading(true);
    authFetch('/api/contact')
      .then(r => r.json())
      .then(d => { setMessages(Array.isArray(d) ? d : []); setMessagesLoading(false); })
      .catch(() => setMessagesLoading(false));
  }, []);

  React.useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const fetchCoupons = React.useCallback(() => {
    setCouponsLoading(true);
    authFetch('/api/coupons')
      .then(r => r.json())
      .then(d => { setCoupons(Array.isArray(d) ? d : []); setCouponsLoading(false); })
      .catch(() => setCouponsLoading(false));
  }, []);

  React.useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const [logs,        setLogs]        = React.useState([]);
  const [logsLoading, setLogsLoading] = React.useState(false);

  const fetchLogs = React.useCallback(() => {
    setLogsLoading(true);
    authFetch('/api/admin/logs')
      .then(r => r.json())
      .then(d => { setLogs(Array.isArray(d) ? d : []); setLogsLoading(false); })
      .catch(() => setLogsLoading(false));
  }, []);

  React.useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const fetchCertificates = React.useCallback(() => {
    setCertsLoading(true);
    authFetch('/api/certificates')
      .then(r => r.json())
      .then(data => { setCertificates(Array.isArray(data) ? data : []); setCertsLoading(false); })
      .catch(() => setCertsLoading(false));
  }, []);

  React.useEffect(() => { fetchCertificates(); }, [fetchCertificates]);

  // ── Tab-local state lifted here so hook count is stable across renders ────────
  // MessagesTab selected message
  const [selectedMessage, setSelectedMessage] = React.useState(null);
  // ActivityTab clear-log confirm dialog
  const [clearConfirm, setClearConfirm] = React.useState(false);
  const [clearing,     setClearing]     = React.useState(false);
  // ─────────────────────────────────────────────────────────────────────────────

  // Certificates
  const [certificates,  setCertificates]  = React.useState([]);
  const [certsLoading,  setCertsLoading]  = React.useState(false);
  const [certSearch,    setCertSearch]    = React.useState('');
  // Publish-certificate modal (opened from order detail)
  const [publishModal,  setPublishModal]  = React.useState(null); // { order, productIndex, productName, productSubtitle, variantColor, variantStorage, existingCertId }
  const [publishDraft,  setPublishDraft]  = React.useState({ serial_number: '', apple_order_ref: '', chain_of_custody: [] });
  const [publishSaving, setPublishSaving] = React.useState(false);
  const [publishError,  setPublishError]  = React.useState('');

  // Auto-refresh orders and messages every 2 minutes so the admin sees new data without a page reload
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
      fetchMessages();
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchMessages]);

  const unreadMessages = messages.filter(m => !m.read).length;

  const tabs = [
    { key: 'orders',       label: 'Orders',       count: orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length },
    { key: 'products',     label: 'Products'     },
    { key: 'certificates', label: 'Certificates' },
    { key: 'messages',     label: 'Messages',     count: unreadMessages },
    { key: 'coupons',      label: 'Coupons'      },
    { key: 'activity',     label: 'Activity'     },
    { key: 'forex',        label: 'Forex'        },
    { key: 'revenue',      label: 'Revenue'      },
    { key: 'customers',    label: 'Customers'    },
  ];

  // Apply time filter to any list of orders
  function applyTimeFilter(list, tf, cFrom, cTo) {
    if (tf === 'all') return list;
    const now = new Date();
    return list.filter(o => {
      const d = new Date(o.raw?.created_at || o.date);
      if (tf === 'today')  return d.toDateString() === now.toDateString();
      if (tf === 'week')   return d >= new Date(now - 7 * 86400000);
      if (tf === 'month')  return d >= new Date(now - 30 * 86400000);
      if (tf === 'year')   return d >= new Date(now - 365 * 86400000);
      if (tf === 'custom') {
        const from = cFrom ? new Date(cFrom) : null;
        const to   = cTo   ? new Date(cTo + 'T23:59:59') : null;
        if (from && d < from) return false;
        if (to   && d > to)   return false;
        return true;
      }
      return true;
    });
  }

  const totalRevNgn   = orders.reduce((s, o) => s + o.ngn, 0);
  const totalRevUsd   = orders.reduce((s, o) => s + o.usd, 0);
  const delivered     = orders.filter(o => o.status === 'Delivered').length;
  const active        = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled' && o.status !== 'Payment Pending').length;
  const pendingPayment = orders.filter(o => o.status === 'Payment Pending').length;

  const filteredOrders = React.useMemo(() => {
    let list = orders.filter(o => {
      if (orderSearch.trim()) {
        const q = orderSearch.trim().toLowerCase();
        const hit = o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) ||
          (o.phone || '').includes(q) || o.address.toLowerCase().includes(q) || o.product.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (orderStatusFilter === 'open') {
        if (o.status === 'Delivered' || o.status === 'Cancelled' || o.status === 'Payment Pending') return false;
      } else if (orderStatusFilter !== 'all') {
        if (o.status !== orderStatusFilter) return false;
      }
      if (orderFlaggedOnly && !o.flag) return false;
      if (orderPendingOnly && o.status !== 'Payment Pending') return false;
      return true;
    });
    return applyTimeFilter(list, orderTimeFilter, customFrom, customTo);
  }, [orders, orderSearch, orderStatusFilter, orderTimeFilter, orderFlaggedOnly, orderPendingOnly, customFrom, customTo]);

  const activeFilters =
    (orderSearch.trim() ? 1 : 0) +
    (orderStatusFilter !== 'all' ? 1 : 0) +
    (orderTimeFilter !== 'all' ? 1 : 0) +
    (orderFlaggedOnly ? 1 : 0) +
    (orderPendingOnly ? 1 : 0);

  const clearFilters = () => {
    setOrderSearch(''); setOrderStatusFilter('all');
    setOrderTimeFilter('all'); setCustomFrom(''); setCustomTo('');
    setOrderFlaggedOnly(false); setOrderPendingOnly(false);
  };

  // Resend confirmation email for an order
  const resendEmail = async (orderId) => {
    setResendState(s => ({ ...s, [orderId]: 'loading' }));
    try {
      const res = await authFetch(`/api/orders/${orderId}/resend-email`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResendState(s => ({ ...s, [orderId]: 'ok' }));
        setTimeout(() => setResendState(s => { const n = {...s}; delete n[orderId]; return n; }), 4000);
      } else {
        setResendState(s => ({ ...s, [orderId]: 'error:' + (data.error || 'Failed') }));
        setTimeout(() => setResendState(s => { const n = {...s}; delete n[orderId]; return n; }), 6000);
      }
    } catch(e) {
      setResendState(s => ({ ...s, [orderId]: 'error:Network error' }));
      setTimeout(() => setResendState(s => { const n = {...s}; delete n[orderId]; return n; }), 6000);
    }
  };

  // Toggle flag on an order
  const toggleFlag = async (orderId, currently) => {
    const reason = currently ? '' : (flagReason.trim() || 'Flagged by admin');
    try {
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagged: !currently, flag_reason: reason }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? normaliseOrder(updated) : o));
        if (selectedOrder?.id === orderId) setSelectedOrder(normaliseOrder(updated));
        setFlagReason('');
      }
    } catch(e) {}
  };

  // Save an updated flag reason on an already-flagged order
  const saveFlagReason = async (orderId, reason) => {
    try {
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag_reason: reason.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? normaliseOrder(updated) : o));
        if (selectedOrder?.id === orderId) setSelectedOrder(normaliseOrder(updated));
        setEditingFlagReason(false);
        setEditFlagReasonText('');
      }
    } catch(e) {}
  };

  // Update order status
  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? normaliseOrder(updated) : o));
        if (selectedOrder?.id === orderId) setSelectedOrder(normaliseOrder(updated));
      }
    } catch(e) {}
  };

  const inputStyle = {
    padding: '9px 14px', borderRadius: 9, border: '1.5px solid var(--border)',
    background: 'var(--bg)', fontFamily: 'var(--font-body)', fontSize: 13,
    color: 'var(--text)', outline: 'none', cursor: 'pointer',
  };

  const StatCard = ({ label, value, sub, accent }) => (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 28px' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 28, color: accent || 'var(--text)', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );

  const RefreshBtn = ({ onClick, loading }) => (
    <button onClick={onClick} disabled={loading} title="Refresh" style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '6px 12px', borderRadius: 8,
      border: '1.5px solid var(--border)', background: 'var(--bg)',
      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
      color: 'var(--text-muted)', cursor: loading ? 'default' : 'pointer',
      opacity: loading ? 0.55 : 1, flexShrink: 0, whiteSpace: 'nowrap',
    }}>{loading ? '↻ …' : '↻ Refresh'}</button>
  );

  const OrdersTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <RefreshBtn onClick={fetchOrders} loading={ordersLoading} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Orders"    value={orders.length} />
        <StatCard label="Active Orders"   value={active}         accent="var(--accent)" />
        <StatCard label="Delivered"       value={delivered}      accent="oklch(45% 0.15 155)" />
        <StatCard label="Awaiting Payment" value={pendingPayment} accent="oklch(42% 0.18 55)"
          sub={pendingPayment > 0 ? 'Crypto — payment not confirmed' : 'None outstanding'} />
        <StatCard label="Flagged"         value={orders.filter(o => o.flag).length} accent="oklch(50% 0.18 25)" />
      </div>

      {selectedOrder ? (
        <div>
          <button onClick={() => { setSelectedOrder(null); setFlagReason(''); setEditingFlagReason(false); setEditFlagReasonText(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--accent)', marginBottom: 20, padding: 0 }}>
            ← Back to orders
          </button>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: isMobile ? 20 : 32 }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>ORDER</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 24, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedOrder.flag && <span style={{ fontSize: 18 }} title={selectedOrder.flag_reason}>🚩</span>}
                  {selectedOrder.id}
                </div>
              </div>
              <select value={selectedOrder.status} onChange={e => updateStatus(selectedOrder.id, e.target.value)}
                style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid var(--accent)', background: 'var(--accent-tint)', color: 'var(--accent)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Core fields */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Customer',   value: selectedOrder.customer },
                { label: 'Email',      value: selectedOrder.email    },
                { label: 'Phone',      value: selectedOrder.phone    },
                { label: 'Order Date', value: selectedOrder.date     },
                { label: 'USD Total',  value: `$${Number(selectedOrder.usd).toLocaleString()}` },
                { label: 'NGN Total',  value: `₦${Number(selectedOrder.ngn).toLocaleString()}` },
                { label: 'Status',     value: selectedOrder.status          },
                { label: 'Payment Via', value: selectedOrder.payment_method || 'Flutterwave' },
                { label: 'Address',    value: selectedOrder.address  },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--text)', wordBreak: 'break-all' }}>{f.value || '—'}</div>
                </div>
              ))}
            </div>

            {/* Legacy fallback — only shown for old orders that pre-date the items JSONB column */}
            {(!selectedOrder.items || selectedOrder.items.length === 0) && (
              <div style={{ marginBottom: 20, padding: '16px', background: 'var(--bg-alt)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Product</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                  {selectedOrder.product || '—'}
                </div>
                {(selectedOrder.variant_color || selectedOrder.variant_storage) && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                    {selectedOrder.variant_color && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text)' }}>
                        {selectedOrder.variant_color_hex && <span style={{ width: 9, height: 9, borderRadius: '50%', background: selectedOrder.variant_color_hex, display: 'inline-block', border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />}
                        {selectedOrder.variant_color}
                      </span>
                    )}
                    {selectedOrder.variant_storage && (
                      <span style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text)' }}>
                        {selectedOrder.variant_storage}
                      </span>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedOrder.apple_url && (
                    <a href={selectedOrder.apple_url} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      🍎 Apple Page
                    </a>
                  )}
                  {selectedOrder.product_id && (
                    <button onClick={() => navigate('product', selectedOrder.product_id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      🔗 Certo Page
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Full items list (shown when order has multiple products) */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-alt)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  {(() => {
                    const totalUnits = selectedOrder.items.reduce((sum, it) => sum + (it.qty || 1), 0);
                    const lineCount  = selectedOrder.items.length;
                    return totalUnits === lineCount
                      ? `Order Items (${lineCount})`
                      : `Order Items (${lineCount} line${lineCount !== 1 ? 's' : ''} · ${totalUnits} units)`;
                  })()}
                </div>
                {selectedOrder.items.map((item, i) => {
                  const qty = item.qty && item.qty > 1 ? item.qty : 1;
                  const lineTotal = Number(item.usd_price) * qty;
                  return (
                    <div key={i} style={{ padding: '12px 0', borderBottom: i < selectedOrder.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      {/* Name + price row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                            {qty > 1 && <span style={{ display: 'inline-block', background: 'var(--border)', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginRight: 6 }}>{qty}×</span>}
                            {item.name}
                          </div>
                          {item.subtitle && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{item.subtitle}</div>}
                          {(item.variant_color || item.variant_storage) && (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                              {item.variant_color && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text)' }}>
                                  {item.variant_color_hex && <span style={{ width: 9, height: 9, borderRadius: '50%', background: item.variant_color_hex, display: 'inline-block', border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />}
                                  {item.variant_color}
                                </span>
                              )}
                              {item.variant_storage && (
                                <span style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text)' }}>
                                  {item.variant_storage}
                                </span>
                              )}
                            </div>
                          )}
                          {item.applecare && item.applecare !== 'none' && (
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>+ {item.applecare}</div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                            ${lineTotal.toLocaleString()}
                          </div>
                          {qty > 1 && (
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>{qty} × ${Number(item.usd_price).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                      {/* Link buttons — always shown; fall back to Apple search if no direct URL */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        <a
                          href={item.apple_url || `https://www.apple.com/search/${encodeURIComponent((item.name || '') + ' ' + (item.subtitle || ''))}`}
                          target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
                        >
                          🍎 {item.apple_url ? 'Apple Page' : 'Search Apple'}
                        </a>
                        {item.product_id && (
                          <button
                            onClick={() => navigate('product', item.product_id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            🔗 Certo Page
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pending payment banner */}
            {selectedOrder.status === 'Payment Pending' && (
              <div style={{ padding: '14px 18px', borderRadius: 12, background: 'oklch(95% 0.08 70)', border: '1.5px solid oklch(75% 0.15 60)', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'oklch(38% 0.18 55)', marginBottom: 2 }}>⏳ Awaiting payment</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'oklch(45% 0.15 55)' }}>Payment has not been confirmed yet. Once you've verified the payment, click Mark as Paid to confirm the order and notify the customer.</div>
                </div>
                <button onClick={() => updateStatus(selectedOrder.id, 'Order Confirmed')}
                  style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'oklch(42% 0.18 55)', color: 'white', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  ✓ Mark as Paid
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {selectedOrder.phone && (
                <a href={`https://wa.me/${selectedOrder.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'oklch(93% 0.08 145)', border: '1px solid oklch(80% 0.12 145)', color: 'oklch(35% 0.15 145)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>
                  💬 WhatsApp Customer
                </a>
              )}
              {(() => {
                const rs = resendState[selectedOrder.id];
                const isLoading = rs === 'loading';
                const isOk      = rs === 'ok';
                const isError   = rs && rs.startsWith('error:');
                return (
                  <button
                    onClick={() => resendEmail(selectedOrder.id)}
                    disabled={isLoading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10,
                      border: `1px solid ${isOk ? 'oklch(70% 0.15 145)' : isError ? 'oklch(70% 0.15 25)' : 'var(--border)'}`,
                      background: isOk ? 'oklch(93% 0.06 145)' : isError ? 'oklch(96% 0.07 25)' : 'var(--bg)',
                      color: isOk ? 'oklch(35% 0.15 145)' : isError ? 'oklch(45% 0.18 25)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: isLoading ? 'default' : 'pointer' }}>
                    {isLoading ? '⏳ Sending…' : isOk ? '✓ Email sent!' : isError ? `✗ ${rs.slice(6)}` : '✉ Resend Confirmation Email'}
                  </button>
                );
              })()}
              <button onClick={() => toggleFlag(selectedOrder.id, selectedOrder.flag)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border)', background: selectedOrder.flag ? 'oklch(96% 0.07 25)' : 'var(--bg)', color: selectedOrder.flag ? 'oklch(45% 0.18 25)' : 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                🚩 {selectedOrder.flag ? 'Unflag Order' : 'Flag Order'}
              </button>
            </div>

            {/* ── Certificates section ───────────────────────────────── */}
            {(() => {
              const orderCerts = certificates.filter(c => c.order_id === selectedOrder.id);
              const productList = selectedOrder.items && selectedOrder.items.length > 0
                ? selectedOrder.items.map((item, idx) => ({ idx, name: item.name || selectedOrder.product, subtitle: item.subtitle || '', variantColor: item.variant_color || null, variantStorage: item.variant_storage || null }))
                : [{ idx: 0, name: selectedOrder.product, subtitle: '', variantColor: selectedOrder.variant_color || null, variantStorage: selectedOrder.variant_storage || null }];

              return (
                <div style={{ marginBottom: 20, padding: '16px', background: 'var(--bg-alt)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Certificates</div>
                  {productList.map(({ idx, name, subtitle, variantColor, variantStorage }) => {
                    const cert = orderCerts.find(c => c.product_index === idx);
                    const isPublished = cert?.status === 'published';
                    const isDraft     = cert?.status === 'draft';
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '8px 0', borderBottom: idx < productList.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}{subtitle ? ` · ${subtitle}` : ''}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                            {isPublished && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 20, background: 'oklch(93% 0.06 155)', color: 'oklch(35% 0.15 155)', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700 }}>
                                ✓ Published
                              </span>
                            )}
                            {isDraft && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 20, background: 'oklch(95% 0.08 70)', color: 'oklch(42% 0.18 55)', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700 }}>
                                ⏳ Pending / Draft
                              </span>
                            )}
                            {cert && <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>{cert.id}</span>}
                          </div>
                        </div>
                        {!isPublished && (
                          <button
                            onClick={() => {
                              const order = selectedOrder;
                              setPublishModal({ order, productIndex: idx, productName: name, productSubtitle: subtitle, variantColor, variantStorage, existingCertId: cert?.id || null });
                              setPublishDraft(cert ? {
                                serial_number:   cert.serial_number   || '',
                                apple_order_ref: cert.apple_order_ref || '',
                                chain_of_custody: Array.isArray(cert.chain_of_custody) ? cert.chain_of_custody : [],
                              } : { serial_number: '', apple_order_ref: '', chain_of_custody: [] });
                              setPublishError('');
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--accent)', background: 'var(--accent-tint)', color: 'var(--accent)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                            {isDraft ? '✏ Edit / Publish' : '＋ Publish Certificate'}
                          </button>
                        )}
                        {isPublished && (
                          <a
                            href={`/verify/${selectedOrder.id}`}
                            target="_blank" rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                            View →
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* ── Flag section ─────────────────────────────────────────── */}
            {!selectedOrder.flag ? (
              /* Not yet flagged — show reason textarea above the Flag button */
              <div style={{ marginBottom: 4, padding: '16px', background: 'var(--bg-alt)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Reason for flagging
                </label>
                <textarea
                  value={flagReason}
                  onChange={e => setFlagReason(e.target.value)}
                  placeholder="e.g. Can't reach customer · Suspicious payment · Wrong address confirmed · Hold pending investigation…"
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = 'oklch(65% 0.18 25)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  This is visible to all admins so anyone can follow up on the case.
                </p>
              </div>
            ) : (
              /* Already flagged — show reason card with edit capability */
              <div style={{ marginBottom: 16, padding: '16px', background: 'oklch(97% 0.03 25)', border: '1.5px solid oklch(85% 0.1 25)', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: editingFlagReason ? 10 : 0 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'oklch(45% 0.18 25)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    🚩 Flag reason
                  </div>
                  {!editingFlagReason && (
                    <button
                      onClick={() => { setEditingFlagReason(true); setEditFlagReasonText(selectedOrder.flag_reason || ''); }}
                      style={{ background: 'none', border: '1px solid oklch(75% 0.12 25)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'oklch(45% 0.18 25)', flexShrink: 0 }}>
                      Edit
                    </button>
                  )}
                </div>
                {editingFlagReason ? (
                  <div>
                    <textarea
                      value={editFlagReasonText}
                      onChange={e => setEditFlagReasonText(e.target.value)}
                      rows={3}
                      autoFocus
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid oklch(65% 0.18 25)', background: 'white', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => saveFlagReason(selectedOrder.id, editFlagReasonText)}
                        style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'oklch(42% 0.18 25)', color: 'white', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Save reason
                      </button>
                      <button
                        onClick={() => { setEditingFlagReason(false); setEditFlagReasonText(''); }}
                        style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'oklch(35% 0.15 25)', lineHeight: 1.65, marginTop: 6, whiteSpace: 'pre-wrap' }}>
                    {selectedOrder.flag_reason || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No reason given — click Edit to add one.</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
          {/* Search + filters bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>

            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                placeholder="Search by order ID, customer, phone, address, product…"
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Status filter */}
            <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)} style={inputStyle}>
              <option value="all">All statuses</option>
              <option value="open">Open (not delivered)</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Time filter */}
            <select value={orderTimeFilter} onChange={e => setOrderTimeFilter(e.target.value)} style={inputStyle}>
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="year">Last 12 months</option>
              <option value="custom">Custom range</option>
            </select>
            {orderTimeFilter === 'custom' && (
              <>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ ...inputStyle, cursor: 'auto' }} />
                <input type="date" value={customTo}   onChange={e => setCustomTo(e.target.value)}   style={{ ...inputStyle, cursor: 'auto' }} />
              </>
            )}

            {/* Awaiting payment toggle */}
            <button
              onClick={() => setOrderPendingOnly(v => !v)}
              style={{
                ...inputStyle,
                background: orderPendingOnly ? 'oklch(95% 0.08 70)' : 'var(--bg)',
                borderColor: orderPendingOnly ? 'oklch(55% 0.18 55)' : 'var(--border)',
                color: orderPendingOnly ? 'oklch(42% 0.18 55)' : 'var(--text-muted)',
                fontWeight: orderPendingOnly ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              ⏳ Awaiting payment
              {pendingPayment > 0 && (
                <span style={{ marginLeft: 6, background: 'oklch(42% 0.18 55)', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>{pendingPayment}</span>
              )}
            </button>

            {/* Flagged toggle */}
            <button
              onClick={() => setOrderFlaggedOnly(v => !v)}
              style={{
                ...inputStyle,
                background: orderFlaggedOnly ? 'oklch(96% 0.07 25)' : 'var(--bg)',
                borderColor: orderFlaggedOnly ? 'oklch(60% 0.18 25)' : 'var(--border)',
                color: orderFlaggedOnly ? 'oklch(45% 0.18 25)' : 'var(--text-muted)',
                fontWeight: orderFlaggedOnly ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              🚩 Flagged only
            </button>

            {/* Clear filters */}
            {activeFilters > 0 && (
              <button onClick={clearFilters} style={{ ...inputStyle, color: 'var(--accent)', borderColor: 'var(--accent-tint2)', background: 'var(--accent-tint)', fontWeight: 600 }}>
                Clear ({activeFilters})
              </button>
            )}

            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {filteredOrders.length} of {orders.length}
            </span>
          </div>

          {/* Orders table */}
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: 'var(--bg-alt)' }}>
                {['Order ID', 'Customer', 'Product', 'Status', 'Via', 'NGN Total', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '12px 20px', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordersLoading ? (
                <tr><td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>Loading orders…</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>
                    No orders match your filters.
                  </td>
                </tr>
              ) : filteredOrders.map(o => {
                const sc = statusColor(o.status);
                return (
                  <tr key={o.id} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => { setSelectedOrder(o); logEvent('Opened order', `${o.id} — ${o.customer} — ${o.product} — ${o.status}`); }}>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                      {o.status === 'Payment Pending' && <span style={{ marginRight: 6 }} title="Awaiting payment">⏳</span>}
                      {o.flag && <span style={{ marginRight: 6 }}>🚩</span>}{o.id}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {o.customer}
                        {o.phone && (
                          <a href={`https://wa.me/${o.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            style={{ fontSize: 14, textDecoration: 'none', lineHeight: 1 }} title="WhatsApp">💬</a>
                        )}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{o.phone}</div>
                    </td>
                    <td style={{ padding: '14px 20px', maxWidth: 160 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>{o.product}</div>
                      {o.items && o.items.length > 1 && (
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>+{o.items.length - 1} more item{o.items.length - 1 > 1 ? 's' : ''}</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 6, background: sc.bg, color: sc.color, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{o.status}</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {(() => {
                        const pm = o.payment_method || 'Flutterwave';
                        const pmStyle = pm === 'MoonPay'
                          ? { bg: 'oklch(93% 0.06 280)', color: 'oklch(38% 0.18 280)' }
                          : pm === 'Test Mode'
                          ? { bg: 'oklch(94% 0.02 0)', color: 'oklch(45% 0.1 0)' }
                          : { bg: 'oklch(93% 0.07 145)', color: 'oklch(35% 0.15 145)' };
                        return <span style={{ padding: '4px 10px', borderRadius: 6, background: pmStyle.bg, color: pmStyle.color, fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{pm}</span>;
                      })()}
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>₦{o.ngn.toLocaleString()}</td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{o.date}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ color: 'var(--accent)', fontSize: 16 }}>→</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );

  const openEdit = (p) => {
    setEditDraft(JSON.parse(JSON.stringify(p))); // deep copy
    setEditSection('basic');
    setEditingProduct(p);
  };

  const openAdd = () => {
    const blank = {
      id: 'product-' + Date.now(),
      name: 'New Product', subtitle: '', type: 'iPhone',
      condition: 'new', conditionNote: '',
      usdPrice: 0, images: [], rawImages: [], badge: '', deliveryDays: '10–18 business days',
      listingStatus: 'live', inStock: true, featured: false,
      overview: [], specs: [], includes: [], features: [], techSpecs: [],
      stock: 0, ngnPrice: 0, variants: { colors: [], storages: [] },
    };
    setEditDraft(blank);
    setEditSection('basic');
    setEditingProduct(blank);
  };

  const saveEdit = () => {
    // Strip blank / stub image URLs before saving
    const cleanUrls = (arr) => (arr || []).filter(u => u && u.trim() && u.trim() !== 'https://' && u.trim().startsWith('http'));
    const updated = {
      ...editDraft,
      usdPrice:  Number(editDraft.usdPrice),
      ngnPrice:  Number(editDraft.usdPrice) * forexRate,
      stock:     Number(editDraft.stock),
      rawImages: cleanUrls(editDraft.rawImages),
      // Also clean color images
      variants: editDraft.variants ? {
        ...editDraft.variants,
        colors: (editDraft.variants.colors || []).map(c => ({ ...c, images: cleanUrls(c.images) })),
      } : { colors: [], storages: [] },
    };

    // Optimistic UI update
    const exists = products.some(p => p.id === editingProduct.id);
    if (exists) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
      // Persist to API (map back to snake_case)
      authFetch(`/api/products/${encodeURIComponent(updated.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updated.name, subtitle: updated.subtitle,
          usd_price: updated.usdPrice,
          listing_status: updated.listingStatus || 'live',
          in_stock: (updated.listingStatus || 'live') === 'live',
          featured: updated.featured, badge: updated.badge,
          delivery_days: updated.deliveryDays, condition: updated.condition,
          condition_note: updated.conditionNote, stock_count: updated.stock,
          overview: updated.overview, specs: updated.specs,
          includes: updated.includes, features: updated.features,
          tech_specs: updated.techSpecs,
          image_urls: updated.rawImages || [],
          variants: updated.variants || { colors: [], storages: [] },
        }),
      }).catch(err => console.error('Failed to save product:', err));
    } else {
      // New product — POST to API to persist in DB
      setProducts(prev => [...prev, updated]); // optimistic
      authFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updated.name, subtitle: updated.subtitle,
          category: updated.type,
          usd_price: updated.usdPrice,
          listing_status: updated.listingStatus || 'live',
          in_stock: (updated.listingStatus || 'live') === 'live',
          featured: updated.featured, badge: updated.badge,
          delivery_days: updated.deliveryDays, condition: updated.condition,
          condition_note: updated.conditionNote, stock_count: updated.stock,
          overview: updated.overview, specs: updated.specs,
          includes: updated.includes, features: updated.features,
          tech_specs: updated.techSpecs,
          image_urls: updated.rawImages || [],
          variants: updated.variants || { colors: [], storages: [] },
        }),
      })
      .then(r => r.json())
      .then(saved => {
        // Replace the temp local entry with the real DB record (correct server-generated id)
        setProducts(prev => prev.map(p => p.id === updated.id ? normaliseDashProduct(saved) : p));
      })
      .catch(err => console.error('Failed to create product:', err));
    }
    setEditingProduct(null);
  };

  // Draft mutation helpers
  const setDF = (key, val) => setEditDraft(d => ({...d, [key]: val}));
  const setListItem = (key, i, val) => setEditDraft(d => ({...d, [key]: d[key].map((x, j) => j === i ? val : x)}));
  const addListItem = (key, blank) => setEditDraft(d => ({...d, [key]: [...(d[key]||[]), blank]}));
  const removeListItem = (key, i) => setEditDraft(d => ({...d, [key]: d[key].filter((_, j) => j !== i)}));
  const setFeature = (i, field, val) => setEditDraft(d => ({...d, features: d.features.map((f, j) => j === i ? {...f, [field]: val} : f)}));
  const setSpecSection = (si, field, val) => setEditDraft(d => ({...d, techSpecs: d.techSpecs.map((s, j) => j === si ? {...s, [field]: val} : s)}));
  const setSpecItem = (si, ii, val) => setEditDraft(d => ({...d, techSpecs: d.techSpecs.map((s, j) => j === si ? {...s, items: s.items.map((x, k) => k === ii ? val : x)} : s)}));
  const addSpecItem = (si) => setEditDraft(d => ({...d, techSpecs: d.techSpecs.map((s, j) => j === si ? {...s, items: [...s.items, '']} : s)}));
  const removeSpecItem = (si, ii) => setEditDraft(d => ({...d, techSpecs: d.techSpecs.map((s, j) => j === si ? {...s, items: s.items.filter((_, k) => k !== ii)} : s)}));

  const renderEditModal = () => {
    if (!editingProduct || !editDraft.name) return null;

    const fld   = MODAL_FLD;
    const lbl   = MODAL_LBL;
    const focus = modalFocus;
    const blur  = modalBlur;

    const isNew = !products.some(p => p.id === editingProduct.id);

    const EDIT_SECTIONS = [
      { key: 'basic',     label: 'Basic Info'     },
      { key: 'condition', label: 'Condition'       },
      { key: 'images',    label: 'Images'          },
      { key: 'variants',  label: 'Variants'        },
      { key: 'overview',  label: 'Overview'        },
      { key: 'specs',     label: 'Quick Specs'     },
      { key: 'inbox',     label: "What's in the Box" },
      { key: 'features',  label: 'Features'        },
      { key: 'techspecs', label: 'Tech Specs'      },
    ];

    const renderSection = () => {
      switch (editSection) {
        case 'basic': return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label style={lbl}>Product name</label><input style={fld} value={editDraft.name} onChange={e => setDF('name', e.target.value)} onFocus={focus} onBlur={blur} /></div>
            <div><label style={lbl}>Subtitle / storage / color</label><input style={fld} value={editDraft.subtitle} onChange={e => setDF('subtitle', e.target.value)} onFocus={focus} onBlur={blur} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div><label style={lbl}>USD Price</label><input type="number" style={fld} value={editDraft.usdPrice} onChange={e => setDF('usdPrice', e.target.value)} onFocus={focus} onBlur={blur} /></div>
              <div><label style={lbl}>Stock count</label><input type="number" style={fld} value={editDraft.stock} onChange={e => setDF('stock', e.target.value)} onFocus={focus} onBlur={blur} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div>
                <label style={lbl}>Condition</label>
                <select style={{ ...fld, cursor: 'pointer' }} value={editDraft.condition} onChange={e => setDF('condition', e.target.value)}>
                  <option value="new">New</option>
                  <option value="refurb">Refurbished</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Listing status</label>
                <select style={{ ...fld, cursor: 'pointer' }} value={editDraft.listingStatus || 'live'} onChange={e => { setDF('listingStatus', e.target.value); setDF('inStock', e.target.value === 'live'); }}>
                  <option value="live">🟢 Live (on sale)</option>
                  <option value="out_of_stock">🔴 Out of Stock</option>
                  <option value="coming_soon">🟡 Coming Soon</option>
                  <option value="hidden">⚫ Hidden (admin only)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div><label style={lbl}>Badge label</label><input style={fld} value={editDraft.badge || ''} onChange={e => setDF('badge', e.target.value)} onFocus={focus} onBlur={blur} /></div>
              <div><label style={lbl}>Delivery estimate</label><input style={fld} value={editDraft.deliveryDays || ''} onChange={e => setDF('deliveryDays', e.target.value)} onFocus={focus} onBlur={blur} /></div>
            </div>
            <div style={{ background: 'var(--bg-alt)', borderRadius: 9, padding: '11px 14px', fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>
              NGN at current rate: <strong style={{ color: 'var(--text)' }}>₦{(Number(editDraft.usdPrice) * forexRate).toLocaleString()}</strong>
            </div>
          </div>
        );

        case 'condition': return (
          <div>
            <label style={lbl}>Condition note (shown on product page)</label>
            <textarea value={editDraft.conditionNote || ''} onChange={e => setDF('conditionNote', e.target.value)}
              onFocus={focus} onBlur={blur}
              rows={5} style={{ ...fld, resize: 'vertical', lineHeight: 1.6 }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
              This text appears in the condition box on the product detail page. Describe sourcing, warranty status, and any cosmetic notes.
            </p>
          </div>
        );

        case 'images': return (
          <div>
            <ListEditor label="Image URLs (one per line)" listKey="rawImages" blank="https://" editDraft={editDraft} setListItem={setListItem} addListItem={addListItem} removeListItem={removeListItem} />
            {(editDraft.rawImages || []).filter(url => url && url.startsWith('http')).slice(0, 1).map((url, i) => (
              <div key={i} style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
                <img src={`/api/img?url=${encodeURIComponent(url.replace(/[&?]\.v=[^&]*/, ''))}`} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
              </div>
            ))}
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
              Add full image URLs (https://...). The first image is the main display image; additional images appear as thumbnails in the gallery.
            </p>
          </div>
        );

        case 'overview': return <ListEditor label="Overview bullets" listKey="overview" blank="New bullet point" editDraft={editDraft} setListItem={setListItem} addListItem={addListItem} removeListItem={removeListItem} />;
        case 'specs':    return <ListEditor label="Quick spec highlights" listKey="specs" blank="New spec" editDraft={editDraft} setListItem={setListItem} addListItem={addListItem} removeListItem={removeListItem} />;
        case 'inbox':    return <ListEditor label="What's in the box" listKey="includes" blank="New item" editDraft={editDraft} setListItem={setListItem} addListItem={addListItem} removeListItem={removeListItem} />;

        case 'features': return (
          <div>
            {(editDraft.features || []).map((f, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Feature {i + 1}</span>
                  <button onClick={() => removeListItem('features', i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}>Remove</button>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={lbl}>Title</label>
                  <input value={f.title} onChange={e => setFeature(i, 'title', e.target.value)} onFocus={focus} onBlur={blur} style={fld} />
                </div>
                <div>
                  <label style={lbl}>Description</label>
                  <textarea value={f.body} onChange={e => setFeature(i, 'body', e.target.value)} onFocus={focus} onBlur={blur}
                    rows={3} style={{ ...fld, resize: 'vertical', lineHeight: 1.6 }} />
                </div>
              </div>
            ))}
            <button onClick={() => addListItem('features', { title: '', body: '' })}
              style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-tint)', border: '1px dashed var(--accent-tint2)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              + Add feature
            </button>
          </div>
        );

        case 'variants': return (
          <VariantsEditor editDraft={editDraft} setEditDraft={setEditDraft} fld={fld} lbl={lbl} focus={focus} blur={blur} />
        );

        case 'techspecs': return (
          <div>
            {(editDraft.techSpecs || []).map((sec, si) => (
              <div key={si} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                  <input value={sec.section} onChange={e => setSpecSection(si, 'section', e.target.value)} onFocus={focus} onBlur={blur}
                    placeholder="Section name (e.g. Chip)"
                    style={{ ...fld, fontWeight: 600, flex: 1 }} />
                  <button onClick={() => removeListItem('techSpecs', si)}
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', color: 'var(--text-muted)', padding: '6px 10px', fontSize: 12, flexShrink: 0 }}>Remove section</button>
                </div>
                {sec.items.map((item, ii) => (
                  <div key={ii} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                    <input value={item} onChange={e => setSpecItem(si, ii, e.target.value)} onFocus={focus} onBlur={blur}
                      style={{ ...fld, flex: 1 }} />
                    <button onClick={() => removeSpecItem(si, ii)} aria-label="Remove"
                      style={{ padding: '0 9px', border: '1px solid var(--border)', borderRadius: 7, background: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 15, flexShrink: 0 }}>×</button>
                  </div>
                ))}
                <button onClick={() => addSpecItem(si)}
                  style={{ fontSize: 11, color: 'var(--accent)', background: 'var(--accent-tint)', border: '1px dashed var(--accent-tint2)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', marginTop: 4 }}>
                  + Add item
                </button>
              </div>
            ))}
            <button onClick={() => addListItem('techSpecs', { section: '', items: [''] })}
              style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-tint)', border: '1px dashed var(--accent-tint2)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              + Add section
            </button>
          </div>
        );

        default: return null;
      }
    };

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 24 }}
        onClick={e => { if (e.target === e.currentTarget) setEditingProduct(null); }}>
        <div style={{ background: 'var(--bg)', borderRadius: isMobile ? '20px 20px 0 0' : 20, width: '100%', maxWidth: isMobile ? '100%' : 860, height: isMobile ? '92vh' : 'auto', maxHeight: isMobile ? '92vh' : '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}>

          {/* Header */}
          <div style={{ padding: isMobile ? '16px 20px' : '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{isNew ? 'Add Product' : 'Edit Product'}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{editDraft.name}</div>
            </div>
            <button onClick={() => setEditingProduct(null)} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
          </div>

          {/* Body: sidebar + content */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>

            {/* Section nav — horizontal scrolling strip on mobile, sidebar on desktop */}
            {isMobile ? (
              <div style={{ display: 'flex', gap: 4, padding: '10px 16px', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0 }}>
                {EDIT_SECTIONS.map(s => (
                  <button key={s.key} onClick={() => setEditSection(s.key)} style={{
                    padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    background: editSection === s.key ? 'var(--accent)' : 'var(--bg-alt)',
                    color: editSection === s.key ? 'white' : 'var(--text-muted)',
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: editSection === s.key ? 700 : 400,
                  }}>{s.label}</button>
                ))}
              </div>
            ) : (
              <div style={{ width: 180, borderRight: '1px solid var(--border)', padding: '16px 10px', flexShrink: 0, overflowY: 'auto' }}>
                {EDIT_SECTIONS.map(s => (
                  <button key={s.key} onClick={() => setEditSection(s.key)} style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px',
                    borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 2,
                    background: editSection === s.key ? 'var(--accent-tint)' : 'none',
                    color: editSection === s.key ? 'var(--accent)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-body)', fontSize: 13,
                    fontWeight: editSection === s.key ? 700 : 400,
                  }}>{s.label}</button>
                ))}
              </div>
            )}

            {/* Content area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px 16px' : '24px 28px' }}>
              {renderSection()}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: isMobile ? '12px 16px' : '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
            <button onClick={() => setEditingProduct(null)} style={{ padding: '10px 20px', borderRadius: 9, border: '1px solid var(--border)', background: 'none', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer', color: 'var(--text-muted)' }}>Cancel</button>
            <button onClick={saveEdit} style={{ padding: '10px 24px', borderRadius: 9, border: 'none', background: 'var(--accent)', color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{isNew ? 'Add product' : 'Save changes'}</button>
          </div>
        </div>
      </div>
    );
  };

  const ProductsTab = () => {
    const q = productSearch.trim().toLowerCase();
    const visibleProducts = q
      ? products.filter(p => {
          const certoUrl = `/product/${p.id}`;
          return (
            p.name.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q) ||
            (p.subtitle || '').toLowerCase().includes(q) ||
            (p.type || '').toLowerCase().includes(q) ||
            (p.apple_url || '').toLowerCase().includes(q) ||
            certoUrl.includes(q)
          );
        })
      : products;

    return (
    <div>
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 18 : 22, color: 'var(--text)' }}>
          Product Listings {productsLoading
            ? <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>Loading…</span>
            : <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>
                {q ? `${visibleProducts.length} of ${products.length}` : `(${products.length})`}
              </span>}
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <RefreshBtn onClick={fetchProducts} loading={productsLoading} />
          <button onClick={openAdd} style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>+ Add Product</button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
        <input
          type="text"
          value={productSearch}
          onChange={e => setProductSearch(e.target.value)}
          placeholder="Search by name, ID, category, Apple URL, Certo URL…"
          style={{
            width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10,
            border: '1.5px solid var(--border)', background: 'var(--bg)',
            fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)',
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {q && (
          <button onClick={() => setProductSearch('')} aria-label="Clear search"
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)', lineHeight: 1, padding: 0 }}>
            ×
          </button>
        )}
      </div>

      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ background: 'var(--bg-alt)' }}>
              {['Product', 'Type', 'Condition', 'USD Price', 'NGN Price', 'Stock', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '12px 20px', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleProducts.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>
                No products match "{productSearch}"
              </td></tr>
            ) : visibleProducts.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{p.name}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{p.subtitle}</div>
                </td>
                <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.type}</td>
                <td style={{ padding: '14px 20px' }}><ConditionBadge condition={p.condition} /></td>
                <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>${p.usdPrice.toLocaleString()}</td>
                <td style={{ padding: '14px 20px', fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>₦{p.ngnPrice.toLocaleString()}</td>
                <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 14, color: p.stock === 0 ? 'oklch(50% 0.18 25)' : 'var(--text)' }}>{p.stock}</td>
                <td style={{ padding: '14px 20px' }}>
                  {(() => {
                    const ls = p.listingStatus || 'live';
                    const stMap = {
                      live:         { bg: 'oklch(93% 0.06 155)',  color: 'oklch(35% 0.15 155)', label: 'Live' },
                      out_of_stock: { bg: 'oklch(94% 0.02 0)',    color: 'oklch(45% 0.12 0)',   label: 'Out of Stock' },
                      coming_soon:  { bg: 'oklch(95% 0.07 60)',   color: 'oklch(42% 0.18 55)',  label: 'Coming Soon' },
                      hidden:       { bg: 'oklch(92% 0.01 0)',    color: 'oklch(52% 0.04 0)',   label: 'Hidden' },
                    };
                    const st = stMap[ls] || stMap.live;
                    return <span style={{ padding: '3px 10px', borderRadius: 6, background: st.bg, color: st.color, fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700 }}>{st.label}</span>;
                  })()}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <button onClick={() => openEdit(p)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
  };

  const ForexTab = () => {
    const timeSince = fetchedAt ? (() => {
      const diff = Math.floor((new Date() - fetchedAt) / 1000);
      if (diff < 60) return 'just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      return `${Math.floor(diff / 3600)}h ago`;
    })() : null;

    const cardPad = isMobile ? '20px 16px' : 32;

    return (
    <div style={{ maxWidth: isMobile ? '100%' : 560 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 18 : 22, color: 'var(--text)', margin: 0 }}>Forex Rate Panel</h2>
        <RefreshBtn onClick={() => { fetchOrders(); }} loading={false} />
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: isMobile ? 20 : 32 }}>
        Rate is auto-fetched from live market data. You can override it manually — your override stays active until the next auto-refresh.
      </p>

      {/* Live rate display card */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: cardPad, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
            {manualOverride ? 'Manual override active' : 'Live market rate'}
          </div>
          {!manualOverride && fetchedAt ? (
            <span style={{ background: 'oklch(93% 0.08 155)', color: 'oklch(35% 0.18 155)', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, letterSpacing: '0.04em', flexShrink: 0 }}>● LIVE</span>
          ) : manualOverride ? (
            <span style={{ background: 'oklch(95% 0.06 60)', color: 'oklch(45% 0.18 55)', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}>MANUAL</span>
          ) : (
            <span style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}>FETCHING…</span>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 32 : 40, color: 'var(--accent)', marginBottom: 4 }}>₦{forexRate.toLocaleString()}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: isMobile ? 13 : 14, color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: isMobile ? 6 : 12 }}>
          <span>per 1 USD</span>
          {timeSince && <span>· Auto-fetched {timeSince}</span>}
          {!manualOverride && fetchedAt && (
            <span style={{ fontSize: 12, color: 'oklch(45% 0.1 155)' }}>Source: ExchangeRate-API</span>
          )}
        </div>
        {manualOverride && (
          <button onClick={() => { setManualOverride(false); if (autoRate) { setForexRate(autoRate); setForexInput(String(autoRate)); } logEvent('Restored live forex rate', `Rate set back to ₦${autoRate?.toLocaleString()}/USD`); }}
            style={{ marginTop: 14, fontSize: 12, color: 'oklch(45% 0.18 155)', background: 'oklch(93% 0.06 155)', border: 'none', borderRadius: 7, padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, width: isMobile ? '100%' : 'auto' }}>
            ↺ Restore live rate {autoRate ? `(₦${autoRate.toLocaleString()})` : ''}
          </button>
        )}
      </div>

      {/* Manual override card */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: cardPad, marginBottom: 16 }}>
        <label style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 10 }}>Manual override (₦ per $1)</label>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
          <input type="number" value={forexInput} onChange={e => setForexInput(e.target.value)}
            style={{ flex: 1, padding: '14px 18px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-alt)', fontFamily: 'var(--font-head)', fontSize: isMobile ? 24 : 20, fontWeight: 700, color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button onClick={() => { const r = Number(forexInput); setForexRate(r); setManualOverride(true); setForexSaved(true); setTimeout(() => setForexSaved(false), 2000); logEvent('Overrode forex rate', `Manual rate set to ₦${r.toLocaleString()}/USD`); }}
            style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: forexSaved ? 'oklch(50% 0.18 145)' : 'var(--accent)', color: 'white', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, width: isMobile ? '100%' : 'auto' }}>
            {forexSaved ? '✓ Saved' : 'Override Rate'}
          </button>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6 }}>
          Use this if the parallel market rate differs significantly from the auto-fetched official rate.
        </p>
      </div>

      {/* Price preview */}
      <div style={{ background: 'var(--bg-alt)', borderRadius: 16, padding: isMobile ? '16px 14px' : 20, border: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Price preview at ₦{Number(forexInput).toLocaleString()}/USD</div>
        {PRODUCTS.slice(0, 4).map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: isMobile ? 12 : 13, color: 'var(--text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name} ({p.subtitle.split('·')[0].trim()})</span>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: isMobile ? 13 : 14, fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>₦{(p.usdPrice * Number(forexInput)).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
  };

  const RevenueTab = () => {
    // Exclude Payment Pending and Cancelled — only count confirmed/paid orders
    const revOrders  = applyTimeFilter(orders, revTimeFilter, revCustomFrom, revCustomTo)
      .filter(o => o.status !== 'Payment Pending' && o.status !== 'Cancelled');
    const revNgn     = revOrders.reduce((s, o) => s + o.ngn, 0);
    const revUsd     = revOrders.reduce((s, o) => s + o.usd, 0);
    const totalProfit= revOrders.reduce((s, o) => s + o.usd * 0.12, 0);
    const avgNgn     = revOrders.length ? revNgn / revOrders.length : 0;
    const avgUsd     = revOrders.length ? revUsd / revOrders.length : 0;
    const isNgn      = revCurrency === 'ngn';

    const fmtRev = (ngn, usd) => isNgn ? `₦${(ngn/1000000).toFixed(2)}M` : `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtAvg = (ngn, usd) => isNgn ? `₦${Math.round(ngn).toLocaleString()}` : `$${usd.toFixed(2)}`;

    const tfInputStyle = { padding: '8px 12px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--bg)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', outline: 'none', cursor: 'pointer' };

    return (
      <div>
        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 18 : 22, color: 'var(--text)', margin: 0, flex: 1 }}>Revenue Overview</h2>
          <RefreshBtn onClick={fetchOrders} loading={ordersLoading} />

          {/* Currency toggle */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-alt)', borderRadius: 10, padding: 4, border: '1px solid var(--border)' }}>
            {[['ngn', '₦ NGN'], ['usd', '$ USD']].map(([val, label]) => (
              <button key={val} onClick={() => setRevCurrency(val)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: revCurrency === val ? 'var(--accent)' : 'transparent', color: revCurrency === val ? 'white' : 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: revCurrency === val ? 700 : 400 }}>{label}</button>
            ))}
          </div>

          {/* Timeframe filter */}
          <select value={revTimeFilter} onChange={e => setRevTimeFilter(e.target.value)} style={tfInputStyle}>
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="year">Last 12 months</option>
            <option value="custom">Custom</option>
          </select>
          {revTimeFilter === 'custom' && (
            <>
              <input type="date" value={revCustomFrom} onChange={e => setRevCustomFrom(e.target.value)} style={{ ...tfInputStyle, cursor: 'auto' }} />
              <input type="date" value={revCustomTo}   onChange={e => setRevCustomTo(e.target.value)}   style={{ ...tfInputStyle, cursor: 'auto' }} />
            </>
          )}
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard label={`Total Revenue (${revCurrency.toUpperCase()})`} value={fmtRev(revNgn, revUsd)} sub={`${revOrders.length} orders`} />
          <StatCard label="Total Orders"   value={revOrders.length} />
          <StatCard label="Est. Net Profit" value={`$${totalProfit.toFixed(0)}`} sub="~12% avg margin" accent="oklch(45% 0.15 155)" />
          <StatCard label="Avg Order Value" value={fmtAvg(avgNgn, avgUsd)} sub="Per order" />
        </div>

        {/* Per-order table */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Per-Order Breakdown</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>{revOrders.length} orders</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ background: 'var(--bg-alt)' }}>
                {['Order', 'Customer', 'Revenue', 'Est. Cost', 'Est. Net', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {revOrders.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>No orders in this period.</td></tr>
              ) : revOrders.map(o => {
                const cost = o.usd * 0.88;
                const net  = o.usd * 0.12;
                return (
                  <tr key={o.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{o.id}</td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>{o.customer}</td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                      {isNgn ? `₦${o.ngn.toLocaleString()}` : `$${o.usd.toLocaleString()}`}
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>${cost.toFixed(0)}</td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: 'oklch(45% 0.15 155)' }}>${net.toFixed(0)}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ ...statusColor(o.status), padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)' }}>{o.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    );
  };

  const CustomersTab = () => {
    // Group orders by customer email/name to aggregate stats
    const customerMap = new Map();
    orders.forEach(o => {
      const key = o.email || o.customer;
      if (!customerMap.has(key)) {
        customerMap.set(key, { customer: o.customer, email: o.email, phone: o.phone, orders: [], totalNgn: 0, totalUsd: 0, lastDate: '' });
      }
      const c = customerMap.get(key);
      c.orders.push(o);
      c.totalNgn += o.ngn;
      c.totalUsd += o.usd;
      if (!c.lastDate || o.date > c.lastDate) c.lastDate = o.date;
    });
    const customers = [...customerMap.values()].sort((a, b) => b.orders.length - a.orders.length);

    return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, color: 'var(--text)', margin: 0 }}>Customer Database</h2>
        <RefreshBtn onClick={fetchOrders} loading={ordersLoading} />
      </div>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr style={{ background: 'var(--bg-alt)' }}>
              {['Customer', 'Orders', 'Total Spent', 'Last Order', 'Contact'].map(h => (
                <th key={h} style={{ padding: '12px 20px', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>No customers yet.</td></tr>
            ) : customers.map(c => (
              <tr key={c.email || c.customer} style={{ borderTop: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--accent)', flexShrink: 0 }}>
                      {c.customer.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{c.customer}</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{c.email || c.phone}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{c.orders.length}</td>
                <td style={{ padding: '14px 20px', fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>₦{Math.round(c.totalNgn).toLocaleString()}</td>
                <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>{c.lastDate}</td>
                <td style={{ padding: '14px 20px' }}>
                  {c.phone ? (
                    <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-block', background: 'oklch(93% 0.08 145)', border: '1px solid oklch(80% 0.12 145)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, color: 'oklch(35% 0.15 145)', fontWeight: 600, textDecoration: 'none' }}>
                      💬 WhatsApp
                    </a>
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
    );
  };

  const MessagesTab = () => {
    // selectedMessage / setSelectedMessage live in the parent scope (lifted for hook-count stability)

    const markRead = async (msg, read) => {
      await authFetch(`/api/contact/${msg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read }),
      });
      fetchMessages();
      if (selectedMessage?.id === msg.id) setSelectedMessage(s => ({ ...s, read }));
    };

    const deleteMsg = async (id) => {
      if (!confirm('Delete this message?')) return;
      await authFetch(`/api/contact/${id}`, { method: 'DELETE' });
      fetchMessages();
      if (selectedMessage?.id === id) setSelectedMessage(null);
    };

    const openMsg = (msg) => {
      setSelectedMessage(msg);
      if (!msg.read) markRead(msg, true);
    };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: selectedMessage ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* List */}
        <div style={{ background: 'var(--bg)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, color: 'var(--text)', margin: 0 }}>
              Messages {unreadMessages > 0 && <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>({unreadMessages} unread)</span>}
            </h2>
            <RefreshBtn onClick={fetchMessages} loading={messagesLoading} />
          </div>

          {messagesLoading ? (
            <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>Loading…</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>No messages yet.</div>
          ) : messages.map((msg, i) => (
            <div
              key={msg.id}
              onClick={() => openMsg(msg)}
              style={{
                padding: '14px 20px', cursor: 'pointer',
                borderBottom: i < messages.length - 1 ? '1px solid var(--border)' : 'none',
                background: selectedMessage?.id === msg.id ? 'var(--accent-tint)' : msg.read ? 'var(--bg)' : 'oklch(98% 0.01 250)',
                borderLeft: `3px solid ${selectedMessage?.id === msg.id ? 'var(--accent)' : msg.read ? 'transparent' : 'var(--accent)'}`,
              }}
              onMouseEnter={e => { if (selectedMessage?.id !== msg.id) e.currentTarget.style.background = 'var(--bg-alt)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = selectedMessage?.id === msg.id ? 'var(--accent-tint)' : msg.read ? 'var(--bg)' : 'oklch(98% 0.01 250)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: msg.read ? 500 : 700, color: 'var(--text)', marginBottom: 2 }}>
                  {!msg.read && <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', marginRight: 6, verticalAlign: 'middle', marginTop: -2 }} />}
                  {msg.name}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {new Date(msg.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{msg.email}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {msg.message}
              </div>
            </div>
          ))}
        </div>

        {/* Detail pane */}
        {selectedMessage && (
          <div style={{ background: 'var(--bg)', borderRadius: 14, border: '1px solid var(--border)', padding: 24, alignSelf: 'start', position: 'sticky', top: 80 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 4 }}>{selectedMessage.name}</div>
                <a href={`mailto:${selectedMessage.email}`} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>{selectedMessage.email}</a>
              </div>
              <button onClick={() => setSelectedMessage(null)} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              {new Date(selectedMessage.created_at).toLocaleString('en-NG', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>

            <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text)', lineHeight: 1.75, whiteSpace: 'pre-wrap', background: 'var(--bg-alt)', borderRadius: 10, padding: '16px', marginBottom: 20, border: '1px solid var(--border)' }}>
              {selectedMessage.message}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href={`mailto:${selectedMessage.email}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'var(--accent)', color: 'white', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>
                ✉ Reply via Email
              </a>
              <button onClick={() => markRead(selectedMessage, !selectedMessage.read)}
                style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
                {selectedMessage.read ? 'Mark Unread' : 'Mark Read'}
              </button>
              <button onClick={() => deleteMsg(selectedMessage.id)}
                style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid oklch(85% 0.05 20)', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 13, color: 'oklch(50% 0.18 20)', cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const BLANK_COUPON ={ code: '', description: '', discount_type: 'fixed', discount_value: '', applies_to: 'delivery', max_uses: '', expires_at: '', is_active: true };

  const CouponsTab = () => {
    const saveCoupon = async () => {
      setCouponSaving(true);
      setCouponSaveErr('');
      try {
        const isNew = !couponForm.id;
        const url   = isNew ? '/api/coupons' : `/api/coupons/${couponForm.id}`;
        const method = isNew ? 'POST' : 'PATCH';
        const body = { ...couponForm };
        if (!body.max_uses) body.max_uses = null;
        if (!body.expires_at) body.expires_at = null;
        if (!isNew) delete body.code; // code is immutable after creation

        const r = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Save failed');
        setCouponForm(null);
        fetchCoupons();
      } catch (e) {
        setCouponSaveErr(e.message);
      } finally {
        setCouponSaving(false);
      }
    };

    const deleteCoupon = async (id) => {
      if (!confirm('Delete this coupon?')) return;
      await authFetch(`/api/coupons/${id}`, { method: 'DELETE' });
      fetchCoupons();
    };

    const toggleActive = async (c) => {
      await authFetch(`/api/coupons/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !c.is_active }),
      });
      fetchCoupons();
    };

    const fieldStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font-body)', fontSize: 14, background: 'var(--bg)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
    const labelStyle = { fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, color: 'var(--text)', margin: 0 }}>Coupons</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <RefreshBtn onClick={fetchCoupons} loading={couponsLoading} />
            <button onClick={() => { setCouponForm({ ...BLANK_COUPON }); setCouponSaveErr(''); }}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              + New Coupon
            </button>
          </div>
        </div>

        {/* Create / edit form */}
        {couponForm && (
          <div style={{ background: 'var(--bg)', border: '1.5px solid var(--accent)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 20, marginTop: 0 }}>
              {couponForm.id ? `Edit Coupon — ${couponForm.code}` : 'New Coupon'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              {!couponForm.id && (
                <div>
                  <label style={labelStyle}>Code *</label>
                  <input style={fieldStyle} value={couponForm.code} placeholder="e.g. WELCOME20"
                    onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                </div>
              )}
              <div>
                <label style={labelStyle}>Description</label>
                <input style={fieldStyle} value={couponForm.description} placeholder="e.g. Welcome discount"
                  onChange={e => setCouponForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Discount Type *</label>
                <select style={fieldStyle} value={couponForm.discount_type}
                  onChange={e => setCouponForm(f => ({ ...f, discount_type: e.target.value }))}>
                  <option value="fixed">Fixed ($)</option>
                  <option value="percent">Percent (%)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Discount Value *</label>
                <input style={fieldStyle} type="number" min="0" value={couponForm.discount_value} placeholder="e.g. 20"
                  onChange={e => setCouponForm(f => ({ ...f, discount_value: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Applies To *</label>
                <select style={fieldStyle} value={couponForm.applies_to}
                  onChange={e => setCouponForm(f => ({ ...f, applies_to: e.target.value }))}>
                  <option value="delivery">Delivery fee only</option>
                  <option value="service">Service fee only</option>
                  <option value="both">Delivery + Service fees</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Max Total Uses (blank = unlimited)</label>
                <input style={fieldStyle} type="number" min="1" value={couponForm.max_uses} placeholder="e.g. 100"
                  onChange={e => setCouponForm(f => ({ ...f, max_uses: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Expires At (blank = never)</label>
                <input style={fieldStyle} type="date" value={couponForm.expires_at ? couponForm.expires_at.split('T')[0] : ''}
                  onChange={e => setCouponForm(f => ({ ...f, expires_at: e.target.value }))} />
              </div>
              {couponForm.id && (
                <div>
                  <label style={labelStyle}>Status</label>
                  <select style={fieldStyle} value={couponForm.is_active ? 'true' : 'false'}
                    onChange={e => setCouponForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}
            </div>
            {couponSaveErr && <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'oklch(45% 0.2 20)', marginBottom: 12 }}>{couponSaveErr}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveCoupon} disabled={couponSaving}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {couponSaving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setCouponForm(null)}
                style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Coupon list */}
        {couponsLoading ? (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>Loading…</div>
        ) : coupons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>No coupons yet. Create one above.</div>
        ) : (
          <div style={{ background: 'var(--bg)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-alt)' }}>
                  {['Code', 'Discount', 'Applies To', 'Uses', 'Expires', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map((c, i) => {
                  const discountLabel = c.discount_type === 'fixed' ? `$${Number(c.discount_value).toFixed(2)} off` : `${c.discount_value}% off`;
                  const appliesToLabel = c.applies_to === 'both' ? 'Delivery + Service' : c.applies_to === 'delivery' ? 'Delivery fee' : 'Service fee';
                  const expired = c.expires_at && new Date(c.expires_at) < new Date();
                  const exhausted = c.max_uses !== null && c.used_count >= c.max_uses;
                  const effectivelyInactive = !c.is_active || expired || exhausted;
                  return (
                    <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{c.code}</div>
                        {c.description && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{c.description}</div>}
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{discountLabel}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>{appliesToLabel}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)' }}>
                        {c.used_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ''}
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: 13, color: expired ? 'oklch(45% 0.2 20)' : 'var(--text-muted)' }}>
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                          background: effectivelyInactive ? 'oklch(94% 0.02 0)' : 'oklch(93% 0.06 145)',
                          color: effectivelyInactive ? 'oklch(45% 0.08 0)' : 'oklch(35% 0.15 145)' }}>
                          {expired ? 'Expired' : exhausted ? 'Exhausted' : c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => { setCouponForm({ ...c, expires_at: c.expires_at ? c.expires_at.split('T')[0] : '' }); setCouponSaveErr(''); }}
                            style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer', color: 'var(--text)' }}>Edit</button>
                          <button onClick={() => toggleActive(c)}
                            style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer', color: 'var(--text-muted)' }}>
                            {c.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={() => deleteCoupon(c.id)}
                            style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid oklch(85% 0.05 20)', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer', color: 'oklch(50% 0.18 20)' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ── All hooks have been called above — safe to conditionally return the login screen now ──
  if (!adminToken) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 28, color: 'var(--text)', letterSpacing: '-0.02em' }}>Certo Admin</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>Sign in to continue</div>
        </div>
        <form onSubmit={handleLogin} style={{ background: 'var(--bg-alt)', border: '1.5px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Password</label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              type={showPwd ? 'text' : 'password'}
              value={loginPwd}
              onChange={e => { setLoginPwd(e.target.value); setLoginErr(''); }}
              placeholder="Enter admin password"
              autoFocus
              style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: 10, border: `1.5px solid ${loginErr ? 'oklch(60% 0.2 20)' : 'var(--border)'}`, fontFamily: 'var(--font-body)', fontSize: 15, background: 'var(--bg)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
            />
            <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, padding: 2 }}>{showPwd ? 'Hide' : 'Show'}</button>
          </div>
          {loginErr && <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'oklch(45% 0.2 20)', marginBottom: 14 }}>⚠ {loginErr}</div>}
          <button type="submit" disabled={loginLoading || !loginPwd.trim()} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: loginPwd.trim() ? 'var(--accent)' : 'var(--border)', color: loginPwd.trim() ? 'white' : 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, cursor: loginPwd.trim() ? 'pointer' : 'not-allowed' }}>
            {loginLoading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
      </div>
    </div>
  );

  const ActivityTab = () => {
    // clearConfirm / setClearConfirm and clearing / setClearing live in the parent scope (lifted)

    const actionIcon = (action = '') => {
      if (action.startsWith('Sign'))    return '🔐';
      if (action.startsWith('Updat'))   return '✏️';
      if (action.startsWith('Creat'))   return '➕';
      if (action.startsWith('Delet'))   return '🗑️';
      if (action.startsWith('Enabl'))   return '✅';
      if (action.startsWith('Disabl'))  return '🔴';
      if (action.startsWith('Resent'))  return '✉️';
      if (action.startsWith('Status'))  return '🔄';
      if (action.startsWith('Flagg'))   return '🚩';
      if (action.startsWith('Unflag'))  return '✅';
      if (action.startsWith('Note'))    return '📝';
      if (action.startsWith('Cleared')) return '🧹';
      return '•';
    };

    const doClear = async () => {
      setClearing(true);
      try {
        await authFetch('/api/admin/logs', { method: 'DELETE' });
        fetchLogs();
        setClearConfirm(false);
      } catch(e) {}
      setClearing(false);
    };

    const fmt = (ts) => {
      const d = new Date(ts);
      return d.toLocaleString('en-NG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>Activity Log</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{logs.length} entries</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={fetchLogs} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>
              ↻ Refresh
            </button>
            {clearConfirm ? (
              <>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'oklch(45% 0.18 25)' }}>Clear all logs?</span>
                <button onClick={doClear} disabled={clearing} style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'white', background: 'oklch(50% 0.2 25)', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>
                  {clearing ? 'Clearing…' : 'Yes, clear'}
                </button>
                <button onClick={() => setClearConfirm(false)} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setClearConfirm(true)} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'oklch(45% 0.18 25)', background: 'oklch(96% 0.04 25)', border: '1px solid oklch(85% 0.08 25)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>
                🗑 Clear logs
              </button>
            )}
          </div>
        </div>

        {logsLoading ? (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', padding: '48px 0', textAlign: 'center' }}>Loading…</div>
        ) : logs.length === 0 ? (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', padding: '48px 0', textAlign: 'center' }}>No activity yet.</div>
        ) : (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            {logs.map((log, i) => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{actionIcon(log.action)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{log.action}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-tint)', border: '1px solid var(--accent-tint2)', borderRadius: 5, padding: '2px 8px' }}>{log.admin_name}</span>
                  </div>
                  {log.details && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{log.details}</div>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, textAlign: 'right', marginTop: 2 }}>{fmt(log.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Certificates Tab ──────────────────────────────────────────────────────
  const CertificatesTab = () => {
    const fld = { ...MODAL_FLD };
    const lbl = { ...MODAL_LBL };

    const filtered = React.useMemo(() => {
      if (!certSearch.trim()) return certificates;
      const q = certSearch.trim().toLowerCase();
      return certificates.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.order_id.toLowerCase().includes(q) ||
        (c.product_name || '').toLowerCase().includes(q) ||
        (c.serial_number || '').toLowerCase().includes(q) ||
        (c.recipient_name || '').toLowerCase().includes(q)
      );
    }, [certificates, certSearch]);

    const [createOrderId, setCreateOrderId] = React.useState('');
    const [createError,   setCreateError]   = React.useState('');

    const statusBadge = (s) => {
      const styles = {
        published: { bg: 'oklch(93% 0.06 155)', color: 'oklch(35% 0.15 155)', label: 'Published' },
        draft:     { bg: 'oklch(95% 0.08 70)',  color: 'oklch(42% 0.18 55)',  label: 'Pending / Draft' },
      };
      const st = styles[s] || styles.draft;
      return <span style={{ padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color, fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{st.label}</span>;
    };

    const handleCreateByOrderId = async () => {
      const id = createOrderId.trim().toUpperCase();
      if (!id) return;
      // Fetch order to pre-fill
      setCreateError('');
      try {
        const r = await authFetch(`/api/orders/${id}`);
        const order = await r.json();
        if (!r.ok) { setCreateError(order.error || 'Order not found'); return; }
        const normOrder = normaliseOrder(order);
        // Determine products
        const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : null;
        const productName = items ? items[0].name : (order.product_name || '');
        const productSub  = items ? (items[0].subtitle || '') : (order.product_subtitle || '');
        const vColor   = items ? (items[0].variant_color || null) : (order.variant_color || null);
        const vStorage = items ? (items[0].variant_storage || null) : (order.variant_storage || null);
        setPublishModal({ order: normOrder, productIndex: 0, productName, productSubtitle: productSub, variantColor: vColor, variantStorage: vStorage, existingCertId: null });
        setPublishDraft({ serial_number: '', apple_order_ref: '', chain_of_custody: [] });
        setPublishError('');
        setCreateOrderId('');
      } catch(e) {
        setCreateError('Could not fetch order. Check the ID and try again.');
      }
    };

    const deleteCert = async (certId) => {
      if (!confirm('Delete this certificate? This cannot be undone.')) return;
      try {
        const r = await authFetch(`/api/certificates/${certId}`, { method: 'DELETE' });
        if (r.ok) fetchCertificates();
      } catch(e) {}
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, color: 'var(--text)', margin: '0 0 4px' }}>Certificates</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Published and draft verification certificates for customer orders.</p>
          </div>
          <RefreshBtn onClick={fetchCertificates} loading={certsLoading} />
        </div>

        {/* Create by order ID */}
        <div style={{ background: 'var(--bg)', border: '1.5px dashed var(--border)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ ...lbl, marginBottom: 10 }}>Create certificate for order</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <input
              value={createOrderId}
              onChange={e => { setCreateOrderId(e.target.value.toUpperCase()); setCreateError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleCreateByOrderId()}
              placeholder="CRT-220426-8841"
              style={{ ...fld, width: 220, flexShrink: 0 }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button onClick={handleCreateByOrderId} disabled={!createOrderId.trim()}
              style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: createOrderId.trim() ? 'var(--accent)' : 'var(--border)', color: 'white', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, cursor: createOrderId.trim() ? 'pointer' : 'not-allowed' }}>
              Open Certificate Form →
            </button>
          </div>
          {createError && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'oklch(45% 0.2 20)', marginTop: 8 }}>{createError}</div>}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by cert ID, order ID, product, serial, recipient…"
            value={certSearch}
            onChange={e => setCertSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Table */}
        {certsLoading ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>
            {certificates.length === 0 ? 'No certificates yet. Create one using the order ID form above.' : 'No certificates match your search.'}
          </div>
        ) : (
          <div style={{ background: 'var(--bg)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: 'var(--bg-alt)' }}>
                  {['Certificate ID', 'Order', 'Product', 'Serial', 'Status', 'Issued', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.02em', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{c.id}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.order_id}</td>
                    <td style={{ padding: '12px 16px', maxWidth: 200 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.product_name}</div>
                      {c.product_subtitle && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>{c.product_subtitle}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{c.serial_number || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>{statusBadge(c.status)}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {c.published_at ? new Date(c.published_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap' }}>
                        {c.status !== 'published' && (
                          <button
                            onClick={() => {
                              // Find the matching order from the orders list or just pass order_id
                              const order = orders.find(o => o.id === c.order_id) || { id: c.order_id };
                              setPublishModal({ order, productIndex: c.product_index, productName: c.product_name, productSubtitle: c.product_subtitle || '', variantColor: c.variant_color || null, variantStorage: c.variant_storage || null, existingCertId: c.id });
                              setPublishDraft({ serial_number: c.serial_number || '', apple_order_ref: c.apple_order_ref || '', chain_of_custody: Array.isArray(c.chain_of_custody) ? c.chain_of_custody : [] });
                              setPublishError('');
                            }}
                            style={{ padding: '5px 12px', borderRadius: 7, border: '1.5px solid var(--accent)', background: 'var(--accent-tint)', color: 'var(--accent)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            Edit / Publish
                          </button>
                        )}
                        {c.status === 'published' && (
                          <a href={`/verify/${c.order_id}`} target="_blank" rel="noreferrer"
                            style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>
                            View
                          </a>
                        )}
                        <button onClick={() => deleteCert(c.id)}
                          style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid oklch(85% 0.05 20)', background: 'transparent', color: 'oklch(50% 0.18 20)', fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Publish-certificate modal ──────────────────────────────────────────────
  const renderPublishModal = () => {
    if (!publishModal) return null;
    const { order, productIndex, productName, productSubtitle, variantColor, variantStorage, existingCertId } = publishModal;
    const fld = { ...MODAL_FLD };
    const lbl = { ...MODAL_LBL };

    const custody = Array.isArray(publishDraft.chain_of_custody) ? publishDraft.chain_of_custody : [];

    const setCustodyItem = (i, key, val) => setPublishDraft(d => ({
      ...d, chain_of_custody: d.chain_of_custody.map((s, j) => j === i ? { ...s, [key]: val } : s),
    }));
    const addCustodyStep = () => setPublishDraft(d => ({ ...d, chain_of_custody: [...d.chain_of_custody, { title: '', subtitle: '', date: '' }] }));
    const removeCustodyStep = (i) => setPublishDraft(d => ({ ...d, chain_of_custody: d.chain_of_custody.filter((_, j) => j !== i) }));

    const canPublish = publishDraft.serial_number.trim() && publishDraft.apple_order_ref.trim() && custody.length > 0;

    const handleSave = async (publish) => {
      if (publish && !canPublish) {
        setPublishError('Serial number, Apple order ref, and at least one chain-of-custody step are required to publish.');
        return;
      }
      setPublishSaving(true);
      setPublishError('');
      try {
        const rawOrder = order.raw || {};
        const body = {
          order_id:          order.id,
          product_index:     productIndex,
          product_name:      productName,
          product_subtitle:  productSubtitle || '',
          variant_color:     variantColor  || null,
          variant_storage:   variantStorage || null,
          serial_number:     publishDraft.serial_number.trim(),
          apple_order_ref:   publishDraft.apple_order_ref.trim(),
          chain_of_custody:  custody,
          status:            publish ? 'published' : 'draft',
          recipient_name:    rawOrder.customer_name || order.customer || '',
          recipient_address: rawOrder.address || '',
          recipient_state:   rawOrder.state   || '',
          usd_price:         rawOrder.usd_price || order.usd || 0,
          ngn_price:         rawOrder.ngn_price || order.ngn || 0,
          forex_rate:        rawOrder.forex_rate || 0,
        };
        const url    = existingCertId ? `/api/certificates/${existingCertId}` : '/api/certificates';
        const method = existingCertId ? 'PATCH' : 'POST';
        const r = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Save failed');
        fetchCertificates();
        setPublishModal(null);
      } catch(e) {
        setPublishError(e.message || 'Failed to save certificate');
      } finally {
        setPublishSaving(false);
      }
    };

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px 40px', overflowY: 'auto' }}
        onClick={e => { if (e.target === e.currentTarget) setPublishModal(null); }}>
        <div style={{ background: 'var(--bg)', borderRadius: 20, width: '100%', maxWidth: 680, padding: 32, boxShadow: '0 32px 80px -16px rgba(0,0,0,0.35)', flexShrink: 0 }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, color: 'var(--text)', margin: '0 0 4px' }}>
                {existingCertId ? 'Edit Certificate' : 'Publish Certificate'}
              </h2>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
                {productName}{productSubtitle ? ` · ${productSubtitle}` : ''} — Order <strong>{order.id}</strong>
              </div>
            </div>
            <button onClick={() => setPublishModal(null)} aria-label="Close"
              style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
          </div>

          {/* Serial + Apple order ref */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={lbl}>Serial Number *</label>
              <input value={publishDraft.serial_number} onChange={e => setPublishDraft(d => ({ ...d, serial_number: e.target.value }))}
                placeholder="e.g. M82FX19JH3RQ"
                style={{ ...fld, fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: '0.04em' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={lbl}>Apple Order Reference *</label>
              <input value={publishDraft.apple_order_ref} onChange={e => setPublishDraft(d => ({ ...d, apple_order_ref: e.target.value }))}
                placeholder="e.g. W1234567890"
                style={{ ...fld, fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: '0.04em' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>

          {/* Chain of custody */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ ...lbl, marginBottom: 10 }}>Chain of Custody * <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(at least one step required)</span></label>
            {custody.map((step, i) => (
              <div key={i} style={{ background: 'var(--bg-alt)', borderRadius: 10, padding: 14, marginBottom: 10, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Step {i + 1}</span>
                  <button onClick={() => removeCustodyStep(i)} aria-label="Remove"
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}>×</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, marginBottom: 8 }}>
                  <div>
                    <label style={{ ...lbl, marginBottom: 4 }}>Title</label>
                    <input value={step.title} onChange={e => setCustodyItem(i, 'title', e.target.value)}
                      placeholder="e.g. Apple Inc." style={fld}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  </div>
                  <div>
                    <label style={{ ...lbl, marginBottom: 4 }}>Date</label>
                    <input value={step.date} onChange={e => setCustodyItem(i, 'date', e.target.value)}
                      placeholder="MAY 03" style={fld}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  </div>
                </div>
                <div>
                  <label style={{ ...lbl, marginBottom: 4 }}>Subtitle / Detail</label>
                  <input value={step.subtitle} onChange={e => setCustodyItem(i, 'subtitle', e.target.value)}
                    placeholder="e.g. Cupertino, CA · United States" style={fld}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </div>
            ))}
            <button onClick={addCustodyStep}
              style={{ fontSize: 13, color: 'var(--accent)', background: 'var(--accent-tint)', border: '1px dashed var(--accent-tint2)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
              + Add Custody Step
            </button>
          </div>

          {/* Error */}
          {publishError && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'oklch(97% 0.02 20)', border: '1px solid oklch(85% 0.05 20)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'oklch(40% 0.15 20)' }}>
              ⚠ {publishError}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={() => setPublishModal(null)}
              style={{ padding: '11px 22px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={() => handleSave(false)} disabled={publishSaving}
              style={{ padding: '11px 22px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, cursor: publishSaving ? 'not-allowed' : 'pointer' }}>
              {publishSaving ? 'Saving…' : 'Save as Draft'}
            </button>
            <button onClick={() => handleSave(true)} disabled={publishSaving || !canPublish}
              style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: canPublish ? 'var(--accent)' : 'var(--border)', color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, cursor: publishSaving || !canPublish ? 'not-allowed' : 'pointer', opacity: !canPublish ? 0.65 : 1 }}>
              {publishSaving ? 'Publishing…' : '✓ Publish Certificate'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const tabContent = {
    orders:       OrdersTab(),
    products:     ProductsTab(),
    certificates: CertificatesTab(),
    messages:     MessagesTab(),
    coupons:      CouponsTab(),
    activity:     ActivityTab(),
    forex:        ForexTab(),
    revenue:      RevenueTab(),
    customers:    CustomersTab(),
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-alt)', paddingTop: 64 }}>
      {renderEditModal()}
      {renderPublishModal()}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '40px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 22 : 28, color: 'var(--text)', marginBottom: 4 }}>Dashboard</h1>
            {!isMobile && <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>Internal order & product management</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {adminName && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-tint)', border: '1px solid var(--accent-tint2)', borderRadius: 8, padding: '5px 12px' }}>
                👋 {adminName}
              </div>
            )}
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px' }}>
              ₦{CERTO_RATE.toLocaleString()}/USD
            </div>
            <button onClick={handleLogout} title="Sign out" style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>
              Sign out
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginBottom: 24, paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 6, width: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activeTab === t.key ? 'var(--accent)' : 'transparent',
              color: activeTab === t.key ? 'white' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: activeTab === t.key ? 700 : 500,
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {t.label}
              {t.count > 0 && (
                <span style={{ background: activeTab === t.key ? 'rgba(255,255,255,0.25)' : 'var(--accent)', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
        </div>

        {tabContent[activeTab]}
      </div>
    </div>
  );
};

export { DashboardPage };
