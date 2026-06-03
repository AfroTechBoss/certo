// Certo Dashboard — tab views (part 1): Overview, Orders, Products
const { useState: useS1, useMemo: useM1 } = React;
const U = window.CertoDashUI;
const MK = window.CERTO_MOCK;
const DIcon = window.DashIcon;

const fmtN = n => '₦' + Number(n).toLocaleString();
const fmtU = n => '$' + Number(n).toLocaleString();

// ════ OVERVIEW ════════════════════════════════════════════════════════════
function OverviewTab({ isMobile, setTab }) {
  const orders = MK.MOCK_ORDERS;
  const totalNgn = orders.reduce((s, o) => s + o.ngn, 0);
  const delivered = orders.filter(o => o.status === 'Delivered').length;
  const active = orders.filter(o => !['Delivered', 'Cancelled', 'Payment Pending'].includes(o.status)).length;
  const pending = orders.filter(o => o.status === 'Payment Pending').length;
  const recent = orders.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14 }}>
        <U.StatCard label="Revenue (30d)" value={'₦' + (totalNgn / 1e6).toFixed(1) + 'M'} delta="12.4%" deltaUp sub="vs last month"
          spark={MK.MOCK_REVENUE_SERIES.map(r => r.ngn)} icon={<DIcon name="coins" size={16} />} />
        <U.StatCard label="Active Orders" value={active} delta="3" deltaUp sub="in transit" accent="var(--accent)"
          icon={<DIcon name="box" size={16} />} />
        <U.StatCard label="Delivered" value={delivered} sub="all-time genuine" accent="oklch(45% 0.15 155)"
          icon={<DIcon name="cert" size={16} />} />
        <U.StatCard label="Awaiting Pay" value={pending} sub={pending ? 'crypto unconfirmed' : 'none'} accent="oklch(48% 0.18 55)"
          icon={<DIcon name="ticket" size={16} />} />
      </div>

      {/* Chart + breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: 16 }}>
        <U.Panel title="Revenue this week" action={<span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>₦17.8M</span>}>
          <AreaChartWrap />
        </U.Panel>
        <U.Panel title="Orders by status">
          <U.DonutChart total="ORDERS" segments={(() => {
            const m = {};
            orders.forEach(o => { const k = o.status === 'Delivered' ? 'delivered' : o.status === 'Payment Pending' ? 'pending' : 'in_progress'; m[k] = (m[k] || 0) + 1; });
            return Object.entries(m).map(([label, value]) => ({ label, value }));
          })()} />
        </U.Panel>
      </div>

      {/* Recent orders + alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: 16 }}>
        <U.Panel title="Recent orders" pad={0} action={
          <button onClick={() => setTab('orders')} style={linkBtn}>View all →</button>
        }>
          {recent.map((o, i) => (
            <div key={o.id} onClick={() => setTab('orders')} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
              borderTop: i ? '1px solid var(--border)' : 'none', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--bg-alt)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, color: 'var(--accent)' }}>
                {o.customer.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.customer}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.product}</div>
              </div>
              {!isMobile && <U.StatusPill status={o.status} />}
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13.5, color: 'var(--text)', flexShrink: 0 }}>{fmtN(o.ngn)}</div>
            </div>
          ))}
        </U.Panel>

        <U.Panel title="Needs attention">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AlertRow color="oklch(55% 0.18 55)" icon="ticket" title={`${pending} order awaiting payment`} sub="Confirm crypto payment to proceed" onClick={() => setTab('orders')} />
            <AlertRow color="oklch(55% 0.18 25)" icon="flag" title="1 flagged order" sub="Address change — confirm before shipping" onClick={() => setTab('orders')} />
            <AlertRow color="oklch(50% 0.16 250)" icon="mail" title={`${MK.MOCK_MESSAGES.filter(m => !m.read).length} unread messages`} sub="Customers waiting on a reply" onClick={() => setTab('messages')} />
            <AlertRow color="oklch(55% 0.16 60)" icon="tag" title="1 product out of stock" sub="AirPods Pro (Refurbished)" onClick={() => setTab('products')} />
          </div>
        </U.Panel>
      </div>
    </div>
  );
}

function AreaChartWrap() {
  return <U.AreaChart data={MK.MOCK_REVENUE_SERIES} xKey="day" yKey="ngn" height={200} />;
}

function AlertRow({ color, icon, title, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
      padding: '12px 14px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--bg-alt)', cursor: 'pointer',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = color}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
        <DIcon name={icon} size={16} c={color} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{sub}</div>
      </div>
      <DIcon name="chevron" size={15} c="var(--text-muted)" />
    </button>
  );
}

const linkBtn = { background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--accent)' };

// ════ ORDERS ══════════════════════════════════════════════════════════════
function OrdersTab({ isMobile }) {
  const all = MK.MOCK_ORDERS;
  const [sel, setSel] = useS1(null);
  const [statusF, setStatusF] = useS1('all');
  const [q, setQ] = useS1('');

  const filtered = all.filter(o => {
    if (statusF === 'open' && ['Delivered', 'Cancelled'].includes(o.status)) return false;
    if (statusF === 'flagged' && !o.flag) return false;
    if (statusF === 'pending' && o.status !== 'Payment Pending') return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      return o.id.toLowerCase().includes(s) || o.customer.toLowerCase().includes(s) || o.product.toLowerCase().includes(s);
    }
    return true;
  });

  if (sel) return <OrderDetail order={sel} onBack={() => setSel(null)} isMobile={isMobile} />;

  const delivered = all.filter(o => o.status === 'Delivered').length;
  const active = all.filter(o => !['Delivered', 'Cancelled', 'Payment Pending'].includes(o.status)).length;
  const pending = all.filter(o => o.status === 'Payment Pending').length;
  const flagged = all.filter(o => o.flag).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 14 }}>
        <U.StatCard label="Active" value={active} accent="var(--accent)" icon={<DIcon name="box" size={16} />} />
        <U.StatCard label="Delivered" value={delivered} accent="oklch(45% 0.15 155)" icon={<DIcon name="cert" size={16} />} />
        <U.StatCard label="Awaiting Pay" value={pending} accent="oklch(48% 0.18 55)" icon={<DIcon name="ticket" size={16} />} />
        <U.StatCard label="Flagged" value={flagged} accent="oklch(52% 0.18 25)" icon={<DIcon name="flag" size={16} />} />
      </div>

      <U.Panel pad={0}>
        {/* Filter bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}><DIcon name="search" size={15} /></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search orders…" style={{ ...inputS, paddingLeft: 33, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <U.Segmented value={statusF} onChange={setStatusF} options={[
            { key: 'all', label: 'All' }, { key: 'open', label: 'Open' }, { key: 'pending', label: 'Awaiting Pay' }, { key: 'flagged', label: 'Flagged' },
          ]} />
          <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{filtered.length} of {all.length}</span>
        </div>

        {/* Table / cards */}
        {isMobile ? (
          <div>
            {filtered.map((o, i) => (
              <div key={o.id} onClick={() => setSel(o)} style={{ padding: '14px 18px', borderTop: i ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>{o.flag && '🚩 '}{o.id}</span>
                  <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{fmtN(o.ngn)}</span>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{o.customer}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{o.product}</div>
                <U.StatusPill status={o.status} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ background: 'var(--bg-alt)' }}>
                  {['Order', 'Customer', 'Product', 'Status', 'Via', 'Total', ''].map(h => (
                    <th key={h} style={thS}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} onClick={() => setSel(o)} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...tdS, fontWeight: 700, color: 'var(--accent)' }}>
                      {o.status === 'Payment Pending' && '⏳ '}{o.flag && '🚩 '}{o.id}
                    </td>
                    <td style={tdS}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{o.customer}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.phone}</div>
                    </td>
                    <td style={{ ...tdS, maxWidth: 180, color: 'var(--text-muted)', fontSize: 12.5 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.product}</div>
                      {o.items.length > 1 && <span style={{ color: 'var(--accent)', fontSize: 11 }}>+{o.items.length - 1} more</span>}
                    </td>
                    <td style={tdS}><U.StatusPill status={o.status} /></td>
                    <td style={tdS}><PayPill method={o.payment_method} /></td>
                    <td style={{ ...tdS, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--text)' }}>{fmtN(o.ngn)}</td>
                    <td style={tdS}><DIcon name="chevron" size={15} c="var(--accent)" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </U.Panel>
    </div>
  );
}

function PayPill({ method }) {
  const m = method === 'MoonPay'
    ? { bg: 'oklch(94% 0.05 280)', fg: 'oklch(42% 0.16 280)' }
    : { bg: 'oklch(93% 0.06 145)', fg: 'oklch(36% 0.15 145)' };
  return <span style={{ padding: '3px 9px', borderRadius: 6, background: m.bg, color: m.fg, fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{method}</span>;
}

function OrderDetail({ order, onBack, isMobile }) {
  const [status, setStatus] = useS1(order.status);
  const STATUSES = ['Payment Pending', 'Order Confirmed', 'Purchased from Apple', 'In Transit to US Partner', 'Customs Clearance', 'Arrived in Nigeria', 'Out for Delivery', 'Delivered', 'Cancelled'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={onBack} style={{ ...linkBtn, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}>← Back to orders</button>
      <U.Panel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Order</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 26, color: 'var(--text)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
              {order.flag && <span title={order.flag_reason}>🚩</span>}{order.id}
            </div>
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{
            padding: '10px 16px', borderRadius: 10, border: '1.5px solid var(--accent)', background: 'var(--accent-tint, #f7e9df)',
            color: 'var(--accent)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, cursor: 'pointer', outline: 'none',
          }}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 18, marginBottom: 24 }}>
          {[
            ['Customer', order.customer], ['Phone', order.phone], ['Email', order.email],
            ['USD Total', fmtU(order.usd)], ['NGN Total', fmtN(order.ngn)], ['Payment', order.payment_method],
            ['Order Date', order.date], ['Address', order.address],
          ].map(([k, v]) => (
            <div key={k} style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', wordBreak: 'break-word' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Items */}
        <div style={{ background: 'var(--bg-alt)', borderRadius: 12, border: '1px solid var(--border)', padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Order items ({order.items.length})</div>
          {order.items.map((it, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{it.qty > 1 && `${it.qty}× `}{it.name}</div>
                {it.subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{it.subtitle}</div>}
                {it.applecare && it.applecare !== 'none' && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>+ {it.applecare}</div>}
              </div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{fmtU(it.usd_price * (it.qty || 1))}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ ...actionBtn, background: 'oklch(93% 0.08 145)', borderColor: 'oklch(80% 0.12 145)', color: 'oklch(35% 0.15 145)', textDecoration: 'none' }}>💬 WhatsApp customer</a>
          <button style={actionBtn}>✉ Resend confirmation</button>
          <button style={{ ...actionBtn, color: order.flag ? 'oklch(45% 0.18 25)' : 'var(--text-muted)' }}>🚩 {order.flag ? 'Unflag' : 'Flag'} order</button>
          <button style={{ ...actionBtn, borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-tint, #f7e9df)' }}>＋ Publish certificate</button>
        </div>

        {order.flag && (
          <div style={{ marginTop: 16, padding: 14, background: 'oklch(97% 0.03 25)', border: '1.5px solid oklch(85% 0.1 25)', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'oklch(45% 0.18 25)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>🚩 Flag reason</div>
            <div style={{ fontSize: 14, color: 'oklch(35% 0.15 25)', lineHeight: 1.6 }}>{order.flag_reason}</div>
          </div>
        )}
      </U.Panel>
    </div>
  );
}

// ════ PRODUCTS ════════════════════════════════════════════════════════════
function ProductsTab({ isMobile }) {
  const [q, setQ] = useS1('');
  const products = MK.MOCK_PRODUCTS.filter(p => !q.trim() || (p.name + p.subtitle + p.type).toLowerCase().includes(q.toLowerCase()));
  const STATUS_MAP = {
    live: { label: 'Live', bg: 'oklch(93% 0.06 155)', fg: 'oklch(35% 0.15 155)' },
    out_of_stock: { label: 'Out of stock', bg: 'oklch(94% 0.02 0)', fg: 'oklch(48% 0.05 0)' },
    coming_soon: { label: 'Coming soon', bg: 'oklch(95% 0.07 70)', fg: 'oklch(45% 0.16 55)' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}><DIcon name="search" size={15} /></span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…" style={{ ...inputS, paddingLeft: 34, width: '100%', boxSizing: 'border-box' }} />
        </div>
        <button style={{ ...primaryBtn, display: 'flex', alignItems: 'center', gap: 7 }}><DIcon name="plus" size={16} c="white" /> Add product</button>
      </div>

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map(p => {
            const st = STATUS_MAP[p.listingStatus] || STATUS_MAP.live;
            return (
              <U.Panel key={p.id} pad={16}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{p.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>{p.subtitle}</div>
                    <span style={{ padding: '3px 9px', borderRadius: 6, background: st.bg, color: st.fg, fontSize: 11, fontWeight: 700 }}>{st.label}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{fmtN(p.ngnPrice)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)' }}>{fmtU(p.usdPrice)}</div>
                    <div style={{ fontSize: 12, color: p.stock === 0 ? 'oklch(55% 0.18 25)' : 'var(--text-muted)', marginTop: 6 }}>{p.stock} in stock</div>
                  </div>
                </div>
              </U.Panel>
            );
          })}
        </div>
      ) : (
        <U.Panel pad={0}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr style={{ background: 'var(--bg-alt)' }}>
                  {['Product', 'Type', 'Condition', 'USD', 'NGN', 'Stock', 'Status', ''].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const st = STATUS_MAP[p.listingStatus] || STATUS_MAP.live;
                  return (
                    <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={tdS}>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>{p.name} {p.featured && <span title="Featured" style={{ color: 'var(--accent)' }}>★</span>}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.subtitle}</div>
                      </td>
                      <td style={{ ...tdS, color: 'var(--text-muted)', fontSize: 12.5 }}>{p.type}</td>
                      <td style={tdS}><CondBadge condition={p.condition} /></td>
                      <td style={{ ...tdS, fontSize: 13 }}>{fmtU(p.usdPrice)}</td>
                      <td style={{ ...tdS, fontFamily: 'var(--font-head)', fontWeight: 700 }}>{fmtN(p.ngnPrice)}</td>
                      <td style={{ ...tdS, color: p.stock === 0 ? 'oklch(55% 0.18 25)' : 'var(--text)', fontWeight: 600 }}>{p.stock}</td>
                      <td style={tdS}><span style={{ padding: '3px 9px', borderRadius: 6, background: st.bg, color: st.fg, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{st.label}</span></td>
                      <td style={tdS}><button style={{ ...miniBtn }}>Edit</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </U.Panel>
      )}
    </div>
  );
}

function CondBadge({ condition }) {
  const s = condition === 'refurb' ? { bg: 'oklch(94% 0.06 250)', fg: 'oklch(40% 0.15 250)', label: 'Refurb' } : { bg: 'oklch(93% 0.06 155)', fg: 'oklch(35% 0.15 155)', label: 'New' };
  return <span style={{ padding: '3px 9px', borderRadius: 6, background: s.bg, color: s.fg, fontSize: 11, fontWeight: 700 }}>{s.label}</span>;
}

// Shared style atoms
const inputS = { padding: '9px 13px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', outline: 'none' };
const thS = { padding: '12px 18px', fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' };
const tdS = { padding: '13px 18px', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--text)', verticalAlign: 'middle' };
const primaryBtn = { background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' };
const actionBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const miniBtn = { background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 };

Object.assign(window, { OverviewTab, OrdersTab, ProductsTab });
window.CertoDashAtoms = { inputS, thS, tdS, primaryBtn, actionBtn, miniBtn, linkBtn, fmtN, fmtU };
