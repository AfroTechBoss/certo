import React, { useState, useEffect, useMemo, useCallback } from 'react';

// ─── Auth helpers ─────────────────────────────────────────────────────────────
const TOKEN_KEY = 'certo_admin_token';
const NAME_KEY  = 'certo_admin_name';
const getToken  = () => sessionStorage.getItem(TOKEN_KEY);
const getName   = () => sessionStorage.getItem(NAME_KEY) || 'Admin';

async function authFetch(url, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...opts, headers });
  if (res.status === 401) {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(NAME_KEY);
    window.location.reload();
    throw new Error('Session expired');
  }
  return res;
}

// ─── Mobile hook ─────────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

// ─── Data mapping ─────────────────────────────────────────────────────────────
function mapOrder(r) {
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
      : [{ name: r.product_name, subtitle: r.product_subtitle, usd_price: Number(r.usd_price), qty: r.qty || 1, applecare: r.applecare }],
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

function mapProduct(r) {
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
  };
}

function mapCert(r) {
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

function mapMessage(r) {
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

function mapCoupon(r) {
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

function mapLog(r) {
  const d = r.created_at;
  return {
    action: r.action,
    details: r.details,
    admin: r.admin_name,
    ts: d ? new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—',
  };
}

function buildRevenueSeries(rawOrders) {
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

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, c = 'currentColor', sw = 1.6 }) => {
  const p = { fill: 'none', stroke: c, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    grid:    <><rect x="3" y="3" width="7" height="7" rx="1.5" {...p}/><rect x="14" y="3" width="7" height="7" rx="1.5" {...p}/><rect x="3" y="14" width="7" height="7" rx="1.5" {...p}/><rect x="14" y="14" width="7" height="7" rx="1.5" {...p}/></>,
    box:     <><path d="M21 8l-9-5-9 5 9 5 9-5z" {...p}/><path d="M3 8v8l9 5 9-5V8" {...p}/><path d="M12 13v8" {...p}/></>,
    tag:     <><path d="M20 13l-7 7-9-9V4h7l9 9z" {...p}/><circle cx="7.5" cy="7.5" r="1.2" fill={c} stroke="none"/></>,
    cert:    <><rect x="4" y="3" width="16" height="14" rx="2" {...p}/><path d="M8 8h8M8 12h5" {...p}/><circle cx="12" cy="19" r="2.5" {...p}/></>,
    mail:    <><rect x="3" y="5" width="18" height="14" rx="2" {...p}/><path d="M3 7l9 6 9-6" {...p}/></>,
    ticket:  <><path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4V8z" {...p}/><path d="M13 6v12" {...p} strokeDasharray="2 2"/></>,
    chart:   <><path d="M3 3v18h18" {...p}/><path d="M7 14l3-3 3 2 4-5" {...p}/></>,
    pulse:   <><path d="M3 12h4l2 6 4-14 2 8h6" {...p}/></>,
    coins:   <><ellipse cx="12" cy="6" rx="8" ry="3" {...p}/><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" {...p}/><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" {...p}/></>,
    users:   <><circle cx="9" cy="8" r="3.2" {...p}/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" {...p}/><path d="M16 5.5a3.2 3.2 0 010 6M21 20c0-2.5-1.3-4.7-3.3-5.6" {...p}/></>,
    search:  <><circle cx="11" cy="11" r="7" {...p}/><path d="M21 21l-4-4" {...p}/></>,
    bell:    <><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9z" {...p}/><path d="M13.7 21a2 2 0 01-3.4 0" {...p}/></>,
    logout:  <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" {...p}/><path d="M16 17l5-5-5-5M21 12H9" {...p}/></>,
    refresh: <><path d="M21 12a9 9 0 11-3-6.7L21 8" {...p}/><path d="M21 3v5h-5" {...p}/></>,
    flag:    <><path d="M4 21V4M4 4h13l-2 4 2 4H4" {...p}/></>,
    plus:    <><path d="M12 5v14M5 12h14" {...p}/></>,
    chevron: <><path d="M9 6l6 6-6 6" {...p}/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{paths[name] || null}</svg>;
};

// ─── UI Primitives ────────────────────────────────────────────────────────────
const DASH_STATUS_COLORS = {
  'Payment Pending':          { bg: 'oklch(95% 0.07 70)',  fg: 'oklch(45% 0.16 55)',  dot: 'oklch(60% 0.18 55)'  },
  'Order Confirmed':          { bg: 'oklch(94% 0.05 250)', fg: 'oklch(42% 0.15 250)', dot: 'oklch(55% 0.16 250)' },
  'Purchased from Apple':     { bg: 'oklch(95% 0.04 30)',  fg: 'oklch(45% 0.13 30)',  dot: 'oklch(58% 0.15 30)'  },
  'In Transit to US Partner': { bg: 'oklch(94% 0.05 220)', fg: 'oklch(43% 0.13 220)', dot: 'oklch(56% 0.14 220)' },
  'Customs Clearance':        { bg: 'oklch(96% 0.06 80)',  fg: 'oklch(46% 0.14 65)',  dot: 'oklch(60% 0.16 65)'  },
  'Arrived in Nigeria':       { bg: 'oklch(94% 0.07 155)', fg: 'oklch(38% 0.15 155)', dot: 'oklch(52% 0.16 155)' },
  'Out for Delivery':         { bg: 'oklch(95% 0.07 60)',  fg: 'oklch(44% 0.16 55)',  dot: 'oklch(60% 0.17 55)'  },
  'Delivered':                { bg: 'oklch(93% 0.06 155)', fg: 'oklch(35% 0.15 155)', dot: 'oklch(50% 0.17 155)' },
  'Cancelled':                { bg: 'oklch(94% 0.02 0)',   fg: 'oklch(48% 0.04 0)',   dot: 'oklch(60% 0.04 0)'   },
};
const dashStatus = (s) => DASH_STATUS_COLORS[s] || DASH_STATUS_COLORS['Order Confirmed'];

const StatusPill = ({ status, dot = true }) => {
  const c = dashStatus(status);
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 11px', borderRadius:100, background:c.bg, color:c.fg, fontFamily:'var(--font-body)', fontSize:11.5, fontWeight:700, whiteSpace:'nowrap', letterSpacing:'0.01em' }}>
      {dot && <span style={{ width:6, height:6, borderRadius:'50%', background:c.dot, flexShrink:0 }} />}
      {status}
    </span>
  );
};

const Sparkline = ({ data, color = 'var(--accent)', width = 96, height = 32, fill = true }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gid = 'spark-' + Math.random().toString(36).slice(2, 8);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display:'block', overflow:'visible' }}>
      {fill && (<><defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.22"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs><path d={area} fill={`url(#${gid})`}/></>)}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.5" fill={color}/>
    </svg>
  );
};

const StatCard = ({ label, value, sub, delta, deltaUp, spark, sparkColor, accent, icon }) => (
  <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:16, padding:'20px 22px', display:'flex', flexDirection:'column', gap:0, position:'relative', overflow:'hidden' }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
      <span style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)' }}>{label}</span>
      {icon && <span style={{ width:30, height:30, borderRadius:9, flexShrink:0, background:'var(--bg-alt)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', color:accent||'var(--accent)' }}>{icon}</span>}
    </div>
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12 }}>
      <div>
        <div style={{ fontFamily:'var(--font-num)', fontWeight:800, fontSize:30, color:accent||'var(--text)', letterSpacing:'-0.025em', lineHeight:1 }}>{value}</div>
        {(sub||delta) && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
            {delta && <span style={{ display:'inline-flex', alignItems:'center', gap:2, fontFamily:'var(--font-body)', fontSize:12, fontWeight:700, color:deltaUp?'oklch(50% 0.16 155)':'oklch(55% 0.18 25)' }}>{deltaUp?'↑':'↓'} {delta}</span>}
            {sub && <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-muted)' }}>{sub}</span>}
          </div>
        )}
      </div>
      {spark && <Sparkline data={spark} color={sparkColor||accent||'var(--accent)'}/>}
    </div>
  </div>
);

const Empty = ({ label }) => (
  <div style={{ textAlign:'center', padding:'36px 0', fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-muted)' }}>{label}</div>
);

const AreaChart = ({ data, xKey='day', yKey='views', color='var(--accent)', height=200, formatValue }) => {
  const [hovered, setHovered] = useState(null);
  if (!data || !data.length) return <Empty label="No data yet for this period"/>;
  const W=720, H=height, PL=8, PR=8, PB=28, PT=12;
  const innerW=W-PL-PR, innerH=H-PB-PT;
  const ys = data.map(d => d[yKey]);
  const maxV = Math.max(...ys, 1);
  const pts = data.map((d, i) => ({
    x: PL + (i / Math.max(data.length-1,1)) * innerW,
    y: PT + (innerH - (d[yKey]/maxV)*innerH),
    d,
  }));
  const line = pts.map((p,i) => `${i?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length-1].x.toFixed(1)},${PT+innerH} L${pts[0].x.toFixed(1)},${PT+innerH} Z`;
  const gid = 'dashArea-' + color.replace(/[^a-z0-9]/gi,'').slice(0,8);
  const fmt = formatValue || (v => v >= 1e6 ? '₦'+(v/1e6).toFixed(2)+'M' : v >= 1e3 ? v.toLocaleString() : String(v));

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * W;
    let closest = 0, minD = Infinity;
    pts.forEach((p,i) => { const d = Math.abs(p.x - rawX); if (d < minD) { minD=d; closest=i; } });
    setHovered(closest);
  };

  const hp = hovered !== null ? pts[hovered] : null;
  const tooltipX = hp ? Math.min(Math.max(hp.x, 40), W-40) : 0;
  const tooltipAbove = hp && hp.y > H/2;

  return (
    <div style={{ position:'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', display:'block', cursor:'crosshair' }} preserveAspectRatio="none"
        onMouseMove={handleMouseMove} onMouseLeave={() => setHovered(null)}>
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.28"/><stop offset="100%" stopColor={color} stopOpacity="0.02"/></linearGradient></defs>
        {[0,0.5,1].map(t => <line key={t} x1={PL} y1={(PT+innerH*t).toFixed(1)} x2={W-PR} y2={(PT+innerH*t).toFixed(1)} stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4"/>)}
        <path d={area} fill={`url(#${gid})`}/>
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {pts.map((p,i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={hovered===i?5:3.5} fill={hovered===i?color:'var(--bg)'} stroke={color} strokeWidth="2" style={{ transition:'r 0.1s' }}/>
            <text x={p.x} y={H-8} textAnchor="middle" fontSize="11" fill="var(--text-muted)" fontFamily="var(--font-body)">{p.d[xKey]}</text>
          </g>
        ))}
        {hp && (
          <line x1={hp.x} y1={PT} x2={hp.x} y2={PT+innerH} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>
        )}
      </svg>
      {hp && (
        <div style={{ position:'absolute', left:`${(tooltipX/W)*100}%`, top: tooltipAbove ? 'auto' : '8px', bottom: tooltipAbove ? '32px' : 'auto', transform:'translateX(-50%)', pointerEvents:'none', background:'var(--ink,#1a1714)', color:'white', borderRadius:9, padding:'8px 14px', fontSize:12, fontWeight:700, whiteSpace:'nowrap', boxShadow:'0 4px 16px rgba(26,23,20,0.25)', zIndex:10 }}>
          <div style={{ fontSize:10, fontWeight:500, color:'rgba(255,255,255,0.6)', marginBottom:2 }}>{hp.d[xKey]}</div>
          <div style={{ fontSize:14, fontFamily:'var(--font-num)', fontWeight:800 }}>{fmt(hp.d[yKey])}</div>
        </div>
      )}
    </div>
  );
};

const DONUT_COLORS = ['var(--accent)','oklch(55% 0.16 250)','oklch(55% 0.15 155)','oklch(60% 0.16 60)','oklch(52% 0.16 310)','oklch(50% 0.08 220)'];

const DonutChart = ({ segments, total: totalLabel }) => {
  const [hovSeg, setHovSeg] = useState(null);
  if (!segments||!segments.length) return null;
  const total = segments.reduce((s,e) => s+e.value, 0) || 1;
  const R=38, C=2*Math.PI*R;
  let cum=0;
  const slices = segments.map((seg,i) => {
    const arc=(seg.value/total)*C;
    const slice={...seg, arc, offset:C/4-cum, color:DONUT_COLORS[i%DONUT_COLORS.length]};
    cum+=arc;
    return slice;
  });
  const hov = hovSeg !== null ? slices[hovSeg] : null;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:28, flexWrap:'wrap' }}>
      <div style={{ position:'relative', flexShrink:0 }}>
        <svg viewBox="0 0 100 100" style={{ width:116, height:116, display:'block' }}>
          {slices.map((s,i) => (
            <circle key={i} cx="50" cy="50" r={hovSeg===i?40:R} fill="none" stroke={s.color}
              strokeWidth={hovSeg===i?11:15}
              strokeDasharray={`${s.arc.toFixed(2)} ${(C-s.arc).toFixed(2)}`}
              strokeDashoffset={s.offset.toFixed(2)} strokeLinecap="butt"
              style={{ cursor:'pointer', transition:'r 0.15s, stroke-width 0.15s', opacity: hovSeg!==null&&hovSeg!==i?0.45:1 }}
              onMouseEnter={() => setHovSeg(i)} onMouseLeave={() => setHovSeg(null)}
            />
          ))}
          {hov ? (
            <>
              <text x="50" y="44" textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--text)" fontFamily="var(--font-num)">{hov.value}</text>
              <text x="50" y="56" textAnchor="middle" fontSize="6.5" fill="var(--text-muted)" fontFamily="var(--font-body)" letterSpacing="0.06em">{Math.round((hov.value/total)*100)}%</text>
            </>
          ) : (
            <>
              <text x="50" y="47" textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--text)" fontFamily="var(--font-num)">{total>=1000?(total/1000).toFixed(1)+'k':total}</text>
              <text x="50" y="60" textAnchor="middle" fontSize="7" fill="var(--text-muted)" fontFamily="var(--font-body)" letterSpacing="0.1em">{totalLabel||'TOTAL'}</text>
            </>
          )}
        </svg>
        {hov && (
          <div style={{ position:'absolute', top:-38, left:'50%', transform:'translateX(-50%)', background:'var(--ink,#1a1714)', color:'white', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:700, whiteSpace:'nowrap', pointerEvents:'none', boxShadow:'0 4px 16px rgba(26,23,20,0.25)' }}>
            {hov.label.replace(/_/g,' ')} · {hov.value}
          </div>
        )}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:9, flex:1, minWidth:180 }}>
        {slices.map((s,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'3px 6px', borderRadius:7, background:hovSeg===i?'var(--bg-alt)':'transparent', transition:'background 0.15s' }}
            onMouseEnter={() => setHovSeg(i)} onMouseLeave={() => setHovSeg(null)}>
            <span style={{ width:9, height:9, borderRadius:3, background:s.color, flexShrink:0 }}/>
            <span style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text)', flex:1, textTransform:'capitalize' }}>{s.label.replace(/_/g,' ')}</span>
            <span style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:700, color:'var(--text)' }}>{s.value.toLocaleString()}</span>
            <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-muted)', minWidth:34, textAlign:'right' }}>{Math.round((s.value/total)*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BarList = ({ items, labelKey, valueKey, color='var(--accent)' }) => {
  if (!items||!items.length) return <Empty label="No data yet"/>;
  const max = Math.max(...items.map(i => i[valueKey]), 1);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
      {items.map((it,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ width:16, fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-muted)', textAlign:'right', flexShrink:0 }}>{i+1}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:5 }}>{it[labelKey]}</div>
            <div style={{ height:6, background:'var(--bg-alt)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(it[valueKey]/max)*100}%`, background:color, borderRadius:4, transition:'width 0.5s' }}/>
            </div>
          </div>
          <span style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:700, color:'var(--text)', flexShrink:0 }}>{it[valueKey].toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const Panel = ({ title, action, children, pad=22, style }) => (
  <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden', ...style }}>
    {title && (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'16px 22px', borderBottom:'1px solid var(--border)' }}>
        <span style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, color:'var(--text)', letterSpacing:'-0.01em' }}>{title}</span>
        {action}
      </div>
    )}
    <div style={{ padding:pad }}>{children}</div>
  </div>
);

const Segmented = ({ options, value, onChange, size='md' }) => (
  <div style={{ display:'inline-flex', gap:3, background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:10, padding:3 }}>
    {options.map(o => {
      const active = value===o.key;
      return (
        <button key={o.key} onClick={() => onChange(o.key)} style={{ padding:size==='sm'?'5px 11px':'7px 15px', borderRadius:7, border:'none', cursor:'pointer', background:active?'var(--bg)':'transparent', color:active?'var(--text)':'var(--text-muted)', fontFamily:'var(--font-body)', fontSize:size==='sm'?12:13, fontWeight:active?700:500, boxShadow:active?'0 1px 3px rgba(26,23,20,0.08)':'none', transition:'all 0.15s', whiteSpace:'nowrap' }}>{o.label}</button>
      );
    })}
  </div>
);

// ─── Shared style atoms ───────────────────────────────────────────────────────
const inputS    = { padding:'9px 13px', borderRadius:9, border:'1px solid var(--border)', background:'var(--bg)', fontFamily:'var(--font-body)', fontSize:13, color:'var(--text)', outline:'none' };
const thS       = { padding:'12px 18px', fontFamily:'var(--font-body)', fontSize:11.5, fontWeight:700, color:'var(--text-muted)', textAlign:'left', whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:'0.04em' };
const tdS       = { padding:'13px 18px', fontFamily:'var(--font-body)', fontSize:13.5, color:'var(--text)', verticalAlign:'middle' };
const primaryBtn = { background:'var(--accent)', color:'white', border:'none', borderRadius:10, padding:'10px 18px', cursor:'pointer', fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, whiteSpace:'nowrap' };
const actionBtn  = { display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text-muted)', fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, cursor:'pointer' };
const miniBtn    = { background:'none', border:'1px solid var(--border)', borderRadius:7, padding:'5px 12px', cursor:'pointer', fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-muted)', fontWeight:600 };
const linkBtn    = { background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:'var(--accent)' };
const fmtN = n => '₦' + Number(n).toLocaleString();
const fmtU = n => '$' + Number(n).toLocaleString();

