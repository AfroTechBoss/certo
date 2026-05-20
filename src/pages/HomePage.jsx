
// Certo — Homepage (v3 · matches Homepage.html exactly)
// Sections: Hero · Certificate · Chain of Custody · Catalog · Forex · Voices · Founder · Final CTA · Footer
import React from 'react';
import { CERTO_RATE, TESTIMONIALS, useResponsive } from '../data.js';

/* ─────────────────────────────────────────────────────────────────────────────
   Design tokens — mirrors index.html :root exactly
   ───────────────────────────────────────────────────────────────────────────── */
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

const HEAD = { fontFamily: "'Syne', Georgia, serif" };
const BODY = { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" };
const MONO = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

/* ─────────────────────────────────────────────────────────────────────────────
   Scroll reveal — threshold 0.12, same as Homepage.html
   ───────────────────────────────────────────────────────────────────────────── */
function useReveal() {
  React.useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      }),
      { threshold: 0.12 },
    );
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Shared primitives
   ───────────────────────────────────────────────────────────────────────────── */
const Eyebrow = ({ children, light }) => (
  <div style={{
    ...BODY, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: light ? 'rgba(255,255,255,0.45)' : T.accent,
    marginBottom: 14,
  }}>
    {children}
  </div>
);

const Inner = ({ children, style = {} }) => (
  <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px', ...style }}>
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   01 · Hero / Manifesto
   Background: cream — headline left, receipt card right
   ───────────────────────────────────────────────────────────────────────────── */
function SectionHero({ navigate, isMobile }) {
  return (
    <section style={{
      background: T.cream,
      minHeight: '100svh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grain texture overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        backgroundSize: '160px',
        opacity: 0.5,
        zIndex: 0,
      }} />

      <Inner style={{ padding: isMobile ? '100px 24px 80px' : '120px 48px 100px', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 420px',
          gap: isMobile ? 60 : 64,
          alignItems: 'center',
        }}>

          {/* Left — Manifesto */}
          <div>
            <div style={{
              ...BODY, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: T.accent, marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 20, height: 1, background: T.accent, display: 'inline-block' }} />
              Certo · Lagos, Nigeria
            </div>

            <h1 style={{
              ...HEAD,
              fontWeight: 800,
              fontSize: isMobile ? 'clamp(44px, 13vw, 68px)' : 'clamp(60px, 5.5vw, 88px)',
              lineHeight: 1.0,
              letterSpacing: '-0.04em',
              color: T.ink,
              marginBottom: 28,
            }}>
              Apple,<br />
              the way<br />
              <em style={{ color: T.accent, fontStyle: 'italic' }}>Apple intended.</em>
            </h1>

            <p style={{
              ...BODY, fontSize: isMobile ? 17 : 19, lineHeight: 1.75,
              color: T.muted, marginBottom: 36, maxWidth: 500,
            }}>
              Every device sourced directly from Apple&nbsp;US. Serial verified
              against Apple's own database. Delivered to your door in Nigeria with
              the original warranty intact — no grey market, no mystery.
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40 }}>
              <button
                onClick={() => navigate('shop')}
                style={{
                  ...BODY, background: T.ink, color: 'white', border: 'none',
                  borderRadius: 12, padding: isMobile ? '14px 28px' : '15px 32px',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  boxShadow: '0 4px 16px rgba(26,23,20,0.18)',
                }}
              >
                Shop Apple Products →
              </button>
              <button
                onClick={() => navigate('how-it-works')}
                style={{
                  ...BODY, background: 'transparent', color: T.ink,
                  border: `1.5px solid ${T.border}`, borderRadius: 12,
                  padding: isMobile ? '13px 24px' : '14px 28px',
                  fontSize: 15, fontWeight: 500, cursor: 'pointer',
                }}
              >
                How it works
              </button>
            </div>

            <div style={{ display: 'flex', gap: isMobile ? 16 : 28, flexWrap: 'wrap' }}>
              {[
                { icon: '✓', label: 'Serial verified on apple.com', color: T.sage },
                { icon: '✓', label: 'Original US warranty',         color: T.sage },
                { icon: '✓', label: 'Delivered to your door',       color: T.sage },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ color: item.color, fontSize: 12, fontWeight: 800 }}>{item.icon}</span>
                  <span style={{ ...BODY, fontSize: 13, color: T.muted, fontWeight: 500 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Receipt card (the "hero-receipt") */}
          {!isMobile && <HeroReceipt />}
        </div>

        {/* Mobile receipt — shown below headline */}
        {isMobile && (
          <div style={{ marginTop: 8 }}>
            <HeroReceipt />
          </div>
        )}
      </Inner>

      {/* Scroll cue */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        opacity: 0.4,
      }}>
        <span style={{ ...BODY, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted }}>Scroll</span>
        <div style={{ width: 1, height: 32, background: T.muted }} />
      </div>
    </section>
  );
}

