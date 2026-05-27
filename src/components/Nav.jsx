
// Certo — Navigation (redesigned)
//
// Visual changes from previous version
//   - Floating pill on scroll: at the top of the page the nav is transparent
//     and full-width; once you scroll past 40px it shrinks into a centered
//     pill with a subtle shadow and backdrop blur.
//   - Live forex chip sits next to the cart — Certo-specific signal that
//     reinforces the rate-locked-at-checkout promise from the homepage.
//   - Cart button uses a soft terracotta dot instead of a filled badge when
//     items are present (cleaner at small sizes).
//   - Mobile menu is a full-screen overlay with large tap targets, a hero
//     "Shop Apple" CTA at the bottom, and the forex rate pinned to the foot.
//   - Active link uses an underline accent rather than color swap, so the
//     non-active links can stay quietly muted.

import React from 'react';
import { useResponsive } from '../data.js';

// ─── Logo ──────────────────────────────────────────────────────────────────

const CertoLogo = ({ navigate, dark = false }) => (
  <button
    onClick={() => navigate('home')}
    aria-label="Certo home"
    style={{
      background: 'none', border: 'none', cursor: 'pointer',
      padding: 0, display: 'inline-flex', alignItems: 'baseline', gap: 6,
    }}
  >
    <span style={{
      fontFamily: 'var(--font-head)', fontWeight: 800,
      fontSize: 22, letterSpacing: '-0.04em',
      color: dark ? 'var(--text)' : 'var(--text)', lineHeight: 1,
    }}>
      Certo
    </span>
    <span style={{
      width: 5, height: 5, borderRadius: '50%',
      background: 'var(--accent)', display: 'inline-block',
      transform: 'translateY(-1px)',
    }} aria-hidden="true" />
  </button>
);

// ─── Live forex chip ───────────────────────────────────────────────────────

const ForexChip = ({ compact = false }) => {
  const [rate, setRate] = React.useState(() => {
    try {
      const cached = localStorage.getItem('certo_rate');
      return cached ? Number(cached) : null;
    } catch { return null; }
  });

  React.useEffect(() => {
    fetch('/api/forex')
      .then(r => r.ok ? r.json() : {})
      .then(d => { if (d.rate) setRate(d.rate); })
      .catch(() => {});
  }, []);

  if (!rate) return null;

  return (
    <div
      title="Current USD → NGN buying rate · locked at checkout"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: compact ? '5px 10px' : '6px 12px',
        borderRadius: 100,
        background: 'var(--bg-alt)',
        border: '1px solid var(--border)',
        fontFamily: 'var(--font-body)',
        fontSize: 12, fontWeight: 500, color: 'var(--text-muted)',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--accent)',
          animation: 'certoLivePulse 1.8s ease-in-out infinite',
        }}
      />
      <span>
        <strong style={{ color: 'var(--text)', fontWeight: 600 }}>
          ₦{Number(rate).toLocaleString()}
        </strong>
        <span style={{ color: 'var(--text-muted)' }}> / $1</span>
      </span>
    </div>
  );
};

// ─── Active link underline ─────────────────────────────────────────────────

const NavLink = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      position: 'relative',
      background: 'none', border: 'none', cursor: 'pointer',
      padding: '8px 4px', margin: '0 8px',
      fontFamily: 'var(--font-body)', fontSize: 14,
      fontWeight: active ? 600 : 500,
      color: active ? 'var(--text)' : 'var(--text-muted)',
      transition: 'color 0.18s',
    }}
    onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
    onMouseLeave={e => e.currentTarget.style.color = active ? 'var(--text)' : 'var(--text-muted)'}
  >
    {children}
    {active && (
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', left: 4, right: 4, bottom: 2,
          height: 2, borderRadius: 2, background: 'var(--accent)',
        }}
      />
    )}
  </button>
);

// ─── Cart keyframes (injected once) ────────────────────────────────────────

const CART_STYLES = `
@keyframes cartShake {
  0%,100% { transform: rotate(0deg) scale(1); }
  15%      { transform: rotate(-18deg) scale(1.15); }
  30%      { transform: rotate(16deg)  scale(1.15); }
  45%      { transform: rotate(-14deg) scale(1.1); }
  60%      { transform: rotate(12deg)  scale(1.1); }
  75%      { transform: rotate(-8deg)  scale(1.05); }
  90%      { transform: rotate(6deg)   scale(1.05); }
}
@keyframes cartDropIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}
.cart-shake { animation: cartShake 0.55s cubic-bezier(.36,.07,.19,.97) both; }
`;