// ─── TAB: Overview ────────────────────────────────────────────────────────────
function OverviewTab({ isMobile, setTab, orders, revenueSeries, messages, products }) {
  const visible   = orders.filter(o => !o.admin_hidden);
  const totalNgn  = visible.reduce((s,o) => s+o.ngn, 0);
  const delivered = visible.filter(o => o.status==='Delivered').length;
  const active    = visible.filter(o => !['Delivered','Cancelled','Payment Pending'].includes(o.status)).length;
  const pending   = visible.filter(o => o.status==='Payment Pending').length;
  const unreadMsg = messages.filter(m => !m.read).length;
  const outOfStock= products.filter(p => p.stock===0 && p.listingStatus!=='coming_soon').length;
  const recent    = visible.slice(0,5);
  const sparkData = revenueSeries.map(r => r.ngn);
  const revTotal  = totalNgn >= 1e6 ? '₦'+(totalNgn/1e6).toFixed(1)+'M' : fmtN(totalNgn);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:14 }}>
        <StatCard label="Revenue (all)" value={revTotal} sub={`${visible.length} orders`} spark={sparkData} icon={<Icon name="coins" size={16}/>}/>
        <StatCard label="Active Orders" value={active} sub="in transit" accent="var(--accent)" icon={<Icon name="box" size={16}/>}/>
        <StatCard label="Delivered" value={delivered} sub="genuine verified" accent="oklch(45% 0.15 155)" icon={<Icon name="cert" size={16}/>}/>
        <StatCard label="Awaiting Pay" value={pending} sub={pending?'unconfirmed':'none'} accent="oklch(48% 0.18 55)" icon={<Icon name="ticket" size={16}/>}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1.6fr 1fr', gap:16 }}>
        <Panel title="Revenue trend" action={<span style={{ fontFamily:'var(--font-num)', fontWeight:800, fontSize:18, color:'var(--text)' }}>{revTotal}</span>}>
          <AreaChart data={revenueSeries} xKey="day" yKey="ngn" height={200}/>
        </Panel>
        <Panel title="Orders by status">
          <DonutChart total="ORDERS" segments={(() => {
            const m = {};
            orders.forEach(o => {
              const k = o.status==='Delivered' ? 'delivered' : o.status==='Payment Pending' ? 'pending' : 'in_progress';
              m[k] = (m[k]||0)+1;
            });
            return Object.entries(m).map(([label,value]) => ({ label, value }));
          })()}/>
        </Panel>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1.6fr 1fr', gap:16 }}>
        <Panel title="Recent orders" pad={0} action={<button onClick={() => setTab('orders')} style={linkBtn}>View all →</button>}>
          {recent.length ? recent.map((o,i) => (
            <div key={o.id} onClick={() => setTab('orders')} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderTop:i?'1px solid var(--border)':'none', cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-alt)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div style={{ width:36, height:36, borderRadius:9, background:'var(--bg-alt)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'var(--font-head)', fontWeight:700, fontSize:12, color:'var(--accent)' }}>
                {o.customer.split(' ').map(n=>n[0]).join('').slice(0,2)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{o.customer}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{o.product}</div>
              </div>
              {!isMobile && <StatusPill status={o.status}/>}
              <div style={{ fontFamily:'var(--font-num)', fontWeight:700, fontSize:13.5, color:'var(--text)', flexShrink:0 }}>{fmtN(o.ngn)}</div>
            </div>
          )) : <Empty label="No orders yet"/>}
        </Panel>

        <Panel title="Needs attention">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <AlertRow color="oklch(55% 0.18 55)" icon="ticket" title={`${pending} order${pending!==1?'s':''} awaiting payment`} sub="Confirm crypto payment to proceed" onClick={() => setTab('orders')}/>
            <AlertRow color="oklch(55% 0.18 25)" icon="flag" title={`${orders.filter(o=>o.flag).length} flagged order${orders.filter(o=>o.flag).length!==1?'s':''}`} sub="Address change — confirm before shipping" onClick={() => setTab('orders')}/>
            <AlertRow color="oklch(50% 0.16 250)" icon="mail" title={`${unreadMsg} unread message${unreadMsg!==1?'s':''}`} sub="Customers waiting on a reply" onClick={() => setTab('messages')}/>
            {outOfStock>0 && <AlertRow color="oklch(55% 0.16 60)" icon="tag" title={`${outOfStock} product${outOfStock!==1?'s':''} out of stock`} sub="Update stock or hide listing" onClick={() => setTab('products')}/>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function AlertRow({ color, icon, title, sub, onClick }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:12, width:'100%', textAlign:'left', padding:'12px 14px', borderRadius:11, border:'1px solid var(--border)', background:'var(--bg-alt)', cursor:'pointer' }}
      onMouseEnter={e => e.currentTarget.style.borderColor=color}
      onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
      <span style={{ width:32, height:32, borderRadius:8, background:'var(--bg)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon name={icon} size={16} c={color}/>
      </span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{title}</div>
        <div style={{ fontSize:11.5, color:'var(--text-muted)' }}>{sub}</div>
      </div>
      <Icon name="chevron" size={15} c="var(--text-muted)"/>
    </button>
  );
}

// ─── Create order modal (phone / walk-in orders) ─────────────────────────────
const NG_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT – Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

function CreateOrderModal({ onClose, onDone, products, rate }) {
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

  const liveRate = rate || (() => { try { return parseInt(localStorage.getItem('certo_rate')||'1590',10)||1590; } catch(_){ return 1590; } })();
  const usdNum   = parseFloat(form.usd_price) || 0;
  const ngnTotal = usdNum * liveRate;

  const filteredProds = (products || []).filter(p =>
    !productQ.trim() || (p.name + ' ' + (p.subtitle||'')).toLowerCase().includes(productQ.toLowerCase())
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

  const selectedProd = (products||[]).find(p => p.id === form.product_id) || null;
  const hasColors    = selectedProd?.variants?.colors?.length  > 0;
  const hasStorages  = selectedProd?.variants?.storages?.length > 0;

  const APPLECARE_OPTIONS = ['none', 'AppleCare+', 'AppleCare+ with Theft and Loss'];
  const PAYMENT_METHODS   = ['Cash / Bank Transfer', 'Flutterwave', 'WhatsApp (USD/Crypto)', 'MoonPay', 'Other'];

  const submit = async () => {
    if (!form.customer_name.trim()) { setErr('Customer name is required.');  return; }
    if (!form.customer_phone.trim()){ setErr('Customer phone is required.'); return; }
    if (!form.address.trim())       { setErr('Delivery address is required.');return; }
    if (!form.product_name.trim())  { setErr('Select or enter a product.');   return; }
    if (!form.usd_price)            { setErr('Price is required.');           return; }
    setErr(''); setBusy(true);
    try {
      const res = await authFetch('/api/orders', { method:'POST', body: JSON.stringify({
        customer_name:      form.customer_name.trim(),
        customer_email:     form.customer_email.trim() || `phone+${form.customer_phone.replace(/\D/g,'')}@certo.ng`,
        customer_phone:     form.customer_phone.trim(),
        address:            form.address.trim(),
        state:              form.state,
        product_id:         form.product_id || null,
        product_name:       form.product_name.trim(),
        product_subtitle:   form.product_subtitle.trim(),
        apple_url:          form.apple_url.trim(),
        product_image_url:  '',
        applecare:          form.applecare,
        qty:                Number(form.qty) || 1,
        usd_price:          parseFloat(form.usd_price),
        ngn_price:          parseFloat(form.usd_price) * liveRate,
        forex_rate:         liveRate,
        payment_method:     form.payment_method,
        initial_status:     form.initial_status,
        variant_id:         form.variant_id   || null,
        variant_color:      form.variant_color || null,
        variant_storage:    form.variant_storage || null,
        variant_color_hex:  form.variant_color_hex || null,
        items: [{
          product_id:      form.product_id || '',
          name:            form.product_name.trim(),
          subtitle:        form.product_subtitle.trim(),
          usd_price:       parseFloat(form.usd_price),
          qty:             Number(form.qty) || 1,
          applecare:       form.applecare,
          apple_url:       form.apple_url.trim(),
          variant_color:   form.variant_color || null,
          variant_storage: form.variant_storage || null,
          variant_color_hex: form.variant_color_hex || null,
        }],
      }) });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || 'Failed to create order'); setBusy(false); return; }
      onDone(json.order || json);
      onClose();
    } catch(e) { setErr(e.message); }
    setBusy(false);
  };

  const L = { fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 };
  const I = { ...inputS, width:'100%', boxSizing:'border-box' };

  return (
    <Modal
      title="New order"
      subtitle="Phone / walk-in"
      onClose={onClose}
      width={640}
      footer={
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {usdNum > 0 && <span style={{ fontSize:13, color:'var(--text-muted)', marginRight:'auto' }}>Total: <strong style={{ color:'var(--text)' }}>${usdNum.toLocaleString('en-US',{minimumFractionDigits:2})} · ₦{ngnTotal.toLocaleString('en-NG')}</strong></span>}
          <button onClick={onClose} style={{ ...actionBtn }}>Cancel</button>
          <button onClick={submit} disabled={busy} style={{ ...primaryBtn, opacity:busy?0.7:1 }}>{busy?'Creating…':'Create order'}</button>
        </div>
      }
    >
      {err && <div style={{ fontSize:12.5, color:'oklch(50% 0.18 25)', padding:'10px 14px', background:'oklch(97% 0.03 25)', borderRadius:9, border:'1px solid oklch(85% 0.1 25)', marginBottom:16 }}>{err}</div>}

      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

        {/* ── Customer ── */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ flex:1, height:1, background:'var(--border)' }}/> Customer <span style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ gridColumn:'1/-1' }}><label style={L}>Full Name *</label><input value={form.customer_name} onChange={e => set('customer_name', e.target.value)} placeholder="e.g. Chidi Ozo" style={I}/></div>
            <div><label style={L}>Phone *</label><input value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} placeholder="+234 800 000 0000" style={I}/></div>
            <div><label style={L}>Email</label><input value={form.customer_email} onChange={e => set('customer_email', e.target.value)} placeholder="optional" style={I}/></div>
          </div>
        </div>

        {/* ── Delivery ── */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ flex:1, height:1, background:'var(--border)' }}/> Delivery <span style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ gridColumn:'1/-1' }}><label style={L}>Address *</label><input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, area, city" style={I}/></div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={L}>State *</label>
              <select value={form.state} onChange={e => set('state', e.target.value)} style={{ ...I, cursor:'pointer' }}>
                {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Product ── */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ flex:1, height:1, background:'var(--border)' }}/> Product <span style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>
          <div style={{ position:'relative', marginBottom:12 }}>
            <label style={L}>Search products *</label>
            <input
              value={productQ}
              onChange={e => { setProductQ(e.target.value); setShowPicker(true); if (!e.target.value) { set('product_id',''); set('product_name',''); set('usd_price',''); } }}
              onFocus={() => setShowPicker(true)}
              placeholder="Type to search, or enter product name manually below"
              style={I}
            />
            {showPicker && productQ && filteredProds.length > 0 && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:50, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, boxShadow:'0 8px 32px rgba(26,23,20,0.15)', maxHeight:200, overflowY:'auto', marginTop:4 }}>
                {filteredProds.map(p => (
                  <div key={p.id} onMouseDown={() => pickProduct(p)} style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:13 }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <div style={{ fontWeight:600, color:'var(--text)' }}>{p.name}</div>
                    {p.subtitle && <div style={{ fontSize:12, color:'var(--text-muted)' }}>{p.subtitle}</div>}
                    <div style={{ fontSize:11, color:'var(--accent)', marginTop:2 }}>${(p.usdPrice||p.usd_price||0).toLocaleString('en-US',{minimumFractionDigits:2})}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual name override if no product selected from list */}
          {!form.product_id && (
            <div style={{ marginBottom:12 }}><label style={L}>Product name (manual)</label><input value={form.product_name} onChange={e => set('product_name', e.target.value)} placeholder="e.g. iPhone 16 Pro Max" style={I}/></div>
          )}

          {/* Variant selectors */}
          {hasColors && (
            <div style={{ marginBottom:12 }}>
              <label style={L}>Color</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {selectedProd.variants.colors.map(c => (
                  <button key={c.id} onMouseDown={() => pickColor(c)} style={{ padding:'6px 14px', borderRadius:8, border:`2px solid ${form.variant_color===c.name?'var(--accent)':'var(--border)'}`, background:form.variant_color===c.name?'var(--accent-tint)':'var(--bg)', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
                    {c.hex && <span style={{ width:12, height:12, borderRadius:'50%', background:c.hex, border:'1px solid rgba(0,0,0,0.15)', display:'inline-block' }}/>}
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {hasStorages && (
            <div style={{ marginBottom:12 }}>
              <label style={L}>Storage / Size</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {selectedProd.variants.storages.filter(s => s.in_stock!==false).map(s => (
                  <button key={s.id} onMouseDown={() => pickStorage(s)} style={{ padding:'6px 14px', borderRadius:8, border:`2px solid ${form.variant_id===s.id?'var(--accent)':'var(--border)'}`, background:form.variant_id===s.id?'var(--accent-tint)':'var(--bg)', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                    {s.size} · ${Number(s.price_usd).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div><label style={L}>USD Price *</label><input type="number" min="0" step="0.01" value={form.usd_price} onChange={e => set('usd_price', e.target.value)} style={I}/></div>
            <div><label style={L}>Qty</label><input type="number" min="1" value={form.qty} onChange={e => set('qty', e.target.value)} style={I}/></div>
            <div>
              <label style={L}>AppleCare</label>
              <select value={form.applecare} onChange={e => set('applecare', e.target.value)} style={{ ...I, cursor:'pointer' }}>
                {APPLECARE_OPTIONS.map(o => <option key={o} value={o}>{o==='none'?'None':o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Payment ── */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ flex:1, height:1, background:'var(--border)' }}/> Payment <span style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={L}>Payment Method</label>
              <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} style={{ ...I, cursor:'pointer' }}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={L}>Initial Status</label>
              <select value={form.initial_status} onChange={e => set('initial_status', e.target.value)} style={{ ...I, cursor:'pointer' }}>
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

// ─── TAB: Orders ──────────────────────────────────────────────────────────────
function OrdersTab({ isMobile, orders, onOrdersChange, certificates, products, rate }) {
  const [sel,        setSel]        = useState(null);
  const [statusF,    setStatusF]    = useState('all');
  const [q,          setQ]          = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Hidden orders are completely invisible — filtered out at the source
  const visible = orders.filter(o => !o.admin_hidden);

  const filtered = visible.filter(o => {
    if (statusF==='open'    && ['Delivered','Cancelled'].includes(o.status)) return false;
    if (statusF==='flagged' && !o.flag) return false;
    if (statusF==='pending' && o.status!=='Payment Pending') return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      return o.id.toLowerCase().includes(s) || o.customer.toLowerCase().includes(s) || o.product.toLowerCase().includes(s);
    }
    return true;
  });

  if (sel) return <OrderDetail order={sel} onBack={() => setSel(null)} isMobile={isMobile} onOrdersChange={(updated) => { onOrdersChange && onOrdersChange(updated); if (updated.admin_hidden) setSel(null); }} existingCerts={(certificates||[]).filter(c => c.order_id===sel.id)}/>;

  const handleCreatedOrder = (raw) => {
    const mapped = mapOrder(raw);
    onOrdersChange && onOrdersChange(mapped, true); // true = new order
    setSel(mapped); // open the new order detail immediately
  };

  const delivered = visible.filter(o => o.status==='Delivered').length;
  const active    = visible.filter(o => !['Delivered','Cancelled','Payment Pending'].includes(o.status)).length;
  const pending   = visible.filter(o => o.status==='Payment Pending').length;
  const flagged   = visible.filter(o => o.flag).length;

  return (
    <>
      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} onDone={handleCreatedOrder} products={products} rate={rate}/>}
      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:14 }}>
        <StatCard label="Active"       value={active}    accent="var(--accent)"       icon={<Icon name="box"    size={16}/>}/>
        <StatCard label="Delivered"    value={delivered} accent="oklch(45% 0.15 155)" icon={<Icon name="cert"   size={16}/>}/>
        <StatCard label="Awaiting Pay" value={pending}   accent="oklch(48% 0.18 55)"  icon={<Icon name="ticket" size={16}/>}/>
        <StatCard label="Flagged"      value={flagged}   accent="oklch(52% 0.18 25)"  icon={<Icon name="flag"   size={16}/>}/>
      </div>

      <Panel pad={0}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, padding:'14px 18px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
          <div style={{ position:'relative', flex:'1 1 200px', minWidth:0 }}>
            <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', display:'flex' }}><Icon name="search" size={15}/></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search orders…" style={{ ...inputS, paddingLeft:33, width:'100%', boxSizing:'border-box' }}/>
          </div>
          <Segmented value={statusF} onChange={setStatusF} options={[
            {key:'all',     label:'All'},
            {key:'open',    label:'Open'},
            {key:'pending', label:'Awaiting Pay'},
            {key:'flagged', label:'Flagged'},
          ]}/>
          <button onClick={() => setShowCreate(true)} style={{ ...primaryBtn, display:'flex', alignItems:'center', gap:6, marginLeft:'auto' }}>
            <Icon name="plus" size={15} c="white"/> New order
          </button>
          <span style={{ fontSize:12.5, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{filtered.length} of {visible.length}</span>
        </div>

        {isMobile ? (
          <div>
            {filtered.map((o,i) => (
              <div key={o.id} onClick={() => setSel(o)} style={{ padding:'14px 18px', borderTop:i?'1px solid var(--border)':'none', cursor:'pointer' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontFamily:'var(--font-body)', fontWeight:700, fontSize:13, color:'var(--accent)' }}>{o.flag&&'🚩 '}{o.id}</span>
                  <span style={{ fontFamily:'var(--font-num)', fontWeight:700, fontSize:14, color:'var(--text)' }}>{fmtN(o.ngn)}</span>
                </div>
                <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{o.customer}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>{o.product}</div>
                <StatusPill status={o.status}/>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:640 }}>
              <thead>
                <tr style={{ background:'var(--bg-alt)' }}>
                  {['Order','Customer','Product','Status','Via','Total',''].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} onClick={() => setSel(o)} style={{ borderTop:'1px solid var(--border)', cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ ...tdS, fontWeight:700, color:'var(--accent)' }}>{o.status==='Payment Pending'&&'⏳ '}{o.flag&&'🚩 '}{o.id}</td>
                    <td style={tdS}><div style={{ fontWeight:600, color:'var(--text)' }}>{o.customer}</div><div style={{ fontSize:12, color:'var(--text-muted)' }}>{o.phone}</div></td>
                    <td style={{ ...tdS, maxWidth:180, color:'var(--text-muted)', fontSize:12.5 }}><div style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{o.product}</div>{o.items.length>1&&<span style={{ color:'var(--accent)', fontSize:11 }}>+{o.items.length-1} more</span>}</td>
                    <td style={tdS}><StatusPill status={o.status}/></td>
                    <td style={tdS}><PayPill method={o.payment_method}/></td>
                    <td style={{ ...tdS, fontFamily:'var(--font-num)', fontWeight:700, color:'var(--text)' }}>{fmtN(o.ngn)}</td>
                    <td style={tdS}><Icon name="chevron" size={15} c="var(--accent)"/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!filtered.length && <Empty label="No orders match this filter"/>}
      </Panel>
    </div>
    </>
  );
}

// ─── Reusable Modal shell ─────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, footer, width=480 }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key==='Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(26,23,20,0.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px 12px', overflowY:'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'var(--bg)', borderRadius:20, border:'1px solid var(--border)', width:'100%', maxWidth:width, boxShadow:'0 24px 80px rgba(26,23,20,0.22)', overflow:'hidden', maxHeight:'calc(100dvh - 32px)', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div>
            <span style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:17, color:'var(--text)', letterSpacing:'-0.01em' }}>{title}</span>
            {subtitle && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4, display:'flex', borderRadius:7, lineHeight:1 }} aria-label="Close">✕</button>
        </div>
        <div style={{ padding:20, overflowY:'auto', flex:1 }}>{children}</div>
        {footer && <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border)', flexShrink:0 }}>{footer}</div>}
      </div>
    </div>
  );
}

// ─── WhatsApp QR modal ────────────────────────────────────────────────────────
function WhatsAppModal({ phone, name, onClose }) {
  const cleaned = (phone||'').replace(/[^0-9]/g,'');
  const waUrl   = `https://wa.me/${cleaned}`;
  const qrSrc   = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=1a1714&bgcolor=faf9f7&data=${encodeURIComponent(waUrl)}`;
  return (
    <Modal title="WhatsApp customer" onClose={onClose} width={380}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>
          Scan with your phone to open WhatsApp with <strong style={{ color:'var(--text)' }}>{name}</strong>
        </div>
        <div style={{ display:'inline-flex', padding:12, background:'var(--bg-alt)', borderRadius:16, border:'1px solid var(--border)', marginBottom:20 }}>
          <img src={qrSrc} alt="WhatsApp QR" width={200} height={200} style={{ display:'block', borderRadius:8 }}/>
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:24, fontFamily:'var(--font-mono,monospace)' }}>{phone}</div>
        <div style={{ display:'flex', gap:10 }}>
          <a href={waUrl} target="_blank" rel="noreferrer" onClick={onClose} style={{ ...primaryBtn, flex:1, textAlign:'center', textDecoration:'none', background:'oklch(50% 0.18 145)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Continue on Web
          </a>
          <button onClick={onClose} style={{ ...actionBtn, flex:1, justifyContent:'center' }}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Flag order modal ─────────────────────────────────────────────────────────
function FlagModal({ order, onClose, onDone }) {
  const [reason, setReason] = useState(order.flag_reason || '');
  const [busy, setBusy]     = useState(false);
  const adminName = getName();
  const isFlagged = order.flag;

  const labelS = { fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:8 };

  const patch = async (body) => {
    setBusy(true);
    try {
      const res = await authFetch(`/api/orders/${order.id}`, { method:'PATCH', body: JSON.stringify(body) });
      if (res.ok) { const updated = await res.json(); onDone(mapOrder(updated)); }
    } catch(e) { console.error(e); }
    setBusy(false);
    onClose();
  };

  return (
    <Modal title={isFlagged ? 'Edit flag' : 'Flag order'} onClose={onClose} width={440}>
      {isFlagged ? (
        <>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>
            Updating as <strong style={{ color:'var(--text)' }}>{adminName}</strong>. Reason is visible to all admins.
          </div>
          <label style={labelS}>Flag reason *</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Customer requested address change — confirm before shipping"
            rows={4}
            style={{ ...inputS, width:'100%', boxSizing:'border-box', resize:'vertical', marginBottom:20, lineHeight:1.6 }}
          />
          <div style={{ display:'flex', gap:10 }}>
            <button
              onClick={() => patch({ flag_reason: `[${adminName}] ${reason.trim()}` })}
              disabled={busy || !reason.trim()}
              style={{ ...primaryBtn, background:'oklch(50% 0.18 25)', flex:1, opacity:(!reason.trim()||busy)?0.6:1 }}
            >{busy ? 'Saving…' : 'Update reason'}</button>
            <button
              onClick={() => patch({ flagged: false, flag_reason: '' })}
              disabled={busy}
              style={{ ...actionBtn, flex:1, justifyContent:'center', color:'oklch(45% 0.18 25)', borderColor:'oklch(85% 0.1 25)' }}
            >Remove flag</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>
            Flagging as <strong style={{ color:'var(--text)' }}>{adminName}</strong>. The reason will be visible to all admins.
          </div>
          <label style={labelS}>Reason *</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Customer requested address change — confirm before shipping"
            rows={4}
            style={{ ...inputS, width:'100%', boxSizing:'border-box', resize:'vertical', marginBottom:20, lineHeight:1.6 }}
          />
          <div style={{ display:'flex', gap:10 }}>
            <button
              onClick={() => patch({ flagged: true, flag_reason: `[${adminName}] ${reason.trim()}` })}
              disabled={busy || !reason.trim()}
              style={{ ...primaryBtn, background:'oklch(50% 0.18 25)', flex:1, opacity:(!reason.trim()||busy)?0.6:1 }}
            >{busy ? 'Flagging…' : 'Flag order'}</button>
            <button onClick={onClose} style={{ ...actionBtn, flex:1, justifyContent:'center' }}>Cancel</button>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Certificate modal (create / edit draft / view published) ────────────────
function CertModal({ order, existingCert, onClose, onDone }) {
  const isMobile    = useIsMobile();
  const isPublished = existingCert?.status === 'published';
  const isDraft     = existingCert?.status === 'draft';
  const isCreate    = !existingCert;

  // Editable state (create or edit-draft mode)
  const initCoc = (isDraft && Array.isArray(existingCert?.chain_of_custody) && existingCert.chain_of_custody.length)
    ? existingCert.chain_of_custody.map(e => ({ step: e.step || '', actor: e.actor || '' }))
    : [{ step: '', actor: 'Certo' }];

  const [serial,   setSerial]   = useState(existingCert?.serial_number    || '');
  const [appleRef, setAppleRef] = useState(existingCert?.apple_order_ref  || '');
  const [asDraft,  setAsDraft]  = useState(false);
  const [coc,      setCoc]      = useState(initCoc);
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState('');

  const addStep    = ()            => setCoc(p => [...p, { step:'', actor:'Certo' }]);
  const removeStep = (i)           => setCoc(p => p.filter((_,j) => j!==i));
  const setStep    = (i, k, v)     => setCoc(p => p.map((e,j) => j===i ? {...e,[k]:v} : e));

  const labelS = { fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 };

  const submit = async () => {
    setErr('');
    const status      = asDraft ? 'draft' : 'published';
    const filledCoc   = coc.filter(e => e.step.trim());
    if (!asDraft) {
      if (!serial.trim())    { setErr('Serial number is required to publish.'); return; }
      if (!appleRef.trim())  { setErr('Apple order reference is required to publish.'); return; }
      if (!filledCoc.length) { setErr('At least one chain of custody step is required to publish.'); return; }
    }
    setBusy(true);
    try {
      const cocWithTs = filledCoc.map(e => ({ step: e.step.trim(), actor: e.actor.trim() || 'Certo', ts: new Date().toISOString() }));
      const body = {
        serial_number: serial.trim(),
        apple_order_ref: appleRef.trim(),
        chain_of_custody: asDraft ? [] : cocWithTs,
        status,
        ...(isCreate ? {
          order_id: order.id, product_name: order.product,
          product_subtitle: order.product_subtitle || '',
          recipient_name: order.customer, recipient_address: order.address,
        } : {}),
      };
      const url    = isDraft ? `/api/certificates/${existingCert.id}` : '/api/certificates';
      const method = isDraft ? 'PATCH' : 'POST';
      const res  = await authFetch(url, { method, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || 'Failed to save certificate'); setBusy(false); return; }
      onDone && onDone(json);
      onClose();
    } catch(e) { setErr(e.message); }
    setBusy(false);
  };

  // ── Published: read-only view ──────────────────────────────────────────────
  if (isPublished) {
    const pubCoc = Array.isArray(existingCert.chain_of_custody) ? existingCert.chain_of_custody : [];
    const pubDate = existingCert.published_at || existingCert.issued_at || existingCert.created_at;
    return (
      <Modal title="Certificate" onClose={onClose} width={520}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Header chip */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ padding:'4px 12px', borderRadius:100, background:'oklch(93% 0.06 155)', color:'oklch(35% 0.15 155)', fontSize:11.5, fontWeight:700 }}>✓ Published</span>
            {pubDate && <span style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(pubDate).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}</span>}
          </div>

          {/* Order + cert ID */}
          <div style={{ padding:'12px 16px', background:'var(--bg-alt)', borderRadius:10, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Certificate ID</div>
            <div style={{ fontFamily:'var(--font-mono,monospace)', fontWeight:700, fontSize:14, color:'var(--text)' }}>{existingCert.id}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{order.id} — {order.customer} — {order.product}</div>
          </div>

          {/* Serial + Apple ref */}
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:12 }}>
            <div>
              <div style={labelS}>Serial number</div>
              <div style={{ fontFamily:'var(--font-mono,monospace)', fontSize:14, fontWeight:700, color:'var(--text)', padding:'8px 12px', background:'var(--bg-alt)', borderRadius:8, border:'1px solid var(--border)' }}>{existingCert.serial_number||'—'}</div>
            </div>
            <div>
              <div style={labelS}>Apple order ref</div>
              <div style={{ fontFamily:'var(--font-mono,monospace)', fontSize:14, fontWeight:700, color:'var(--text)', padding:'8px 12px', background:'var(--bg-alt)', borderRadius:8, border:'1px solid var(--border)' }}>{existingCert.apple_order_ref||'—'}</div>
            </div>
          </div>

          {/* Chain of custody */}
          <div>
            <div style={labelS}>Chain of custody</div>
            {pubCoc.length ? (
              <div style={{ display:'flex', flexDirection:'column', gap:0, borderRadius:10, border:'1px solid var(--border)', overflow:'hidden' }}>
                {pubCoc.map((e,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderTop:i?'1px solid var(--border)':'none', background:'var(--bg)' }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--accent)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, flexShrink:0 }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text)' }}>{e.step}</div>
                      <div style={{ fontSize:11.5, color:'var(--text-muted)' }}>{e.actor}{e.ts&&` · ${new Date(e.ts).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}`}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={{ fontSize:13, color:'var(--text-muted)' }}>No chain of custody recorded.</div>}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <a href={`/verify/${order.id}`} target="_blank" rel="noreferrer" style={{ ...primaryBtn, textDecoration:'none', flex:1, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Open public certificate
            </a>
            <button onClick={onClose} style={{ ...actionBtn, flex:1, justifyContent:'center' }}>Close</button>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Create / Edit draft ────────────────────────────────────────────────────
  const title = isDraft ? 'Edit draft certificate' : 'Publish certificate';
  return (
    <Modal title={title} onClose={onClose} width={540}>
      <div style={{ display:'flex', flexDirection:'column', gap:16, maxHeight:'75vh', overflowY:'auto', paddingRight:2 }}>

        {/* Order context */}
        <div style={{ padding:'12px 16px', background:'var(--bg-alt)', borderRadius:10, border:'1px solid var(--border)' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Order</div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{order.id} — {order.customer}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{order.product}</div>
        </div>

        {/* Serial */}
        <div>
          <label style={labelS}>Serial number {!asDraft&&'*'}</label>
          <input value={serial} onChange={e => setSerial(e.target.value)} placeholder="e.g. F2LWQ1JKXXX" style={{ ...inputS, width:'100%', boxSizing:'border-box', fontFamily:'var(--font-mono,monospace)', letterSpacing:'0.04em' }}/>
        </div>

        {/* Apple ref */}
        <div>
          <label style={labelS}>Apple order reference {!asDraft&&'*'}</label>
          <input value={appleRef} onChange={e => setAppleRef(e.target.value)} placeholder="e.g. W12345678" style={{ ...inputS, width:'100%', boxSizing:'border-box' }}/>
        </div>

        {/* Chain of custody builder */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <label style={{ ...labelS, marginBottom:0 }}>Chain of custody {!asDraft&&'*'}</label>
            <button onClick={addStep} style={{ ...miniBtn, color:'var(--accent)', borderColor:'var(--accent)', display:'flex', alignItems:'center', gap:5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Add step
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {coc.map((entry, i) => (
              <div key={i} style={{ display:'flex', gap:8, alignItems:isMobile?'flex-start':'center', flexWrap:isMobile?'wrap':'nowrap' }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--bg-alt)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--text-muted)', flexShrink:0, marginTop:isMobile?10:0 }}>{i+1}</div>
                <input
                  value={entry.step}
                  onChange={e => setStep(i,'step',e.target.value)}
                  placeholder={i===0 ? 'e.g. Purchased from Apple US' : i===1 ? 'e.g. Shipped to Certo Nigeria' : 'e.g. Quality checked and packaged'}
                  style={{ ...inputS, flex: isMobile ? '1 1 100%' : 2, minWidth:0 }}
                />
                <input
                  value={entry.actor}
                  onChange={e => setStep(i,'actor',e.target.value)}
                  placeholder="Actor"
                  style={{ ...inputS, flex: isMobile ? '1 1 calc(100% - 30px)' : 1, minWidth:0 }}
                />
                {coc.length > 1 && (
                  <button onClick={() => removeStep(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'4px 6px', borderRadius:6, flexShrink:0, fontSize:14, lineHeight:1, marginTop:isMobile?2:0 }} title="Remove step">✕</button>
                )}
              </div>
            ))}
          </div>
          {!asDraft && <div style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:8 }}>Timestamps are recorded automatically on publish.</div>}
        </div>

        {/* Draft toggle */}
        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-alt)' }}>
          <input type="checkbox" checked={asDraft} onChange={e => setAsDraft(e.target.checked)} style={{ width:16, height:16, accentColor:'var(--accent)' }}/>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Save as draft only</div>
            <div style={{ fontSize:11.5, color:'var(--text-muted)' }}>Fill in the details later — chain of custody won't be recorded until you publish</div>
          </div>
        </label>

        {err && <div style={{ fontSize:12.5, color:'oklch(50% 0.18 25)', padding:'10px 14px', background:'oklch(97% 0.03 25)', borderRadius:9, border:'1px solid oklch(85% 0.1 25)' }}>{err}</div>}

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={submit} disabled={busy} style={{ ...primaryBtn, flex:1, opacity:busy?0.7:1 }}>
            {busy ? 'Saving…' : asDraft ? 'Save draft' : `✓ ${isDraft?'Publish draft':'Publish certificate'}`}
          </button>
          <button onClick={onClose} style={{ ...actionBtn, flex:1, justifyContent:'center' }}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Product edit modal ───────────────────────────────────────────────────────
function ProductEditModal({ productId, onClose, onDone }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading,   setLoading]   = useState(true);
  const [form,      setForm]      = useState(null);
  const [busy,      setBusy]      = useState(false);
  const [err,       setErr]       = useState('');

  const rate = (() => { try { return parseInt(localStorage.getItem('certo_rate') || '1590', 10) || 1590; } catch(_) { return 1590; } })();

  useEffect(() => {
    authFetch(`/api/products/${productId}`)
      .then(r => r.json())
      .then(p => {
        // Normalise variants: colours store images as a newline-joined string for the textarea
        const rawV   = p.variants && !Array.isArray(p.variants) ? p.variants : { colors:[], storages:[] };
        const colors   = (rawV.colors  || []).map(c => ({ ...c, images: Array.isArray(c.images) ? c.images.join('\n') : (c.images || '') }));
        const storages = rawV.storages || [];

        setForm({
          name:           p.name           || '',
          subtitle:       p.subtitle       || '',
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

  // ── list-field helpers ──────────────────────────────────────────────────────
  const addItem    = (key)         => set(key, [...form[key], '']);
  const setItem    = (key, i, val) => set(key, form[key].map((v, j) => j === i ? val : v));
  const removeItem = (key, i)      => set(key, form[key].filter((_, j) => j !== i));

  // ── variant helpers ─────────────────────────────────────────────────────────
  const addColor    = () => set('variants', { ...form.variants, colors: [...form.variants.colors, { id: Date.now().toString(36), name:'', hex:'#888888', images:'' }] });
  const removeColor = (i) => set('variants', { ...form.variants, colors: form.variants.colors.filter((_,j) => j!==i) });
  const setColor    = (i, k, v) => set('variants', { ...form.variants, colors: form.variants.colors.map((c,j) => j===i ? {...c,[k]:v} : c) });

  const addStorage    = () => set('variants', { ...form.variants, storages: [...form.variants.storages, { id: Date.now().toString(36), size:'', price_usd:0, in_stock:true }] });
  const removeStorage = (i) => set('variants', { ...form.variants, storages: form.variants.storages.filter((_,j) => j!==i) });
  const setStorage    = (i, k, v) => set('variants', { ...form.variants, storages: form.variants.storages.map((s,j) => j===i ? {...s,[k]:v} : s) });

  const submit = async () => {
    if (!form.name.trim()) { setErr('Product name is required.'); setActiveTab('basic'); return; }
    setErr(''); setBusy(true);
    try {
      const hasVariants = form.variants.colors.length > 0 || form.variants.storages.length > 0;
      const variants = hasVariants ? {
        colors:   form.variants.colors.map(c => ({ ...c, images: typeof c.images === 'string' ? c.images.split('\n').map(s=>s.trim()).filter(Boolean) : (c.images||[]) })),
        storages: form.variants.storages.map(s => ({ ...s, price_usd: Number(s.price_usd) })),
      } : [];

      const res  = await authFetch(`/api/products/${productId}`, { method:'PATCH', body: JSON.stringify({
        name: form.name.trim(), subtitle: form.subtitle.trim(),
        usd_price: Number(form.usd_price), stock_count: Number(form.stock_count),
        in_stock: form.in_stock, condition: form.condition, condition_note: form.condition_note,
        listing_status: form.listing_status, featured: form.featured,
        badge: form.badge.trim(), delivery_days: form.delivery_days.trim(), apple_url: form.apple_url.trim(),
        image_urls: form.image_urls.filter(Boolean),
        overview:   form.overview.filter(s => s.trim()),
        specs:      form.specs.filter(s => s.trim()),
        includes:   form.includes.filter(s => s.trim()),
        features:   form.features.filter(s => s.trim()),
        tech_specs: form.tech_specs.filter(s => s.trim()),
        variants,
      }) });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || 'Update failed'); setBusy(false); return; }
      onDone(json);
      onClose();
    } catch(e) { setErr(e.message); }
    setBusy(false);
  };

  const TABS = [
    { id:'basic',      label:'Basic Info' },
    { id:'condition',  label:'Condition' },
    { id:'images',     label:'Images' },
    { id:'variants',   label:'Variants' },
    { id:'overview',   label:'Overview' },
    { id:'specs',      label:'Quick Specs' },
    { id:'includes',   label:"What's in the Box" },
    { id:'features',   label:'Features' },
    { id:'tech_specs', label:'Tech Specs' },
  ];

  const L  = { fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 };
  const I  = { ...inputS, width:'100%', boxSizing:'border-box' };
  const TA = { ...I, resize:'vertical', fontFamily:'var(--font-body)', fontSize:13, lineHeight:1.6 };

  const ListEditor = ({ fieldKey, placeholder }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {form[fieldKey].map((val, i) => (
        <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input value={val} onChange={e => setItem(fieldKey, i, e.target.value)} placeholder={placeholder} style={{ ...I, flex:1 }}/>
          <button onClick={() => removeItem(fieldKey, i)} style={{ flexShrink:0, width:30, height:30, borderRadius:7, border:'1px solid var(--border)', background:'var(--bg-alt)', color:'var(--text-muted)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>
      ))}
      <button onClick={() => addItem(fieldKey)} style={{ alignSelf:'flex-start', padding:'6px 14px', borderRadius:8, border:'1px solid var(--accent)', background:'var(--accent-tint)', color:'var(--accent)', fontSize:12.5, fontWeight:600, cursor:'pointer' }}>+ Add item</button>
    </div>
  );

  return (
    <Modal
      title="Edit Product"
      subtitle={form?.name || (loading ? 'Loading…' : 'Product')}
      onClose={onClose}
      width={800}
      footer={
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={submit} disabled={busy || loading || !form} style={{ ...primaryBtn, flex:1, opacity:(busy||loading||!form)?0.7:1 }}>{busy?'Saving…':'Save changes'}</button>
          <button onClick={onClose} style={{ ...actionBtn, flex:1, justifyContent:'center' }}>Cancel</button>
        </div>
      }
    >
      {loading ? (
        <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text-muted)' }}>Loading product…</div>
      ) : !form ? (
        <div style={{ color:'oklch(50% 0.18 25)', padding:'20px 0' }}>{err || 'Failed to load product.'}</div>
      ) : (
        <>
          {err && <div style={{ fontSize:12.5, color:'oklch(50% 0.18 25)', padding:'10px 14px', background:'oklch(97% 0.03 25)', borderRadius:9, border:'1px solid oklch(85% 0.1 25)', marginBottom:12 }}>{err}</div>}

          <div style={{ display:'flex', gap:0, minHeight:480 }}>

            {/* ── Sidebar ───────────────────────────────────────────────── */}
            <div style={{ width:168, flexShrink:0, borderRight:'1px solid var(--border)', marginLeft:-20, marginTop:-20, marginBottom:-20, paddingTop:8 }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  display:'block', width:'100%', textAlign:'left',
                  padding:'9px 16px', fontSize:13.5, border:'none', cursor:'pointer', borderRadius:0,
                  fontWeight: activeTab===t.id ? 700 : 400,
                  color:      activeTab===t.id ? 'var(--accent)' : 'var(--text)',
                  background: activeTab===t.id ? 'var(--accent-tint)' : 'transparent',
                  fontFamily: 'var(--font-body)',
                }}>{t.label}</button>
              ))}
            </div>

            {/* ── Content ───────────────────────────────────────────────── */}
            <div style={{ flex:1, paddingLeft:24, display:'flex', flexDirection:'column', gap:16 }}>

              {/* Basic Info */}
              {activeTab === 'basic' && <>
                <div><label style={L}>Product Name</label><input value={form.name} onChange={e => set('name', e.target.value)} style={I}/></div>
                <div><label style={L}>Subtitle / Storage / Color</label><input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="e.g. 256GB · Desert Titanium" style={I}/></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div><label style={L}>USD Price</label><input type="number" min="0" step="0.01" value={form.usd_price} onChange={e => set('usd_price', e.target.value)} style={I}/></div>
                  <div><label style={L}>Stock Count</label><input type="number" min="0" value={form.stock_count} onChange={e => set('stock_count', e.target.value)} style={I}/></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={L}>Condition</label>
                    <select value={form.condition} onChange={e => set('condition', e.target.value)} style={{ ...I, cursor:'pointer' }}>
                      <option value="New">New</option>
                      <option value="Refurb">Refurb</option>
                    </select>
                  </div>
                  <div>
                    <label style={L}>Listing Status</label>
                    <select value={form.listing_status} onChange={e => set('listing_status', e.target.value)} style={{ ...I, cursor:'pointer' }}>
                      <option value="live">🟢 Live (on sale)</option>
                      <option value="out_of_stock">Out of stock</option>
                      <option value="coming_soon">Coming soon</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div><label style={L}>Badge Label</label><input value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="e.g. New model" style={I}/></div>
                  <div><label style={L}>Delivery Estimate</label><input value={form.delivery_days} onChange={e => set('delivery_days', e.target.value)} placeholder="10–18 business days" style={I}/></div>
                </div>
                <div><label style={L}>Apple.com URL</label><input value={form.apple_url} onChange={e => set('apple_url', e.target.value)} placeholder="https://www.apple.com/shop/buy-iphone/…" style={I}/></div>
                <div style={{ display:'flex', gap:20, padding:'10px 14px', background:'var(--bg-alt)', borderRadius:10, border:'1px solid var(--border)' }}>
                  <label style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={form.in_stock} onChange={e => set('in_stock', e.target.checked)} style={{ width:15, height:15, accentColor:'var(--accent)' }}/>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>In stock</span>
                  </label>
                  <label style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} style={{ width:15, height:15, accentColor:'var(--accent)' }}/>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Featured ★</span>
                  </label>
                </div>
                <div style={{ fontSize:13, color:'var(--text-muted)', padding:'8px 12px', background:'var(--bg-alt)', borderRadius:8, border:'1px solid var(--border)' }}>
                  NGN at current rate: <strong style={{ color:'var(--text)' }}>₦{form.usd_price ? (Number(form.usd_price)*rate).toLocaleString('en-NG') : '0'}</strong>
                </div>
              </>}

              {/* Condition */}
              {activeTab === 'condition' && <>
                <div>
                  <label style={L}>Condition Note (shown on product page)</label>
                  <textarea value={form.condition_note} onChange={e => set('condition_note', e.target.value)} rows={7} style={TA}/>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:8, lineHeight:1.65 }}>This text appears in the condition box on the product detail page. Describe sourcing, warranty status, and any cosmetic notes.</div>
                </div>
              </>}

              {/* Images */}
              {activeTab === 'images' && <>
                <div>
                  <label style={L}>Image URLs (one per line)</label>
                  <ListEditor fieldKey="image_urls" placeholder="https://store.storeimages.cdn-apple.com/…"/>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:10, lineHeight:1.65 }}>The first image is the main display image; additional images appear as thumbnails in the gallery.</div>
                </div>
              </>}

              {/* Variants */}
              {activeTab === 'variants' && <>
                <div style={{ fontSize:12.5, color:'var(--text-muted)', lineHeight:1.65, padding:'10px 14px', background:'var(--bg-alt)', borderRadius:9, border:'1px solid var(--border)' }}>
                  Define colors and storage sizes separately. Customers choose their preferred color (which shows that color's images) and their storage size (which sets the price). Leave both empty for products with no variants.
                </div>

                <div>
                  <label style={L}>Colors</label>
                  {form.variants.colors.map((c, i) => (
                    <div key={c.id||i} style={{ padding:14, background:'var(--bg-alt)', borderRadius:10, border:'1px solid var(--border)', marginBottom:10 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, marginBottom:10 }}>
                        <div><label style={{ ...L, marginBottom:4 }}>Color Name</label><input value={c.name} onChange={e => setColor(i,'name',e.target.value)} placeholder="Desert Titanium" style={I}/></div>
                        <div>
                          <label style={{ ...L, marginBottom:4 }}>Hex Color</label>
                          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                            <input value={c.hex} onChange={e => setColor(i,'hex',e.target.value)} placeholder="#888888" style={{ ...I, width:90 }}/>
                            <input type="color" value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : '#888888'} onChange={e => setColor(i,'hex',e.target.value)} style={{ width:32, height:34, padding:2, border:'1px solid var(--border)', borderRadius:7, cursor:'pointer', flexShrink:0 }}/>
                          </div>
                        </div>
                      </div>
                      <label style={{ ...L, marginBottom:4 }}>Images (one URL per line)</label>
                      <textarea value={c.images} onChange={e => setColor(i,'images',e.target.value)} rows={3} placeholder="https://store.storeimages.cdn-apple.com/…" style={{ ...TA, marginBottom:8 }}/>
                      <button onClick={() => removeColor(i)} style={{ fontSize:12, color:'oklch(50% 0.18 25)', border:'none', background:'none', cursor:'pointer', padding:0, fontFamily:'var(--font-body)' }}>Remove color</button>
                    </div>
                  ))}
                  <button onClick={addColor} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--accent)', background:'var(--accent-tint)', color:'var(--accent)', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>+ Add Color</button>
                </div>

                <div>
                  <label style={L}>Storage Sizes & Prices</label>
                  {form.variants.storages.map((s, i) => (
                    <div key={s.id||i} style={{ padding:14, background:'var(--bg-alt)', borderRadius:10, border:'1px solid var(--border)', marginBottom:10 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                        <div><label style={{ ...L, marginBottom:4 }}>Size Label</label><input value={s.size} onChange={e => setStorage(i,'size',e.target.value)} placeholder="256GB" style={I}/></div>
                        <div><label style={{ ...L, marginBottom:4 }}>Price (USD)</label><input type="number" min="0" step="0.01" value={s.price_usd} onChange={e => setStorage(i,'price_usd',e.target.value)} style={I}/></div>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <label style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
                          <input type="checkbox" checked={s.in_stock !== false} onChange={e => setStorage(i,'in_stock',e.target.checked)} style={{ width:14, height:14, accentColor:'var(--accent)' }}/>
                          <span style={{ fontSize:13, color:'var(--text)', fontFamily:'var(--font-body)' }}>In stock</span>
                        </label>
                        <button onClick={() => removeStorage(i)} style={{ fontSize:12, color:'oklch(50% 0.18 25)', border:'none', background:'none', cursor:'pointer', padding:0, fontFamily:'var(--font-body)' }}>Remove</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={addStorage} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--accent)', background:'var(--accent-tint)', color:'var(--accent)', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>+ Add Storage</button>
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

// ─── Create product modal ─────────────────────────────────────────────────────
function ProductCreateModal({ onClose, onDone }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [form, setForm] = useState({
    name: '', subtitle: '', category: 'iPhone',
    usd_price: '', stock_count: 0,
    in_stock: true, condition: 'New', condition_note: '',
    listing_status: 'live', featured: false,
    badge: '', delivery_days: '10–18 business days', apple_url: '',
    image_urls: [],
    overview: [],
    specs: [],
    includes: [],
    features: [],
    tech_specs: [],
    variants: { colors: [], storages: [] },
  });
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  const rate = (() => { try { return parseInt(localStorage.getItem('certo_rate') || '1590', 10) || 1590; } catch(_) { return 1590; } })();

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── list-field helpers ──────────────────────────────────────────────────────
  const addItem    = (key)         => set(key, [...form[key], '']);
  const setItem    = (key, i, val) => set(key, form[key].map((v, j) => j === i ? val : v));
  const removeItem = (key, i)      => set(key, form[key].filter((_, j) => j !== i));

  // ── variant helpers ─────────────────────────────────────────────────────────
  const addColor    = () => set('variants', { ...form.variants, colors: [...form.variants.colors, { id: Date.now().toString(36), name:'', hex:'#888888', images:'' }] });
  const removeColor = (i) => set('variants', { ...form.variants, colors: form.variants.colors.filter((_,j) => j!==i) });
  const setColor    = (i, k, v) => set('variants', { ...form.variants, colors: form.variants.colors.map((c,j) => j===i ? {...c,[k]:v} : c) });

  const addStorage    = () => set('variants', { ...form.variants, storages: [...form.variants.storages, { id: Date.now().toString(36), size:'', price_usd:0, in_stock:true }] });
  const removeStorage = (i) => set('variants', { ...form.variants, storages: form.variants.storages.filter((_,j) => j!==i) });
  const setStorage    = (i, k, v) => set('variants', { ...form.variants, storages: form.variants.storages.map((s,j) => j===i ? {...s,[k]:v} : s) });

  const submit = async () => {
    if (!form.name.trim()) { setErr('Product name is required.'); setActiveTab('basic'); return; }
    if (!form.usd_price)   { setErr('USD price is required.');    setActiveTab('basic'); return; }
    setErr(''); setBusy(true);
    try {
      const hasVariants = form.variants.colors.length > 0 || form.variants.storages.length > 0;
      const variants = hasVariants ? {
        colors:   form.variants.colors.map(c => ({ ...c, images: typeof c.images === 'string' ? c.images.split('\n').map(s=>s.trim()).filter(Boolean) : (c.images||[]) })),
        storages: form.variants.storages.map(s => ({ ...s, price_usd: Number(s.price_usd) })),
      } : [];

      const res  = await authFetch('/api/products', { method: 'POST', body: JSON.stringify({
        name: form.name.trim(), subtitle: form.subtitle.trim(), category: form.category,
        usd_price: Number(form.usd_price), stock_count: Number(form.stock_count),
        in_stock: form.in_stock, condition: form.condition, condition_note: form.condition_note,
        listing_status: form.listing_status, featured: form.featured,
        badge: form.badge.trim(), delivery_days: form.delivery_days.trim(), apple_url: form.apple_url.trim(),
        image_urls: form.image_urls.filter(Boolean),
        overview:   form.overview.filter(s => s.trim()),
        specs:      form.specs.filter(s => s.trim()),
        includes:   form.includes.filter(s => s.trim()),
        features:   form.features.filter(s => s.trim()),
        tech_specs: form.tech_specs.filter(s => s.trim()),
        variants,
      }) });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || 'Create failed'); setBusy(false); return; }
      onDone(json);
      onClose();
    } catch(e) { setErr(e.message); }
    setBusy(false);
  };

  const TABS = [
    { id:'basic',      label:'Basic Info' },
    { id:'condition',  label:'Condition' },
    { id:'images',     label:'Images' },
    { id:'variants',   label:'Variants' },
    { id:'overview',   label:'Overview' },
    { id:'specs',      label:'Quick Specs' },
    { id:'includes',   label:"What's in the Box" },
    { id:'features',   label:'Features' },
    { id:'tech_specs', label:'Tech Specs' },
  ];

  const L  = { fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 };
  const I  = { ...inputS, width:'100%', boxSizing:'border-box' };
  const TA = { ...I, resize:'vertical', fontFamily:'var(--font-body)', fontSize:13, lineHeight:1.6 };

  const ListEditor = ({ fieldKey, placeholder }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {form[fieldKey].map((val, i) => (
        <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input value={val} onChange={e => setItem(fieldKey, i, e.target.value)} placeholder={placeholder} style={{ ...I, flex:1 }}/>
          <button onClick={() => removeItem(fieldKey, i)} style={{ flexShrink:0, width:30, height:30, borderRadius:7, border:'1px solid var(--border)', background:'var(--bg-alt)', color:'var(--text-muted)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>
      ))}
      <button onClick={() => addItem(fieldKey)} style={{ alignSelf:'flex-start', padding:'6px 14px', borderRadius:8, border:'1px solid var(--accent)', background:'var(--accent-tint)', color:'var(--accent)', fontSize:12.5, fontWeight:600, cursor:'pointer' }}>+ Add item</button>
    </div>
  );

  return (
    <Modal
      title="Add Product"
      subtitle={form.name || 'New Product'}
      onClose={onClose}
      width={800}
      footer={
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={submit} disabled={busy} style={{ ...primaryBtn, flex:1, opacity:busy?0.7:1 }}>{busy?'Creating…':'Add product'}</button>
          <button onClick={onClose} style={{ ...actionBtn, flex:1, justifyContent:'center' }}>Cancel</button>
        </div>
      }
    >
      {/* error banner (always visible above content) */}
      {err && <div style={{ fontSize:12.5, color:'oklch(50% 0.18 25)', padding:'10px 14px', background:'oklch(97% 0.03 25)', borderRadius:9, border:'1px solid oklch(85% 0.1 25)', marginBottom:12 }}>{err}</div>}

      <div style={{ display:'flex', gap:0, minHeight:480 }}>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div style={{ width:168, flexShrink:0, borderRight:'1px solid var(--border)', marginLeft:-20, marginTop:-20, marginBottom:-20, paddingTop:8 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display:'block', width:'100%', textAlign:'left',
              padding:'9px 16px', fontSize:13.5, border:'none', cursor:'pointer', borderRadius:0,
              fontWeight: activeTab===t.id ? 700 : 400,
              color:      activeTab===t.id ? 'var(--accent)' : 'var(--text)',
              background: activeTab===t.id ? 'var(--accent-tint)' : 'transparent',
              fontFamily: 'var(--font-body)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div style={{ flex:1, paddingLeft:24, display:'flex', flexDirection:'column', gap:16 }}>

          {/* Basic Info */}
          {activeTab === 'basic' && <>
            <div><label style={L}>Product Name</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. iPhone 16 Pro" style={I}/></div>
            <div><label style={L}>Subtitle / Storage / Color</label><input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="e.g. 256GB · Desert Titanium" style={I}/></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label style={L}>USD Price</label><input type="number" min="0" step="0.01" value={form.usd_price} onChange={e => set('usd_price', e.target.value)} placeholder="0" style={I}/></div>
              <div><label style={L}>Stock Count</label><input type="number" min="0" value={form.stock_count} onChange={e => set('stock_count', e.target.value)} style={I}/></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={L}>Condition</label>
                <select value={form.condition} onChange={e => set('condition', e.target.value)} style={{ ...I, cursor:'pointer' }}>
                  <option value="New">New</option>
                  <option value="Refurb">Refurb</option>
                </select>
              </div>
              <div>
                <label style={L}>Listing Status</label>
                <select value={form.listing_status} onChange={e => set('listing_status', e.target.value)} style={{ ...I, cursor:'pointer' }}>
                  <option value="live">🟢 Live (on sale)</option>
                  <option value="out_of_stock">Out of stock</option>
                  <option value="coming_soon">Coming soon</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label style={L}>Badge Label</label><input value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="e.g. New model" style={I}/></div>
              <div><label style={L}>Delivery Estimate</label><input value={form.delivery_days} onChange={e => set('delivery_days', e.target.value)} placeholder="10–18 business days" style={I}/></div>
            </div>
            <div><label style={L}>Apple.com URL</label><input value={form.apple_url} onChange={e => set('apple_url', e.target.value)} placeholder="https://www.apple.com/shop/buy-iphone/…" style={I}/></div>
            <div style={{ display:'flex', gap:20, padding:'10px 14px', background:'var(--bg-alt)', borderRadius:10, border:'1px solid var(--border)' }}>
              <label style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                <input type="checkbox" checked={form.in_stock} onChange={e => set('in_stock', e.target.checked)} style={{ width:15, height:15, accentColor:'var(--accent)' }}/>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>In stock</span>
              </label>
              <label style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} style={{ width:15, height:15, accentColor:'var(--accent)' }}/>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Featured ★</span>
              </label>
            </div>
            <div style={{ fontSize:13, color:'var(--text-muted)', padding:'8px 12px', background:'var(--bg-alt)', borderRadius:8, border:'1px solid var(--border)' }}>
              NGN at current rate: <strong style={{ color:'var(--text)' }}>₦{form.usd_price ? (Number(form.usd_price)*rate).toLocaleString('en-NG') : '0'}</strong>
            </div>
          </>}

          {/* Condition */}
          {activeTab === 'condition' && <>
            <div>
              <label style={L}>Condition Note (shown on product page)</label>
              <textarea value={form.condition_note} onChange={e => set('condition_note', e.target.value)} rows={7} style={TA}/>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:8, lineHeight:1.65 }}>This text appears in the condition box on the product detail page. Describe sourcing, warranty status, and any cosmetic notes.</div>
            </div>
          </>}

          {/* Images */}
          {activeTab === 'images' && <>
            <div>
              <label style={L}>Image URLs (one per line)</label>
              <ListEditor fieldKey="image_urls" placeholder="https://store.storeimages.cdn-apple.com/…"/>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:10, lineHeight:1.65 }}>Add full image URLs (https://…). The first image is the main display image; additional images appear as thumbnails in the gallery.</div>
            </div>
          </>}

          {/* Variants */}
          {activeTab === 'variants' && <>
            <div style={{ fontSize:12.5, color:'var(--text-muted)', lineHeight:1.65, padding:'10px 14px', background:'var(--bg-alt)', borderRadius:9, border:'1px solid var(--border)' }}>
              Define colors and storage sizes separately. Customers choose their preferred color (which shows that color's images) and their storage size (which sets the price). Leave both empty for products with no variants.
            </div>

            {/* Colors */}
            <div>
              <label style={L}>Colors</label>
              {form.variants.colors.map((c, i) => (
                <div key={c.id} style={{ padding:14, background:'var(--bg-alt)', borderRadius:10, border:'1px solid var(--border)', marginBottom:10 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, marginBottom:10 }}>
                    <div><label style={{ ...L, marginBottom:4 }}>Color Name</label><input value={c.name} onChange={e => setColor(i,'name',e.target.value)} placeholder="Desert Titanium" style={I}/></div>
                    <div>
                      <label style={{ ...L, marginBottom:4 }}>Hex Color</label>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <input value={c.hex} onChange={e => setColor(i,'hex',e.target.value)} placeholder="#888888" style={{ ...I, width:90 }}/>
                        <input type="color" value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : '#888888'} onChange={e => setColor(i,'hex',e.target.value)} style={{ width:32, height:34, padding:2, border:'1px solid var(--border)', borderRadius:7, cursor:'pointer', flexShrink:0 }}/>
                      </div>
                    </div>
                  </div>
                  <label style={{ ...L, marginBottom:4 }}>Images (one URL per line)</label>
                  <textarea value={c.images} onChange={e => setColor(i,'images',e.target.value)} rows={3} placeholder="https://store.storeimages.cdn-apple.com/…" style={{ ...TA, marginBottom:8 }}/>
                  <button onClick={() => removeColor(i)} style={{ fontSize:12, color:'oklch(50% 0.18 25)', border:'none', background:'none', cursor:'pointer', padding:0, fontFamily:'var(--font-body)' }}>Remove color</button>
                </div>
              ))}
              <button onClick={addColor} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--accent)', background:'var(--accent-tint)', color:'var(--accent)', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>+ Add Color</button>
            </div>

            {/* Storages */}
            <div>
              <label style={L}>Storage Sizes & Prices</label>
              {form.variants.storages.map((s, i) => (
                <div key={s.id} style={{ padding:14, background:'var(--bg-alt)', borderRadius:10, border:'1px solid var(--border)', marginBottom:10 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                    <div><label style={{ ...L, marginBottom:4 }}>Size Label</label><input value={s.size} onChange={e => setStorage(i,'size',e.target.value)} placeholder="256GB" style={I}/></div>
                    <div><label style={{ ...L, marginBottom:4 }}>Price (USD)</label><input type="number" min="0" step="0.01" value={s.price_usd} onChange={e => setStorage(i,'price_usd',e.target.value)} style={I}/></div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <label style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
                      <input type="checkbox" checked={s.in_stock !== false} onChange={e => setStorage(i,'in_stock',e.target.checked)} style={{ width:14, height:14, accentColor:'var(--accent)' }}/>
                      <span style={{ fontSize:13, color:'var(--text)', fontFamily:'var(--font-body)' }}>In stock</span>
                    </label>
                    <button onClick={() => removeStorage(i)} style={{ fontSize:12, color:'oklch(50% 0.18 25)', border:'none', background:'none', cursor:'pointer', padding:0, fontFamily:'var(--font-body)' }}>Remove</button>
                  </div>
                </div>
              ))}
              <button onClick={addStorage} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--accent)', background:'var(--accent-tint)', color:'var(--accent)', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>+ Add Storage</button>
            </div>
          </>}

          {/* Overview */}
          {activeTab === 'overview' && <>
            <label style={L}>Overview Bullets</label>
            <ListEditor fieldKey="overview" placeholder="e.g. 48MP Fusion camera system"/>
          </>}

          {/* Quick Specs */}
          {activeTab === 'specs' && <>
            <label style={L}>Quick Specs</label>
            <ListEditor fieldKey="specs" placeholder="e.g. A18 Pro chip · 6-core CPU"/>
          </>}

          {/* What's in the Box */}
          {activeTab === 'includes' && <>
            <label style={L}>What's in the Box</label>
            <ListEditor fieldKey="includes" placeholder="e.g. iPhone with iOS 18"/>
          </>}

          {/* Features */}
          {activeTab === 'features' && <>
            <label style={L}>Features</label>
            <ListEditor fieldKey="features" placeholder="e.g. Face ID for secure authentication"/>
          </>}

          {/* Tech Specs */}
          {activeTab === 'tech_specs' && <>
            <label style={L}>Tech Specs</label>
            <ListEditor fieldKey="tech_specs" placeholder="e.g. 6.3-inch Super Retina XDR display"/>
          </>}

        </div>
      </div>
    </Modal>
  );
}

// ─── Delete (soft-hide) order modal ──────────────────────────────────────────
function DeleteOrderModal({ order, onClose, onDone }) {
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await authFetch(`/api/orders/${order.id}`, { method:'PATCH', body: JSON.stringify({ admin_hidden: true }) });
      if (res.ok) { const updated = await res.json(); onDone(mapOrder(updated)); }
    } catch(e) { console.error(e); }
    setBusy(false);
    onClose();
  };

  return (
    <Modal title="Delete order" onClose={onClose} width={380}>
      <div style={{ fontSize:14, color:'var(--text)', lineHeight:1.7, marginBottom:24 }}>
        Are you sure you want to delete this?
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={submit} disabled={busy} style={{ ...primaryBtn, background:'oklch(48% 0.2 25)', flex:1, opacity:busy?0.7:1 }}>{busy?'Deleting…':'Delete'}</button>
        <button onClick={onClose} style={{ ...actionBtn, flex:1, justifyContent:'center' }}>Cancel</button>
      </div>
    </Modal>
  );
}

function PayPill({ method }) {
  const m = method==='MoonPay'
    ? { bg:'oklch(94% 0.05 280)', fg:'oklch(42% 0.16 280)' }
    : { bg:'oklch(93% 0.06 145)', fg:'oklch(36% 0.15 145)' };
  return <span style={{ padding:'3px 9px', borderRadius:6, background:m.bg, color:m.fg, fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>{method||'Paystack'}</span>;
}

function OrderDetail({ order: initialOrder, onBack, isMobile, onOrdersChange, existingCerts }) {
  const [order,   setOrder]   = useState(initialOrder);
  const [status,  setStatus]  = useState(initialOrder.status);
  const [saving,  setSaving]  = useState(false);
  const [resend,      setResend]      = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'
  const [resendError, setResendError] = useState('');
  const [waModal,     setWaModal]     = useState(false);
  const [flagModal,   setFlagModal]   = useState(false);
  const [certModal,   setCertModal]   = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [localCerts,  setLocalCerts]  = useState(existingCerts || []);

  useEffect(() => { setLocalCerts(existingCerts || []); }, [existingCerts]);

  const existingCert    = localCerts[0] || null;
  const certIsPublished = existingCert?.status === 'published';
  const certIsDraft     = existingCert?.status === 'draft';
  const certBtnLabel    = certIsPublished ? '✓ View certificate' : certIsDraft ? '⏳ Edit draft certificate' : '＋ Publish certificate';
  const certBtnStyle    = certIsPublished
    ? { ...actionBtn, borderColor:'oklch(70% 0.15 155)', color:'oklch(35% 0.15 155)', background:'oklch(93% 0.06 155)' }
    : certIsDraft
    ? { ...actionBtn, borderColor:'oklch(75% 0.12 55)', color:'oklch(42% 0.14 55)', background:'oklch(95% 0.07 70)' }
    : { ...actionBtn, borderColor:'var(--accent)', color:'var(--accent)', background:'var(--accent-tint,#f7e9df)' };

  const STATUSES = ['Payment Pending','Order Confirmed','Purchased from Apple','In Transit to US Partner','Customs Clearance','Arrived in Nigeria','Out for Delivery','Delivered','Cancelled'];

  const updateStatus = async (newStatus) => {
    setStatus(newStatus);
    setSaving(true);
    try {
      const res = await authFetch(`/api/orders/${order.id}`, { method:'PATCH', body: JSON.stringify({ status: newStatus }) });
      if (res.ok) {
        const updated = await res.json();
        const mapped  = mapOrder(updated);
        setOrder(mapped);
        onOrdersChange && onOrdersChange(mapped);
      }
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const handleFlagDone = (updated) => {
    setOrder(updated);
    onOrdersChange && onOrdersChange(updated);
  };

  const resendEmail = async () => {
    setResend('sending');
    setResendError('');
    try {
      const res = await authFetch(`/api/orders/${order.id}/resend-email`, { method:'POST' });
      if (res.ok) {
        setResend('sent');
        setTimeout(() => setResend('idle'), 4000);
      } else {
        let msg = 'Send failed';
        try { const j = await res.json(); msg = j.error || msg; } catch(_) {}
        setResendError(msg);
        setResend('error');
        setTimeout(() => { setResend('idle'); setResendError(''); }, 6000);
      }
    } catch(e) {
      setResendError(e.message || 'Network error');
      setResend('error');
      setTimeout(() => { setResend('idle'); setResendError(''); }, 6000);
    }
  };

  const infoFields = [
    ['Customer', order.customer],
    ['Phone',    order.phone],
    ['Email',    order.email],
    ['USD Total',fmtU(order.usd)],
    ['NGN Total',fmtN(order.ngn)],
    ['Payment',  order.payment_method],
    ['Order Date',order.date],
    ['Address',  order.address],
  ];

  return (
    <>
      {waModal     && <WhatsAppModal phone={order.phone} name={order.customer} onClose={() => setWaModal(false)}/>}
      {flagModal   && <FlagModal order={order} onClose={() => setFlagModal(false)} onDone={handleFlagDone}/>}
      {certModal   && <CertModal order={order} existingCert={existingCert} onClose={() => setCertModal(false)} onDone={(cert) => setLocalCerts([cert])}/>}
      {deleteModal && <DeleteOrderModal order={order} onClose={() => setDeleteModal(false)} onDone={(updated) => { onOrdersChange && onOrdersChange(updated); onBack(); }}/>}

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <button onClick={onBack} style={{ ...linkBtn, alignSelf:'flex-start', display:'flex', alignItems:'center', gap:6 }}>← Back to orders</button>
        <Panel>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:24 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>Order</div>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:26, color:'var(--text)', letterSpacing:'-0.02em', display:'flex', alignItems:'center', gap:10 }}>
                {order.flag && <span title={order.flag_reason}>🚩</span>}{order.id}
              </div>
            </div>
            <select value={status} onChange={e => updateStatus(e.target.value)} disabled={saving} style={{ padding:'10px 16px', borderRadius:10, border:'1.5px solid var(--accent)', background:'var(--accent-tint,#f7e9df)', color:'var(--accent)', fontFamily:'var(--font-body)', fontSize:14, fontWeight:700, cursor:'pointer', outline:'none' }}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Info grid */}
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:18, marginBottom:24 }}>
            {infoFields.map(([k,v]) => (
              <div key={k} style={{ minWidth:0 }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:600 }}>{k}</div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', wordBreak:'break-word' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Order items */}
          <div style={{ background:'var(--bg-alt)', borderRadius:12, border:'1px solid var(--border)', padding:16, marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>Order items ({order.items.length})</div>
            {order.items.map((it,i) => (
              <div key={i} style={{ padding:'10px 0', borderTop:i?'1px solid var(--border)':'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{it.qty>1&&`${it.qty}× `}{it.name}</div>
                    {it.subtitle&&<div style={{ fontSize:12, color:'var(--text-muted)' }}>{it.subtitle}</div>}
                    {it.applecare&&it.applecare!=='none'&&<div style={{ fontSize:12, color:'var(--accent)', marginTop:2 }}>+ {it.applecare}</div>}
                  </div>
                  <div style={{ fontFamily:'var(--font-num)', fontWeight:700, fontSize:14, color:'var(--text)' }}>{fmtU(it.usd_price*(it.qty||1))}</div>
                </div>
                {(it.apple_url || it.product_id) && (
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                    {it.apple_url && (
                      <a href={it.apple_url} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:7, background:'var(--bg)', border:'1px solid var(--border)', fontSize:12, fontWeight:600, color:'var(--text)', textDecoration:'none' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        Apple.com
                      </a>
                    )}
                    {it.product_id && (
                      <a href={`/shop/${it.product_id}`} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:7, background:'var(--bg)', border:'1px solid var(--border)', fontSize:12, fontWeight:600, color:'var(--text)', textDecoration:'none' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                        Certo listing
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={() => setWaModal(true)} style={{ ...actionBtn, background:'oklch(93% 0.08 145)', borderColor:'oklch(80% 0.12 145)', color:'oklch(35% 0.15 145)' }}>💬 WhatsApp customer</button>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <button
                onClick={resendEmail}
                disabled={resend === 'sending' || resend === 'sent'}
                style={{
                  ...actionBtn,
                  ...(resend === 'sent'  ? { color:'oklch(35% 0.15 155)', borderColor:'oklch(72% 0.12 155)', background:'oklch(93% 0.06 155)' } : {}),
                  ...(resend === 'error' ? { color:'oklch(48% 0.2 25)',   borderColor:'oklch(85% 0.1 25)',   background:'oklch(98% 0.01 25)'  } : {}),
                }}
              >
                {resend === 'sending' ? '⏳ Sending…' : resend === 'sent' ? '✓ Email sent' : resend === 'error' ? '✕ Failed — retry' : '✉ Resend confirmation'}
              </button>
              {resend === 'error' && resendError && (
                <span style={{ fontSize:11, color:'oklch(48% 0.2 25)', paddingLeft:2 }}>{resendError}</span>
              )}
            </div>
            <button onClick={() => setFlagModal(true)} style={{ ...actionBtn, color:order.flag?'oklch(45% 0.18 25)':'var(--text-muted)', borderColor:order.flag?'oklch(85% 0.1 25)':'var(--border)', background:order.flag?'oklch(97% 0.03 25)':'var(--bg)' }}>
              🚩 {order.flag?'Unflag':'Flag'} order
            </button>
            <button onClick={() => setCertModal(true)} style={certBtnStyle}>{certBtnLabel}</button>
            {isMobile ? (
              <button onClick={() => setDeleteModal(true)} style={{ ...actionBtn, color:'oklch(48% 0.2 25)', borderColor:'oklch(85% 0.1 25)', background:'oklch(98% 0.01 25)', width:'100%', justifyContent:'center' }}>🗑 Delete order</button>
            ) : (
              <button onClick={() => setDeleteModal(true)} style={{ ...actionBtn, color:'oklch(48% 0.2 25)', borderColor:'oklch(85% 0.1 25)', background:'oklch(98% 0.01 25)', marginLeft:'auto' }}>🗑 Delete order</button>
            )}
          </div>

          {/* Flag reason banner */}
          {order.flag && (
            <div style={{ marginTop:16, padding:14, background:'oklch(97% 0.03 25)', border:'1.5px solid oklch(85% 0.1 25)', borderRadius:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'oklch(45% 0.18 25)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>🚩 Flag reason</div>
              <div style={{ fontSize:14, color:'oklch(35% 0.15 25)', lineHeight:1.6 }}>{order.flag_reason}</div>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

// ─── TAB: Products ────────────────────────────────────────────────────────────
function ProductsTab({ isMobile, products, onProductUpdate }) {
  const [q,           setQ]          = useState('');
  const [editId,      setEditId]     = useState(null);
  const [showCreate,  setShowCreate] = useState(false);
  const [localProds,  setLocalProds] = useState(products);

  useEffect(() => { setLocalProds(products); }, [products]);

  const filtered = localProds.filter(p => !q.trim() || (p.name+p.subtitle+p.type).toLowerCase().includes(q.toLowerCase()));
  const STATUS_MAP = {
    live:        { label:'Live',         bg:'oklch(93% 0.06 155)', fg:'oklch(35% 0.15 155)' },
    out_of_stock:{ label:'Out of stock', bg:'oklch(94% 0.02 0)',   fg:'oklch(48% 0.05 0)'   },
    coming_soon: { label:'Coming soon',  bg:'oklch(95% 0.07 70)',  fg:'oklch(45% 0.16 55)'  },
    hidden:      { label:'Hidden',       bg:'oklch(94% 0.02 0)',   fg:'oklch(48% 0.05 0)'   },
  };

  const handleEditDone = (raw) => {
    const mapped = mapProduct(raw);
    setLocalProds(prev => prev.map(p => p.id===mapped.id ? mapped : p));
    onProductUpdate && onProductUpdate(mapped);
  };

  const handleCreateDone = (raw) => {
    const mapped = mapProduct(raw);
    setLocalProds(prev => [mapped, ...prev]);
    onProductUpdate && onProductUpdate(mapped);
  };

  return (
    <>
      {editId && <ProductEditModal productId={editId} onClose={() => setEditId(null)} onDone={handleEditDone}/>}
      {showCreate && <ProductCreateModal onClose={() => setShowCreate(false)} onDone={handleCreateDone}/>}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:'1 1 220px' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', display:'flex' }}><Icon name="search" size={15}/></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…" style={{ ...inputS, paddingLeft:34, width:'100%', boxSizing:'border-box' }}/>
          </div>
          <span style={{ fontSize:12.5, color:'var(--text-muted)' }}>{filtered.length} of {localProds.length}</span>
          <button onClick={() => setShowCreate(true)} style={{ ...primaryBtn, display:'flex', alignItems:'center', gap:7 }}><Icon name="plus" size={16} c="white"/> Add product</button>
        </div>

        {isMobile ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map(p => {
              const st = STATUS_MAP[p.listingStatus]||STATUS_MAP.live;
              return (
                <Panel key={p.id} pad={16}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, color:'var(--text)' }}>{p.name}{p.featured&&<span style={{ color:'var(--accent)', marginLeft:4 }}>★</span>}</div>
                      <div style={{ fontSize:12.5, color:'var(--text-muted)', marginBottom:8 }}>{p.subtitle}</div>
                      <span style={{ padding:'3px 9px', borderRadius:6, background:st.bg, color:st.fg, fontSize:11, fontWeight:700 }}>{st.label}</span>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:'var(--font-num)', fontWeight:800, fontSize:16, color:'var(--text)' }}>{fmtU(p.usdPrice)}</div>
                      <div style={{ fontSize:12, color:p.stock===0?'oklch(55% 0.18 25)':'var(--text-muted)', marginTop:4 }}>{p.stock} in stock</div>
                      <button onClick={() => setEditId(p.id)} style={{ ...miniBtn, marginTop:8 }}>Edit</button>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        ) : (
          <Panel pad={0}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:720 }}>
                <thead><tr style={{ background:'var(--bg-alt)' }}>{['Product','Type','Condition','USD','Stock','Status',''].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map(p => {
                    const st = STATUS_MAP[p.listingStatus]||STATUS_MAP.live;
                    return (
                      <tr key={p.id} style={{ borderTop:'1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--bg-alt)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={tdS}><div style={{ fontWeight:700, color:'var(--text)' }}>{p.name}{p.featured&&<span title="Featured" style={{ color:'var(--accent)' }}>★</span>}</div><div style={{ fontSize:12, color:'var(--text-muted)' }}>{p.subtitle}</div></td>
                        <td style={{ ...tdS, color:'var(--text-muted)', fontSize:12.5 }}>{p.type}</td>
                        <td style={tdS}><CondBadge condition={p.condition}/></td>
                        <td style={{ ...tdS, fontSize:13 }}>{fmtU(p.usdPrice)}</td>
                        <td style={{ ...tdS, color:p.stock===0?'oklch(55% 0.18 25)':'var(--text)', fontWeight:600 }}>{p.stock}</td>
                        <td style={tdS}><span style={{ padding:'3px 9px', borderRadius:6, background:st.bg, color:st.fg, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>{st.label}</span></td>
                        <td style={tdS}><button onClick={() => setEditId(p.id)} style={miniBtn}>Edit</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!filtered.length&&<Empty label="No products found"/>}
          </Panel>
        )}
      </div>
    </>
  );
}

function CondBadge({ condition }) {
  const s = condition==='Refurb'||condition==='refurb'
    ? { bg:'oklch(94% 0.06 250)', fg:'oklch(40% 0.15 250)', label:'Refurb' }
    : { bg:'oklch(93% 0.06 155)', fg:'oklch(35% 0.15 155)', label:'New' };
  return <span style={{ padding:'3px 9px', borderRadius:6, background:s.bg, color:s.fg, fontSize:11, fontWeight:700 }}>{s.label}</span>;
}

// ─── TAB: Certificates ────────────────────────────────────────────────────────
function CertificatesTab({ isMobile, certificates }) {
  const [q, setQ] = useState('');
  const certs = certificates.filter(c => !q.trim() || (c.id+c.order_id+c.product_name+c.serial_number).toLowerCase().includes(q.toLowerCase()));
  const published = certificates.filter(c => c.status==='published').length;
  const drafts    = certificates.filter(c => c.status==='draft').length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:14 }}>
        <StatCard label="Published"   value={published}           accent="oklch(45% 0.15 155)" icon={<Icon name="cert" size={16}/>}/>
        <StatCard label="Drafts"      value={drafts}              accent="oklch(48% 0.18 55)"  icon={<Icon name="cert" size={16}/>}/>
        <StatCard label="Total issued" value={certificates.length} sub="all time"              icon={<Icon name="cert" size={16}/>}/>
      </div>

      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', display:'flex' }}><Icon name="search" size={15}/></span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by serial, order, product…" style={{ ...inputS, paddingLeft:34, width:'100%', boxSizing:'border-box' }}/>
      </div>

      <Panel pad={0}>
        {certs.length ? certs.map((c,i) => (
          <div key={c.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'15px 20px', borderTop:i?'1px solid var(--border)':'none' }}>
            <div style={{ width:40, height:40, borderRadius:10, background:c.status==='published'?'oklch(93% 0.06 155)':'oklch(95% 0.07 70)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name="cert" size={18} c={c.status==='published'?'oklch(40% 0.15 155)':'oklch(48% 0.16 55)'}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{c.product_name}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-mono,monospace)' }}>{c.order_id}{c.serial_number?` · ${c.serial_number}`:' · no serial yet'}</div>
            </div>
            {!isMobile&&<div style={{ fontSize:12, color:'var(--text-muted)' }}>{c.date}</div>}
            <span style={{ padding:'4px 11px', borderRadius:100, fontSize:11, fontWeight:700, whiteSpace:'nowrap', background:c.status==='published'?'oklch(93% 0.06 155)':'oklch(95% 0.07 70)', color:c.status==='published'?'oklch(35% 0.15 155)':'oklch(45% 0.16 55)' }}>{c.status==='published'?'✓ Published':'⏳ Draft'}</span>
            <button style={miniBtn}>{c.status==='published'?'View':'Edit'}</button>
          </div>
        )) : <Empty label="No certificates yet"/>}
      </Panel>
    </div>
  );
}

// ─── TAB: Messages ────────────────────────────────────────────────────────────
function MessagesTab({ isMobile, messages: initialMessages }) {
  const [sel,  setSel]  = useState(null);
  const [msgs, setMsgs] = useState(initialMessages);

  useEffect(() => { setMsgs(initialMessages); }, [initialMessages]);

  const open = async (m) => {
    setSel(m);
    if (!m.read) {
      setMsgs(prev => prev.map(x => x.id===m.id ? {...x, read:true} : x));
      setSel(s => s?.id===m.id ? {...s, read:true} : s);
      try { await authFetch(`/api/contact/${m.id}`, { method:'PATCH', body: JSON.stringify({ read:true }) }); } catch(e){}
    }
  };

  const markUnread = async () => {
    if (!sel) return;
    setMsgs(prev => prev.map(x => x.id===sel.id ? {...x, read:false} : x));
    setSel(s => ({...s, read:false}));
    try { await authFetch(`/api/contact/${sel.id}`, { method:'PATCH', body: JSON.stringify({ read:false }) }); } catch(e){}
  };

  const deleteMsg = async () => {
    if (!sel) return;
    try {
      const res = await authFetch(`/api/contact/${sel.id}`, { method:'DELETE' });
      if (res.ok) {
        setMsgs(prev => prev.filter(x => x.id !== sel.id));
        setSel(null);
      }
    } catch(e) { console.error(e); }
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'340px 1fr', gap:16, alignItems:'start' }}>
      <Panel pad={0} title={`Inbox · ${msgs.filter(m=>!m.read).length} unread`}>
        {msgs.length ? msgs.map((m,i) => {
          const active = sel?.id===m.id;
          return (
            <button key={m.id} onClick={() => open(m)} style={{ display:'block', width:'100%', textAlign:'left', cursor:'pointer', padding:'14px 18px', border:'none', borderTop:i?'1px solid var(--border)':'none', borderLeft:active?'3px solid var(--accent)':'3px solid transparent', background:active?'var(--bg-alt)':'var(--bg)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                {!m.read&&<span style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)', flexShrink:0 }}/>}
                <span style={{ fontSize:13.5, fontWeight:m.read?600:800, color:'var(--text)', flex:1 }}>{m.name}</span>
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>{m.created_at.split('·')[0]}</span>
              </div>
              <div style={{ fontSize:12.5, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.message}</div>
            </button>
          );
        }) : <Empty label="No messages yet"/>}
      </Panel>

      {(sel||!isMobile)&&(
        <Panel style={{ minHeight:300 }}>
          {sel ? (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, gap:12, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:20, color:'var(--text)' }}>{sel.name}</div>
                  <a href={`mailto:${sel.email}`} style={{ fontSize:13, color:'var(--accent)', textDecoration:'none' }}>{sel.email}</a>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{sel.created_at}</div>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <a href={`mailto:${sel.email}`} style={{ ...primaryBtn, textDecoration:'none' }}>Reply</a>
                  <button onClick={markUnread} disabled={!sel.read} style={{ ...actionBtn, opacity:sel.read?1:0.4, cursor:sel.read?'pointer':'default' }}>Mark unread</button>
                  <button onClick={deleteMsg} style={{ ...actionBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(88% 0.08 25)' }}>Delete</button>
                </div>
              </div>
              <div style={{ background:'var(--bg-alt)', borderRadius:12, padding:20, fontSize:15, lineHeight:1.7, color:'var(--text)' }}>{sel.message}</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:280, gap:12, color:'var(--text-muted)' }}>
              <Icon name="mail" size={32} c="var(--border)"/>
              <span style={{ fontSize:13 }}>Select a message to read</span>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

// ─── Coupon create modal ──────────────────────────────────────────────────────
function CouponCreateModal({ onClose, onDone }) {
  const [form, setForm] = useState({
    code: '', description: '', discount_type: 'percent',
    discount_value: '', applies_to: 'all',  // 'all' | 'product' | 'service' | 'delivery' | 'fees'
    max_uses: '', expires_at: '',
  });
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const L = { fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 };
  const I = { ...inputS, width:'100%', boxSizing:'border-box' };

  const submit = async () => {
    if (!form.code.trim())       { setErr('Coupon code is required.');    return; }
    if (!form.discount_value)    { setErr('Discount value is required.'); return; }
    setErr(''); setBusy(true);
    try {
      const res  = await authFetch('/api/coupons', { method:'POST', body: JSON.stringify({
        code:           form.code.trim().toUpperCase(),
        description:    form.description.trim(),
        discount_type:  form.discount_type,
        discount_value: Number(form.discount_value),
        applies_to:     form.applies_to,
        max_uses:       form.max_uses ? Number(form.max_uses) : null,
        expires_at:     form.expires_at || null,
      }) });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || 'Create failed'); setBusy(false); return; }
      onDone(json);
      onClose();
    } catch(e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Modal title="New coupon" onClose={onClose} width={480}
      footer={
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={submit} disabled={busy} style={{ ...primaryBtn, flex:1, opacity:busy?0.7:1 }}>{busy?'Creating…':'Create coupon'}</button>
          <button onClick={onClose} style={{ ...actionBtn, flex:1, justifyContent:'center' }}>Cancel</button>
        </div>
      }
    >
      {err && <div style={{ fontSize:12.5, color:'oklch(50% 0.18 25)', padding:'10px 14px', background:'oklch(97% 0.03 25)', borderRadius:9, border:'1px solid oklch(85% 0.1 25)', marginBottom:14 }}>{err}</div>}
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div><label style={L}>Coupon Code *</label><input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. SAVE20" style={I}/></div>
        <div><label style={L}>Description</label><input value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. 20% off all iPhones" style={I}/></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={L}>Discount Type *</label>
            <select value={form.discount_type} onChange={e => set('discount_type', e.target.value)} style={{ ...I, cursor:'pointer' }}>
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed amount (₦)</option>
            </select>
          </div>
          <div><label style={L}>Discount Value *</label><input type="number" min="0" step="0.01" value={form.discount_value} onChange={e => set('discount_value', e.target.value)} placeholder={form.discount_type==='percent'?'e.g. 20':'e.g. 5000'} style={I}/></div>
        </div>
        <div>
          <label style={L}>Applies To</label>
          <select value={form.applies_to} onChange={e => set('applies_to', e.target.value)} style={{ ...I, cursor:'pointer' }}>
            <option value="all">Entire order total</option>
            <option value="product">Product price only</option>
            <option value="service">Service fee only ($35)</option>
            <option value="delivery">Delivery fee only</option>
            <option value="fees">All fees (service + delivery)</option>
          </select>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div><label style={L}>Max Uses</label><input type="number" min="1" value={form.max_uses} onChange={e => set('max_uses', e.target.value)} placeholder="Unlimited" style={I}/></div>
          <div><label style={L}>Expiry Date</label><input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} style={I}/></div>
        </div>
      </div>
    </Modal>
  );
}

// ─── TAB: Coupons ─────────────────────────────────────────────────────────────
function CouponsTab({ isMobile, coupons: initialCoupons }) {
  const [localCoupons, setLocalCoupons] = useState(initialCoupons);
  const [showCreate,   setShowCreate]   = useState(false);

  useEffect(() => { setLocalCoupons(initialCoupons); }, [initialCoupons]);

  const handleCreated = (raw) => {
    setLocalCoupons(prev => [mapCoupon(raw), ...prev]);
  };

  const toggleActive = async (c) => {
    try {
      const res = await authFetch(`/api/coupons/${c.id}`, { method:'PATCH', body: JSON.stringify({ is_active: !c.active }) });
      if (res.ok) {
        const updated = mapCoupon(await res.json());
        setLocalCoupons(prev => prev.map(x => x.id===updated.id ? updated : x));
      }
    } catch(e) { console.error(e); }
  };

  const deleteCoupon = async (c) => {
    if (!window.confirm(`Delete coupon "${c.code}"? This cannot be undone.`)) return;
    try {
      const res = await authFetch(`/api/coupons/${c.id}`, { method:'DELETE' });
      if (res.ok) setLocalCoupons(prev => prev.filter(x => x.id !== c.id));
    } catch(e) { console.error(e); }
  };

  return (
    <>
      {showCreate && <CouponCreateModal onClose={() => setShowCreate(false)} onDone={handleCreated}/>}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:18, color:'var(--text)', margin:0 }}>Discount codes</h2>
          <button onClick={() => setShowCreate(true)} style={{ ...primaryBtn, display:'flex', alignItems:'center', gap:7 }}><Icon name="plus" size={16} c="white"/> New coupon</button>
        </div>
        {localCoupons.length ? (
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)', gap:14 }}>
            {localCoupons.map(c => {
              const usagePct = c.max_uses ? Math.min(100, Math.round((c.uses / c.max_uses) * 100)) : 0;
              return (
                <div key={c.id} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:16, padding:20, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-12, right:-12, width:70, height:70, borderRadius:'50%', background:c.active?'var(--accent-tint,#f7e9df)':'var(--bg-alt)', opacity:0.6 }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, position:'relative' }}>
                    <div style={{ fontFamily:'var(--font-mono,monospace)', fontWeight:700, fontSize:16, color:'var(--text)', letterSpacing:'0.04em', background:'var(--bg-alt)', border:'1px dashed var(--border)', borderRadius:8, padding:'5px 12px' }}>{c.code}</div>
                    <button onClick={() => toggleActive(c)} style={{ padding:'3px 9px', borderRadius:100, fontSize:10.5, fontWeight:700, cursor:'pointer', border:'none', background:c.active?'oklch(93% 0.06 155)':'oklch(94% 0.02 0)', color:c.active?'oklch(35% 0.15 155)':'oklch(50% 0.04 0)' }}>{c.active?'Active':'Inactive'}</button>
                  </div>
                  <div style={{ fontFamily:'var(--font-num)', fontWeight:800, fontSize:28, color:'var(--accent)', letterSpacing:'-0.02em', marginBottom:2 }}>
                    {c.type==='percent' ? `${c.value}% off` : `₦${Number(c.value).toLocaleString()} off`}
                  </div>
                  {c.description && <div style={{ fontSize:12.5, color:'var(--text-muted)', marginBottom:4 }}>{c.description}</div>}
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>Expires {c.expires}</div>
                  {c.max_uses ? (<>
                    <div style={{ marginBottom:6, display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)' }}>
                      <span>{c.uses} / {c.max_uses} used</span>
                      <span>{usagePct}%</span>
                    </div>
                    <div style={{ height:6, background:'var(--bg-alt)', borderRadius:4, overflow:'hidden', marginBottom:14 }}>
                      <div style={{ height:'100%', width:`${usagePct}%`, background:'var(--accent)', borderRadius:4 }}/>
                    </div>
                  </>) : (
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>{c.uses} uses · No limit</div>
                  )}
                  <button onClick={() => deleteCoupon(c)} style={{ ...miniBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(88% 0.08 25)' }}>Delete</button>
                </div>
              );
            })}
          </div>
        ) : <Empty label="No coupons yet"/>}
      </div>
    </>
  );
}

// ─── TAB: Analytics ───────────────────────────────────────────────────────────
function AnalyticsTab({ isMobile, analytics: analyticsData }) {
  const [tf, setTf] = useState('7days');
  const [data, setData] = useState(analyticsData);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async (timeframe) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/analytics?timeframe=${timeframe}`);
      if (res.ok) setData(await res.json());
    } catch(e){}
    setLoading(false);
  }, []);

  useEffect(() => { reload(tf); }, [tf]);

  const ov = data?.overview || {};
  const NG = { LA:'Lagos', FC:'Abuja (FCT)', RV:'Rivers', OY:'Oyo' };
  const locLabel = r => r.country==='NG' ? '🇳🇬 '+(NG[r.region]||r.region||r.location) : '🌍 '+(r.location||r.country||'Unknown');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18, opacity:loading?0.7:1, transition:'opacity 0.2s' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'8px 14px', borderRadius:10, background:'oklch(93% 0.06 155)', border:'1px solid oklch(82% 0.1 155)' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'oklch(50% 0.17 155)' }}/>
          <span style={{ fontSize:12.5, fontWeight:700, color:'oklch(35% 0.15 155)' }}>Server online</span>
        </div>
        <Segmented value={tf} onChange={v => { setTf(v); }} options={[{key:'today',label:'Today'},{key:'7days',label:'7d'},{key:'30days',label:'30d'},{key:'90days',label:'90d'}]}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:14 }}>
        <StatCard label="Page Views"      value={(ov.pageviews||0).toLocaleString()}         sub={`${(ov.unique_sessions||0).toLocaleString()} unique`}    icon={<Icon name="chart"  size={16}/>}/>
        <StatCard label="Product Views"   value={(ov.product_views||0).toLocaleString()}     accent="oklch(50% 0.18 250)"                                  icon={<Icon name="tag"    size={16}/>}/>
        <StatCard label="Add to Cart"     value={(ov.add_to_cart||0).toLocaleString()}       accent="oklch(45% 0.18 155)"                                  icon={<Icon name="box"    size={16}/>}/>
        <StatCard label="Checkout Starts" value={(ov.checkout_starts||0).toLocaleString()}   accent="oklch(48% 0.18 55)"                                   icon={<Icon name="ticket" size={16}/>}/>
        <StatCard label="Conversion"      value={ov.unique_sessions ? ((ov.checkout_starts||0)/ov.unique_sessions*100).toFixed(1)+'%':'—'} sub="sessions → checkout" accent="oklch(50% 0.16 310)" icon={<Icon name="pulse" size={16}/>}/>
        <StatCard label="Total Events"    value={ov.total_events ? ((ov.total_events/1000).toFixed(1)+'k') : '0'} sub="tracked actions" accent="var(--text-muted)" icon={<Icon name="grid" size={16}/>}/>
      </div>

      {data?.daily?.length ? (
        <Panel title="Daily page views">
          <AreaChart data={data.daily.map(x => ({ day: new Date(x.day+'T12:00').toLocaleDateString('en-NG',{month:'short',day:'numeric'}), views: x.views }))} xKey="day" yKey="views" height={200}/>
        </Panel>
      ) : null}

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:16 }}>
        <Panel title="Top pages">{data?.topPages?.length ? <BarList items={data.topPages} labelKey="page" valueKey="views"/> : <Empty label="No page data yet"/>}</Panel>
        <Panel title="Top products">{data?.topProducts?.length ? <BarList items={data.topProducts} labelKey="product_name" valueKey="views" color="oklch(52% 0.18 250)"/> : <Empty label="No product view data yet"/>}</Panel>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:16 }}>
        <Panel title="Visitor locations">{data?.locations?.length ? <BarList items={data.locations.map(l => ({ ...l, label:locLabel(l) }))} labelKey="label" valueKey="sessions" color="oklch(50% 0.16 310)"/> : <Empty label="No location data yet"/>}</Panel>
        <Panel title="Event breakdown">{data?.eventBreakdown?.length ? <DonutChart total="EVENTS" segments={data.eventBreakdown.map(e => ({ label:e.event_type, value:e.count }))}/> : <Empty label="No event data yet"/>}</Panel>
      </div>
    </div>
  );
}

