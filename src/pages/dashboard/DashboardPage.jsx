
// Certo — Internal Dashboard

const MOCK_ORDERS = [
  { id: 'CRT-2204-8841', customer: 'Adaeze Okoye',  phone: '08031234567', address: '14 Adeola Odeku St, Victoria Island, Lagos',       product: 'iPhone 15 Pro 256GB',    status: 'Customs Clearance',       usd: 1098, ngn: 1745820, date: 'Apr 22, 2026', flag: false },
  { id: 'CRT-2203-4412', customer: 'Emeka Obi',      phone: '07056789012', address: '3 Aminu Kano Crescent, Wuse 2, Abuja',              product: 'MacBook Air M3 13"',      status: 'Delivered',                usd: 1198, ngn: 1904820, date: 'Apr 18, 2026', flag: false },
  { id: 'CRT-2203-3301', customer: 'Ngozi Eze',      phone: '09012345678', address: '7 Rumuola Rd, Port Harcourt, Rivers',               product: 'AirPods Pro 2nd Gen',     status: 'Delivered',                usd: 348,  ngn: 553320,  date: 'Apr 15, 2026', flag: false },
  { id: 'CRT-2204-9210', customer: 'Tunde Balogun',  phone: '08167890123', address: '22 Bodija Estate, Ibadan, Oyo',                     product: 'iPhone 15 Pro 512GB',    status: 'Order Confirmed',          usd: 1298, ngn: 2063820, date: 'Apr 24, 2026', flag: false },
  { id: 'CRT-2204-7752', customer: 'Chisom Nwosu',   phone: '07034561234', address: '5 Independence Layout, Enugu',                      product: 'iPad Pro 11"',            status: 'Purchased from Apple',     usd: 999,  ngn: 1588410, date: 'Apr 23, 2026', flag: true  },
  { id: 'CRT-2202-1190', customer: 'Kemi Adeleke',   phone: '08098765432', address: '9 GRA Phase 2, Benin City, Edo',                    product: 'Apple Watch S9 41mm',    status: 'Delivered',                usd: 399,  ngn: 634410,  date: 'Apr 10, 2026', flag: false },
  { id: 'CRT-2204-6631', customer: 'Femi Oladele',   phone: '08123456789', address: '31 Allen Avenue, Ikeja, Lagos',                     product: 'MacBook Air M3 15"',     status: 'In Transit to US Partner', usd: 1498, ngn: 2381820, date: 'Apr 25, 2026', flag: false },
  { id: 'CRT-2204-5502', customer: 'Amaka Chukwu',   phone: '07089012345', address: '18 Trans-Amadi Industrial Layout, Port Harcourt',   product: 'AirPods Pro 2 (Refurb)', status: 'Arrived in Nigeria',       usd: 249,  ngn: 395910,  date: 'Apr 27, 2026', flag: false },
];

const INITIAL_PRODUCTS = PRODUCTS.map(p => ({
  ...p,
  stock: p.inStock ? Math.floor(Math.random() * 8) + 1 : 0,
  ngnPrice: p.usdPrice * CERTO_RATE,
}));

const ALL_STATUSES = [
  'Order Confirmed',
  'Purchased from Apple',
  'In Transit to US Partner',
  'Customs Clearance',
  'Arrived in Nigeria',
  'Out for Delivery',
  'Delivered',
];

const statusColor = (s) => {
  if (s === 'Delivered')               return { bg: 'oklch(93% 0.06 155)',  color: 'oklch(35% 0.15 155)' };
  if (s === 'Order Confirmed')         return { bg: 'oklch(93% 0.06 250)',  color: 'oklch(40% 0.15 250)' };
  if (s === 'Customs Clearance')       return { bg: 'oklch(96% 0.06 80)',   color: 'oklch(45% 0.15 65)'  };
  if (s === 'Arrived in Nigeria')      return { bg: 'oklch(94% 0.08 155)',  color: 'oklch(38% 0.16 155)' };
  if (s === 'Out for Delivery')        return { bg: 'oklch(95% 0.07 60)',   color: 'oklch(42% 0.18 55)'  };
  if (s === 'In Transit to US Partner')return { bg: 'oklch(94% 0.06 220)',  color: 'oklch(42% 0.14 220)' };
  if (s === 'Purchased from Apple')    return { bg: 'oklch(94% 0.05 30)',   color: 'oklch(44% 0.14 30)'  };
  return { bg: 'oklch(94% 0.03 250)', color: 'oklch(45% 0.12 250)' };
};

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

