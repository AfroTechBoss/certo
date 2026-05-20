
// Certo — Homepage (v2)
// Sections: Hero · Certificate · Chain of Custody · Catalog · Forex · Voices · Founder · Final CTA
import React from 'react';
import { CERTO_RATE, PRODUCTS, TESTIMONIALS, useResponsive } from '../data.js';

// ─── Design tokens (match index.html CSS vars) ────────────────────────────────
const T = {
  cream:      '#f2f0ec',
  card:       '#faf9f7',
  ink:        '#1a1714',
  muted:      '#706b60',
  subtle:     '#9a9387',
  border:     '#e5e2db',
  hairline:   '#ece8e0',
  accent:     '#d97757',
  accentDark: '#b85f3d',
  accentTint: '#f7e9df',
  sage:       '#1f7a4d',
  sageTint:   '#dff1e6',
};
const HEAD  = { fontFamily: "'Syne', Georgia, serif" };
const BODY  = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO  = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

// ─── Scroll reveal hook ───────────────────────────────────────────────────────
function useReveal() {
  React.useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      }),
      { threshold: 0.1 },
    );
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt        = (usd) => `₦${(usd * CERTO_RATE).toLocaleString()}`;
const Eyebrow    = ({ children, light, style = {} }) => (
  <div style={{ ...BODY, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: light ? 'rgba(255,255,255,0.5)' : T.accent, marginBottom: 16, ...style }}>{children}</div>
);
const SectionWrap = ({ children, bg = T.card, style = {}, ...rest }) => (
  <section style={{ background: bg, ...style }} {...rest}>{children}</section>
);
const Inner = ({ children, style = {} }) => (
  <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', ...style }}>{children}</div>
);

