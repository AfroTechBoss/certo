// ─── Map raw API rows → dashboard-friendly shapes ────────────────────────────
// Pure functions; no side effects. Used everywhere a tab reads from /api.

export function mapOrder(r) {
  return {
    id: r.id,
    customer: r.customer_name,
    phone: r.customer_phone,
    email: r.customer_email,
    product: r.product_name,
    product_subtitle: r.product_subtitle || '',
    apple_url: r.apple_url || '',
    product_image_url: r.product_image_url || '',
    items: Array.isArray(r.items) && r.items.length
      ? r.items
      : [{ name: r.product_name, subtitle: r.product_subtitle, usd_price: Number(r.usd_price), qty: r.qty || 1, applecare: r.applecare,
           variant_color: r.variant_color || null, variant_storage: r.variant_storage || null, variant_color_hex: r.variant_color_hex || null }],
    variant_color:     r.variant_color     || null,
    variant_storage:   r.variant_storage   || null,
    variant_color_hex: r.variant_color_hex || null,
    status: r.status,
    payment_method: r.payment_method || 'Paystack',
    flag: r.flagged || false,
    flag_reason: r.flag_reason || '',
    flag_by: r.flag_by || '',
    admin_hidden: r.admin_hidden || false,
    ngn: Number(r.ngn_price) || 0,
    usd: Number(r.usd_price) || 0,
    date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
    address: [r.address, r.state].filter(Boolean).join(', ') || '—',
  };
}

export function mapProduct(r) {
  return {
    id: r.id,
    name: r.name,
    subtitle: r.subtitle || '',
    type: r.category || r.type || '',
    condition: r.condition || 'New',
    conditionNote: r.condition_note || '',
    usdPrice: Number(r.usd_price) || 0,
    ngnPrice: Number(r.ngn_price) || 0,
    stock: Number(r.stock_count) ?? 0,
    inStock: r.in_stock !== false,
    listingStatus: r.listing_status || 'live',
    featured: r.featured || false,
    badge: r.badge || '',
    deliveryDays: r.delivery_days || '',
    appleUrl: r.apple_url || '',
    sortOrder: Number(r.sort_order) || 0,
    variants: r.variants || null,
    code: r.code ? String(r.code) : null,
  };
}

export function mapCert(r) {
  const d = r.issued_at || r.created_at;
  return {
    id: r.id,
    order_id: r.order_id,
    product_name: r.product_name,
    serial_number: r.serial_number || '',
    status: r.status || 'draft',
    date: d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
  };
}

export function mapMessage(r) {
  const d = r.created_at;
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    message: r.message,
    read: r.read || false,
    created_at: d ? new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—',
  };
}

export function mapCoupon(r) {
  return {
    id:          r.id,
    code:        r.code,
    description: r.description || '',
    type:        r.discount_type  || 'percent',
    value:       Number(r.discount_value) || 0,
    applies_to:  r.applies_to || 'all',
    active:      r.is_active !== false,
    expires:     r.expires_at ? new Date(r.expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No expiry',
    expires_raw: r.expires_at || null,
    uses:        Number(r.used_count) || 0,
    max_uses:    r.max_uses != null ? Number(r.max_uses) : null,
  };
}

export function mapLog(r) {
  const d = r.created_at;
  return {
    action: r.action,
    details: r.details,
    admin: r.admin_name,
    ts: d ? new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—',
  };
}

// Build a 7-day NGN revenue series for the overview/revenue charts.
export function buildRevenueSeries(rawOrders) {
  const days = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    days[key] = { day: key, ngn: 0 };
  }
  (rawOrders || []).forEach(o => {
    if (!o.created_at) return;
    const key = new Date(o.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    if (days[key]) days[key].ngn += Number(o.ngn_price || 0);
  });
  return Object.values(days);
}