const DashboardPage = ({ navigate, subPage = 'orders', liveRate }) => {
  const { isMobile } = useResponsive();
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

  // Own fetch — dashboard is self-sufficient, doesn't wait on App.jsx timing
  React.useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(data => {
        if (data.rates && data.rates.NGN) {
          const rate = Math.round(data.rates.NGN) + 100;
          const now = new Date();
          CERTO_RATE = rate;
          setFetchedAt(now);
          setAutoRate(rate);
          if (!manualOverride) {
            setForexRate(rate);
            setForexInput(String(rate));
          }
          try {
            localStorage.setItem('certo_rate', String(rate));
            localStorage.setItem('certo_rate_ts', String(now.getTime()));
          } catch(e) {}
        }
      })
      .catch(() => {});
  }, []);
  const [selectedOrder,setSelectedOrder]= React.useState(null);
  const [orders,       setOrders]       = React.useState(MOCK_ORDERS);
  const [products,       setProducts]       = React.useState(INITIAL_PRODUCTS);
  const [editingProduct, setEditingProduct] = React.useState(null);
  const [editDraft,      setEditDraft]      = React.useState({});
  const [editSection,    setEditSection]    = React.useState('basic');

  // Orders — filter + search state
  const [orderSearch,      setOrderSearch]      = React.useState('');
  const [orderStatusFilter,setOrderStatusFilter] = React.useState('all');
  const [orderTimeFilter,  setOrderTimeFilter]   = React.useState('all');
  const [orderFlaggedOnly, setOrderFlaggedOnly]  = React.useState(false);

  const tabs = [
    { key: 'orders',    label: 'Orders',    count: orders.filter(o => o.status !== 'Delivered').length },
    { key: 'products',  label: 'Products'  },
    { key: 'forex',     label: 'Forex'     },
    { key: 'revenue',   label: 'Revenue'   },
    { key: 'customers', label: 'Customers' },
  ];

  const totalRevNgn = orders.reduce((s, o) => s + o.ngn, 0);
  const totalRevUsd = orders.reduce((s, o) => s + o.usd, 0);
  const delivered   = orders.filter(o => o.status === 'Delivered').length;
  const active      = orders.filter(o => o.status !== 'Delivered').length;

  // Filtering logic
  const filteredOrders = React.useMemo(() => {
    return orders.filter(o => {
      if (orderSearch.trim()) {
        const q = orderSearch.trim().toLowerCase();
        const hit =
          o.id.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.phone.includes(q) ||
          o.address.toLowerCase().includes(q) ||
          o.product.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
      if (orderFlaggedOnly && !o.flag) return false;
      if (orderTimeFilter !== 'all') {
        const d   = new Date(o.date);
        const now = new Date();
        if (orderTimeFilter === 'today') {
          if (d.toDateString() !== now.toDateString()) return false;
        } else if (orderTimeFilter === 'week') {
          if (d < new Date(now - 7 * 86400000)) return false;
        } else if (orderTimeFilter === 'month') {
          if (d < new Date(now - 30 * 86400000)) return false;
        }
      }
      return true;
    });
  }, [orders, orderSearch, orderStatusFilter, orderTimeFilter, orderFlaggedOnly]);

  const activeFilters =
    (orderSearch.trim() ? 1 : 0) +
    (orderStatusFilter !== 'all' ? 1 : 0) +
    (orderTimeFilter !== 'all' ? 1 : 0) +
    (orderFlaggedOnly ? 1 : 0);

  const clearFilters = () => {
    setOrderSearch('');
    setOrderStatusFilter('all');
    setOrderTimeFilter('all');
    setOrderFlaggedOnly(false);
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

  const OrdersTab = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Orders"  value={orders.length} />
        <StatCard label="Active Orders" value={active}    accent="var(--accent)" />
        <StatCard label="Delivered"     value={delivered} accent="oklch(45% 0.15 155)" />
        <StatCard label="Flagged"       value={orders.filter(o => o.flag).length} accent="oklch(50% 0.18 25)" />
      </div>

      {selectedOrder ? (
        <div>
          <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--accent)', marginBottom: 20, padding: 0 }}>
            ← Back to orders
          </button>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>ORDER</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 24, color: 'var(--text)' }}>{selectedOrder.id}</div>
              </div>
              <select defaultValue={selectedOrder.status} onChange={e => {
                setOrders(orders.map(o => o.id === selectedOrder.id ? {...o, status: e.target.value} : o));
                setSelectedOrder({...selectedOrder, status: e.target.value});
              }} style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid var(--accent)', background: 'var(--accent-tint)', color: 'var(--accent)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 16 }}>
              {[
                { label: 'Customer',   value: selectedOrder.customer },
                { label: 'Phone',      value: selectedOrder.phone    },
                { label: 'Product',    value: selectedOrder.product  },
                { label: 'Order Date', value: selectedOrder.date     },
                { label: 'USD Total',  value: `$${selectedOrder.usd.toLocaleString()}`  },
                { label: 'NGN Total',  value: `₦${selectedOrder.ngn.toLocaleString()}`  },
                { label: 'Status',     value: selectedOrder.status   },
                { label: 'Address',    value: selectedOrder.address  },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{f.value}</div>
                </div>
              ))}
            </div>
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
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Time filter */}
            <select value={orderTimeFilter} onChange={e => setOrderTimeFilter(e.target.value)} style={inputStyle}>
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
            </select>

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
                {['Order ID', 'Customer', 'Product', 'Status', 'NGN Total', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '12px 20px', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>
                    No orders match your filters.
                  </td>
                </tr>
              ) : filteredOrders.map(o => {
                const sc = statusColor(o.status);
                return (
                  <tr key={o.id} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => setSelectedOrder(o)}>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                      {o.flag && <span style={{ marginRight: 6 }}>🚩</span>}{o.id}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{o.customer}</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{o.phone}</div>
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 160 }}>{o.product}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 6, background: sc.bg, color: sc.color, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{o.status}</span>
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
      usdPrice: 0, images: [], badge: '', deliveryDays: '10–18 business days',
      inStock: true, featured: false,
      overview: [], specs: [], includes: [], features: [], techSpecs: [],
      stock: 0, ngnPrice: 0,
    };
    setEditDraft(blank);
    setEditSection('basic');
    setEditingProduct(blank);
  };

  const saveEdit = () => {
    const updated = {
      ...editDraft,
      usdPrice: Number(editDraft.usdPrice),
      ngnPrice: Number(editDraft.usdPrice) * forexRate,
      stock:    Number(editDraft.stock),
    };
    const exists = products.some(p => p.id === editingProduct.id);
    if (exists) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
    } else {
      setProducts(prev => [...prev, updated]);
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

    const fld = {
      padding: '9px 13px', borderRadius: 8, border: '1.5px solid var(--border)',
      background: 'var(--bg-alt)', fontFamily: 'var(--font-body)', fontSize: 13,
      color: 'var(--text)', outline: 'none', boxSizing: 'border-box', width: '100%',
    };
    const lbl = { fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' };
    const focus = e => e.target.style.borderColor = 'var(--accent)';
    const blur  = e => e.target.style.borderColor = 'var(--border)';

    const ListEditor = ({ label, listKey, blank = '' }) => (
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...lbl, marginBottom: 10 }}>{label}</div>
        {(editDraft[listKey] || []).map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={item} onChange={e => setListItem(listKey, i, e.target.value)}
              onFocus={focus} onBlur={blur}
              style={{ ...fld, flex: 1 }} />
            <button onClick={() => removeListItem(listKey, i)}
              style={{ padding: '0 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, flexShrink: 0 }}>×</button>
          </div>
        ))}
        <button onClick={() => addListItem(listKey, blank)}
          style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-tint)', border: '1px dashed var(--accent-tint2)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          + Add item
        </button>
      </div>
    );

    const isNew = !products.some(p => p.id === editingProduct.id);

    const EDIT_SECTIONS = [
      { key: 'basic',     label: 'Basic Info'     },
      { key: 'condition', label: 'Condition'       },
      { key: 'images',    label: 'Images'          },
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
                <select style={{ ...fld, cursor: 'pointer' }} value={editDraft.inStock ? 'live' : 'out'} onChange={e => setDF('inStock', e.target.value === 'live')}>
                  <option value="live">Live</option>
                  <option value="out">Out of Stock</option>
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
            <ListEditor label="Image URLs (one per line)" listKey="images" blank="https://" />
            {(editDraft.images || []).filter(url => url.startsWith('http') || url.startsWith('/')).slice(0, 1).map((url, i) => (
              <div key={i} style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
                <img src={url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
              </div>
            ))}
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
              Add full image URLs (https://...). The first image is the main display image; additional images appear as thumbnails in the gallery.
            </p>
          </div>
        );

        case 'overview': return <ListEditor label="Overview bullets" listKey="overview" blank="New bullet point" />;
        case 'specs':    return <ListEditor label="Quick spec highlights" listKey="specs" blank="New spec" />;
        case 'inbox':    return <ListEditor label="What's in the box" listKey="includes" blank="New item" />;

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
                    <button onClick={() => removeSpecItem(si, ii)}
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
            <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
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

  const ProductsTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 18 : 22, color: 'var(--text)' }}>Product Listings</h2>
        <button onClick={openAdd} style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>+ Add Product</button>
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
            {products.map(p => (
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
                  <span style={{ padding: '3px 10px', borderRadius: 6, background: p.inStock ? 'oklch(93% 0.06 155)' : 'oklch(94% 0.02 0)', color: p.inStock ? 'oklch(35% 0.15 155)' : 'oklch(45% 0.12 0)', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700 }}>
                    {p.inStock ? 'Live' : 'Out of Stock'}
                  </span>
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
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 18 : 22, color: 'var(--text)', marginBottom: 8 }}>Forex Rate Panel</h2>
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
          <button onClick={() => { setManualOverride(false); if (autoRate) { setForexRate(autoRate); setForexInput(String(autoRate)); } }}
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
          <button onClick={() => { setForexRate(Number(forexInput)); setManualOverride(true); setForexSaved(true); setTimeout(() => setForexSaved(false), 2000); }}
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
    const margin     = 0.12;
    const totalCost  = orders.reduce((s, o) => s + o.usd * 0.88, 0);
    const totalProfit= orders.reduce((s, o) => s + o.usd * margin, 0);

    return (
      <div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, color: 'var(--text)', marginBottom: 24 }}>Revenue Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard label="Total Revenue (NGN)" value={`₦${(totalRevNgn/1000000).toFixed(1)}M`} sub="All orders" />
          <StatCard label="Total Revenue (USD)" value={`$${totalRevUsd.toLocaleString()}`} sub="All orders" />
          <StatCard label="Est. Net Margin"      value={`$${totalProfit.toFixed(0)}`} sub="~12% avg margin" accent="oklch(45% 0.15 155)" />
          <StatCard label="Avg Order Value"      value={`₦${(totalRevNgn/orders.length/1000).toFixed(0)}k`} sub="Per order" />
        </div>

        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Per-Order Breakdown</span>
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
              {orders.map(o => {
                const cost = o.usd * 0.88;
                const net  = o.usd * 0.12;
                return (
                  <tr key={o.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{o.id}</td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>{o.customer}</td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>${o.usd.toLocaleString()}</td>
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

  const CustomersTab = () => (
    <div>
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, color: 'var(--text)', marginBottom: 24 }}>Customer Database</h2>
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
            {[...new Map(orders.map(o => [o.customer, o])).values()].map(o => (
              <tr key={o.customer} style={{ borderTop: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>
                      {o.customer.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{o.customer}</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{o.phone}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>1</td>
                <td style={{ padding: '14px 20px', fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>₦{o.ngn.toLocaleString()}</td>
                <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>{o.date}</td>
                <td style={{ padding: '14px 20px' }}>
                  <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--accent)' }}>WhatsApp</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );

  const tabContent = {
    orders:    <OrdersTab />,
    products:  <ProductsTab />,
    forex:     <ForexTab />,
    revenue:   <RevenueTab />,
    customers: <CustomersTab />,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-alt)', paddingTop: 64 }}>
      {renderEditModal()}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '40px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 22 : 28, color: 'var(--text)', marginBottom: 4 }}>Dashboard</h1>
            {!isMobile && <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>Internal order & product management</p>}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px' }}>
            ₦{CERTO_RATE.toLocaleString()}/USD
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

Object.assign(window, { DashboardPage });
