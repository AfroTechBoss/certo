
// Certo — App Shell (router + global state)

const FooterComponent = ({ navigate }) => {
  const { isMobile } = useResponsive();

  const NavLink = ({ label, target, param }) => (
    <button onClick={() => navigate(target, param || null)} style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.55)',
      textAlign: 'left', lineHeight: 2.2,
      transition: 'color 0.15s',
    }}
      onMouseEnter={e => e.target.style.color = 'white'}
      onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}
    >{label}</button>
  );

  const ColHead = ({ children }) => (
    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>{children}</div>
  );

  return (
    <footer style={{ background: 'var(--text)', color: 'rgba(255,255,255,0.55)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '56px 24px 40px' : '72px 24px 48px' }}>

        {/* Top grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: isMobile ? '40px 24px' : 40, marginBottom: isMobile ? 48 : 64 }}>

          {/* Brand column — full width on mobile */}
          <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 26, color: 'white', marginBottom: 12, letterSpacing: '-0.02em' }}>Certo</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.5)', maxWidth: 280, marginBottom: 20 }}>
              Genuine Apple products sourced directly from the US, verified and delivered to your door in Nigeria.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                '✓ Every serial number verified on Apple.com',
                '✓ Full Apple US warranty intact',
                '✓ 12-month Certo coverage',
              ].map(t => (
                <span key={t} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{t}</span>
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
              <NavLink label="View Cart" target="cart" />
              <NavLink label="Get Help" target="contact" />
            </div>
            <div style={{ marginTop: 24 }}>
              <ColHead>Contact</ColHead>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 2 }}>
                <div>hello@certo.ng</div>
                <div>Lagos, Nigeria</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>© 2026 Certo Technology Ltd. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'Privacy Policy',   target: 'privacy' },
              { label: 'Terms of Service', target: 'terms'   },
              { label: 'Refund Policy',    target: 'refund'  },
            ].map(({ label, target }) => (
              <button key={label} onClick={() => navigate(target)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.65)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}
              >{label}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

// ─── Hash-based routing helpers ────────────────────────────────────────────

const parseHash = () => {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return { page: 'home', param: null };
  const [route, ...rest] = raw.split('/');
  const param = rest.length ? decodeURIComponent(rest.join('/')) : null;
  if (route === 'product')   return { page: 'product', param };
  if (route === 'shop')      return { page: 'shop',    param };
  if (route === 'dashboard') return { page: param ? `dashboard-${param}` : 'dashboard', param: null };
  const known = ['home', 'how-it-works', 'about', 'faq', 'contact', 'track', 'cart', 'checkout', 'privacy', 'terms', 'refund'];
  if (known.includes(route)) return { page: route, param: null };
  return { page: 'home', param: null };
};

const toHash = (page, param) => {
  if (page === 'home')    return '#/';
  if (page === 'product') return `#/product/${param || ''}`;
  if (page === 'shop')    return param ? `#/shop/${encodeURIComponent(param)}` : '#/shop';
  if (page.startsWith('dashboard')) {
    const sub = page.replace('dashboard-', '');
    return sub === 'dashboard' ? '#/dashboard' : `#/dashboard/${sub}`;
  }
  return `#/${page}`;
};

// ──────────────────────────────────────────────────────────────────────────

const App = () => {
  const initial = parseHash();
  const [page, setPage] = React.useState(initial.page);
  const [pageParam, setPageParam] = React.useState(initial.param);
  const [cart, setCart] = React.useState([]);

  // Load cached rate synchronously before first render — no flash of old rate
  const [liveRate, setLiveRate] = React.useState(() => {
    try {
      const cached = localStorage.getItem('certo_rate');
      if (cached) { CERTO_RATE = Number(cached); return Number(cached); }
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
      fetch('https://api.exchangerate-api.com/v4/latest/USD')
        .then(r => r.json())
        .then(data => {
          if (data.rates && data.rates.NGN) {
            const rate = Math.round(data.rates.NGN) + 100;
            CERTO_RATE = rate;
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
    const onHashChange = () => {
      const { page: p, param } = parseHash();
      setPage(p);
      setPageParam(param);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Scroll to top on every page change
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page]);

  const navigate = (target, param = null) => {
    const hash = toHash(target, param);
    // Only push a new history entry if the URL is actually changing
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      setPage(target);
      setPageParam(param);
    }
  };

  const addToCart = (item) => {
    setCart(prev => [...prev, item]);
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.length;
  const isDashboard = page.startsWith('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage navigate={navigate} />;

      case 'shop':
        return <ShopPage navigate={navigate} addToCart={addToCart} initialType={pageParam} />;

      case 'product':
        return <ProductDetailPage productId={pageParam} navigate={navigate} addToCart={addToCart} />;

      case 'how-it-works':
        return <HowItWorksPage navigate={navigate} />;

      case 'track':
        return <TrackOrderPage />;

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
        return <CheckoutFlow cart={cart} navigate={navigate} clearCart={clearCart} />;

      case 'dashboard':
      case 'dashboard-products':
      case 'dashboard-forex':
      case 'dashboard-revenue':
      case 'dashboard-customers':
      case 'dashboard-refunds': {
        const subPage = page.startsWith('dashboard-') ? page.replace('dashboard-', '') : 'orders';
        return <DashboardPage navigate={navigate} subPage={subPage} liveRate={liveRate} rateFetched={rateFetched} />;
      }

      default:
        return <HomePage navigate={navigate} />;
    }
  };

  return (
    <div>
      <NavComponent page={page} navigate={navigate} cartCount={cartCount} />
      {renderPage()}
      {!isDashboard && <FooterComponent navigate={navigate} />}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