if (typeof document !== 'undefined' && !document.getElementById('certo-cart-styles')) {
  const s = document.createElement('style');
  s.id = 'certo-cart-styles';
  s.textContent = CART_STYLES;
  document.head.appendChild(s);
}

// ─── Cart icon ─────────────────────────────────────────────────────────────

const CartButton = ({ onClick, count, size = 20, shaking = false }) => (
  <button
    onClick={onClick}
    aria-label={count > 0 ? `Cart, ${count} item${count !== 1 ? 's' : ''}` : 'Cart'}
    className={shaking ? 'cart-shake' : ''}
    style={{
      position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
      padding: 8, borderRadius: 10, color: 'var(--text)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 3h1.5L6 12h9l1.5-7H6.5"
            stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8.5" cy="15.5" r="1" fill="currentColor"/>
      <circle cx="13.5" cy="15.5" r="1" fill="currentColor"/>
    </svg>
    {count > 0 && (
      <span aria-hidden="true" style={{
        position: 'absolute', top: 4, right: 4,
        width: 16, height: 16, borderRadius: '50%',
        background: 'var(--accent)', color: 'white',
        fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 2px var(--bg)',
      }}>{count > 9 ? '9+' : count}</span>
    )}
  </button>
);

// ─── Cart dropdown ─────────────────────────────────────────────────────────

const CartDropdown = ({ item, count, totalUsd, onCheckout, onDismiss, alignRight = false }) => {
  const name     = item.product?.name     || '';
  const subtitle = item.product?.subtitle || '';
  const variant  = item.variant;
  const colorHex = variant?.colors?.find?.(c => c.id === item.variant?.id)?.hex || variant?.hex || null;
  const colorName= variant?.color || variant?.name || null;
  const storage  = variant?.storage || null;
  const imgUrl   = item.product?.imageUrl || item.product?.image_urls?.[0] || null;

  const fmtUsd = n => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 10px)',
      right: alignRight ? 0 : 'auto',
      left:  alignRight ? 'auto' : 'auto',
      width: 290,
      background: 'var(--bg, #fff)',
      border: '1px solid var(--border, #e5e2db)',
      borderRadius: 16,
      boxShadow: '0 16px 40px -8px rgba(26,23,20,0.18), 0 2px 8px -2px rgba(26,23,20,0.08)',
      zIndex: 9999,
      overflow: 'hidden',
      animation: 'cartDropIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px 10px',
        background: 'var(--bg-alt, #f5f4f1)',
        borderBottom: '1px solid var(--border, #e5e2db)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 15 }}>✓</span>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
            color: 'var(--accent, #d97757)',
          }}>Added to cart</span>
        </div>
        <button onClick={onDismiss} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '2px 4px', borderRadius: 6,
          fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1,
          color: 'var(--text-muted)', opacity: 0.6,
        }} aria-label="Dismiss">✕</button>
      </div>

      {/* Item row */}
      <div style={{ padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {imgUrl ? (
          <img src={imgUrl} alt={name}
            style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain',
                     background: 'var(--bg-alt)', border: '1px solid var(--border)', flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--bg-alt)',
                        border: '1px solid var(--border)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20 }}>🛍</div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
            color: 'var(--text)', lineHeight: 1.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{name}</div>
          {subtitle && (
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)',
              marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{subtitle}</div>
          )}
          {(colorName || storage) && (
            <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
              {colorName && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 500,
                  color: 'var(--text-muted)', background: 'var(--bg-alt)',
                  border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px',
                }}>
                  {colorHex && <span style={{ width: 7, height: 7, borderRadius: '50%', background: colorHex, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />}
                  {colorName}
                </span>
              )}
              {storage && (
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 500,
                  color: 'var(--text-muted)', background: 'var(--bg-alt)',
                  border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px',
                }}>{storage}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cart summary + CTA */}
      <div style={{
        padding: '10px 14px 14px',
        borderTop: '1px solid var(--border, #e5e2db)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 10,
        }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
            {count} item{count !== 1 ? 's' : ''} in cart
          </span>
          <span style={{
            fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15,
            color: 'var(--text)',
          }}>{fmtUsd(totalUsd)}</span>
        </div>
        <button onClick={onCheckout} style={{
          width: '100%', padding: '11px 0',
          background: 'var(--accent, #d97757)', color: 'white',
          border: 'none', borderRadius: 10, cursor: 'pointer',
          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
          letterSpacing: '0.01em',
          boxShadow: '0 4px 12px -4px rgba(217,119,87,0.45)',
          transition: 'transform 0.12s, box-shadow 0.12s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px -4px rgba(217,119,87,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px -4px rgba(217,119,87,0.45)'; }}
        >
          Proceed to checkout →
        </button>
      </div>
    </div>
  );
};

// ─── Main nav ──────────────────────────────────────────────────────────────

const NavComponent = ({ page, navigate, cartCount = 0, lastAdded = null, cart = [] }) => {
  const [menuOpen,  setMenuOpen]  = React.useState(false);
  const [scrolled,  setScrolled]  = React.useState(false);
  const [shaking,   setShaking]   = React.useState(false);
  const [showDrop,  setShowDrop]  = React.useState(false);
  const timerRef = React.useRef(null);
  const { isMobile } = useResponsive();
  const isDashboard = page && page.startsWith('dashboard');

  // Trigger shake + dropdown whenever a new item is added
  React.useEffect(() => {
    if (!lastAdded) return;
    setShaking(true);
    setShowDrop(true);
    setTimeout(() => setShaking(false), 600);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowDrop(false), 4500);
    return () => clearTimeout(timerRef.current);
  }, [lastAdded?._ts]);

  const cartTotalUsd = cart.reduce((sum, item) => {
    const base = item.variant?.price_usd ?? item.product?.usdPrice ?? 0;
    return sum + base * (item.qty || 1);
  }, 0);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on page change + lock scroll while open
  React.useEffect(() => { setMenuOpen(false); }, [page]);
  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navLinks = isDashboard ? [
    { key: 'dashboard',              label: 'Orders'       },
    { key: 'dashboard-products',     label: 'Products'     },
    { key: 'dashboard-certificates', label: 'Certificates' },
    { key: 'dashboard-forex',        label: 'Forex'        },
    { key: 'dashboard-revenue',      label: 'Revenue'      },
    { key: 'dashboard-customers',    label: 'Customers'    },
  ] : [
    { key: 'shop',         label: 'Shop'         },
    { key: 'how-it-works', label: 'How It Works' },
    { key: 'about',        label: 'About'        },
    { key: 'faq',          label: 'FAQ'          },
  ];

  const goTo = (key) => { navigate(key); setMenuOpen(false); };

  // Outer wrap controls the floating-pill behavior
  const outerStyle = {
    position: 'fixed',
    top: scrolled && !isMobile && !isDashboard ? 14 : 0,
    left: 0, right: 0, zIndex: 100,
    display: 'flex', justifyContent: 'center',
    pointerEvents: 'none', // children re-enable
    transition: 'top 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
  };

  // The actual nav surface
  const isFloating = scrolled && !isMobile && !isDashboard;
  const navStyle = {
    pointerEvents: 'auto',
    width: isFloating ? 'min(1180px, calc(100% - 28px))' : '100%',
    maxWidth: '100%',
    height: 64,
    padding: isFloating ? '0 14px 0 22px' : '0 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: isDashboard
      ? 'var(--bg)'
      : isFloating
        ? 'rgba(250,249,247,0.92)'
        : (scrolled || menuOpen)
          ? 'rgba(250,249,247,0.95)'
          : 'transparent',
    backdropFilter: (isFloating || scrolled || menuOpen) ? 'blur(18px) saturate(140%)' : 'none',
    WebkitBackdropFilter: (isFloating || scrolled || menuOpen) ? 'blur(18px) saturate(140%)' : 'none',
    borderRadius: isFloating ? 18 : 0,
    border: isDashboard
      ? '1px solid transparent'
      : isFloating
        ? '1px solid var(--border)'
        : (scrolled || menuOpen)
          ? '1px solid transparent'
          : '1px solid transparent',
    borderBottom: isDashboard
      ? '1px solid var(--border)'
      : (scrolled && !isFloating) || menuOpen
        ? '1px solid var(--border)'
        : '1px solid transparent',
    boxShadow: isFloating
      ? '0 10px 30px -10px rgba(26,23,20,0.18), 0 2px 6px rgba(26,23,20,0.04)'
      : 'none',
    transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
  };

  return (
    <>
      {/* Keyframes for the live pulse indicator */}
      <style>{`
        @keyframes certoLivePulse {
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50%      { opacity: 1;   transform: scale(1); }
        }
      `}</style>

      <div style={outerStyle}>
        <nav style={navStyle}>
          {/* Left — logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
            <CertoLogo navigate={navigate} />
          </div>

          {/* Center — links (desktop only) */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {navLinks.map(link => (
                <NavLink
                  key={link.key}
                  active={page === link.key}
                  onClick={() => goTo(link.key)}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          )}

          {/* Right — actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {!isDashboard && !isMobile && (
              <>
                <ForexChip />
                <button
                  onClick={() => goTo('track')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '8px 12px', borderRadius: 8,
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                    color: 'var(--text-muted)',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >Track</button>
                {/* Cart + dropdown */}
                <div style={{ position: 'relative' }}>
                  <CartButton onClick={() => { goTo('cart'); setShowDrop(false); }} count={cartCount} shaking={shaking} />
                  {showDrop && lastAdded && (
                    <CartDropdown
                      item={lastAdded}
                      count={cartCount}
                      totalUsd={cartTotalUsd}
                      onCheckout={() => { goTo('cart'); setShowDrop(false); }}
                      onDismiss={() => setShowDrop(false)}
                    />
                  )}
                </div>
                <button
                  onClick={() => goTo('shop')}
                  style={{
                    background: 'var(--accent)', color: 'white', border: 'none',
                    borderRadius: 10, cursor: 'pointer', padding: '10px 18px',
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                    letterSpacing: '0.01em',
                    boxShadow: '0 4px 12px -4px rgba(217,119,87,0.4)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px -4px rgba(217,119,87,0.5)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px -4px rgba(217,119,87,0.4)';
                  }}
                >Shop Apple</button>
              </>
            )}

            {/* Mobile: cart + hamburger */}
            {!isDashboard && isMobile && (
              <>
                <div style={{ position: 'relative' }}>
                  <CartButton onClick={() => { goTo('cart'); setShowDrop(false); }} count={cartCount} size={22} shaking={shaking} />
                  {showDrop && lastAdded && (
                    <CartDropdown
                      item={lastAdded}
                      count={cartCount}
                      totalUsd={cartTotalUsd}
                      onCheckout={() => { goTo('cart'); setShowDrop(false); }}
                      onDismiss={() => setShowDrop(false)}
                      alignRight
                    />
                  )}
                </div>
                <button
                  onClick={() => setMenuOpen(m => !m)}
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 8, borderRadius: 10, color: 'var(--text)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {menuOpen ? (
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <path d="M5 5l12 12M17 5L5 17"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <path d="M3 7h16M3 15h16"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              </>
            )}

            {isDashboard && !isMobile && (
              <button onClick={() => goTo('home')} style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13,
                color: 'var(--text-muted)',
              }}>← Back to site</button>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile overlay menu */}
      {menuOpen && isMobile && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, zIndex: 99,
          background: 'var(--bg)',
          display: 'flex', flexDirection: 'column',
          padding: '24px 24px 32px',
          overflowY: 'auto',
          animation: 'certoMenuSlide 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          <style>{`
            @keyframes certoMenuSlide {
              from { opacity: 0; transform: translateY(-8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--text-muted)', marginBottom: 8,
          }}>
            Browse
          </div>

          {navLinks.map(link => (
            <button
              key={link.key}
              onClick={() => goTo(link.key)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', textAlign: 'left',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '18px 0',
                fontFamily: 'var(--font-head)',
                fontSize: 24, fontWeight: page === link.key ? 700 : 600,
                letterSpacing: '-0.02em',
                color: page === link.key ? 'var(--accent)' : 'var(--text)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span>{link.label}</span>
              <span style={{
                fontSize: 18, color: page === link.key ? 'var(--accent)' : 'var(--text-muted)',
              }}>→</span>
            </button>
          ))}

          <button
            onClick={() => goTo('track')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', textAlign: 'left',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '18px 0',
              fontFamily: 'var(--font-head)',
              fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em',
              color: 'var(--text)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span>Track Order</span>
            <span style={{ fontSize: 18, color: 'var(--text-muted)' }}>→</span>
          </button>

          <button
            onClick={() => goTo('shop')}
            style={{
              marginTop: 28, width: '100%', padding: '18px',
              background: 'var(--accent)', color: 'white', border: 'none',
              borderRadius: 14, fontFamily: 'var(--font-body)',
              fontSize: 16, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 8px 20px -6px rgba(217,119,87,0.4)',
            }}
          >
            Shop Apple Products
            <span>→</span>
          </button>

          {/* Forex anchor at the foot */}
          <div style={{
            marginTop: 'auto', paddingTop: 28,
            display: 'flex', alignItems: 'center', gap: 10,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)', fontSize: 12,
          }}>
            <ForexChip compact />
            <span>locked at checkout</span>
          </div>
        </div>
      )}
    </>
  );
};

export { CertoLogo, NavComponent, ForexChip };