// ─── TAB: Activity ────────────────────────────────────────────────────────────
function ActivityTab({ isMobile, logs, onLogsCleared }) {
  const [clearing, setClearing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const iconFor = a => a.includes('order')||a.includes('status') ? 'box' : a.includes('certificate') ? 'cert' : a.includes('product') ? 'tag' : a.includes('forex')||a.includes('rate') ? 'coins' : a.includes('message') ? 'mail' : 'pulse';

  const doClear = async () => {
    setConfirmOpen(false);
    setClearing(true);
    try {
      const res = await authFetch('/api/admin/logs', { method: 'DELETE' });
      if (res.ok) onLogsCleared();
    } catch(e) { console.error(e); }
    setClearing(false);
  };

  return (
    <>
      {confirmOpen && (
        <Modal title="Clear activity log?" onClose={() => setConfirmOpen(false)} width={380}>
          <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.6, margin:'0 0 20px' }}>
            This will permanently delete all {logs.length} log {logs.length === 1 ? 'entry' : 'entries'}. This action cannot be undone.
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={() => setConfirmOpen(false)} style={{ ...actionBtn }}>Cancel</button>
            <button onClick={doClear} style={{ ...actionBtn, background:'oklch(48% 0.2 25)', color:'white', borderColor:'transparent' }}>
              Delete all
            </button>
          </div>
        </Modal>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:18, color:'var(--text)', margin:0 }}>Activity log</h2>
          {logs.length > 0 && (
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={clearing}
              style={{ ...actionBtn, color:'oklch(48% 0.2 25)', borderColor:'oklch(85% 0.1 25)', background:'oklch(98% 0.01 25)', opacity:clearing?0.5:1 }}
            >
              {clearing ? 'Clearing…' : 'Clear log'}
            </button>
          )}
        </div>
        <Panel pad={0}>
          {logs.length ? logs.map((l,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'15px 20px', borderTop:i?'1px solid var(--border)':'none' }}>
              <div style={{ width:36, height:36, borderRadius:9, background:'var(--bg-alt)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name={iconFor(l.action.toLowerCase())} size={16} c="var(--accent)"/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text)' }}>{l.action}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{l.details}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{l.admin}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{l.ts}</div>
              </div>
            </div>
          )) : <Empty label="No activity yet"/>}
        </Panel>
      </div>
    </>
  );
}