/* Receipt card — the visual hero element */
function HeroReceipt() {
  const rows = [
    { label: 'Item',         value: 'iPhone 16 Pro Max · 256GB' },
    { label: 'Colour',       value: 'Desert Titanium' },
    { label: 'Source',       value: 'Apple.com US',              accent: true },
    { label: 'Apple Order',  value: 'W1234567890',               mono: true  },
    { label: 'Serial No.',   value: 'DNWDC3XXXXXX',              mono: true  },
    { label: 'Shipped',      value: 'Direct from Apple US →  NG' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Shadow paper behind */}
      <div style={{
        position: 'absolute', inset: 0, background: T.card,
        borderRadius: 24, transform: 'rotate(3deg) translateY(6px)',
        border: `1px solid ${T.border}`,
        boxShadow: '0 12px 40px rgba(26,23,20,0.07)',
      }} />

      {/* Main receipt card */}
      <div style={{
        position: 'relative',
        background: T.card,
        borderRadius: 24,
        border: `1px solid ${T.border}`,
        boxShadow: '0 24px 64px rgba(26,23,20,0.10)',
        overflow: 'hidden',
      }}>
        {/* Perforated top */}
        <div style={{
          height: 10,
          backgroundImage: `radial-gradient(circle at center, ${T.cream} 3px, transparent 3.5px)`,
          backgroundSize: '16px 10px',
          backgroundPosition: 'center',
        }} />

        <div style={{ padding: '22px 28px 28px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
            <div>
              <div style={{ ...BODY, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.subtle, marginBottom: 4 }}>
                Order Confirmation
              </div>
              <div style={{ ...HEAD, fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em', color: T.ink }}>
                CRT-220426-8841
              </div>
              <div style={{ ...BODY, fontSize: 11, color: T.muted, marginTop: 3 }}>Apr 22, 2026</div>
            </div>
            <div style={{
              background: T.sageTint, borderRadius: 8, padding: '8px 14px',
              transform: 'rotate(4deg)',
            }}>
              <div style={{ ...BODY, fontSize: 9, fontWeight: 800, color: T.sage, letterSpacing: '0.1em' }}>✓ DELIVERED</div>
            </div>
          </div>

          {/* Row list */}
          <div style={{ borderTop: `1px solid ${T.hairline}`, paddingTop: 18, marginBottom: 18 }}>
            {rows.map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 16, padding: '7px 0',
                borderBottom: `1px solid ${T.hairline}`,
              }}>
                <span style={{ ...BODY, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.subtle, flexShrink: 0 }}>
                  {row.label}
                </span>
                <span style={{
                  ...(row.mono ? MONO : BODY),
                  fontSize: row.mono ? 11 : 12,
                  fontWeight: row.accent ? 700 : 600,
                  color: row.accent ? T.sage : T.ink,
                  textAlign: 'right',
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Serial badge */}
          <div style={{
            background: T.accentTint, borderRadius: 10,
            padding: '12px 16px', marginBottom: 20,
          }}>
            <div style={{ ...BODY, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.accentDark, marginBottom: 5 }}>
              Verified on apple.com
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ ...MONO, fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: '0.05em' }}>DNWDC3XXXXXX</div>
              <div style={{ ...BODY, fontSize: 11, fontWeight: 800, color: T.accentDark }}>✓ Genuine</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ ...BODY, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.subtle, marginBottom: 3 }}>
                Signed by
              </div>
              <div style={{ ...HEAD, fontStyle: 'italic', fontWeight: 700, fontSize: 20, color: T.ink, letterSpacing: '-0.02em' }}>
                Certo
              </div>
            </div>
            <div style={{
              width: 52, height: 52, background: 'white',
              border: `1px solid ${T.border}`, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=48x48&data=https://certo.ng/verify/CRT-220426-8841"
                alt="QR" style={{ width: 44, height: 44 }}
              />
            </div>
          </div>
        </div>

        {/* Perforated bottom */}
        <div style={{
          height: 10,
          backgroundImage: `radial-gradient(circle at center, ${T.cream} 3px, transparent 3.5px)`,
          backgroundSize: '16px 10px',
          backgroundPosition: 'center',
          transform: 'rotate(180deg)',
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   02 · Certificate / Proof on paper
   ───────────────────────────────────────────────────────────────────────────── */
function SectionCertificate({ navigate, isMobile }) {
  const certRows = [
    { label: 'Device',          value: 'iPhone 16 Pro Max 256GB'  },
    { label: 'Serial No.',      value: 'DNWDC3XXXXXX',  mono: true },
    { label: 'Apple Order Ref', value: 'W123456789',    mono: true },
    { label: 'Recipient',       value: 'Adaeze Okoye, Lagos'      },
  ];

  return (
    <section style={{ background: T.card }}>
      <Inner style={{ padding: isMobile ? '80px 24px' : '120px 48px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 56 : 80,
          alignItems: 'center',
        }}>

          {/* Left — copy */}
          <div>
            <Eyebrow>Proof on paper</Eyebrow>
            <h2 style={{
              ...HEAD, fontWeight: 800,
              fontSize: isMobile ? 34 : 'clamp(32px, 3.2vw, 52px)',
              letterSpacing: '-0.03em', lineHeight: 1.1, color: T.ink, marginBottom: 22,
            }}>
              Every device ships<br />with a verification<br />certificate.
            </h2>
            <p style={{ ...BODY, fontSize: 16, lineHeight: 1.8, color: T.muted, marginBottom: 20 }}>
              Not a receipt. Not a sticker. A signed certificate of authenticity
              that records the serial number, your Apple order reference, and the
              full chain of custody from Apple&nbsp;US to your address.
            </p>
            <p style={{ ...BODY, fontSize: 16, lineHeight: 1.8, color: T.muted, marginBottom: 32 }}>
              After delivery, scan the QR code or visit{' '}
              <strong style={{ color: T.ink }}>certo.ng/verify</strong> to
              view and download your certificate any time.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('verify')}
                style={{
                  ...BODY, background: T.ink, color: 'white', border: 'none',
                  borderRadius: 10, padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                View sample certificate →
              </button>
              <button
                onClick={() => navigate('how-it-works')}
                style={{
                  ...BODY, background: 'transparent', color: T.muted,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                }}
              >
                How verification works
              </button>
            </div>
          </div>

          {/* Right — certificate visual */}
          <div style={{ display: 'flex', justifyContent: isMobile ? 'flex-start' : 'center' }}>
            <div style={{ width: '100%', maxWidth: 380 }}>
              {/* Certificate card */}
              <div style={{
                background: T.card, borderRadius: 20,
                border: `1px solid ${T.border}`,
                boxShadow: '0 24px 64px rgba(26,23,20,0.10)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: 8,
                  backgroundImage: `radial-gradient(circle, ${T.cream} 3px, transparent 3.5px)`,
                  backgroundSize: '16px 8px',
                }} />

                <div style={{ padding: '24px 28px 28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <div style={{ ...BODY, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.accent, marginBottom: 5 }}>
                        Verification Certificate
                      </div>
                      <div style={{ ...HEAD, fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em', color: T.ink }}>
                        CRT-220426-8841
                      </div>
                    </div>
                    <div style={{ background: T.sageTint, borderRadius: 6, padding: '6px 12px', transform: 'rotate(5deg)' }}>
                      <span style={{ ...BODY, fontSize: 10, fontWeight: 800, color: T.sage, letterSpacing: '0.1em' }}>✓ DELIVERED</span>
                    </div>
                  </div>

                  <div style={{ borderTop: `1px solid ${T.hairline}`, paddingTop: 18, marginBottom: 18 }}>
                    {certRows.map(row => (
                      <div key={row.label} style={{
                        display: 'flex', justifyContent: 'space-between', gap: 12,
                        padding: '7px 0', borderBottom: `1px solid ${T.hairline}`,
                      }}>
                        <span style={{ ...BODY, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.subtle }}>
                          {row.label}
                        </span>
                        <span style={{ ...(row.mono ? MONO : BODY), fontSize: row.mono ? 11 : 12, fontWeight: 600, color: T.ink, textAlign: 'right' }}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ ...BODY, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.subtle, marginBottom: 3 }}>
                        Signed by
                      </div>
                      <div style={{ ...HEAD, fontStyle: 'italic', fontWeight: 700, fontSize: 20, color: T.ink, letterSpacing: '-0.02em' }}>
                        Certo
                      </div>
                    </div>
                    <div style={{
                      width: 52, height: 52, background: 'white',
                      border: `1px solid ${T.border}`, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=48x48&data=https://certo.ng/verify/CRT-220426-8841"
                        alt="QR" style={{ width: 44, height: 44 }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{
                  height: 8,
                  backgroundImage: `radial-gradient(circle, ${T.cream} 3px, transparent 3.5px)`,
                  backgroundSize: '16px 8px',
                  transform: 'rotate(180deg)',
                }} />
              </div>

              {/* Verification badge below */}
              <div style={{
                marginTop: 16, background: T.sageTint, borderRadius: 12,
                padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 32, height: 32, background: T.sage, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ color: 'white', fontSize: 14, fontWeight: 800 }}>✓</span>
                </div>
                <div>
                  <div style={{ ...BODY, fontWeight: 700, fontSize: 13, color: T.sage }}>Verified on apple.com</div>
                  <div style={{ ...BODY, fontSize: 11, color: T.sage, opacity: 0.8, marginTop: 1 }}>Genuine — Apple US warranty active</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Inner>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   03 · Chain of Custody
   ───────────────────────────────────────────────────────────────────────────── */
function SectionChainOfCustody({ isMobile }) {
  const steps = [
    {
      num: '01',
      title: 'You place your order',
      body: 'Pay in NGN. Your exchange rate is locked at checkout — no surprises, no creeping margins.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      ),
    },
    {
      num: '02',
      title: 'We buy from Apple US',
      body: 'Within 24 hours we place your exact order on Apple.com US. You receive the Apple order number.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 13 5 21 8 21c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Shipped to Nigeria',
      body: 'Sealed device ships from Apple US through our logistics partner. Duties and customs handled by us.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 20 4H4c-1 0-1 2 .5 3.5L8 11l-1.8 8.2a2 2 0 0 0 3 2.1L12 19l2.8 2.3a2 2 0 0 0 3-2.1Z"/>
        </svg>
      ),
    },
    {
      num: '04',
      title: 'Delivered to your door',
      body: 'Inspect the sealed box before signing. Serial checked on apple.com. Certificate issued instantly.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>
        </svg>
      ),
    },
  ];

  return (
    <section style={{ background: T.ink }}>
      <Inner style={{ padding: isMobile ? '80px 24px' : '120px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 52 : 72 }}>
          <Eyebrow light>Chain of custody</Eyebrow>
          <h2 style={{
            ...HEAD, fontWeight: 800,
            fontSize: isMobile ? 34 : 'clamp(32px, 3.5vw, 56px)',
            letterSpacing: '-0.03em', lineHeight: 1.05,
            color: 'white', marginBottom: 18,
          }}>
            Every step.<br />Documented.
          </h2>
          <p style={{
            ...BODY, fontSize: 17, lineHeight: 1.75,
            color: 'rgba(255,255,255,0.5)',
            maxWidth: 520, margin: '0 auto',
          }}>
            You're not trusting a seller's word. You're reading a timestamped log
            of every hand your device passed through.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: isMobile ? 12 : 16,
        }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 20,
              padding: isMobile ? '28px 24px' : '36px 28px',
              position: 'relative',
            }}>
              {/* Step number — large ghost */}
              <div style={{
                ...HEAD, fontWeight: 800, fontSize: 52,
                color: 'rgba(255,255,255,0.06)',
                letterSpacing: '-0.05em', lineHeight: 1,
                position: 'absolute', top: 16, right: 20,
                userSelect: 'none',
              }}>
                {step.num}
              </div>

              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: 20,
              }}>
                {step.icon}
              </div>

              <div style={{ ...HEAD, fontWeight: 700, fontSize: 16, color: 'white', letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.3 }}>
                {step.title}
              </div>
              <div style={{ ...BODY, fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.75 }}>
                {step.body}
              </div>
            </div>
          ))}
        </div>
      </Inner>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   04 · Catalog / Featured products
   ───────────────────────────────────────────────────────────────────────────── */
function SectionCatalog({ navigate, isMobile }) {
  const [featured, setFeatured] = React.useState([]);
  const [loading,  setLoading]  = React.useState(true);

  React.useEffect(() => {
    fetch('/api/products?featured=true&in_stock=true&limit=3')
      .then(r => r.ok ? r.json() : [])
      .then(rows => { setFeatured(Array.isArray(rows) ? rows.slice(0, 3) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section style={{ background: T.cream }}>
      <Inner style={{ padding: isMobile ? '80px 24px' : '120px 48px' }}>

        {/* Header row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 20, marginBottom: isMobile ? 40 : 60,
        }}>
          <div>
            <Eyebrow>Catalog · Featured</Eyebrow>
            <h2 style={{
              ...HEAD, fontWeight: 800,
              fontSize: isMobile ? 30 : 'clamp(28px, 3vw, 46px)',
              letterSpacing: '-0.03em', lineHeight: 1.1,
              color: T.ink, margin: 0,
            }}>
              What people are<br />buying right now.
            </h2>
          </div>
          <button
            onClick={() => navigate('shop')}
            style={{
              ...BODY, background: 'transparent', color: T.muted,
              border: `1.5px solid ${T.border}`, borderRadius: 10,
              padding: '12px 24px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            View all →
          </button>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 16,
        }}>
          {loading
            ? [0, 1, 2].map(i => (
                <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, height: 360, opacity: 0.4 }} />
              ))
            : featured.length > 0
              ? featured.map(p => <ProductCard key={p.id} p={p} navigate={navigate} />)
              : [0, 1, 2].map(i => (
                  <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, height: 360, opacity: 0.3 }} />
                ))
          }
        </div>
      </Inner>
    </section>
  );
}

function ProductCard({ p, navigate }) {
  const [hover, setHover] = React.useState(false);
  const usd = parseFloat(p.usd_price) || 0;
  const img = p.image_urls?.[0];

  return (
    <div
      onClick={() => navigate('product', p.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
        transition: 'transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease',
        transform: hover ? 'translateY(-5px)' : 'none',
        boxShadow: hover ? '0 20px 52px rgba(26,23,20,0.12)' : 'none',
      }}
    >
      {/* Image area */}
      <div style={{
        height: 220, background: '#f5f3ef',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative',
      }}>
        {img
          ? <img
              src={`/api/img?url=${encodeURIComponent(img.replace(/[&?]\.v=[^&]*/, ''))}`}
              alt={p.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 24 }}
            />
          : <span style={{ fontSize: 56, opacity: 0.3 }}>📱</span>
        }
        {p.badge && (
          <div style={{
            position: 'absolute', top: 14, left: 14,
            ...BODY, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
            background: T.accentTint, color: T.accentDark,
            borderRadius: 6, padding: '4px 10px',
          }}>
            {p.badge}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '20px 22px 24px' }}>
        <div style={{ ...HEAD, fontWeight: 700, fontSize: 16, color: T.ink, letterSpacing: '-0.02em', marginBottom: 3 }}>
          {p.name}
        </div>
        {p.subtitle && (
          <div style={{ ...BODY, fontSize: 13, color: T.muted, marginBottom: 16 }}>{p.subtitle}</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ ...HEAD, fontWeight: 800, fontSize: 22, color: T.accent, letterSpacing: '-0.03em' }}>
              ₦{Math.round(usd * CERTO_RATE).toLocaleString()}
            </div>
            <div style={{ ...MONO, fontSize: 11, color: T.subtle, marginTop: 2 }}>
              ${usd.toLocaleString()} USD
            </div>
          </div>
          <div style={{ ...BODY, fontSize: 11, color: T.sage, fontWeight: 700, background: T.sageTint, padding: '5px 10px', borderRadius: 7 }}>
            ✓ Verified
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   05 · Forex / The promise
   ───────────────────────────────────────────────────────────────────────────── */
function SectionForex({ isMobile }) {
  const [rate, setRate] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/forex')
      .then(r => r.ok ? r.json() : {})
      .then(d => { if (d.rate) setRate(d.rate); })
      .catch(() => {});
  }, []);

  const displayRate = rate || CERTO_RATE;

  return (
    <section style={{ background: T.card }}>
      <Inner style={{ padding: isMobile ? '80px 24px' : '120px 48px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 56 : 80,
          alignItems: 'center',
        }}>

          {/* Left — copy */}
          <div>
            <Eyebrow>Forex · The promise</Eyebrow>
            <h2 style={{
              ...HEAD, fontWeight: 800,
              fontSize: isMobile ? 30 : 'clamp(28px, 3vw, 48px)',
              letterSpacing: '-0.03em', lineHeight: 1.1,
              color: T.ink, marginBottom: 22,
            }}>
              No mystery margin.<br />
              Your rate is<br />
              the real rate.
            </h2>
            <p style={{ ...BODY, fontSize: 16, lineHeight: 1.8, color: T.muted, marginBottom: 18 }}>
              We use the live interbank USD/NGN rate plus a transparent ₦100 buffer
              to cover our FX exposure. That's it. We show you Apple's US price next
              to ours so you can verify every naira.
            </p>
            <p style={{ ...BODY, fontSize: 16, lineHeight: 1.8, color: T.muted, marginBottom: 28 }}>
              Your rate is locked the moment you pay — even if the naira moves
              overnight, your invoice doesn't change.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Rate locked at checkout — no creeping charges',
                'Apple US price shown alongside ours',
                'Full margin transparency — we show what we make',
              ].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ color: T.sage, fontWeight: 800, fontSize: 13, marginTop: 2 }}>✓</span>
                  <span style={{ ...BODY, fontSize: 14, color: T.ink, lineHeight: 1.6 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — live rate widget */}
          <div>
            <div style={{
              background: T.cream, border: `1px solid ${T.border}`,
              borderRadius: 24, overflow: 'hidden',
            }}>
              {/* Rate display */}
              <div style={{ padding: isMobile ? '28px 24px' : '36px 32px', borderBottom: `1px solid ${T.hairline}` }}>
                <div style={{ ...BODY, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.subtle, marginBottom: 10 }}>
                  Live interbank rate
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <div style={{ ...HEAD, fontWeight: 800, fontSize: isMobile ? 48 : 60, letterSpacing: '-0.05em', color: T.ink, lineHeight: 1 }}>
                    ₦{displayRate.toLocaleString()}
                  </div>
                  <div style={{ ...BODY, fontSize: 14, color: T.muted, fontWeight: 500 }}>/&nbsp;$1</div>
                </div>
                <div style={{ ...BODY, fontSize: 12, color: T.subtle }}>
                  Updated every 10 min · {rate ? 'Live' : 'Estimated'}
                </div>
              </div>

              {/* Example breakdown */}
              <div style={{ padding: isMobile ? '24px' : '28px 32px' }}>
                <div style={{ ...BODY, fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
                  Example — iPhone 16 Pro · 128GB
                </div>

                {[
                  { label: 'Apple US price', value: '$999' },
                  { label: 'Shipping + duties', value: '+ included' },
                  { label: 'Rate (locked)', value: `₦${displayRate.toLocaleString()} / $1` },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '8px 0',
                    borderBottom: `1px solid ${T.hairline}`,
                  }}>
                    <span style={{ ...BODY, fontSize: 13, color: T.muted }}>{row.label}</span>
                    <span style={{ ...MONO, fontSize: 13, color: T.ink, fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}

                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', paddingTop: 16, marginTop: 4,
                }}>
                  <span style={{ ...BODY, fontSize: 15, fontWeight: 700, color: T.ink }}>You pay</span>
                  <span style={{ ...HEAD, fontWeight: 800, fontSize: 26, color: T.accent, letterSpacing: '-0.03em' }}>
                    ₦{Math.round(999 * displayRate).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Inner>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   06 · Voices / Testimonials
   ───────────────────────────────────────────────────────────────────────────── */
function SectionVoices({ isMobile }) {
  return (
    <section style={{ background: T.cream }}>
      <Inner style={{ padding: isMobile ? '80px 24px' : '120px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 44 : 68 }}>
          <Eyebrow>Voices</Eyebrow>
          <h2 style={{
            ...HEAD, fontWeight: 800,
            fontSize: isMobile ? 30 : 'clamp(28px, 3vw, 50px)',
            letterSpacing: '-0.03em', lineHeight: 1.05,
            color: T.ink, marginBottom: 12,
          }}>
            People who took the leap.
          </h2>
          <p style={{ ...BODY, fontSize: 16, color: T.muted, maxWidth: 440, margin: '0 auto' }}>
            Real customers. Real orders. Real serial numbers checked.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 16,
        }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 20, padding: isMobile ? '28px 24px' : '36px 32px',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Stars */}
              <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
                {Array(t.stars || 5).fill(0).map((_, j) => (
                  <svg key={j} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>

              <p style={{
                ...BODY, fontSize: 15, lineHeight: 1.82, color: T.ink,
                flex: 1, marginBottom: 24, fontStyle: 'italic',
              }}>
                "{t.text}"
              </p>

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: `1px solid ${T.hairline}`, paddingTop: 20,
              }}>
                <div>
                  <div style={{ ...BODY, fontWeight: 700, fontSize: 14, color: T.ink }}>{t.name}</div>
                  <div style={{ ...BODY, fontSize: 12, color: T.subtle, marginTop: 2 }}>{t.location}</div>
                </div>
                <div style={{
                  ...BODY, fontSize: 11, fontWeight: 700,
                  background: T.accentTint, color: T.accentDark,
                  borderRadius: 8, padding: '5px 12px',
                }}>
                  {t.product}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Inner>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   07 · Founder note
   ───────────────────────────────────────────────────────────────────────────── */
function SectionFounder({ isMobile }) {
  return (
    <section style={{ background: T.card }}>
      <Inner style={{ padding: isMobile ? '80px 24px' : '120px 48px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '280px 1fr',
          gap: isMobile ? 44 : 80,
          alignItems: 'flex-start',
        }}>

          {/* Left — identity */}
          <div>
            <Eyebrow>Founder note</Eyebrow>

            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: T.ink,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <span style={{ ...HEAD, fontWeight: 800, fontSize: 30, color: 'white', letterSpacing: '-0.04em' }}>C</span>
            </div>

            <div style={{ ...HEAD, fontWeight: 700, fontSize: 17, color: T.ink, letterSpacing: '-0.02em', marginBottom: 4 }}>
              Chidile Ozoemena
            </div>
            <div style={{ ...BODY, fontSize: 13, color: T.muted }}>
              Founder, Certo · Lagos
            </div>

            {/* Divider */}
            <div style={{ width: 32, height: 2, background: T.accent, borderRadius: 2, marginTop: 24 }} />
          </div>

          {/* Right — letter */}
          <div>
            <blockquote style={{ margin: 0 }}>
              <p style={{ ...BODY, fontSize: isMobile ? 17 : 19, lineHeight: 1.85, color: T.ink, marginBottom: 22 }}>
                "I started Certo after watching a close friend pay ₦850,000 for an iPhone that
                turned out to be a refurbished UK device sold as new. The serial number didn't
                match. The warranty was already halfway used. She had no recourse.
              </p>
              <p style={{ ...BODY, fontSize: isMobile ? 17 : 19, lineHeight: 1.85, color: T.ink, marginBottom: 22 }}>
                That's a solvable problem. Apple sells directly from their website. Shipping exists.
                Verification is a 30-second check on apple.com. The only thing missing was someone
                willing to build the system honestly.
              </p>
              <p style={{ ...BODY, fontSize: isMobile ? 17 : 19, lineHeight: 1.85, color: T.ink }}>
                So that's what Certo is. Every device I sell, I'd be comfortable handing to my
                mother. That's the standard."
              </p>
            </blockquote>

            <div style={{ marginTop: 32 }}>
              <div style={{
                ...HEAD, fontStyle: 'italic', fontWeight: 700, fontSize: 28,
                color: T.ink, letterSpacing: '-0.02em',
                display: 'inline-block',
                borderBottom: `2px solid ${T.ink}`, paddingBottom: 4,
              }}>
                Chidile
              </div>
            </div>
          </div>
        </div>
      </Inner>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   08 · Final CTA
   ───────────────────────────────────────────────────────────────────────────── */
function SectionFinalCTA({ navigate, isMobile }) {
  return (
    <section style={{ background: T.accent, position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
        width: '120%', height: '160%',
        background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.1) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <Inner style={{ padding: isMobile ? '80px 24px' : '120px 48px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ ...BODY, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
          Ready?
        </div>

        <h2 style={{
          ...HEAD, fontWeight: 800,
          fontSize: isMobile ? 'clamp(36px, 12vw, 60px)' : 'clamp(48px, 5vw, 80px)',
          letterSpacing: '-0.04em', lineHeight: 1.0,
          color: 'white', marginBottom: 22,
        }}>
          Buy Apple<br />the right way.
        </h2>

        <p style={{
          ...BODY, fontSize: isMobile ? 16 : 18,
          color: 'rgba(255,255,255,0.7)', lineHeight: 1.75,
          maxWidth: 480, margin: '0 auto 44px',
        }}>
          No gimmicks. No fake discounts. Serial verified, warranty intact,
          delivered to your door in Nigeria.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 36 }}>
          <button
            onClick={() => navigate('shop')}
            style={{
              ...BODY, background: 'white', color: T.accent,
              border: 'none', borderRadius: 14,
              padding: isMobile ? '15px 32px' : '18px 44px',
              fontSize: isMobile ? 15 : 17, fontWeight: 800, cursor: 'pointer',
              letterSpacing: '-0.01em',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}
          >
            Browse all products →
          </button>
          <button
            onClick={() => navigate('how-it-works')}
            style={{
              ...BODY, background: 'transparent',
              color: 'rgba(255,255,255,0.9)',
              border: '1.5px solid rgba(255,255,255,0.35)',
              borderRadius: 14,
              padding: isMobile ? '14px 28px' : '17px 36px',
              fontSize: isMobile ? 15 : 17, fontWeight: 500, cursor: 'pointer',
            }}
          >
            How it works
          </button>
        </div>

        <div style={{ display: 'flex', gap: isMobile ? 16 : 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Serial verified on apple.com', 'Original US warranty', '25-day refund guarantee'].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 800, fontSize: 12 }}>✓</span>
              <span style={{ ...BODY, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{s}</span>
            </div>
          ))}
        </div>
      </Inner>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Footer (no data-reveal)
   ───────────────────────────────────────────────────────────────────────────── */
function SectionFooter({ navigate, isMobile }) {
  const links = [
    { label: 'Shop',          screen: 'shop'         },
    { label: 'How it works',  screen: 'how-it-works' },
    { label: 'Verify',        screen: 'verify'       },
    { label: 'Track order',   screen: 'track'        },
  ];

  return (
    <footer style={{ background: T.ink, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <Inner style={{ padding: isMobile ? '48px 24px' : '64px 48px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 32,
          marginBottom: 40,
        }}>
          {/* Brand */}
          <div>
            <div style={{ ...HEAD, fontWeight: 800, fontSize: 22, color: 'white', letterSpacing: '-0.03em', marginBottom: 6 }}>
              Certo
            </div>
            <div style={{ ...BODY, fontSize: 13, color: 'rgba(255,255,255,0.4)', maxWidth: 280, lineHeight: 1.6 }}>
              Genuine Apple products, directly sourced from Apple US. Delivered to Nigeria.
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: isMobile ? 16 : 28, flexWrap: 'wrap' }}>
            {links.map(l => (
              <button
                key={l.screen}
                onClick={() => navigate(l.screen)}
                style={{
                  ...BODY, background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.5)', fontSize: 14,
                  fontWeight: 500, cursor: 'pointer', padding: 0,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                {l.label}
              </button>
            ))}
          </nav>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 12,
        }}>
          <div style={{ ...BODY, fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
            © {new Date().getFullYear()} Certo. All rights reserved.
          </div>
          <div style={{ ...BODY, fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
            Not affiliated with Apple Inc.
          </div>
        </div>
      </Inner>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Root — matches Homepage.html structure exactly
   ───────────────────────────────────────────────────────────────────────────── */
const HomePage = ({ navigate }) => {
  const { isMobile } = useResponsive();
  useReveal();

  return (
    <main>
      {/* 01 Hero — no data-reveal (immediately visible) */}
      <div data-screen-label="01 Hero · Manifesto">
        <SectionHero navigate={navigate} isMobile={isMobile} />
      </div>

      {/* 02 Certificate — data-reveal-wrapper + data-reveal */}
      <div data-reveal-wrapper data-screen-label="02 Certificate · Proof on paper" data-reveal>
        <SectionCertificate navigate={navigate} isMobile={isMobile} />
      </div>

      {/* 03 Chain of custody */}
      <div data-screen-label="03 Chain of custody" data-reveal>
        <SectionChainOfCustody isMobile={isMobile} />
      </div>

      {/* 04 Catalog */}
      <div data-screen-label="04 Catalog · Featured" data-reveal>
        <SectionCatalog navigate={navigate} isMobile={isMobile} />
      </div>

      {/* 05 Forex */}
      <div data-screen-label="05 Forex · The promise" data-reveal>
        <SectionForex isMobile={isMobile} />
      </div>

      {/* 06 Voices */}
      <div data-screen-label="06 Voices · Testimonials" data-reveal>
        <SectionVoices isMobile={isMobile} />
      </div>

      {/* 07 Founder note */}
      <div data-screen-label="07 Founder note" data-reveal>
        <SectionFounder isMobile={isMobile} />
      </div>

      {/* 08 Final CTA */}
      <div data-screen-label="08 Final CTA" data-reveal>
        <SectionFinalCTA navigate={navigate} isMobile={isMobile} />
      </div>

      {/* Footer — no data-reveal */}
      <SectionFooter navigate={navigate} isMobile={isMobile} />
    </main>
  );
};

// Named exports so ShopPage / other consumers don't break
const fmt = (usd) => `₦${Math.round(usd * CERTO_RATE).toLocaleString()}`;
const ProductIcon = () => null;
export { HomePage, ProductIcon, fmt };
