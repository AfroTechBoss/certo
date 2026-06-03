// Certo Dashboard — tab views (part 2):
// Certificates, Messages, Coupons, Analytics, Activity, Forex, Revenue, Customers
const { useState: useS2 } = React;
const UU = window.CertoDashUI;
const MM = window.CERTO_MOCK;
const DI = window.DashIcon;
const A = window.CertoDashAtoms;
const { inputS: inS, thS: th2, tdS: td2, primaryBtn: pBtn, actionBtn: aBtn, miniBtn: mBtn, fmtN: fN, fmtU: fU } = A;

// ════ CERTIFICATES ════════════════════════════════════════════════════════
function CertificatesTab({ isMobile }) {
  const [q, setQ] = useS2('');
  const certs = MM.MOCK_CERTIFICATES.filter(c => !q.trim() || (c.id + c.order_id + c.product_name + c.serial_number).toLowerCase().includes(q.toLowerCase()));
  const published = MM.MOCK_CERTIFICATES.filter(c => c.status === 'published').length;
  const drafts = MM.MOCK_CERTIFICATES.filter(c => c.status === 'draft').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)', gap: 14 }}>
        <UU.StatCard label="Published" value={published} accent="oklch(45% 0.15 155)" icon={<DI name="cert" size={16} />} />
        <UU.StatCard label="Drafts" value={drafts} accent="oklch(48% 0.18 55)" icon={<DI name="cert" size={16} />} />
        <UU.StatCard label="Total issued" value={MM.MOCK_CERTIFICATES.length} sub="all time" icon={<DI name="cert" size={16} />} />
      </div>

      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}><DI name="search" size={15} /></span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by serial, order, product…" style={{ ...inS, paddingLeft: 34, width: '100%', boxSizing: 'border-box' }} />
      </div>

      <UU.Panel pad={0}>
        {certs.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: c.status === 'published' ? 'oklch(93% 0.06 155)' : 'oklch(95% 0.07 70)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DI name="cert" size={18} c={c.status === 'published' ? 'oklch(40% 0.15 155)' : 'oklch(48% 0.16 55)'} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{c.product_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)' }}>
                {c.order_id}{c.serial_number ? ` · ${c.serial_number}` : ' · no serial yet'}
              </div>
            </div>
            {!isMobile && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.date}</div>}
            <span style={{
              padding: '4px 11px', borderRadius: 100, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
              background: c.status === 'published' ? 'oklch(93% 0.06 155)' : 'oklch(95% 0.07 70)',
              color: c.status === 'published' ? 'oklch(35% 0.15 155)' : 'oklch(45% 0.16 55)',
            }}>{c.status === 'published' ? '✓ Published' : '⏳ Draft'}</span>
            <button style={mBtn}>{c.status === 'published' ? 'View' : 'Edit'}</button>
          </div>
        ))}
      </UU.Panel>
    </div>
  );
}

// ════ MESSAGES ════════════════════════════════════════════════════════════
function MessagesTab({ isMobile }) {
  const [sel, setSel] = useS2(null);
  const [msgs, setMsgs] = useS2(MM.MOCK_MESSAGES);
  const open = (m) => { setSel(m); setMsgs(prev => prev.map(x => x.id === m.id ? { ...x, read: true } : x)); };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '340px 1fr', gap: 16, alignItems: 'start' }}>
      <UU.Panel pad={0} title={`Inbox · ${msgs.filter(m => !m.read).length} unread`}>
        {msgs.map((m, i) => {
          const active = sel?.id === m.id;
          return (
            <button key={m.id} onClick={() => open(m)} style={{
              display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
              padding: '14px 18px', border: 'none', borderTop: i ? '1px solid var(--border)' : 'none',
              borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
              background: active ? 'var(--bg-alt)' : 'var(--bg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {!m.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                <span style={{ fontSize: 13.5, fontWeight: m.read ? 600 : 800, color: 'var(--text)', flex: 1 }}>{m.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.created_at.split('·')[0]}</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.message}</div>
            </button>
          );
        })}
      </UU.Panel>

      {(sel || !isMobile) && (
        <UU.Panel style={{ minHeight: 300 }}>
          {sel ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>{sel.name}</div>
                  <a href={`mailto:${sel.email}`} style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>{sel.email}</a>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sel.created_at}</div>
                </div>
                <a href={`mailto:${sel.email}`} style={{ ...pBtn, textDecoration: 'none' }}>Reply</a>
              </div>
              <div style={{ background: 'var(--bg-alt)', borderRadius: 12, padding: 20, fontSize: 15, lineHeight: 1.7, color: 'var(--text)' }}>
                {sel.message}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 12, color: 'var(--text-muted)' }}>
              <DI name="mail" size={32} c="var(--border)" />
              <span style={{ fontSize: 13 }}>Select a message to read</span>
            </div>
          )}
        </UU.Panel>
      )}
    </div>
  );
}

