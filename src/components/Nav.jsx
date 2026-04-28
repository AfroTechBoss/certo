
// Certo — Navigation

const CertoLogo = ({ navigate }) => (
  <button onClick={() => navigate('home')} style={{
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
    display: 'flex', alignItems: 'center', gap: 8,
  }}>
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="var(--accent)"/>
      <path d="M8 14.5L12 18.5L20 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em', color: 'var(--text)' }}>
      Certo
    </span>
  </button>
);

const NavComponent = ({ page, navigate, cartCount = 0 }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled]   = React.useState(false);
  const { isMobile } = useResponsive();
  const isDashboard = page && page.startsWith('dashboard');

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close menu on page change
  React.useEffect(() => { setMenuOpen(false); }, [page]);

  const navLinks = isDashboard ? [
    { key: 'dashboard',          label: 'Orders'    },
    { key: 'dashboard-products', label: 'Products'  },
    { key: 'dashboard-forex',    label: 'Forex'     },
    { key: 'dashboard-revenue',  label: 'Revenue'   },
    { key: 'dashboard-customers',label: 'Customers' },
  ] : [
    { key: 'shop',         label: 'Shop'         },
    { key: 'how-it-works', label: 'How It Works' },
    { key: 'about',        label: 'About'        },
    { key: 'faq',          label: 'FAQ'          },
  ];

  const navStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    background: (scrolled || menuOpen) ? 'rgba(250,249,247,0.96)' : 'transparent',
    backdropFilter: (scrolled || menuOpen) ? 'blur(16px)' : 'none',
    borderBottom: (scrolled || menuOpen) ? '1px solid var(--border)' : '1px solid transparent',
    transition: 'all 0.3s ease',
  };
  if (isDashboard) {
    navStyle.background   = 'var(--bg)';
    navStyle.borderBottom = '1px solid var(--border)';
  }

  const goTo = (key) => { navigate(key); setMenuOpen(false); };

  return (
    <nav style={navStyle}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <CertoLogo navigate={navigate} />

        {/* Desktop links */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {navLinks.map(link => (
              <button key={link.key} onClick={() => goTo(link.key)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 14px', borderRadius: 8,
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                color: page === link.key ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = page === link.key ? 'var(--accent)' : 'var(--text-muted)'}
              >{link.label}</button>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isDashboard && !isMobile && (
            <>
              <button onClick={() => goTo('track')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                color: 'var(--text-muted)', padding: '8px 4px',
              }}>Track Order</button>
              <button onClick={() => goTo('cart')} style={{
                position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
                padding: 8, borderRadius: 8, color: 'var(--text)',
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 3h1.5L6 12h9l1.5-7H6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="15.5" r="1" fill="currentColor"/>
                  <circle cx="13.5" cy="15.5" r="1" fill="currentColor"/>
                </svg>
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'var(--accent)', color: 'white',
                    borderRadius: '50%', width: 16, height: 16,
                    fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{cartCount}</span>
                )}
              </button>
              <button onClick={() => goTo('shop')} style={{
                background: 'var(--accent)', color: 'white', border: 'none',
                borderRadius: 10, cursor: 'pointer', padding: '10px 20px',
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
              }}>Shop Apple</button>
            </>
          )}

          {/* Mobile: cart icon + hamburger */}
          {!isDashboard && isMobile && (
            <>
              <button onClick={() => goTo('cart')} style={{
                position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
                padding: 8, borderRadius: 8, color: 'var(--text)',
              }}>
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                  <path d="M3 3h1.5L6 12h9l1.5-7H6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="15.5" r="1" fill="currentColor"/>
                  <circle cx="13.5" cy="15.5" r="1" fill="currentColor"/>
                </svg>
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'var(--accent)', color: 'white',
                    borderRadius: '50%', width: 16, height: 16,
                    fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{cartCount}</span>
                )}
              </button>
              <button onClick={() => setMenuOpen(m => !m)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 4px', color: 'var(--text)', display: 'flex', flexDirection: 'column',
                gap: 5, alignItems: 'center', justifyContent: 'center',
              }}>
                {menuOpen ? (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </>
          )}

          {isDashboard && !isMobile && (
            <button onClick={() => goTo('home')} style={{
              background: 'none', border: '1px solid var(--border)', cursor: 'pointer',
              borderRadius: 8, padding: '7px 14px',
              fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)',
            }}>← Back to site</button>
          )}
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {menuOpen && isMobile && (
        <div style={{
          background: 'var(--bg)', borderTop: '1px solid var(--border)',
          padding: '8px 20px 24px',
        }}>
          {navLinks.map(link => (
            <button key={link.key} onClick={() => goTo(link.key)} style={{
              display: 'flex', width: '100%', textAlign: 'left',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '14px 0', fontFamily: 'var(--font-body)', fontSize: 17,
              fontWeight: page === link.key ? 600 : 400,
              color: page === link.key ? 'var(--accent)' : 'var(--text)',
              borderBottom: '1px solid var(--border-light)',
            }}>{link.label}</button>
          ))}
          <button onClick={() => goTo('track')} style={{
            display: 'flex', width: '100%', textAlign: 'left',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '14px 0', fontFamily: 'var(--font-body)', fontSize: 17,
            color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)',
          }}>Track Order</button>
          <button onClick={() => goTo('shop')} style={{
            marginTop: 16, width: '100%', padding: '14px',
            background: 'var(--accent)', color: 'white', border: 'none',
            borderRadius: 12, fontFamily: 'var(--font-body)', fontSize: 16,
            fontWeight: 700, cursor: 'pointer',
          }}>Shop Apple Products →</button>
        </div>
      )}
    </nav>
  );
};

Object.assign(window, { CertoLogo, NavComponent });
