import React, { useState, useEffect, useCallback } from 'react';

// ─── Shared utilities ──────────────────────────────────────────────────────
// Auth / token storage (used by login + auto-logout)
import { TOKEN_KEY, NAME_KEY, getToken, getName } from './lib/auth.js';
// Style atoms (used by the login screen + nav + topbar)
import { inputS, primaryBtn, actionBtn } from './lib/styles.js';
// Row → display-friendly mappers (used inside the bootstrap effect)
import { mapOrder, mapProduct, mapCert, mapMessage, mapCoupon, mapLog, buildRevenueSeries }
  from './lib/mappers.js';
// Authenticated fetch wrapper
import { authFetch } from './lib/auth.js';
// Icon used in nav + topbar
import { Icon } from './components/Icon.jsx';

// ─── Per-tab components ────────────────────────────────────────────────────
// Each tab manages its own data fetching, modals, and state.
// DashboardPage only handles routing between tabs + the shell (nav, topbar, login).
import { OverviewTab }     from './tabs/OverviewTab.jsx';
import { OrdersTab }       from './tabs/OrdersTab.jsx';
import { ProductsTab }     from './tabs/ProductsTab.jsx';
import { CertificatesTab } from './tabs/CertificatesTab.jsx';
import { MessagesTab }     from './tabs/MessagesTab.jsx';
import { CouponsTab }      from './tabs/CouponsTab.jsx';
import { AnalyticsTab }    from './tabs/AnalyticsTab.jsx';
import { ActivityTab }     from './tabs/ActivityTab.jsx';
import { ForexTab }        from './tabs/ForexTab.jsx';
import { RevenueTab }      from './tabs/RevenueTab.jsx';
import { CustomersTab }    from './tabs/CustomersTab.jsx';
import { BlogTab }         from './tabs/BlogTab.jsx';
import { RefundsTab }      from './tabs/RefundsTab.jsx';

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
  { key:'blog',         label:'Blog',         icon:'book'   },
  { key:'refunds',      label:'Refunds',      icon:'undo'   },
];
const MOBILE_PRIMARY = ['overview','orders','products','analytics','blog'];

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
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Enter admin password" autoComplete="current-password" autoFocus style={{ ...inputS, width:'100%', boxSizing:'border-box', marginBottom:16, fontSize:15, padding:'13px 16px' }}/>
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
      {tab==='blog'         && <BlogTab isMobile={isMobile}/>}
      {tab==='refunds'      && <RefundsTab isMobile={isMobile} orders={orders}/>}
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
