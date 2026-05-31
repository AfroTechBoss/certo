
// Certo — App Shell (router + global state)
import React from 'react';
import { CERTO_RATE, setCERTO_RATE, useResponsive } from './data.js';
import { NavComponent } from './components/Nav.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { ShopPage, ProductDetailPage } from './pages/ShopPage.jsx';
import { HowItWorksPage, TrackOrderPage, AboutPage, FAQPage, ContactPage, PrivacyPolicyPage, TermsOfServicePage, RefundPolicyPage } from './pages/Pages.jsx';
import { VerifyPage } from './pages/VerifyPage.jsx';
import { CheckoutFlow } from './pages/Checkout.jsx';
import { DashboardPage } from './pages/dashboard/DashboardPage.jsx';

const FooterComponent = ({ navigate }) => {
  const { isMobile } = useResponsive();

  const NavLink = ({ label, target, param }) => (
    <button onClick={() => navigate(target, param || null)} style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      fontFamily: 'var(--font-body)', fontSize: isMobile ? 12 : 14, color: 'rgba(255,255,255,0.55)',
      textAlign: 'left', lineHeight: 2.0,
      transition: 'color 0.15s',
    }}
      onMouseEnter={e => e.target.style.color = 'white'}
      onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}
    >{label}</button>
  );

  const ColHead = ({ children }) => (
    <div style={{ fontFamily: 'var(--font-body)', fontSize: isMobile ? 9 : 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: isMobile ? 10 : 14 }}>{children}</div>
  );

  return (
    <footer style={{ background: 'var(--text)', color: 'rgba(255,255,255,0.55)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '56px 24px 40px' : '72px 48px 48px' }}>

        {/* Top grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: isMobile ? '40px 24px' : 40, marginBottom: isMobile ? 48 : 64 }}>

          {/* Brand column — full width on mobile */}
          <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 22 : 26, color: 'white', marginBottom: 10, letterSpacing: '-0.02em' }}>Certo</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: isMobile ? 12 : 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', maxWidth: 280, marginBottom: 16 }}>
              Genuine Apple products sourced directly from the US, verified and delivered to your door in Nigeria.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                '✓ Every serial number verified on Apple.com',
                '✓ Full Apple US warranty intact',
                '✓ 12-month Certo coverage',
              ].map(t => (
                <span key={t} style={{ fontFamily: 'var(--font-body)', fontSize: isMobile ? 11 : 13, color: 'rgba(255,255,255,0.45)' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Shop column */}
          <div>
            <ColHead>Shop</ColHead>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <NavLink label="All Products" target="shop" />
              {['iPhone', 'MacBook', 'iPad', 'AirPods', 'Watch', 'Apple TV', 'HomePod', 'Accessories'].map(t => (
                <NavLink key={t} label={t} target="shop" param={t} />
              ))}
            </div>
          </div>

          {/* Company column */}
          <div>
            <ColHead>Company</ColHead>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <NavLink label="How It Works" target="how-it-works" />
              <NavLink label="About" target="about" />
              <NavLink label="FAQ" target="faq" />
              <NavLink label="Contact" target="contact" />
            </div>
          </div>

          {/* Support column */}
          <div>
            <ColHead>Support</ColHead>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <NavLink label="Track Your Order" target="track" />
              <NavLink label="Verify Certificate" target="verify" />
              <NavLink label="View Cart" target="cart" />
              <NavLink label="Get Help" target="contact" />
            </div>
            <div style={{ marginTop: 24 }}>
              <ColHead>Contact</ColHead>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: isMobile ? 11 : 13, color: 'rgba(255,255,255,0.45)', lineHeight: 2 }}>
                <div>hello@certo.ng</div>
                <div>Lagos, Nigeria</div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, marginBottom: 20 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, margin: 0 }}>
            Certo is not an Apple Authorized Reseller or distributor. Products are purchased directly from Apple US as retail imports. Certo is not affiliated with, endorsed by, or in any way connected to Apple Inc. Apple, iPhone, iPad, Mac, AirPods, Apple Watch, and AppleCare are trademarks of Apple Inc., registered in the US and other countries.
          </p>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: isMobile ? 11 : 13, color: 'rgba(255,255,255,0.55)' }}>© 2026 Certo Technologies. All rights reserved.</span>
          <div style={{ display: 'flex', gap: isMobile ? 14 : 20 }}>
            {[
              { label: 'Privacy Policy',   target: 'privacy' },
              { label: 'Terms of Service', target: 'terms'   },
              { label: 'Refund Policy',    target: 'refund'  },
            ].map(({ label, target }) => (
              <button key={label} onClick={() => navigate(target)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', fontSize: isMobile ? 10 : 12, color: 'rgba(255,255,255,0.55)' }}
                onMouseEnter={e => e.target.style.color = 'white'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}
              >{label}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

// ─── History API routing helpers ────────────────────────────────────────────

const parsePath = () => {
  const p = window.location.pathname;
  if (p === '/' || p === '') return { page: 'home', param: null };
  const parts = p.replace(/^\//, '').split('/');
  const route = parts[0];
  const rest  = parts.slice(1);
  const param = rest.length ? decodeURIComponent(rest.join('/')) : null;
  if (route === 'product')   return { page: 'product', param };
  if (route === 'shop')      return { page: 'shop',    param };
  if (route === 'track')     return { page: 'track',   param };
  if (route === 'verify')    return { page: 'verify',  param };
  if (route === 'dashboard') return { page: param ? `dashboard-${param}` : 'dashboard', param: null };
  const known = ['home', 'how-it-works', 'about', 'faq', 'contact', 'cart', 'checkout', 'privacy', 'terms', 'refund', 'verify'];
  if (known.includes(route)) return { page: route, param: null };
  return { page: 'home', param: null };
};

const toPath = (page, param) => {
  if (page === 'home')    return '/';
  if (page === 'product') return `/product/${param || ''}`;
  if (page === 'shop')    return param ? `/shop/${encodeURIComponent(param)}` : '/shop';
  if (page === 'track')   return param ? `/track/${encodeURIComponent(param)}` : '/track';
  if (page === 'verify')  return param ? `/verify/${encodeURIComponent(param)}` : '/verify';
  if (page.startsWith('dashboard')) {
    const sub = page.replace('dashboard-', '');
    return sub === 'dashboard' ? '/dashboard' : `/dashboard/${sub}`;
  }
  return `/${page}`;
};

// ──────────────────────────────────────────────────────────────────────────

const App = () => {
  const initial = parsePath();
  const [page, setPage] = React.useState(initial.page);
  const [pageParam, setPageParam] = React.useState(initial.param);
  const [cart, setCart] = React.useState([]);

  // Load cached rate synchronously before first render — no flash of old rate
  const [liveRate, setLiveRate] = React.useState(() => {
    try {
      const cached = localStorage.getItem('certo_rate');
      if (cached) { setCERTO_RATE(Number(cached)); return Number(cached); }
    } catch(e) {}
    return CERTO_RATE;
  });
  const [rateFetched, setRateFetched] = React.useState(() => {
    try {
      const ts = localStorage.getItem('certo_rate_ts');
      return ts ? new Date(Number(ts)) : null;
    } catch(e) { return null; }
  });

  // Fetch fresh rate on mount and every 10 minutes — cache result
  React.useEffect(() => {
    const fetchRate = () => {
      fetch('/api/forex')
        .then(r => r.json())
        .then(data => {
          if (data.rate) {
            const rate = data.rate;
            setCERTO_RATE(rate);
            setLiveRate(rate);
            const now = new Date();
            setRateFetched(now);
            try {
              localStorage.setItem('certo_rate', String(rate));
              localStorage.setItem('certo_rate_ts', String(now.getTime()));
            } catch(e) {}
          }
        })
        .catch(() => {}); // fail silently — keep cached rate
    };
    fetchRate();
    const interval = setInterval(fetchRate, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync state when browser back/forward buttons are used
  React.useEffect(() => {
    const onPopState = () => {
      const { page: p, param } = parsePath();
      setPage(p);
      setPageParam(param);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Scroll to top on every page change
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page]);

  // ── Anonymous analytics ────────────────────────────────────────────────────
  // Session ID persists for the browser tab — no cookies, no PII stored
  const sessionId = React.useMemo(() => {
    try {
      let id = sessionStorage.getItem('certo_sid');
      if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('certo_sid', id); }
      return id;
    } catch(_) { return Math.random().toString(36).slice(2); }
  }, []);

  const trackEvent = React.useCallback((eventType, extra = {}) => {
    // Don't track admin dashboard activity
    if (page && page.startsWith('dashboard')) return;
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType, session_id: sessionId, referrer: document.referrer || null, ...extra }),
    }).catch(() => {});
  }, [sessionId, page]);

  // Fire pageview on every route change
  React.useEffect(() => {
    if (!page.startsWith('dashboard')) {
      trackEvent('pageview', { page: window.location.pathname });
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps
  // ──────────────────────────────────────────────────────────────────────────

  const navigate = (target, param = null) => {
    const path = toPath(target, param);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setPage(target);
    setPageParam(param);
  };

  const [lastAdded, setLastAdded] = React.useState(null);

  const addToCart = (item) => {
    setCart(prev => {
      const key = `${item.product.id}_${item.variant?.id || 'none'}_${item.applecare?.id || 'none'}`;
      const exists = prev.find(i => `${i.product.id}_${i.variant?.id || 'none'}_${i.applecare?.id || 'none'}` === key);
      if (exists) {
        return prev.map(i =>
          `${i.product.id}_${i.variant?.id || 'none'}_${i.applecare?.id || 'none'}` === key
            ? { ...i, qty: (i.qty || 1) + 1 }
            : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
    setLastAdded({ ...item, _ts: Date.now() });
    trackEvent('add_to_cart', { product_id: item.product?.id, product_name: item.product?.name, page: window.location.pathname });
  };

  const updateCartItemQty = (productId, variantId, applecareid, delta) => {
    setCart(prev =>
      prev
        .map(i =>
          i.product.id === productId && (i.variant?.id || 'none') === variantId && (i.applecare?.id || 'none') === applecareid
            ? { ...i, qty: (i.qty || 1) + delta }
            : i
        )
        .filter(i => (i.qty || 1) > 0)
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const isDashboard = page.startsWith('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage navigate={navigate} />;

      case 'shop':
        return <ShopPage navigate={navigate} addToCart={addToCart} initialType={pageParam} />;

      case 'product':
        return <ProductDetailPage productId={pageParam} navigate={navigate} addToCart={addToCart} trackEvent={trackEvent} />;

      case 'how-it-works':
        return <HowItWorksPage navigate={navigate} />;

      case 'track':
        return <TrackOrderPage initialOrderId={pageParam} />;

      case 'verify':
        return <VerifyPage navigate={navigate} initialOrderId={pageParam} />;

      case 'about':
        return <AboutPage navigate={navigate} />;

      case 'faq':
        return <FAQPage />;

      case 'contact':
        return <ContactPage />;

      case 'privacy':
        return <PrivacyPolicyPage navigate={navigate} />;

      case 'terms':
        return <TermsOfServicePage navigate={navigate} />;

      case 'refund':
        return <RefundPolicyPage navigate={navigate} />;

      case 'cart':
      case 'checkout':
        return <CheckoutFlow cart={cart} navigate={navigate} clearCart={clearCart} updateCartItemQty={updateCartItemQty} />;

      case 'dashboard':
      case 'dashboard-overview':
      case 'dashboard-orders':
      case 'dashboard-products':
      case 'dashboard-forex':
      case 'dashboard-revenue':
      case 'dashboard-customers':
      case 'dashboard-certificates':
      case 'dashboard-messages':
      case 'dashboard-coupons':
      case 'dashboard-analytics':
      case 'dashboard-activity':
      case 'dashboard-refunds': {
        const subPage = page.startsWith('dashboard-') ? page.replace('dashboard-', '') : 'overview';
        return <DashboardPage navigate={navigate} subPage={subPage} liveRate={liveRate} rateFetched={rateFetched} />;
      }

      default:
        return <HomePage navigate={navigate} />;
    }
  };

  return (
    <div>
      <NavComponent page={page} navigate={navigate} cartCount={cartCount} lastAdded={lastAdded} cart={cart} />
      <main>{renderPage()}</main>
      {!isDashboard && <FooterComponent navigate={navigate} />}
    </div>
  );
};

export default App;