// ─── TAB: Forex ───────────────────────────────────────────────────────────────
function ForexTab({ isMobile, liveRate, rateFetched, onRateChange, products }) {
  // `displayRate` is what we show on the card — kept in sync with the prop
  const [displayRate, setDisplayRate] = useState(liveRate || 1590);
  // override input state
  const [overrideInput, setOverrideInput] = useState(String(liveRate || 1590));
  const [overrideSaved, setOverrideSaved] = useState(false);
  // fetch state
  const [fetching,   setFetching]   = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [fetchedAt,  setFetchedAt]  = useState(rateFetched || null);
  // raw market rate (= display rate − 100 markup) — only set after an explicit fetch
  const [marketRate, setMarketRate] = useState(null);
  // whether the current rate is an override (vs. auto-fetched)
  const [isOverride, setIsOverride] = useState(false);

  // Keep display rate in sync with prop (e.g. auto-refresh in App.jsx)
  useEffect(() => {
    if (liveRate) {
      setDisplayRate(liveRate);
      if (!isOverride) setOverrideInput(String(liveRate));
    }
  }, [liveRate]);

  useEffect(() => { if (rateFetched) setFetchedAt(rateFetched); }, [rateFetched]);

  const fetchLive = async () => {
    setFetching(true);
    setFetchError('');
    try {
      const res = await fetch('/api/forex');
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      const withMarkup = Number(data.rate);          // already includes +₦100
      const raw        = withMarkup - 100;            // pure market rate
      setMarketRate(raw);
      setDisplayRate(withMarkup);
      setOverrideInput(String(withMarkup));
      setIsOverride(false);
      setFetchedAt(new Date());
      if (onRateChange) onRateChange(withMarkup);
    } catch(e) {
      setFetchError(e.message || 'Failed to fetch rate');
    }
    setFetching(false);
  };

  const applyOverride = () => {
    const n = Number(overrideInput);
    if (!n || n < 100) return;
    setDisplayRate(n);
    setIsOverride(true);
    setMarketRate(null);
    setOverrideSaved(true);
    setTimeout(() => setOverrideSaved(false), 2000);
    if (onRateChange) onRateChange(n);
  };

  const fmtTs = (ts) => {
    if (!ts) return null;
    const d = ts instanceof Date ? ts : new Date(ts);
    return d.toLocaleTimeString('en-NG', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:16, alignItems:'start', maxWidth:900 }}>
      {/* ── Left dark card ── */}
      <div style={{ background:'var(--ink,#1a1714)', borderRadius:18, padding:isMobile?22:32, color:'white', position:'relative', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background: isOverride ? 'var(--accent,#d97757)' : '#34d399', flexShrink:0 }}/>
            {isOverride ? 'Custom override' : 'Live buying rate'}
          </div>
          <button
            onClick={fetchLive}
            disabled={fetching}
            style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, padding:'6px 12px', color:'white', fontSize:12, fontWeight:600, cursor:fetching?'not-allowed':'pointer', opacity:fetching?0.6:1, whiteSpace:'nowrap' }}
          >
            <span style={{ display:'flex', animation: fetching ? 'spin 0.75s linear infinite' : 'none' }}>
              <Icon name="refresh" size={13} c="white"/>
            </span>
            {fetching ? 'Fetching…' : 'Fetch live'}
          </button>
        </div>

        <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
          <span style={{ fontFamily:'var(--font-num)', fontWeight:800, fontSize:isMobile?48:64, letterSpacing:'-0.04em', lineHeight:1 }}>₦{displayRate.toLocaleString()}</span>
          <span style={{ fontSize:16, color:'rgba(255,255,255,0.5)', fontFamily:'var(--font-mono,monospace)' }}>/ $1</span>
        </div>

        {/* Rate breakdown row */}
        {marketRate !== null && (
          <div style={{ display:'flex', gap:12, marginTop:14, flexWrap:'wrap' }}>
            <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:8, padding:'6px 12px', fontSize:12 }}>
              <span style={{ color:'rgba(255,255,255,0.5)' }}>Market rate  </span>
              <span style={{ fontWeight:700, color:'white' }}>₦{marketRate.toLocaleString()}</span>
            </div>
            <div style={{ background:'rgba(52,211,153,0.15)', borderRadius:8, padding:'6px 12px', fontSize:12 }}>
              <span style={{ color:'rgba(255,255,255,0.5)' }}>+ markup  </span>
              <span style={{ fontWeight:700, color:'#34d399' }}>₦100</span>
            </div>
          </div>
        )}

        <div style={{ fontSize:12, color: fetchError ? 'oklch(65% 0.2 25)' : '#34d399', marginTop:12 }}>
          {fetchError
            ? `⚠ ${fetchError}`
            : fetchedAt
              ? `Last fetched at ${fmtTs(fetchedAt)}`
              : 'Not yet fetched this session'}
        </div>

        <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.12)' }}>
          <svg width="100%" height="44" viewBox="0 0 320 48" preserveAspectRatio="none">
            <defs><linearGradient id="fxg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4"/><stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/></linearGradient></defs>
            <path d="M0,32 L40,30 L80,34 L120,26 L160,28 L200,20 L240,24 L280,14 L320,10 L320,48 L0,48 Z" fill="url(#fxg)"/>
            <path d="M0,32 L40,30 L80,34 L120,26 L160,28 L200,20 L240,24 L280,14 L320,10" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ── Right panel ── */}
      <Panel title="Override rate">
        <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, margin:'0 0 16px' }}>
          Click <strong>Fetch live</strong> to pull the current market rate (already including +₦100 markup). Or type a custom rate below and hit <strong>Override</strong> to lock it instantly across the whole catalog.
        </p>

        <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:8 }}>Custom rate (₦ per $1)</label>
        <div style={{ display:'flex', gap:10 }}>
          <input
            type="number"
            value={overrideInput}
            onChange={e => { setOverrideInput(e.target.value); setOverrideSaved(false); }}
            onKeyDown={e => { if (e.key === 'Enter') applyOverride(); }}
            style={{ ...inputS, flex:1, fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, padding:'12px 16px' }}
          />
          <button
            onClick={applyOverride}
            style={{ ...primaryBtn, padding:'12px 22px', background: overrideSaved ? 'oklch(50% 0.17 155)' : 'var(--accent)', minWidth:96 }}
          >
            {overrideSaved ? '✓ Saved' : 'Override'}
          </button>
        </div>

        {isOverride && (
          <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:7, fontSize:12, color:'var(--accent)', fontWeight:600 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', flexShrink:0 }}/>
            Custom override active — fetch live to reset
          </div>
        )}

        <div style={{ marginTop:20, background:'var(--bg-alt)', borderRadius:12, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>
            Preview at ₦{Number(overrideInput || displayRate).toLocaleString()}
          </div>
          {products.slice(0,4).map(p => (
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderTop:'1px solid var(--border)', fontSize:13, gap:8 }}>
              <span style={{ color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{p.name} {(p.subtitle||'').split('·')[0].trim()}</span>
              <span style={{ fontFamily:'var(--font-num)', fontWeight:700, color:'var(--text)', flexShrink:0 }}>{fmtN(p.usdPrice * Number(overrideInput || displayRate))}</span>
            </div>
          ))}
          {!products.length && <div style={{ fontSize:13, color:'var(--text-muted)' }}>No products to preview.</div>}
        </div>
      </Panel>
    </div>
  );
}

