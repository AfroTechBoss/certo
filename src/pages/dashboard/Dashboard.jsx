// Certo — Internal Dashboard (redesigned)
// Self-contained: renders against mock data in the preview, but the structure
// mirrors the production component (same tabs, same data shapes).
//
// Layout: persistent left sidebar nav on desktop; collapses to a bottom tab
// bar + sheet on mobile. Top bar carries greeting, global search, live-rate
// chip and admin avatar. Each tab is a focused workspace.

const { useState, useEffect, useMemo } = React;
const {
  StatusPill, StatCard, Sparkline, AreaChart, DonutChart, BarList,
  Panel, Empty, Segmented, dashStatus,
} = window.CertoDashUI;
const M = window.CERTO_MOCK;

// ─── Icons (lightweight inline set) ─────────────────────────────────────────

const Icon = ({ name, size = 18, c = 'currentColor', sw = 1.6 }) => {
  const p = { fill: 'none', stroke: c, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    grid:   <><rect x="3" y="3" width="7" height="7" rx="1.5" {...p}/><rect x="14" y="3" width="7" height="7" rx="1.5" {...p}/><rect x="3" y="14" width="7" height="7" rx="1.5" {...p}/><rect x="14" y="14" width="7" height="7" rx="1.5" {...p}/></>,
    box:    <><path d="M21 8l-9-5-9 5 9 5 9-5z" {...p}/><path d="M3 8v8l9 5 9-5V8" {...p}/><path d="M12 13v8" {...p}/></>,
    tag:    <><path d="M20 13l-7 7-9-9V4h7l9 9z" {...p}/><circle cx="7.5" cy="7.5" r="1.2" fill={c} stroke="none"/></>,
    cert:   <><rect x="4" y="3" width="16" height="14" rx="2" {...p}/><path d="M8 8h8M8 12h5" {...p}/><circle cx="12" cy="19" r="2.5" {...p}/></>,
    mail:   <><rect x="3" y="5" width="18" height="14" rx="2" {...p}/><path d="M3 7l9 6 9-6" {...p}/></>,
    ticket: <><path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4V8z" {...p}/><path d="M13 6v12" {...p} strokeDasharray="2 2"/></>,
    chart:  <><path d="M3 3v18h18" {...p}/><path d="M7 14l3-3 3 2 4-5" {...p}/></>,
    pulse:  <><path d="M3 12h4l2 6 4-14 2 8h6" {...p}/></>,
    coins:  <><ellipse cx="12" cy="6" rx="8" ry="3" {...p}/><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" {...p}/><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" {...p}/></>,
    users:  <><circle cx="9" cy="8" r="3.2" {...p}/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" {...p}/><path d="M16 5.5a3.2 3.2 0 010 6M21 20c0-2.5-1.3-4.7-3.3-5.6" {...p}/></>,
    search: <><circle cx="11" cy="11" r="7" {...p}/><path d="M21 21l-4-4" {...p}/></>,
    bell:   <><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9z" {...p}/><path d="M13.7 21a2 2 0 01-3.4 0" {...p}/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" {...p}/><path d="M16 17l5-5-5-5M21 12H9" {...p}/></>,
    refresh:<><path d="M21 12a9 9 0 11-3-6.7L21 8" {...p}/><path d="M21 3v5h-5" {...p}/></>,
    flag:   <><path d="M4 21V4M4 4h13l-2 4 2 4H4" {...p}/></>,
    plus:   <><path d="M12 5v14M5 12h14" {...p}/></>,
    chevron:<><path d="M9 6l6 6-6 6" {...p}/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{paths[name]}</svg>;
};

// ─── Nav config ─────────────────────────────────────────────────────────────

const NAV = [
  { key: 'overview',     label: 'Overview',     icon: 'grid'   },
  { key: 'orders',       label: 'Orders',       icon: 'box'    },
  { key: 'products',     label: 'Products',     icon: 'tag'    },
  { key: 'certificates', label: 'Certificates', icon: 'cert'   },
  { key: 'messages',     label: 'Messages',     icon: 'mail'   },
  { key: 'coupons',      label: 'Coupons',      icon: 'ticket' },
  { key: 'analytics',    label: 'Analytics',    icon: 'chart'  },
  { key: 'activity',     label: 'Activity',     icon: 'pulse'  },
  { key: 'forex',        label: 'Forex',        icon: 'coins'  },
  { key: 'revenue',      label: 'Revenue',      icon: 'coins'  },
  { key: 'customers',    label: 'Customers',    icon: 'users'  },
];
// Mobile bottom-bar shows the 5 most-used; the rest live behind "More"
const MOBILE_PRIMARY = ['overview', 'orders', 'products', 'analytics', 'messages'];

// ─── Main ───────────────────────────────────────────────────────────────────

function DashboardApp({ forceMobile = false }) {
  const isMobile = forceMobile;
  const [tab, setTab] = useState('overview');
  const [moreOpen, setMoreOpen] = useState(false);
  const [search, setSearch] = useState('');

  const orders = M.MOCK_ORDERS;
  const unread = M.MOCK_MESSAGES.filter(m => !m.read).length;
  const activeOrders = orders.filter(o => !['Delivered', 'Cancelled', 'Payment Pending'].includes(o.status)).length;

  const counts = { orders: activeOrders, messages: unread };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', background: 'var(--bg-alt)',
      fontFamily: 'var(--font-body)', color: 'var(--text)',
    }}>
      {/* ─── Sidebar (desktop) ─── */}
      {!isMobile && (
        <aside style={{
          width: 232, flexShrink: 0, background: 'var(--bg)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh',
        }}>
          {/* Brand */}
          <div style={{ padding: '22px 22px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.04em', color: 'var(--text)' }}>Certo</span>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{
              marginLeft: 'auto', fontFamily: 'var(--font-body)', fontSize: 9.5, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)',
              background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 7px',
            }}>Admin</span>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 12px' }}>
            {NAV.map(n => {
              const active = tab === n.key;
              const badge = counts[n.key];
              return (
                <button key={n.key} onClick={() => setTab(n.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                  padding: '9px 12px', marginBottom: 2, borderRadius: 9,
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: active ? 'var(--accent-tint, #f7e9df)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: active ? 700 : 500,
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-alt)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Icon name={n.icon} size={18} c={active ? 'var(--accent)' : 'var(--text-muted)'} />
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {badge > 0 && (
                    <span style={{
                      background: active ? 'var(--accent)' : 'var(--text-muted)', color: 'white',
                      borderRadius: 100, fontSize: 10.5, fontWeight: 700, padding: '1px 7px', minWidth: 18, textAlign: 'center',
                    }}>{badge}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Admin footer */}
          <div style={{ padding: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--ink, #1a1714)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>K</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Kayode</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Founder</div>
              </div>
              <button title="Log out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
                <Icon name="logout" size={16} />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ─── Main column ─── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: 'rgba(250,249,247,0.85)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          padding: isMobile ? '14px 18px' : '16px 28px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isMobile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 19, letterSpacing: '-0.04em' }}>Certo</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)' }} />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 6px' }}>Admin</span>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.025em', color: 'var(--text)', textTransform: 'capitalize', lineHeight: 1 }}>
                  {NAV.find(n => n.key === tab)?.label}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>
                  Good morning, Kayode — here's where things stand today.
                </div>
              </>
            )}
          </div>

          {/* Search (desktop) */}
          {!isMobile && (
            <div style={{ position: 'relative', width: 240 }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}><Icon name="search" size={15} /></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders, products…" style={{
                width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 34px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--bg)', fontFamily: 'var(--font-body)',
                fontSize: 13, color: 'var(--text)', outline: 'none',
              }} />
            </div>
          )}

          {/* Rate chip */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 10,
            background: 'var(--bg)', border: '1px solid var(--border)', whiteSpace: 'nowrap',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text)', fontWeight: 700 }}>₦{M.RATE.toLocaleString()}</strong> / $1
            </span>
          </div>

          {!isMobile && (
            <button style={{ position: 'relative', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 9, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <Icon name="bell" size={17} />
              {unread > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 0 2px var(--bg)' }} />}
            </button>
          )}
        </header>

        {/* Tab body */}
        <main style={{ flex: 1, padding: isMobile ? '18px 16px 96px' : '24px 28px 40px', maxWidth: 1280, width: '100%', margin: '0 auto' }}>
          {tab === 'overview'     && <OverviewTab isMobile={isMobile} setTab={setTab} />}
          {tab === 'orders'       && <OrdersTab isMobile={isMobile} />}
          {tab === 'products'     && <ProductsTab isMobile={isMobile} />}
          {tab === 'certificates' && <CertificatesTab isMobile={isMobile} />}
          {tab === 'messages'     && <MessagesTab isMobile={isMobile} />}
          {tab === 'coupons'      && <CouponsTab isMobile={isMobile} />}
          {tab === 'analytics'    && <AnalyticsTab isMobile={isMobile} />}
          {tab === 'activity'     && <ActivityTab isMobile={isMobile} />}
          {tab === 'forex'        && <ForexTab isMobile={isMobile} />}
          {tab === 'revenue'      && <RevenueTab isMobile={isMobile} />}
          {tab === 'customers'    && <CustomersTab isMobile={isMobile} />}
        </main>
      </div>

      {/* ─── Mobile bottom nav ─── */}
      {isMobile && (
        <>
          <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
            background: 'rgba(250,249,247,0.94)', backdropFilter: 'blur(16px)',
            borderTop: '1px solid var(--border)',
            display: 'flex', padding: '8px 6px 10px',
          }}>
            {MOBILE_PRIMARY.map(key => {
              const n = NAV.find(x => x.key === key);
              const active = tab === key;
              const badge = counts[key];
              return (
                <button key={key} onClick={() => { setTab(key); setMoreOpen(false); }} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
                  color: active ? 'var(--accent)' : 'var(--text-muted)', padding: '4px 0',
                }}>
                  <span style={{ position: 'relative' }}>
                    <Icon name={n.icon} size={21} c={active ? 'var(--accent)' : 'var(--text-muted)'} />
                    {badge > 0 && <span style={{ position: 'absolute', top: -4, right: -7, background: 'var(--accent)', color: 'white', borderRadius: 100, fontSize: 9, fontWeight: 700, padding: '0px 4px', minWidth: 14, textAlign: 'center' }}>{badge}</span>}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{n.label}</span>
                </button>
              );
            })}
            <button onClick={() => setMoreOpen(v => !v)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer',
              color: moreOpen ? 'var(--accent)' : 'var(--text-muted)', padding: '4px 0',
            }}>
              <Icon name="grid" size={21} c={moreOpen ? 'var(--accent)' : 'var(--text-muted)'} />
              <span style={{ fontSize: 10, fontWeight: moreOpen ? 700 : 500 }}>More</span>
            </button>
          </nav>

          {moreOpen && (
            <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 29, background: 'rgba(26,23,20,0.3)' }}>
              <div onClick={e => e.stopPropagation()} style={{
                position: 'absolute', bottom: 78, left: 12, right: 12,
                background: 'var(--bg)', borderRadius: 18, border: '1px solid var(--border)',
                padding: 12, boxShadow: '0 -8px 40px rgba(26,23,20,0.2)',
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
              }}>
                {NAV.filter(n => !MOBILE_PRIMARY.includes(n.key)).map(n => {
                  const active = tab === n.key;
                  return (
                    <button key={n.key} onClick={() => { setTab(n.key); setMoreOpen(false); }} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px',
                      borderRadius: 12, border: '1px solid var(--border)', cursor: 'pointer',
                      background: active ? 'var(--accent-tint, #f7e9df)' : 'var(--bg-alt)',
                      color: active ? 'var(--accent)' : 'var(--text)',
                    }}>
                      <Icon name={n.icon} size={20} c={active ? 'var(--accent)' : 'var(--text-muted)'} />
                      <span style={{ fontSize: 11.5, fontWeight: active ? 700 : 500 }}>{n.label}</span>
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

window.DashboardApp = DashboardApp;
window.DashIcon = Icon;