// ════ COUPONS ═════════════════════════════════════════════════════════════
function CouponsTab({ isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, color: 'var(--text)', margin: 0 }}>Discount codes</h2>
        <button style={{ ...pBtn, display: 'flex', alignItems: 'center', gap: 7 }}><DI name="plus" size={16} c="white" /> New coupon</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
        {MM.MOCK_COUPONS.map(c => (
          <div key={c.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -12, right: -12, width: 70, height: 70, borderRadius: '50%', background: c.active ? 'var(--accent-tint, #f7e9df)' : 'var(--bg-alt)', opacity: 0.6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative' }}>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, fontSize: 17, color: 'var(--text)', letterSpacing: '0.04em', background: 'var(--bg-alt)', border: '1px dashed var(--border)', borderRadius: 8, padding: '5px 12px' }}>{c.code}</div>
              <span style={{ padding: '3px 9px', borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: c.active ? 'oklch(93% 0.06 155)' : 'oklch(94% 0.02 0)', color: c.active ? 'oklch(35% 0.15 155)' : 'oklch(50% 0.04 0)' }}>{c.active ? 'Active' : 'Inactive'}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 28, color: 'var(--accent)', letterSpacing: '-0.02em', marginBottom: 4 }}>
              {c.type === 'percent' ? `${c.value}% off` : `${fN(c.value)} off`}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>Expires {c.expires}</div>
            <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>{c.uses} / {c.max_uses} used</span>
              <span>{Math.round((c.uses / c.max_uses) * 100)}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--bg-alt)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(c.uses / c.max_uses) * 100}%`, background: 'var(--accent)', borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════ ANALYTICS ═══════════════════════════════════════════════════════════
function AnalyticsTab({ isMobile }) {
  const [tf, setTf] = useS2('7days');
  const d = MM.MOCK_ANALYTICS;
  const ov = d.overview;
  const NG = { LA: 'Lagos', FC: 'Abuja (FCT)', RV: 'Rivers', OY: 'Oyo' };
  const locLabel = r => r.country === 'NG' ? '🇳🇬 ' + (NG[r.region] || r.region) : '🌍 ' + (r.country || 'Unknown');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 10, background: 'oklch(93% 0.06 155)', border: '1px solid oklch(82% 0.1 155)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(50% 0.17 155)' }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'oklch(35% 0.15 155)' }}>Server online · 42ms</span>
        </div>
        <UU.Segmented value={tf} onChange={setTf} options={[{ key: 'today', label: 'Today' }, { key: '7days', label: '7d' }, { key: '30days', label: '30d' }, { key: '90days', label: '90d' }]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 14 }}>
        <UU.StatCard label="Page Views" value={ov.pageviews.toLocaleString()} delta="8.2%" deltaUp sub={`${ov.unique_sessions.toLocaleString()} unique`} icon={<DI name="chart" size={16} />} />
        <UU.StatCard label="Product Views" value={ov.product_views.toLocaleString()} delta="5.1%" deltaUp accent="oklch(50% 0.18 250)" icon={<DI name="tag" size={16} />} />
        <UU.StatCard label="Add to Cart" value={ov.add_to_cart.toLocaleString()} accent="oklch(45% 0.18 155)" icon={<DI name="box" size={16} />} />
        <UU.StatCard label="Checkout Starts" value={ov.checkout_starts.toLocaleString()} accent="oklch(48% 0.18 55)" icon={<DI name="ticket" size={16} />} />
        <UU.StatCard label="Conversion" value={((ov.checkout_starts / ov.unique_sessions) * 100).toFixed(1) + '%'} sub="sessions → checkout" accent="oklch(50% 0.16 310)" icon={<DI name="pulse" size={16} />} />
        <UU.StatCard label="Total Events" value={(ov.total_events / 1000).toFixed(1) + 'k'} sub="tracked actions" accent="var(--text-muted)" icon={<DI name="grid" size={16} />} />
      </div>

      <UU.Panel title="Daily page views">
        <UU.AreaChart data={d.daily.map(x => ({ day: new Date(x.day + 'T12:00').toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }), views: x.views }))} xKey="day" yKey="views" height={200} />
      </UU.Panel>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <UU.Panel title="Top pages"><UU.BarList items={d.topPages} labelKey="page" valueKey="views" /></UU.Panel>
        <UU.Panel title="Top products"><UU.BarList items={d.topProducts} labelKey="product_name" valueKey="views" color="oklch(52% 0.18 250)" /></UU.Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <UU.Panel title="Visitor locations"><UU.BarList items={d.locations.map(l => ({ ...l, label: locLabel(l) }))} labelKey="label" valueKey="sessions" color="oklch(50% 0.16 310)" /></UU.Panel>
        <UU.Panel title="Event breakdown"><UU.DonutChart total="EVENTS" segments={d.eventBreakdown.map(e => ({ label: e.event_type, value: e.count }))} /></UU.Panel>
      </div>
    </div>
  );
}

// ════ ACTIVITY ════════════════════════════════════════════════════════════
function ActivityTab({ isMobile }) {
  const iconFor = (a) => a.includes('order') || a.includes('status') ? 'box' : a.includes('certificate') ? 'cert' : a.includes('product') ? 'tag' : a.includes('forex') || a.includes('rate') ? 'coins' : a.includes('message') ? 'mail' : 'pulse';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, color: 'var(--text)', margin: 0 }}>Activity log</h2>
        <button style={{ ...mBtn, color: 'oklch(50% 0.18 25)', borderColor: 'oklch(85% 0.08 25)' }}>Clear log</button>
      </div>
      <UU.Panel pad={0}>
        {MM.MOCK_LOGS.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--bg-alt)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DI name={iconFor(l.action.toLowerCase())} size={16} c="var(--accent)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{l.action}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.details}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{l.admin}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.ts}</div>
            </div>
          </div>
        ))}
      </UU.Panel>
    </div>
  );
}

// ════ FOREX ═══════════════════════════════════════════════════════════════
function ForexTab({ isMobile }) {
  const [rate, setRate] = useS2(MM.RATE);
  const [input, setInput] = useS2(String(MM.RATE));
  const [saved, setSaved] = useS2(false);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, alignItems: 'start', maxWidth: 900 }}>
      {/* Live rate card */}
      <div style={{ background: 'var(--ink, #1a1714)', borderRadius: 18, padding: 32, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399' }} />
          Live buying rate
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 64, letterSpacing: '-0.04em', lineHeight: 1 }}>₦{rate.toLocaleString()}</span>
          <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono, monospace)' }}>/ $1</span>
        </div>
        <div style={{ fontSize: 13, color: '#34d399', marginTop: 12 }}>↑ 0.6% from yesterday · 30-day avg ₦1,572</div>
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <Sparkline2 />
        </div>
      </div>

      {/* Setter */}
      <UU.Panel title="Update rate">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 18px' }}>
          Auto-synced from the FX feed every minute. Override manually to lock a custom rate across the whole catalog instantly.
        </p>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>New rate (₦ per $1)</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="number" value={input} onChange={e => setInput(e.target.value)} style={{ ...inS, flex: 1, fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, padding: '12px 16px' }} />
          <button onClick={() => { setRate(Number(input)); setSaved(true); setTimeout(() => setSaved(false), 1800); }} style={{ ...pBtn, padding: '12px 22px', background: saved ? 'oklch(50% 0.17 155)' : 'var(--accent)' }}>{saved ? '✓ Saved' : 'Update'}</button>
        </div>
        <div style={{ marginTop: 20, background: 'var(--bg-alt)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Preview at ₦{Number(input).toLocaleString()}</div>
          {MM.MOCK_PRODUCTS.slice(0, 3).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--text)' }}>{p.name} {p.subtitle.split('·')[0]}</span>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--text)' }}>{fN(p.usdPrice * Number(input))}</span>
            </div>
          ))}
        </div>
      </UU.Panel>
    </div>
  );
}

function Sparkline2() {
  return (
    <svg width="100%" height="48" viewBox="0 0 320 48" preserveAspectRatio="none">
      <defs><linearGradient id="fxg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
      <path d="M0,32 L40,30 L80,34 L120,26 L160,28 L200,20 L240,24 L280,14 L320,10 L320,48 L0,48 Z" fill="url(#fxg)" />
      <path d="M0,32 L40,30 L80,34 L120,26 L160,28 L200,20 L240,24 L280,14 L320,10" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ════ REVENUE ═════════════════════════════════════════════════════════════
function RevenueTab({ isMobile }) {
  const [cur, setCur] = useS2('ngn');
  const orders = MM.MOCK_ORDERS;
  const totalNgn = orders.reduce((s, o) => s + o.ngn, 0);
  const totalUsd = orders.reduce((s, o) => s + o.usd, 0);
  const net = totalUsd * 0.12;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <UU.Segmented value={cur} onChange={setCur} options={[{ key: 'ngn', label: '₦ NGN' }, { key: 'usd', label: '$ USD' }]} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14 }}>
        <UU.StatCard label="Gross Revenue" value={cur === 'ngn' ? '₦' + (totalNgn / 1e6).toFixed(1) + 'M' : fU(totalUsd)} delta="12.4%" deltaUp spark={MM.MOCK_REVENUE_SERIES.map(r => r.ngn)} icon={<DI name="coins" size={16} />} />
        <UU.StatCard label="Est. Net Margin" value={fU(net.toFixed(0))} sub="~12% avg" accent="oklch(45% 0.15 155)" icon={<DI name="pulse" size={16} />} />
        <UU.StatCard label="Avg Order Value" value={cur === 'ngn' ? '₦' + (totalNgn / orders.length / 1000).toFixed(0) + 'k' : fU((totalUsd / orders.length).toFixed(0))} icon={<DI name="box" size={16} />} />
        <UU.StatCard label="Orders" value={orders.length} sub="this period" accent="var(--accent)" icon={<DI name="ticket" size={16} />} />
      </div>

      <UU.Panel title="Revenue trend" action={<span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18 }}>{cur === 'ngn' ? '₦17.8M' : fU(totalUsd)}</span>}>
        <UU.AreaChart data={MM.MOCK_REVENUE_SERIES} xKey="day" yKey="ngn" color="oklch(50% 0.15 155)" height={210} />
      </UU.Panel>

      <UU.Panel title="Per-order breakdown" pad={0}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead><tr style={{ background: 'var(--bg-alt)' }}>{['Order', 'Customer', 'Revenue', 'Est. Cost', 'Est. Net'].map(h => <th key={h} style={th2}>{h}</th>)}</tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ ...td2, fontWeight: 700, color: 'var(--accent)' }}>{o.id}</td>
                  <td style={td2}>{o.customer}</td>
                  <td style={{ ...td2, fontFamily: 'var(--font-head)', fontWeight: 700 }}>{cur === 'ngn' ? fN(o.ngn) : fU(o.usd)}</td>
                  <td style={{ ...td2, color: 'var(--text-muted)' }}>{fU((o.usd * 0.88).toFixed(0))}</td>
                  <td style={{ ...td2, color: 'oklch(45% 0.15 155)', fontWeight: 700 }}>{fU((o.usd * 0.12).toFixed(0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </UU.Panel>
    </div>
  );
}

// ════ CUSTOMERS ═══════════════════════════════════════════════════════════
function CustomersTab({ isMobile }) {
  const map = new Map();
  MM.MOCK_ORDERS.forEach(o => {
    if (!map.has(o.customer)) map.set(o.customer, { name: o.customer, phone: o.phone, orders: 0, spent: 0, last: o.date });
    const c = map.get(o.customer); c.orders++; c.spent += o.ngn;
  });
  const customers = [...map.values()].sort((a, b) => b.spent - a.spent);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)', gap: 14 }}>
        <UU.StatCard label="Total Customers" value={customers.length} icon={<DI name="users" size={16} />} />
        <UU.StatCard label="Repeat Buyers" value={customers.filter(c => c.orders > 1).length} accent="var(--accent)" sub="more than 1 order" icon={<DI name="pulse" size={16} />} />
        <UU.StatCard label="Avg Lifetime" value={'₦' + (customers.reduce((s, c) => s + c.spent, 0) / customers.length / 1000).toFixed(0) + 'k'} accent="oklch(45% 0.15 155)" icon={<DI name="coins" size={16} />} />
      </div>
      <UU.Panel pad={0}>
        {isMobile ? customers.map((c, i) => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
            <Avatar name={c.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.orders} order{c.orders > 1 ? 's' : ''} · {c.last}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14 }}>{fN(c.spent)}</div>
          </div>
        )) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead><tr style={{ background: 'var(--bg-alt)' }}>{['Customer', 'Orders', 'Total Spent', 'Last Order', ''].map(h => <th key={h} style={th2}>{h}</th>)}</tr></thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.name} style={{ borderTop: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={td2}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={c.name} /><span style={{ fontWeight: 600 }}>{c.name}</span></div></td>
                    <td style={td2}>{c.orders}</td>
                    <td style={{ ...td2, fontFamily: 'var(--font-head)', fontWeight: 700 }}>{fN(c.spent)}</td>
                    <td style={{ ...td2, color: 'var(--text-muted)' }}>{c.last}</td>
                    <td style={td2}><a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ ...mBtn, color: 'var(--accent)', textDecoration: 'none', display: 'inline-block' }}>WhatsApp</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </UU.Panel>
    </div>
  );
}

function Avatar({ name }) {
  return <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-tint, #f7e9df)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{name.split(' ').map(n => n[0]).join('')}</div>;
}

Object.assign(window, { CertificatesTab, MessagesTab, CouponsTab, AnalyticsTab, ActivityTab, ForexTab, RevenueTab, CustomersTab });