// ─── SECTION 1 — Hero / Manifesto ────────────────────────────────────────────
function SectionHero({ navigate, isMobile }) {
  return (
    <SectionWrap bg={T.ink} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', paddingTop: 80 }}>
      {/* Subtle radial glow behind headline */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: `radial-gradient(ellipse at center, rgba(217,119,87,0.12) 0%, transparent 65%)`, pointerEvents: 'none' }} />

      <Inner style={{ padding: isMobile ? '64px 24px 80px' : '80px 48px 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 860 }}>
          <Eyebrow light style={{ color: 'rgba(255,255,255,0.4)' }}>Certo · Lagos, Nigeria</Eyebrow>

          <h1 style={{ ...HEAD, fontWeight: 800, fontSize: isMobile ? 'clamp(40px, 12vw, 64px)' : 'clamp(56px, 6vw, 96px)', lineHeight: 1.0, letterSpacing: '-0.04em', color: 'white', marginBottom: 32 }}>
            Apple,<br />
            <span style={{ color: T.accent }}>the way Apple</span><br />
            intended.
          </h1>

          <p style={{ ...BODY, fontSize: isMobile ? 17 : 20, lineHeight: 1.75, color: 'rgba(255,255,255,0.62)', marginBottom: 40, maxWidth: 560 }}>
            We buy directly from Apple US. Every serial verified. Delivered to your door in Nigeria with the original US warranty intact — no middlemen, no mystery margins.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('shop')} style={{ ...BODY, background: T.accent, color: 'white', border: 'none', borderRadius: 12, padding: isMobile ? '14px 28px' : '16px 36px', fontSize: isMobile ? 15 : 16, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em' }}>
              Shop Apple Products →
            </button>
            <button onClick={() => navigate('how-it-works')} style={{ ...BODY, background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: isMobile ? '14px 24px' : '16px 32px', fontSize: isMobile ? 15 : 16, fontWeight: 500, cursor: 'pointer' }}>
              How it works
            </button>
          </div>

          <div style={{ display: 'flex', gap: isMobile ? 20 : 32, marginTop: 36, flexWrap: 'wrap' }}>
            {['Serial verified on apple.com', 'Original US warranty', 'WhatsApp updates all the way'].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: T.sage, fontWeight: 700, fontSize: 13 }}>✓</span>
                <span style={{ ...BODY, fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating order card — decorative, desktop only */}
        {!isMobile && (
          <div style={{ position: 'absolute', right: 48, bottom: 80, width: 300 }}>
            <div style={{ background: T.card, borderRadius: 20, padding: '24px 28px', border: `1px solid ${T.border}`, boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
              <div style={{ ...BODY, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.subtle, marginBottom: 14 }}>Latest delivery</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.sageTint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✓</div>
                <div>
                  <div style={{ ...HEAD, fontWeight: 700, fontSize: 14, color: T.ink, letterSpacing: '-0.02em' }}>iPhone 16 Pro Max</div>
                  <div style={{ ...BODY, fontSize: 12, color: T.muted, marginTop: 2 }}>Desert Titanium · 256GB</div>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${T.hairline}`, paddingTop: 14 }}>
                <div style={{ ...BODY, fontSize: 11, color: T.subtle, marginBottom: 6 }}>Serial verified</div>
                <div style={{ ...MONO, fontSize: 12, color: T.ink, letterSpacing: '0.06em', fontWeight: 500 }}>DNWDC3XXXXXX</div>
              </div>
              <div style={{ marginTop: 14, padding: '8px 14px', background: T.sageTint, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: T.sage, fontSize: 14 }}>✓</span>
                <span style={{ ...BODY, fontSize: 12, color: T.sage, fontWeight: 600 }}>Genuine — warranty active</span>
              </div>
            </div>
          </div>
        )}
      </Inner>
    </SectionWrap>
  );
}

// ─── SECTION 2 — Certificate / Proof on paper ────────────────────────────────
function SectionCertificate({ navigate, isMobile }) {
  return (
    <SectionWrap bg={T.cream}>
      <Inner style={{ padding: isMobile ? '72px 24px' : '112px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 48 : 80, alignItems: 'center' }}>

          {/* Left — copy */}
          <div data-reveal>
            <Eyebrow>Proof on paper</Eyebrow>
            <h2 style={{ ...HEAD, fontWeight: 800, fontSize: isMobile ? 32 : 'clamp(32px, 3.5vw, 52px)', letterSpacing: '-0.03em', lineHeight: 1.1, color: T.ink, marginBottom: 20 }}>
              Every device ships with a verification certificate.
            </h2>
            <p style={{ ...BODY, fontSize: 16, lineHeight: 1.8, color: T.muted, marginBottom: 24 }}>
              Not a receipt. Not a sticker. A signed certificate of authenticity that records the serial number, your Apple order reference, and the full chain of custody from Apple US to your address.
            </p>
            <p style={{ ...BODY, fontSize: 16, lineHeight: 1.8, color: T.muted, marginBottom: 32 }}>
              After delivery, scan the QR code on your certificate or enter your order ID at <strong style={{ color: T.ink }}>certo.ng/verify</strong> to view and download it any time.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('verify')} style={{ ...BODY, background: T.ink, color: 'white', border: 'none', borderRadius: 10, padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                View sample certificate →
              </button>
              <button onClick={() => navigate('how-it-works')} style={{ ...BODY, background: 'transparent', color: T.muted, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                How verification works
              </button>
            </div>
          </div>

          {/* Right — certificate card */}
          <div data-reveal style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 380, background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 24px 64px rgba(26,23,20,0.10)' }}>
              {/* Perforated top edge */}
              <div style={{ height: 8, backgroundImage: `radial-gradient(circle, ${T.cream} 3px, transparent 3.5px)`, backgroundSize: '16px 8px' }} />

              <div style={{ padding: '24px 28px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div style={{ ...BODY, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.accent, marginBottom: 6 }}>Verification Certificate</div>
                    <div style={{ ...HEAD, fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', color: T.ink }}>CRT-220426-8841</div>
                  </div>
                  <div style={{ background: T.sageTint, borderRadius: 6, padding: '6px 12px', transform: 'rotate(6deg)' }}>
                    <span style={{ ...BODY, fontSize: 10, fontWeight: 800, color: T.sage, letterSpacing: '0.1em' }}>✓ DELIVERED</span>
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${T.hairline}`, paddingTop: 18, marginBottom: 18 }}>
                  {[
                    { label: 'Device', value: 'iPhone 16 Pro Max 256GB' },
                    { label: 'Serial No.', value: 'DNWDC3XXXXXX', mono: true },
                    { label: 'Apple Order Ref', value: 'W123456789', mono: true },
                    { label: 'Recipient', value: 'Adaeze Okoye, Lagos' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: `1px solid ${T.hairline}` }}>
                      <span style={{ ...BODY, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.subtle }}>{row.label}</span>
                      <span style={{ ...(row.mono ? MONO : BODY), fontSize: row.mono ? 12 : 13, fontWeight: 600, color: T.ink, textAlign: 'right' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ ...BODY, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.subtle, marginBottom: 4 }}>Signed by</div>
                    <div style={{ ...HEAD, fontStyle: 'italic', fontWeight: 700, fontSize: 20, color: T.ink, letterSpacing: '-0.02em' }}>Certo</div>
                  </div>
                  <div style={{ width: 56, height: 56, background: 'white', border: `1px solid ${T.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=56x56&data=https://certo.ng/verify/CRT-220426-8841`} alt="QR" style={{ width: 48, height: 48 }} />
                  </div>
                </div>
              </div>

              {/* Perforated bottom edge */}
              <div style={{ height: 8, backgroundImage: `radial-gradient(circle, ${T.cream} 3px, transparent 3.5px)`, backgroundSize: '16px 8px', transform: 'rotate(180deg)' }} />
            </div>
          </div>
        </div>
      </Inner>
    </SectionWrap>
  );
}

// ─── SECTION 3 — Chain of custody ────────────────────────────────────────────
function SectionChainOfCustody({ isMobile }) {
  const steps = [
    { num: '01', icon: '🛒', title: 'You place your order', sub: 'Pay in NGN or USD. Your rate is locked at checkout — no surprises.', color: T.accentTint, textColor: T.accentDark },
    { num: '02', icon: '🍎', title: 'We buy from Apple.com US', sub: 'Within 24 hours we purchase your exact model from Apple.com. You receive the Apple order number.', color: T.sageTint, textColor: T.sage },
    { num: '03', icon: '✈️', title: 'Shipped to Nigeria', sub: 'Your sealed device is shipped directly from Apple US through our logistics partner. Customs and duties are covered.', color: '#e8f0fe', textColor: '#1a56db' },
    { num: '04', icon: '📦', title: 'Delivered to your door', sub: 'You inspect the sealed box before signing. Serial number checked on apple.com. Certificate issued.', color: T.sageTint, textColor: T.sage },
  ];

  return (
    <SectionWrap bg={T.ink}>
      <Inner style={{ padding: isMobile ? '72px 24px' : '112px 48px' }}>
        <div data-reveal style={{ textAlign: 'center', marginBottom: isMobile ? 48 : 72 }}>
          <Eyebrow light>Chain of custody</Eyebrow>
          <h2 style={{ ...HEAD, fontWeight: 800, fontSize: isMobile ? 32 : 'clamp(32px, 3.5vw, 54px)', letterSpacing: '-0.03em', lineHeight: 1.1, color: 'white', marginBottom: 16 }}>
            Every step. Documented.
          </h2>
          <p style={{ ...BODY, fontSize: 17, lineHeight: 1.75, color: 'rgba(255,255,255,0.55)', maxWidth: 540, margin: '0 auto' }}>
            You're not trusting a seller's word. You're reading a timestamped log of every hand your device passed through.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: isMobile ? 12 : 16 }}>
          {steps.map((step, i) => (
            <div key={i} data-reveal style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: isMobile ? '28px 24px' : '36px 28px' }}>
              <div style={{ fontSize: 28, marginBottom: 16 }}>{step.icon}</div>
              <div style={{ ...HEAD, fontWeight: 800, fontSize: 36, color: 'rgba(255,255,255,0.1)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 12 }}>{step.num}</div>
              <div style={{ ...HEAD, fontWeight: 700, fontSize: 16, color: 'white', letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.3 }}>{step.title}</div>
              <div style={{ ...BODY, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{step.sub}</div>
            </div>
          ))}
        </div>
      </Inner>
    </SectionWrap>
  );
}

// ─── SECTION 4 — Catalog / Featured ─────────────────────────────────────────
function SectionCatalog({ navigate, isMobile }) {
  const [featured, setFeatured] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/products?featured=true&in_stock=true&limit=3')
      .then(r => r.json())
      .then(rows => setFeatured(Array.isArray(rows) ? rows.slice(0, 3) : []))
      .catch(() => {});
  }, []);

  return (
    <SectionWrap bg={T.cream}>
      <Inner style={{ padding: isMobile ? '72px 24px' : '112px 48px' }}>
        <div data-reveal style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: 20, flexDirection: isMobile ? 'column' : 'row', marginBottom: isMobile ? 36 : 56 }}>
          <div>
            <Eyebrow>Freshly stocked</Eyebrow>
            <h2 style={{ ...HEAD, fontWeight: 800, fontSize: isMobile ? 30 : 'clamp(28px, 3vw, 46px)', letterSpacing: '-0.03em', lineHeight: 1.1, color: T.ink, margin: 0 }}>
              What people are<br />buying right now.
            </h2>
          </div>
          <button onClick={() => navigate('shop')} style={{ ...BODY, background: 'transparent', color: T.muted, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            View all products →
          </button>
        </div>

        {featured.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
            {featured.map((p, i) => {
              const usd = parseFloat(p.usd_price) || 0;
              const img = p.image_urls?.[0];
              return (
                <div key={p.id} data-reveal
                  onClick={() => navigate('product', p.id)}
                  style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(26,23,20,0.10)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ height: 220, background: T.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {img
                      ? <img src={`/api/img?url=${encodeURIComponent(img.replace(/[&?]\.v=[^&]*/, ''))}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 24 }} />
                      : <span style={{ fontSize: 64 }}>📱</span>
                    }
                  </div>
                  <div style={{ padding: '20px 24px 24px' }}>
                    {p.badge && <div style={{ ...BODY, display: 'inline-block', background: T.accentTint, color: T.accentDark, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, marginBottom: 10, letterSpacing: '0.04em' }}>{p.badge}</div>}
                    <div style={{ ...HEAD, fontWeight: 700, fontSize: 17, color: T.ink, letterSpacing: '-0.02em', marginBottom: 4 }}>{p.name}</div>
                    {p.subtitle && <div style={{ ...BODY, fontSize: 13, color: T.muted, marginBottom: 14 }}>{p.subtitle}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ ...HEAD, fontWeight: 800, fontSize: 22, color: T.accent, letterSpacing: '-0.03em' }}>₦{Math.round(usd * CERTO_RATE).toLocaleString()}</div>
                        <div style={{ ...MONO, fontSize: 11, color: T.subtle, marginTop: 2 }}>${usd.toLocaleString()} USD</div>
                      </div>
                      <div style={{ ...BODY, fontSize: 12, color: T.sage, fontWeight: 600, background: T.sageTint, padding: '5px 10px', borderRadius: 7 }}>✓ Verified</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, height: 340, opacity: 0.5 }} />
            ))}
          </div>
        )}
      </Inner>
    </SectionWrap>
  );
}

// ─── SECTION 5 — Forex / The promise ─────────────────────────────────────────
function SectionForex({ isMobile }) {
  const [rate, setRate] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/forex')
      .then(r => r.json())
      .then(d => { if (d.rate) setRate(d.rate); })
      .catch(() => {});
  }, []);

  const displayRate = rate || CERTO_RATE;

  return (
    <SectionWrap bg={T.card}>
      <Inner style={{ padding: isMobile ? '72px 24px' : '112px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 48 : 80, alignItems: 'center' }}>

          {/* Left */}
          <div data-reveal>
            <Eyebrow>The forex promise</Eyebrow>
            <h2 style={{ ...HEAD, fontWeight: 800, fontSize: isMobile ? 30 : 'clamp(28px, 3vw, 46px)', letterSpacing: '-0.03em', lineHeight: 1.1, color: T.ink, marginBottom: 20 }}>
              No mystery margin.<br />
              Your rate is the real rate.
            </h2>
            <p style={{ ...BODY, fontSize: 16, lineHeight: 1.8, color: T.muted, marginBottom: 16 }}>
              We use the live interbank USD/NGN rate, plus a transparent ₦100 buffer to cover our own FX risk. That's it. We show you the Apple US price next to ours so you can verify.
            </p>
            <p style={{ ...BODY, fontSize: 16, lineHeight: 1.8, color: T.muted }}>
              Your rate is locked at the moment you pay — so even if the naira moves overnight, your invoice doesn't change.
            </p>

            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Rate locked at checkout — no creeping charges',
                'Apple US price shown alongside ours',
                'We show our margin openly',
              ].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ color: T.sage, fontWeight: 700, fontSize: 14, marginTop: 1 }}>✓</span>
                  <span style={{ ...BODY, fontSize: 14, color: T.ink, lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — live rate card */}
          <div data-reveal>
            <div style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 24, padding: isMobile ? '28px 24px' : '40px 36px' }}>
              <div style={{ ...BODY, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.subtle, marginBottom: 8 }}>Live interbank rate</div>
              <div style={{ ...HEAD, fontWeight: 800, fontSize: isMobile ? 44 : 56, letterSpacing: '-0.04em', color: T.ink, lineHeight: 1, marginBottom: 6 }}>
                ₦{displayRate.toLocaleString()}
              </div>
              <div style={{ ...BODY, fontSize: 13, color: T.muted, marginBottom: 28 }}>per US dollar · updated every 10 minutes</div>

              <div style={{ borderTop: `1px solid ${T.hairline}`, paddingTop: 24 }}>
                <div style={{ ...BODY, fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 16 }}>Example: iPhone 16 Pro · 128GB</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ ...BODY, fontSize: 13, color: T.muted }}>Apple US price</span>
                  <span style={{ ...MONO, fontSize: 13, color: T.ink, fontWeight: 600 }}>$999</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ ...BODY, fontSize: 13, color: T.muted }}>Rate (locked)</span>
                  <span style={{ ...MONO, fontSize: 13, color: T.ink, fontWeight: 600 }}>₦{displayRate.toLocaleString()} / $1</span>
                </div>
                <div style={{ borderTop: `1px solid ${T.hairline}`, paddingTop: 14, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...BODY, fontSize: 14, fontWeight: 700, color: T.ink }}>You pay</span>
                  <span style={{ ...HEAD, fontWeight: 800, fontSize: 22, color: T.accent, letterSpacing: '-0.03em' }}>₦{Math.round(999 * displayRate).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Inner>
    </SectionWrap>
  );
}

// ─── SECTION 6 — Voices / Testimonials ───────────────────────────────────────
function SectionVoices({ isMobile }) {
  return (
    <SectionWrap bg={T.cream}>
      <Inner style={{ padding: isMobile ? '72px 24px' : '112px 48px' }}>
        <div data-reveal style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
          <Eyebrow>Voices</Eyebrow>
          <h2 style={{ ...HEAD, fontWeight: 800, fontSize: isMobile ? 30 : 'clamp(28px, 3vw, 48px)', letterSpacing: '-0.03em', color: T.ink }}>
            People who took the leap.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} data-reveal style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: isMobile ? '28px 24px' : '36px 32px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 20 }}>
                {Array(t.stars).fill(0).map((_, j) => <span key={j} style={{ color: '#f59e0b', fontSize: 16 }}>★</span>)}
              </div>
              <p style={{ ...BODY, fontSize: 15, lineHeight: 1.8, color: T.ink, flex: 1, marginBottom: 24, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${T.hairline}`, paddingTop: 20 }}>
                <div>
                  <div style={{ ...BODY, fontWeight: 700, fontSize: 14, color: T.ink }}>{t.name}</div>
                  <div style={{ ...BODY, fontSize: 12, color: T.subtle, marginTop: 2 }}>{t.location}</div>
                </div>
                <div style={{ ...BODY, padding: '4px 12px', borderRadius: 8, background: T.accentTint, color: T.accentDark, fontSize: 11, fontWeight: 700 }}>{t.product}</div>
              </div>
            </div>
          ))}
        </div>
      </Inner>
    </SectionWrap>
  );
}

// ─── SECTION 7 — Founder note ─────────────────────────────────────────────────
function SectionFounder({ isMobile }) {
  return (
    <SectionWrap bg={T.card}>
      <Inner style={{ padding: isMobile ? '72px 24px' : '112px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: isMobile ? 40 : 80, alignItems: 'flex-start' }}>

          {/* Left — avatar */}
          <div data-reveal style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'flex-start', gap: 16 }}>
            <div style={{ width: 96, height: 96, borderRadius: 24, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ ...HEAD, fontWeight: 800, fontSize: 36, color: 'white', letterSpacing: '-0.04em' }}>C</span>
            </div>
            <div>
              <div style={{ ...HEAD, fontWeight: 700, fontSize: 17, color: T.ink, letterSpacing: '-0.02em' }}>Chidile Ozoemena</div>
              <div style={{ ...BODY, fontSize: 13, color: T.muted, marginTop: 4 }}>Founder, Certo</div>
            </div>
          </div>

          {/* Right — letter */}
          <div data-reveal>
            <Eyebrow>Founder note</Eyebrow>
            <blockquote style={{ margin: 0 }}>
              <p style={{ ...BODY, fontSize: isMobile ? 16 : 18, lineHeight: 1.85, color: T.ink, marginBottom: 20 }}>
                "I started Certo after watching a close friend pay ₦850,000 for an iPhone that turned out to be a refurbished UK device sold as new. The serial number didn't match. The warranty was already halfway used. She had no recourse.
              </p>
              <p style={{ ...BODY, fontSize: isMobile ? 16 : 18, lineHeight: 1.85, color: T.ink, marginBottom: 20 }}>
                That's a solvable problem. Apple sells directly from their website. Shipping exists. Verification is a 30-second check on apple.com. The only thing missing was someone willing to build the system honestly.
              </p>
              <p style={{ ...BODY, fontSize: isMobile ? 16 : 18, lineHeight: 1.85, color: T.ink }}>
                So that's what Certo is. Every device I sell, I'd be comfortable handing to my mother. That's the standard."
              </p>
            </blockquote>
            <div style={{ marginTop: 28 }}>
              <div style={{ ...HEAD, fontStyle: 'italic', fontWeight: 700, fontSize: 26, color: T.ink, letterSpacing: '-0.02em', borderBottom: `1px solid ${T.ink}`, paddingBottom: 6, display: 'inline-block' }}>Chidile</div>
            </div>
          </div>
        </div>
      </Inner>
    </SectionWrap>
  );
}

// ─── SECTION 8 — Final CTA ────────────────────────────────────────────────────
function SectionFinalCTA({ navigate, isMobile }) {
  return (
    <SectionWrap bg={T.accent}>
      <Inner style={{ padding: isMobile ? '72px 24px' : '112px 48px', textAlign: 'center' }}>
        <div data-reveal>
          <div style={{ ...BODY, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Ready?</div>
          <h2 style={{ ...HEAD, fontWeight: 800, fontSize: isMobile ? 'clamp(32px, 10vw, 52px)' : 'clamp(40px, 5vw, 72px)', letterSpacing: '-0.04em', lineHeight: 1.0, color: 'white', marginBottom: 20 }}>
            Buy Apple<br />the right way.
          </h2>
          <p style={{ ...BODY, fontSize: isMobile ? 16 : 18, color: 'rgba(255,255,255,0.72)', lineHeight: 1.75, marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
            No gimmicks. No fake discounts. Serial verified, warranty intact, delivered to your door.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('shop')} style={{ ...BODY, background: 'white', color: T.accent, border: 'none', borderRadius: 12, padding: isMobile ? '15px 32px' : '18px 44px', fontSize: isMobile ? 15 : 17, fontWeight: 800, cursor: 'pointer', letterSpacing: '-0.01em' }}>
              Browse all products →
            </button>
            <button onClick={() => navigate('how-it-works')} style={{ ...BODY, background: 'transparent', color: 'rgba(255,255,255,0.85)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 12, padding: isMobile ? '14px 28px' : '17px 36px', fontSize: isMobile ? 15 : 17, fontWeight: 500, cursor: 'pointer' }}>
              How it works
            </button>
          </div>
          <div style={{ marginTop: 32, display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Serial verified on apple.com', 'Original US warranty', '25-day refund guarantee'].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: 13 }}>✓</span>
                <span style={{ ...BODY, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </Inner>
    </SectionWrap>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
const HomePage = ({ navigate }) => {
  const { isMobile } = useResponsive();
  useReveal();

  return (
    <div>
      <SectionHero           navigate={navigate} isMobile={isMobile} />
      <SectionCertificate    navigate={navigate} isMobile={isMobile} />
      <SectionChainOfCustody navigate={navigate} isMobile={isMobile} />
      <SectionCatalog        navigate={navigate} isMobile={isMobile} />
      <SectionForex                              isMobile={isMobile} />
      <SectionVoices                             isMobile={isMobile} />
      <SectionFounder                            isMobile={isMobile} />
      <SectionFinalCTA       navigate={navigate} isMobile={isMobile} />
    </div>
  );
};

// Keep fmt and ProductIcon exports so ShopPage / other pages that import them don't break
const ProductIcon = () => null;
export { HomePage, ProductIcon, fmt };