// ─── TAB: Revenue ─────────────────────────────────────────────────────────────
// ── Est. net helpers ─────────────────────────────────────────────────────────
// Service fee: $35 flat + $20 per extra unit (2nd item onwards)
function orderServiceFee(order) {
  const totalUnits = (order.items || []).reduce((s, it) => s + (it.qty || 1), 0) || 1;
  return 35 + Math.max(0, totalUnits - 1) * 20;
}
// Price margin: 7% of the USD selling price
function orderPriceMargin(order) { return order.usd * 0.07; }
// Forex margin: ₦100 per every $1 charged → total NGN gain
function orderForexGainNgn(order) { return order.usd * 100; }
// Combined Est. Net in USD (service fee + 7% margin)
function orderEstNetUsd(order) { return orderServiceFee(order) + orderPriceMargin(order); }
// Combined Est. Net in NGN: USD net converted at implied rate + ₦100/$ forex gain
function orderEstNetNgn(order) {
  const impliedRate = order.usd > 0 ? order.ngn / order.usd : 1590;
  return orderEstNetUsd(order) * impliedRate + orderForexGainNgn(order);
}

function RevenueTab({ isMobile, orders, revenueSeries }) {
  const [cur, setCur] = useState('ngn');
  const visible      = orders.filter(o => !o.admin_hidden);
  const totalNgn     = visible.reduce((s,o) => s+o.ngn, 0);
  const totalUsd     = visible.reduce((s,o) => s+o.usd, 0);
  const totalNetUsd  = visible.reduce((s,o) => s+orderEstNetUsd(o), 0);
  const totalNetNgn  = visible.reduce((s,o) => s+orderEstNetNgn(o), 0);

  const netDisplay = cur === 'ngn'
    ? '₦' + (totalNetNgn / 1000).toFixed(0) + 'k'
    : fmtU(totalNetUsd.toFixed(0));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <Segmented value={cur} onChange={setCur} options={[{key:'ngn',label:'₦ NGN'},{key:'usd',label:'$ USD'}]}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:14 }}>
        <StatCard label="Gross Revenue"   value={cur==='ngn'?'₦'+(totalNgn/1e6).toFixed(1)+'M':fmtU(totalUsd)} spark={revenueSeries.map(r=>r.ngn)} icon={<Icon name="coins" size={16}/>}/>
        <StatCard label="Est. Net Profit" value={netDisplay} sub="fee + 7% + forex" accent="oklch(45% 0.15 155)" icon={<Icon name="pulse" size={16}/>}/>
        <StatCard label="Avg Order Value" value={visible.length?(cur==='ngn'?'₦'+(totalNgn/visible.length/1000).toFixed(0)+'k':fmtU((totalUsd/visible.length).toFixed(0))):'—'} icon={<Icon name="box" size={16}/>}/>
        <StatCard label="Orders"          value={visible.length} sub="this period" accent="var(--accent)" icon={<Icon name="ticket" size={16}/>}/>
      </div>

      <Panel title="Revenue trend" action={<span style={{ fontFamily:'var(--font-num)', fontWeight:800, fontSize:18 }}>{cur==='ngn'?'₦'+(totalNgn/1e6).toFixed(1)+'M':fmtU(totalUsd)}</span>}>
        <AreaChart data={revenueSeries} xKey="day" yKey="ngn" color="oklch(50% 0.15 155)" height={210}/>
      </Panel>

      <Panel title="Per-order breakdown" pad={0}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:640 }}>
            <thead>
              <tr style={{ background:'var(--bg-alt)' }}>
                {['Order','Customer','Revenue','Service fee','Price margin','Forex gain','Est. Net'].map(h=><th key={h} style={thS}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const sf   = orderServiceFee(o);
                const pm   = orderPriceMargin(o);
                const fxNgn = orderForexGainNgn(o);
                const netUsd = sf + pm;
                const impliedRate = o.usd > 0 ? o.ngn / o.usd : 1590;
                const netNgn = netUsd * impliedRate + fxNgn;
                return (
                  <tr key={o.id} style={{ borderTop:'1px solid var(--border)' }}>
                    <td style={{ ...tdS, fontWeight:700, color:'var(--accent)' }}>{o.id}</td>
                    <td style={tdS}>{o.customer}</td>
                    <td style={{ ...tdS, fontFamily:'var(--font-num)', fontWeight:700 }}>{cur==='ngn'?fmtN(o.ngn):fmtU(o.usd)}</td>
                    <td style={{ ...tdS, color:'var(--text-muted)' }}>{fmtU(sf.toFixed(0))}</td>
                    <td style={{ ...tdS, color:'var(--text-muted)' }}>{fmtU(pm.toFixed(0))}</td>
                    <td style={{ ...tdS, color:'var(--text-muted)' }}>{fmtN(fxNgn)}</td>
                    <td style={{ ...tdS, color:'oklch(45% 0.15 155)', fontWeight:700 }}>
                      {cur==='ngn' ? fmtN(netNgn) : fmtU(netUsd.toFixed(0))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!orders.length && <Empty label="No revenue data yet"/>}
        </div>
      </Panel>
    </div>
  );
}

// ─── TAB: Customers ───────────────────────────────────────────────────────────
function CustAvatar({ name }) {
  return <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--accent-tint,#f7e9df)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-head)', fontWeight:700, fontSize:12, flexShrink:0 }}>{(name||'?').split(' ').map(n=>n[0]).join('').slice(0,2)}</div>;
}

function CustomersTab({ isMobile, orders }) {
  const [waCustomer, setWaCustomer] = useState(null);

  const map = new Map();
  orders.forEach(o => {
    if (!map.has(o.customer)) map.set(o.customer, { name:o.customer, phone:o.phone, orders:0, spent:0, last:o.date });
    const c = map.get(o.customer); c.orders++; c.spent+=o.ngn;
  });
  const customers = [...map.values()].sort((a,b) => b.spent-a.spent);

  return (
    <>
      {waCustomer && <WhatsAppModal phone={waCustomer.phone} name={waCustomer.name} onClose={() => setWaCustomer(null)}/>}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:14 }}>
          <StatCard label="Total Customers" value={customers.length} icon={<Icon name="users" size={16}/>}/>
          <StatCard label="Repeat Buyers"   value={customers.filter(c=>c.orders>1).length} accent="var(--accent)" sub="more than 1 order" icon={<Icon name="pulse" size={16}/>}/>
          <StatCard label="Avg Lifetime"    value={customers.length?'₦'+(customers.reduce((s,c)=>s+c.spent,0)/customers.length/1000).toFixed(0)+'k':'—'} accent="oklch(45% 0.15 155)" icon={<Icon name="coins" size={16}/>}/>
        </div>
        <Panel pad={0}>
          {isMobile ? customers.map((c,i) => (
            <div key={c.name} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderTop:i?'1px solid var(--border)':'none' }}>
              <CustAvatar name={c.name}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{c.name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{c.orders} order{c.orders>1?'s':''} · {c.last}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                <div style={{ fontFamily:'var(--font-num)', fontWeight:700, fontSize:14 }}>{fmtN(c.spent)}</div>
                <button onClick={() => setWaCustomer(c)} style={{ ...miniBtn, background:'oklch(93% 0.08 145)', borderColor:'oklch(80% 0.12 145)', color:'oklch(35% 0.15 145)' }}>💬 WhatsApp</button>
              </div>
            </div>
          )) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:560 }}>
                <thead><tr style={{ background:'var(--bg-alt)' }}>{['Customer','Phone','Orders','Total Spent','Last Order',''].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.name} style={{ borderTop:'1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg-alt)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={tdS}><div style={{ display:'flex', alignItems:'center', gap:10 }}><CustAvatar name={c.name}/><span style={{ fontWeight:600 }}>{c.name}</span></div></td>
                      <td style={{ ...tdS, color:'var(--text-muted)', fontSize:12.5, fontFamily:'var(--font-mono,monospace)' }}>{c.phone||'—'}</td>
                      <td style={tdS}>{c.orders}</td>
                      <td style={{ ...tdS, fontFamily:'var(--font-num)', fontWeight:700 }}>{fmtN(c.spent)}</td>
                      <td style={{ ...tdS, color:'var(--text-muted)' }}>{c.last}</td>
                      <td style={tdS}>
                        <button onClick={() => setWaCustomer(c)} style={{ ...miniBtn, background:'oklch(93% 0.08 145)', borderColor:'oklch(80% 0.12 145)', color:'oklch(35% 0.15 145)' }}>💬 WhatsApp</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!customers.length && <Empty label="No customers yet"/>}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV = [
  { key:'overview',     label:'Overview',     icon:'grid'   },
  { key:'orders',       label:'Orders',       icon:'box'    },
  { key:'products',     label:'Products',     icon:'tag'    },
  { key:'certificates', label:'Certificates', icon:'cert'   },
  { key:'messages',     label:'Messages',     icon:'mail'   },
  { key:'coupons',      label:'Coupons',      icon:'ticket' },
  { key:'analytics',    label:'Analytics',    icon:'chart'  },
  { key:'activity',     label:'Activity',     icon:'pulse'  },
  { key:'forex',        label:'Forex',        icon:'coins'  },
  { key:'revenue',      label:'Revenue',      icon:'coins'  },
  { key:'customers',    label:'Customers',    icon:'users'  },
];
const MOBILE_PRIMARY = ['overview','orders','products','analytics','messages'];

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pw, setPw]   = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!pw.trim()) return;
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/admin/login', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: pw }),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error||'Invalid password'); setBusy(false); return; }
      sessionStorage.setItem(TOKEN_KEY, json.token);
      sessionStorage.setItem(NAME_KEY,  json.name || 'Admin');
      onLogin();
    } catch {
      setErr('Network error — server may be offline');
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-alt)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'var(--font-body)' }}>
      <div style={{ width:'100%', maxWidth:380, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:20, padding:36, boxShadow:'0 8px 40px rgba(26,23,20,0.08)' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:28, letterSpacing:'-0.04em', color:'var(--text)', marginBottom:6 }}>Certo<span style={{ color:'var(--accent)' }}>.</span></div>
          <div style={{ fontSize:13.5, color:'var(--text-muted)' }}>Admin access only</div>
        </div>
        <form onSubmit={submit}>
          <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:8 }}>Password</label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Enter admin password" autoFocus style={{ ...inputS, width:'100%', boxSizing:'border-box', marginBottom:16, fontSize:15, padding:'13px 16px' }}/>
          {err && <div style={{ fontSize:12.5, color:'oklch(50% 0.18 25)', marginBottom:14, padding:'10px 14px', background:'oklch(97% 0.03 25)', borderRadius:9, border:'1px solid oklch(85% 0.1 25)' }}>{err}</div>}
          <button type="submit" disabled={busy} style={{ ...primaryBtn, width:'100%', padding:'13px', fontSize:15, opacity:busy?0.7:1 }}>{busy?'Signing in…':'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}

// ─── Main DashboardPage ───────────────────────────────────────────────────────
export function DashboardPage({ navigate, subPage, liveRate, rateFetched, onRateChange }) {
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [tab, setTab]           = useState(subPage || 'overview');
  const [moreOpen, setMoreOpen] = useState(false);
  const [search, setSearch]     = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Data state
  const [orders,       setOrders]       = useState([]);
  const [products,     setProducts]     = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [messages,     setMessages]     = useState([]);
  const [coupons,      setCoupons]      = useState([]);
  const [logs,         setLogs]         = useState([]);
  const [analytics,    setAnalytics]    = useState(null);
  const [revenueSeries,setRevenueSeries]= useState([]);
  const [dataLoading,  setDataLoading]  = useState(false);
  const [dataError,    setDataError]    = useState(null);
  const [refreshKey,   setRefreshKey]   = useState(0);
  const [spinning,     setSpinning]     = useState(false);

  const doRefresh = () => { setRefreshKey(k => k+1); setSpinning(true); setTimeout(() => setSpinning(false), 800); };

  // Sync tab from subPage prop
  useEffect(() => { if (subPage) setTab(subPage); }, [subPage]);

  // Responsive
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Load data after login (or on manual refresh)
  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    async function load() {
      setDataLoading(true); setDataError(null);
      try {
        const [oRes, pRes, cRes, mRes, cpRes, lRes, aRes] = await Promise.all([
          authFetch('/api/orders'),
          authFetch('/api/products?admin=true&limit=1000'),
          authFetch('/api/certificates'),
          authFetch('/api/contact'),
          authFetch('/api/coupons'),
          authFetch('/api/admin/logs'),
          authFetch('/api/analytics'),
        ]);
        const [rawOrders, rawProducts, rawCerts, rawMsgs, rawCoupons, rawLogs, analyticsData] = await Promise.all([
          oRes.json(), pRes.json(), cRes.json(), mRes.json(), cpRes.json(), lRes.json(), aRes.json(),
        ]);
        if (cancelled) return;
        setOrders(rawOrders.map(mapOrder));
        setProducts(rawProducts.map(mapProduct));
        setCertificates(rawCerts.map(mapCert));
        setMessages(rawMsgs.map(mapMessage));
        setCoupons(rawCoupons.map(mapCoupon));
        setLogs(rawLogs.map(mapLog));
        setAnalytics(analyticsData);
        setRevenueSeries(buildRevenueSeries(rawOrders));
      } catch(err) {
        if (!cancelled) setDataError(err.message);
      }
      if (!cancelled) setDataLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [loggedIn, refreshKey]);

  const handleTabChange = (key) => {
    setTab(key);
    setMoreOpen(false);
    if (navigate) navigate(key === 'overview' ? 'dashboard' : `dashboard-${key}`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(NAME_KEY);
    setLoggedIn(false);
    if (navigate) navigate('/');
  };

  const handleOrderUpdate = (updated, isNew = false) => {
    if (isNew) setOrders(prev => [updated, ...prev]);
    else       setOrders(prev => prev.map(o => o.id===updated.id ? updated : o));
  };

  const handleProductUpdate = (updated) => {
    setProducts(prev => prev.map(p => p.id===updated.id ? updated : p));
  };

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)}/>;

  const adminName  = getName();
  const unread     = messages.filter(m => !m.read).length;
  const activeOrds = orders.filter(o => !o.admin_hidden && !['Delivered','Cancelled','Payment Pending'].includes(o.status)).length;
  const counts     = { orders: activeOrds, messages: unread };
  const rate       = liveRate || 1590;

  const tabTitle = NAV.find(n => n.key===tab)?.label || 'Overview';
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  const tabContent = (
    <>
      {tab==='overview'     && <OverviewTab isMobile={isMobile} setTab={handleTabChange} orders={orders} revenueSeries={revenueSeries} messages={messages} products={products}/>}
      {tab==='orders'       && <OrdersTab isMobile={isMobile} orders={orders} onOrdersChange={handleOrderUpdate} certificates={certificates} products={products} rate={rate}/>}
      {tab==='products'     && <ProductsTab isMobile={isMobile} products={products} onProductUpdate={handleProductUpdate}/>}
      {tab==='certificates' && <CertificatesTab isMobile={isMobile} certificates={certificates}/>}
      {tab==='messages'     && <MessagesTab isMobile={isMobile} messages={messages}/>}
      {tab==='coupons'      && <CouponsTab isMobile={isMobile} coupons={coupons}/>}
      {tab==='analytics'    && <AnalyticsTab isMobile={isMobile} analytics={analytics}/>}
      {tab==='activity'     && <ActivityTab isMobile={isMobile} logs={logs} onLogsCleared={() => setLogs([])}/>}
      {tab==='forex'        && <ForexTab isMobile={isMobile} liveRate={rate} rateFetched={rateFetched} onRateChange={onRateChange} products={products}/>}
      {tab==='revenue'      && <RevenueTab isMobile={isMobile} orders={orders} revenueSeries={revenueSeries}/>}
      {tab==='customers'    && <CustomersTab isMobile={isMobile} orders={orders}/>}
    </>
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg-alt)', fontFamily:'var(--font-body)', color:'var(--text)' }}>
      {/* Sidebar */}
      {!isMobile && (
        <aside style={{ width:232, flexShrink:0, background:'var(--bg)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh' }}>
          <div style={{ padding:'22px 22px 18px', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:22, letterSpacing:'-0.04em', color:'var(--text)' }}>Certo</span>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--accent)' }}/>
            <span style={{ marginLeft:'auto', fontFamily:'var(--font-body)', fontSize:9.5, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:5, padding:'3px 7px' }}>Admin</span>
          </div>

          <nav style={{ flex:1, overflowY:'auto', padding:'6px 12px' }}>
            {NAV.map(n => {
              const active = tab===n.key;
              const badge  = counts[n.key];
              return (
                <button key={n.key} onClick={() => handleTabChange(n.key)} style={{ display:'flex', alignItems:'center', gap:11, width:'100%', padding:'9px 12px', marginBottom:2, borderRadius:9, border:'none', cursor:'pointer', textAlign:'left', background:active?'var(--accent-tint,#f7e9df)':'transparent', color:active?'var(--accent)':'var(--text-muted)', fontFamily:'var(--font-body)', fontSize:13.5, fontWeight:active?700:500, transition:'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background='var(--bg-alt)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background='transparent'; }}>
                  <Icon name={n.icon} size={18} c={active?'var(--accent)':'var(--text-muted)'}/>
                  <span style={{ flex:1 }}>{n.label}</span>
                  {badge>0 && <span style={{ background:active?'var(--accent)':'var(--text-muted)', color:'white', borderRadius:100, fontSize:10.5, fontWeight:700, padding:'1px 7px', minWidth:18, textAlign:'center' }}>{badge}</span>}
                </button>
              );
            })}
          </nav>

          <div style={{ padding:14, borderTop:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--ink,#1a1714)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-head)', fontWeight:700, fontSize:13, flexShrink:0 }}>{adminName[0]?.toUpperCase()||'A'}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{adminName}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>Admin</div>
              </div>
              <button title="Log out" onClick={handleLogout} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4, display:'flex' }}>
                <Icon name="logout" size={16}/>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main column */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>
        {/* Top bar */}
        <header style={{ position:'sticky', top:0, zIndex:20, background:'rgba(250,249,247,0.85)', backdropFilter:'blur(16px)', borderBottom:'1px solid var(--border)', padding:isMobile?'14px 18px':'16px 28px', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ flex:1, minWidth:0 }}>
            {isMobile ? (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:19, letterSpacing:'-0.04em' }}>Certo</span>
                <span style={{ width:4, height:4, borderRadius:'50%', background:'var(--accent)' }}/>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:5, padding:'2px 6px' }}>Admin</span>
              </div>
            ) : (
              <>
                <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:22, letterSpacing:'-0.025em', color:'var(--text)', textTransform:'capitalize', lineHeight:1 }}>{tabTitle}</div>
                <div style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:3 }}>{greeting}, {adminName} — here's where things stand today.</div>
              </>
            )}
          </div>

          {!isMobile && (
            <div style={{ position:'relative', width:240 }}>
              <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', display:'flex' }}><Icon name="search" size={15}/></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders, products…" style={{ width:'100%', boxSizing:'border-box', padding:'9px 12px 9px 34px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg)', fontFamily:'var(--font-body)', fontSize:13, color:'var(--text)', outline:'none' }}/>
            </div>
          )}

          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--border)', whiteSpace:'nowrap' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)' }}/>
            <span style={{ fontSize:12.5, color:'var(--text-muted)' }}>
              <strong style={{ color:'var(--text)', fontWeight:700 }}>₦{rate.toLocaleString()}</strong> / $1
            </span>
          </div>

          {!isMobile && (
            <>
              <button onClick={doRefresh} title="Refresh all data" style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:9, cursor:'pointer', color:'var(--text-muted)', display:'flex', transition:'opacity 0.2s' }}>
                <span style={{ display:'flex', animation:spinning?'spin 0.8s linear':'none' }}>
                  <Icon name="refresh" size={17}/>
                </span>
              </button>
              <button style={{ position:'relative', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:9, cursor:'pointer', color:'var(--text-muted)', display:'flex' }}>
                <Icon name="bell" size={17}/>
                {unread>0 && <span style={{ position:'absolute', top:6, right:6, width:7, height:7, borderRadius:'50%', background:'var(--accent)', boxShadow:'0 0 0 2px var(--bg)' }}/>}
              </button>
            </>
          )}
          <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
        </header>

        {/* Content */}
        <main style={{ flex:1, padding:isMobile?'18px 16px 96px':'24px 28px 40px', maxWidth:1280, width:'100%', margin:'0 auto' }}>
          {dataLoading ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:300, gap:14, color:'var(--text-muted)' }}>
              <span style={{ display:'flex', animation:'spin 0.75s linear infinite' }}>
                <Icon name="refresh" size={28} c="var(--accent)"/>
              </span>
              <span style={{ fontSize:14, letterSpacing:'0.02em' }}>Loading dashboard…</span>
            </div>
          ) : dataError ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:300, gap:12, color:'var(--text-muted)' }}>
              <div style={{ fontSize:15, fontWeight:600 }}>Failed to load data</div>
              <div style={{ fontSize:13 }}>{dataError}</div>
              <button onClick={() => setLoggedIn(l => !l || (setLoggedIn(true), true))} style={primaryBtn}>Retry</button>
            </div>
          ) : tabContent}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <>
          <nav style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:30, background:'rgba(250,249,247,0.94)', backdropFilter:'blur(16px)', borderTop:'1px solid var(--border)', display:'flex', padding:'8px 6px 10px' }}>
            {MOBILE_PRIMARY.map(key => {
              const n = NAV.find(x => x.key===key);
              const active = tab===key;
              const badge  = counts[key];
              return (
                <button key={key} onClick={() => handleTabChange(key)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'none', border:'none', cursor:'pointer', position:'relative', color:active?'var(--accent)':'var(--text-muted)', padding:'4px 0' }}>
                  <span style={{ position:'relative' }}>
                    <Icon name={n.icon} size={21} c={active?'var(--accent)':'var(--text-muted)'}/>
                    {badge>0 && <span style={{ position:'absolute', top:-4, right:-7, background:'var(--accent)', color:'white', borderRadius:100, fontSize:9, fontWeight:700, padding:'0px 4px', minWidth:14, textAlign:'center' }}>{badge}</span>}
                  </span>
                  <span style={{ fontSize:10, fontWeight:active?700:500 }}>{n.label}</span>
                </button>
              );
            })}
            <button onClick={() => setMoreOpen(v => !v)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'none', border:'none', cursor:'pointer', color:moreOpen?'var(--accent)':'var(--text-muted)', padding:'4px 0' }}>
              <Icon name="grid" size={21} c={moreOpen?'var(--accent)':'var(--text-muted)'}/>
              <span style={{ fontSize:10, fontWeight:moreOpen?700:500 }}>More</span>
            </button>
          </nav>

          {moreOpen && (
            <div onClick={() => setMoreOpen(false)} style={{ position:'fixed', inset:0, zIndex:29, background:'rgba(26,23,20,0.3)' }}>
              <div onClick={e => e.stopPropagation()} style={{ position:'absolute', bottom:78, left:12, right:12, background:'var(--bg)', borderRadius:18, border:'1px solid var(--border)', padding:12, boxShadow:'0 -8px 40px rgba(26,23,20,0.2)', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {NAV.filter(n => !MOBILE_PRIMARY.includes(n.key)).map(n => {
                  const active = tab===n.key;
                  return (
                    <button key={n.key} onClick={() => handleTabChange(n.key)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'16px 8px', borderRadius:12, border:'1px solid var(--border)', cursor:'pointer', background:active?'var(--accent-tint,#f7e9df)':'var(--bg-alt)', color:active?'var(--accent)':'var(--text)' }}>
                      <Icon name={n.icon} size={20} c={active?'var(--accent)':'var(--text-muted)'}/>
                      <span style={{ fontSize:11.5, fontWeight:active?700:500 }}>{n.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DashboardPage;
