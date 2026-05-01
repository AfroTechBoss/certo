
// Certo — Homepage

const fmt = (usd) => `₦${(usd * CERTO_RATE).toLocaleString()}`;

const ProductIcon = ({ type, size = 120, color = 'var(--accent)' }) => {
  const icons = {
    iphone: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <rect x="30" y="8" width="60" height="104" rx="14" fill={color} opacity="0.08"/>
        <rect x="33" y="11" width="54" height="98" rx="12" stroke={color} strokeWidth="2" fill="none"/>
        <rect x="44" y="18" width="32" height="4" rx="2" fill={color} opacity="0.3"/>
        <rect x="37" y="28" width="46" height="68" rx="4" fill={color} opacity="0.06"/>
        <circle cx="60" cy="104" r="4" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5"/>
      </svg>
    ),
    macbook: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <rect x="18" y="28" width="84" height="54" rx="6" fill={color} opacity="0.08"/>
        <rect x="21" y="31" width="78" height="48" rx="4" stroke={color} strokeWidth="2" fill="none"/>
        <rect x="26" y="36" width="68" height="38" rx="2" fill={color} opacity="0.06"/>
        <path d="M10 84h100" stroke={color} strokeWidth="2" opacity="0.4"/>
        <path d="M10 84 Q10 90 18 90H102Q110 90 110 84" stroke={color} strokeWidth="1.5" fill="none" opacity="0.4"/>
        <circle cx="60" cy="32" r="2" fill={color} opacity="0.3"/>
      </svg>
    ),
    ipad: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <rect x="24" y="10" width="72" height="100" rx="10" fill={color} opacity="0.08"/>
        <rect x="27" y="13" width="66" height="94" rx="8" stroke={color} strokeWidth="2" fill="none"/>
        <rect x="32" y="22" width="56" height="76" rx="3" fill={color} opacity="0.06"/>
        <circle cx="60" cy="108" r="3" stroke={color} strokeWidth="1.5" fill="none" opacity="0.4"/>
      </svg>
    ),
    airpods: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <rect x="30" y="20" width="60" height="80" rx="16" fill={color} opacity="0.08"/>
        <rect x="33" y="23" width="54" height="74" rx="14" stroke={color} strokeWidth="2" fill="none"/>
        <rect x="44" y="36" width="10" height="28" rx="5" fill={color} opacity="0.2"/>
        <rect x="66" y="36" width="10" height="28" rx="5" fill={color} opacity="0.2"/>
        <line x1="60" y1="56" x2="60" y2="72" stroke={color} strokeWidth="1.5" opacity="0.3"/>
      </svg>
    ),
    watch: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <rect x="35" y="30" width="50" height="60" rx="14" fill={color} opacity="0.08"/>
        <rect x="38" y="33" width="44" height="54" rx="12" stroke={color} strokeWidth="2" fill="none"/>
        <rect x="44" y="16" width="12" height="18" rx="3" fill={color} opacity="0.2"/>
        <rect x="64" y="16" width="12" height="18" rx="3" fill={color} opacity="0.2"/>
        <rect x="44" y="86" width="12" height="18" rx="3" fill={color} opacity="0.2"/>
        <rect x="64" y="86" width="12" height="18" rx="3" fill={color} opacity="0.2"/>
        <circle cx="60" cy="60" r="16" stroke={color} strokeWidth="1.5" fill="none" opacity="0.3"/>
        <line x1="60" y1="48" x2="60" y2="60" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
        <line x1="60" y1="60" x2="68" y2="64" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      </svg>
    ),
    'apple tv': (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <rect x="22" y="52" width="76" height="36" rx="9" fill={color} opacity="0.08"/>
        <rect x="25" y="55" width="70" height="30" rx="7" stroke={color} strokeWidth="2" fill="none"/>
        <circle cx="60" cy="70" r="9" stroke={color} strokeWidth="1.5" fill="none" opacity="0.3"/>
        <circle cx="60" cy="70" r="3" fill={color} opacity="0.25"/>
        <rect x="50" y="88" width="20" height="5" rx="2.5" fill={color} opacity="0.2"/>
        <rect x="42" y="93" width="36" height="3" rx="1.5" fill={color} opacity="0.1"/>
      </svg>
    ),
    homepod: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <ellipse cx="60" cy="96" rx="22" ry="6" fill={color} opacity="0.1"/>
        <rect x="40" y="22" width="40" height="72" rx="20" fill={color} opacity="0.08"/>
        <rect x="43" y="25" width="34" height="66" rx="17" stroke={color} strokeWidth="2" fill="none"/>
        <circle cx="60" cy="40" r="9" fill={color} opacity="0.12"/>
        <circle cx="60" cy="40" r="4" fill={color} opacity="0.3"/>
        <line x1="49" y1="60" x2="71" y2="60" stroke={color} strokeWidth="1.5" opacity="0.25" strokeLinecap="round"/>
        <line x1="51" y1="68" x2="69" y2="68" stroke={color} strokeWidth="1.5" opacity="0.25" strokeLinecap="round"/>
        <line x1="54" y1="76" x2="66" y2="76" stroke={color} strokeWidth="1.5" opacity="0.25" strokeLinecap="round"/>
      </svg>
    ),
    accessories: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <rect x="26" y="42" width="68" height="62" rx="10" fill={color} opacity="0.08"/>
        <rect x="29" y="45" width="62" height="56" rx="8" stroke={color} strokeWidth="2" fill="none"/>
        <path d="M44 45 Q44 28 60 28 Q76 28 76 45" stroke={color} strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round"/>
        <rect x="43" y="62" width="34" height="4" rx="2" fill={color} opacity="0.2"/>
        <rect x="47" y="72" width="26" height="4" rx="2" fill={color} opacity="0.2"/>
        <rect x="51" y="82" width="18" height="4" rx="2" fill={color} opacity="0.15"/>
      </svg>
    ),
  };
  return icons[type] || icons.iphone;
};

const TrustBadge = ({ icon, title, desc }) => (
  <div style={{ textAlign: 'center', padding: '32px 20px' }}>
    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
      {icon}
    </div>
    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>{title}</div>
    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
  </div>
);

const HomePage = ({ navigate }) => {
  const { isMobile, isTablet } = useResponsive();
  const [featured, setFeatured] = React.useState([]);
  const sp = isMobile ? '64px 20px' : '100px 24px';

  React.useEffect(() => {
    fetch('/api/products?featured=true&in_stock=true&limit=3')
      .then(r => r.json())
      .then(rows => {
        const prods = (Array.isArray(rows) ? rows : [])
          .slice(0, 3)
          .map(p => ({
            id: p.id,
            name: p.name,
            subtitle: p.subtitle || '',
            type: p.category,
            badge: p.badge || '',
            usdPrice: parseFloat(p.usd_price) || 0,
          }));
        setFeatured(prods);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: isMobile ? '100px 20px 64px' : '120px 24px 80px',
        background: 'var(--bg)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '10%', right: isMobile ? '-30%' : '-10%',
          width: isMobile ? 300 : 500, height: isMobile ? 300 : 500, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent-tint) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: 1200, margin: '0 auto', width: '100%',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 48 : 80, alignItems: 'center',
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', background: 'var(--accent-tint)', borderRadius: 100, marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'block' }}/>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.02em' }}>
                Genuine Apple Products · Delivered to Nigeria
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-head)', fontWeight: 700,
              fontSize: isMobile ? 'clamp(36px, 10vw, 52px)' : 'clamp(40px, 5vw, 64px)',
              lineHeight: 1.05, letterSpacing: '-0.03em',
              color: 'var(--text)', marginBottom: 20,
            }}>
              Apple products<br/>
              <span style={{ color: 'var(--accent)' }}>you can trust.</span><br/>
              Finally.
            </h1>

            <p style={{
              fontFamily: 'var(--font-body)', fontSize: isMobile ? 16 : 18,
              lineHeight: 1.7, color: 'var(--text-muted)', marginBottom: 32,
            }}>
              We buy directly from Apple US and deliver to your door in Nigeria. Serial verified. Honest pricing. 25-day refund guarantee.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('shop')} style={{
                background: 'var(--accent)', color: 'white', border: 'none',
                borderRadius: 12, padding: isMobile ? '14px 24px' : '16px 32px',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                fontSize: isMobile ? 15 : 16, fontWeight: 600,
                boxShadow: '0 4px 20px var(--accent-shadow)',
                flex: isMobile ? '1' : 'none',
              }}>Shop Apple Products →</button>
              <button onClick={() => navigate('how-it-works')} style={{
                background: 'transparent', color: 'var(--text)',
                border: '1.5px solid var(--border)',
                borderRadius: 12, padding: isMobile ? '14px 20px' : '16px 28px',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                fontSize: isMobile ? 15 : 16, fontWeight: 500,
                flex: isMobile ? '1' : 'none',
              }}>How It Works</button>
            </div>

            <div style={{ display: 'flex', gap: isMobile ? 16 : 24, marginTop: 28, flexWrap: 'wrap' }}>
              {['Serial Verified', '25-Day Guarantee', 'AppleCare Available'].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}>✓</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero product showcase — hidden on small mobile, shown on tablet+ */}
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {featured.map((p, i) => (
                <div key={p.id}
                  onClick={() => navigate('product', p.id)}
                  style={{
                    background: i === 0 ? 'var(--accent)' : 'var(--bg-alt)',
                    borderRadius: 20, padding: isTablet ? 16 : 24, cursor: 'pointer',
                    gridColumn: i === 0 ? 'span 2' : 'span 1',
                    display: 'flex', alignItems: 'center', gap: 16,
                    transition: 'transform 0.2s',
                    border: i !== 0 ? '1px solid var(--border)' : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <ProductIcon type={p.type.toLowerCase()} size={i === 0 ? 90 : 64} color={i === 0 ? 'white' : 'var(--accent)'} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: i === 0 ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', marginBottom: 3 }}>{p.badge}</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: i === 0 ? 19 : 15, color: i === 0 ? 'white' : 'var(--text)', lineHeight: 1.2, marginBottom: 3 }}>{p.name}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: i === 0 ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginBottom: 8 }}>{p.subtitle}</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: i === 0 ? 18 : 15, color: i === 0 ? 'white' : 'var(--accent)' }}>{fmt(p.usdPrice)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mobile: compact featured cards */}
          {isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {featured.slice(0, 2).map((p, i) => (
                <div key={p.id}
                  onClick={() => navigate('product', p.id)}
                  style={{
                    background: i === 0 ? 'var(--accent)' : 'var(--bg-alt)',
                    borderRadius: 16, padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14,
                    border: i !== 0 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <ProductIcon type={p.type.toLowerCase()} size={56} color={i === 0 ? 'white' : 'var(--accent)'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: i === 0 ? 'white' : 'var(--text)', marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: i === 0 ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginBottom: 4 }}>{p.subtitle}</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: i === 0 ? 'white' : 'var(--accent)' }}>{fmt(p.usdPrice)}</div>
                  </div>
                  <span style={{ color: i === 0 ? 'rgba(255,255,255,0.7)' : 'var(--accent)', fontSize: 18, flexShrink: 0 }}>→</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Problem */}
      <section style={{ padding: sp, background: 'var(--text)', color: 'white' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>The Problem</div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'clamp(24px, 5vw, 48px)', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 24 }}>
            The Nigerian gadget market has been lying to you.
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: isMobile ? 15 : 18, lineHeight: 1.8, color: 'rgba(255,255,255,0.65)', marginBottom: 20 }}>
            Fake serials. UK-used refurbished sold as new. Prices that quietly include a 40% margin. Warranties that don't exist. You've either been burned or you know someone who has.
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: isMobile ? 15 : 18, lineHeight: 1.8, color: 'rgba(255,255,255,0.65)' }}>
            Certo was built to fix exactly this. We buy directly from Apple US, verify every serial number, and show you the original US price alongside ours — so you can see our margin and decide for yourself.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: sp, background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14 }}>The Solution</div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'clamp(24px, 3.5vw, 44px)', letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 14 }}>Here's exactly how Certo works</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-muted)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>Four steps. No surprises. No fine print buried somewhere.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? 2 : 2,
          }}>
            {[
              { num: '01', title: 'You order',  desc: 'Browse real products with real prices. Select your AppleCare option. Pay securely in naira or dollars.' },
              { num: '02', title: 'We procure', desc: 'We buy your specific device from Apple.com US within 24 hours of your payment clearing.' },
              { num: '03', title: 'We ship',    desc: 'Your device travels from Apple US through our trusted logistics partner to Nigeria. You track every step.' },
              { num: '04', title: 'You verify', desc: "At delivery, scan the serial on Apple's website. Genuine or your money back — no arguments." },
            ].map((step, i) => (
              <div key={step.num} style={{
                padding: isMobile ? '28px 20px' : '40px 28px',
                background: i % 2 === 0 ? 'var(--bg-alt)' : 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: isMobile
                  ? (i === 0 ? '16px 0 0 0' : i === 1 ? '0 16px 0 0' : i === 2 ? '0 0 0 16px' : '0 0 16px 0')
                  : (i === 0 ? '16px 0 0 16px' : i === 3 ? '0 16px 16px 0' : 0),
              }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: isMobile ? 36 : 48, fontWeight: 700, color: 'var(--accent-tint2)', marginBottom: 12, lineHeight: 1 }}>{step.num}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: isMobile ? 16 : 20, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>{step.title}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{step.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button onClick={() => navigate('how-it-works')} style={{
              background: 'none', border: '1.5px solid var(--border)', color: 'var(--text)',
              borderRadius: 10, padding: '12px 28px', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
            }}>Read the full process →</button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: sp, background: 'var(--bg-alt)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 56 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14 }}>Social Proof</div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'clamp(24px, 3.5vw, 44px)', letterSpacing: '-0.02em', color: 'var(--text)' }}>People who took the leap</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: 16,
          }}>
            {TESTIMONIALS.map((t, i) => (
              (isMobile && i === 2) ? null :
              <div key={i} style={{ background: 'var(--bg)', borderRadius: 20, padding: isMobile ? 24 : 32, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {Array(t.stars).fill(0).map((_, j) => <span key={j} style={{ color: '#f59e0b', fontSize: 15 }}>★</span>)}
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.75, color: 'var(--text)', marginBottom: 20, fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{t.name}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{t.location}</div>
                  </div>
                  <div style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--accent-tint)', color: 'var(--accent)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)' }}>{t.product}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section style={{ padding: sp, background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 64 }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'clamp(24px, 3.5vw, 44px)', letterSpacing: '-0.02em', color: 'var(--text)' }}>Why you can trust us</h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 0, border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden',
          }}>
            {[
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, title: 'Serial Verification', desc: 'Every device ships with a serial number you can verify on apple.com/coverage before we close the transaction.' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" stroke="var(--accent)" strokeWidth="1.8"/><path d="M8 20h8M12 16v4" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/></svg>, title: 'Authorized Service', desc: 'AppleCare devices can be serviced at any Apple Authorized Service Provider in Nigeria.' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round"/></svg>, title: '25-Day Refund', desc: 'If your device arrives damaged or wrong — you get a full refund. No negotiation required.' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="var(--accent)" strokeWidth="1.8"/><path d="M12 6v6l4 2" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/></svg>, title: 'Real-time Tracking', desc: 'Every order has a live tracking page with timestamped human updates throughout the journey.' },
            ].map((b, i) => (
              <div key={i} style={{ borderRight: i < 3 && !isMobile ? '1px solid var(--border)' : 'none', borderBottom: isMobile && i < 2 ? '1px solid var(--border)' : 'none' }}>
                <TrustBadge {...b} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: sp, background: 'var(--accent)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 'clamp(28px, 8vw, 40px)' : 'clamp(32px, 4vw, 52px)', color: 'white', marginBottom: 16, letterSpacing: '-0.02em' }}>
          Ready to buy Apple the right way?
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: isMobile ? 15 : 18, color: 'rgba(255,255,255,0.75)', marginBottom: 32, lineHeight: 1.7 }}>
          No gimmicks. No fake discounts. Just genuine Apple products, verified and delivered.
        </p>
        <button onClick={() => navigate('shop')} style={{
          background: 'white', color: 'var(--accent)', border: 'none',
          borderRadius: 12, padding: isMobile ? '14px 32px' : '18px 40px',
          cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: isMobile ? 15 : 17, fontWeight: 700,
          width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? 400 : 'none',
        }}>Browse All Products →</button>
      </section>

    </div>
  );
};

Object.assign(window, { HomePage, ProductIcon, fmt });
