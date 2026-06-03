
// Certo — HomePage.jsx  (ported from Homepage.jsx reference design)
// Sections: Hero · Certificate · Chain of Custody · Catalog · Forex · Voices · Founder · Final CTA · Footer
import React, { useEffect, useState } from 'react';
import { CERTO_RATE } from '../data.js';

// ─── Mobile hook (via matchMedia — works with CSS viewport emulation) ─────────

function useIsMobile() {
  const mq = typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)') : null;
  const [mobile, setMobile] = useState(() => mq ? mq.matches : false);
  useEffect(() => {
    if (!mq) return;
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

// ─── Shared data ─────────────────────────────────────────────────────────────

const PROOF_DATA = {
  id: 'CRT-2204-8841',
  issued: '2026 — 05 — 17',
  product: 'iPhone 15 Pro',
  config: '256GB · Natural Titanium · Model A3102',
  serial: 'M82FX19JH3RQ',
  appleOrder: 'W1234567890',
  recipient: 'Adaeze Okoye',
  address: '14 Karimu Kotun St, Victoria Island, Lagos',
  rate: '₦1,590 / $1',
  usd: '$1,098.00',
  ngn: '₦1,745,820',
  route: [
    { day: 'MAY 03', title: 'Apple Inc.',             sub: 'Cupertino, CA · United States' },
    { day: 'MAY 09', title: 'Air freight in transit',  sub: 'JFK New York → MMA Lagos · via licensed carrier' },
    { day: 'MAY 12', title: 'Customs clearance',       sub: 'Murtala Muhammed Airport, Lagos · duties paid in full' },
    { day: 'MAY 17', title: 'Delivered to recipient',  sub: 'Victoria Island, Lagos · signed for in person' },
  ],
};

// ─── Shared sub-components ───────────────────────────────────────────────────

function PrimaryCTA({ label, dark = true, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      background: dark ? 'var(--ink)' : 'var(--accent)',
      color: 'white', textDecoration: 'none',
      border: 'none', cursor: 'pointer',
      borderRadius: 12, padding: '17px 30px',
      fontSize: 15, fontWeight: 600, letterSpacing: '0.01em',
    }}>
      {label}
      <span>→</span>
    </button>
  );
}

// ─── Certificate component ────────────────────────────────────────────────────

function Certificate({ isMobile }) {
  const D = PROOF_DATA;
  const Row = ({ label, value, mono }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '12px 0', borderTop: '1px dashed var(--border)', gap: 16,
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, color: 'var(--subtle)',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        paddingTop: 2, flexShrink: 0,
      }}>{label}</span>
      <span style={{
        fontSize: 13, color: 'var(--ink)', fontWeight: 600,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
        letterSpacing: mono ? '0.04em' : 'normal', textAlign: 'right',
      }}>{value}</span>
    </div>
  );

  return (
    <div style={{
      position: 'relative', background: 'var(--card)',
      border: '1px solid var(--border)', borderRadius: 16,
      padding: isMobile ? '28px 24px 28px' : '36px 40px 40px',
      transform: isMobile ? 'none' : 'rotate(-1deg)',
      boxShadow: '0 40px 100px -30px rgba(26,23,20,0.25), 0 12px 32px -12px rgba(26,23,20,0.1)',
    }}>
      {/* Watermark */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', overflow: 'hidden', borderRadius: 16,
      }}>
        <div style={{
          fontFamily: 'var(--font-head)', fontWeight: 800,
          fontSize: isMobile ? 120 : 220, color: 'var(--ink)', opacity: 0.025,
          letterSpacing: '-0.04em', transform: 'rotate(-10deg)',
          whiteSpace: 'nowrap', userSelect: 'none',
        }}>CERTO</div>
      </div>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingBottom: 20, marginBottom: 16, borderBottom: '2px solid var(--ink)',
        position: 'relative',
      }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
            color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6,
          }}>Verification Certificate</div>
          <div style={{
            fontFamily: 'var(--font-head)', fontWeight: 800,
            fontSize: isMobile ? 20 : 28, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1,
          }}>{D.id}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'var(--subtle)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Issued</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)', fontWeight: 500, letterSpacing: '0.04em' }}>2026-05-17</div>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <Row label="Product"       value={D.product} />
        <Row label="Configuration" value="256GB · Natural Titanium" />
        <Row label="Serial"        value={D.serial} mono />
        <Row label="Apple QC"      value="✓ Passed factory inspection" />

        {/* Route timeline */}
        <div style={{ padding: '20px 0 4px', borderTop: '1px dashed var(--border)', marginTop: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--subtle)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
            Route
          </div>
          {D.route.map((row, i, arr) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '14px 1fr auto', gap: 12,
              alignItems: 'flex-start', padding: '8px 0',
            }}>
              <div style={{ position: 'relative', height: 24 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: i === arr.length - 1 ? 'var(--accent)' : 'var(--ink)',
                  marginTop: 4,
                }} />
                {i < arr.length - 1 && (
                  <div style={{ position: 'absolute', left: 4, top: 16, width: 2, height: 22, background: 'var(--border)' }} />
                )}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{row.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{row.sub}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--subtle)', letterSpacing: '0.06em', marginTop: 3 }}>{row.day}</div>
            </div>
          ))}
        </div>

        {/* Rate + total */}
        <div style={{
          marginTop: 20, padding: '16px 18px',
          background: 'var(--cream)', borderRadius: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--subtle)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Rate locked at checkout</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--ink)', fontWeight: 500, letterSpacing: '0.04em' }}>₦1,590 / $1</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--subtle)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Total paid</div>
            <div style={{ fontFamily: 'var(--font-num)', fontWeight: 800, fontSize: 20, color: 'var(--accent)', letterSpacing: '-0.02em' }}>₦1,745,820</div>
          </div>
        </div>
      </div>

      {/* DELIVERED stamp */}
      <div style={{
        position: 'absolute', top: 20,
        right: isMobile ? 12 : -30,
        transform: 'rotate(10deg)',
        background: 'var(--sage)', color: 'white',
        padding: isMobile ? '8px 14px' : '12px 24px', borderRadius: 6,
        fontFamily: 'var(--font-head)', fontWeight: 800,
        fontSize: isMobile ? 11 : 14, letterSpacing: '0.16em',
        boxShadow: '0 0 0 2px var(--sage), 0 8px 24px -6px rgba(31,122,77,0.5)',
      }}>
        ✓ DELIVERED
      </div>
    </div>
  );
}

// ─── 1. HERO · Manifesto ─────────────────────────────────────────────────────

function SectionHero({ navigate }) {
  const isMobile = useIsMobile();
  const PRINCIPLES = [
    { num: 'I',   title: 'We buy direct from Apple US.',        body: 'Every device begins as an order placed on apple.com.' },
    { num: 'II',  title: 'We verify every serial.',             body: "Checked against Apple's coverage database before it ships." },
    { num: 'III', title: 'We lock the exchange rate.',          body: 'You pay the rate you see at checkout. Forex risk is ours.' },
    { num: 'IV',  title: 'We refund in 25 days, no questions.', body: 'Damaged, wrong, or failed verification? Full refund.' },
  ];

  return (
    <section style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{
        flex: 1, maxWidth: 1440, width: '100%', margin: '0 auto',
        padding: isMobile ? '112px 20px 64px' : '136px 48px 64px',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
          color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 28,
        }}>
          A manifesto · Lagos, 2026
        </div>

        <h1 style={{
          fontFamily: 'var(--font-head)', fontWeight: 800,
          fontSize: isMobile ? 'clamp(48px, 13vw, 72px)' : 'clamp(64px, 9vw, 132px)',
          lineHeight: 0.9,
          letterSpacing: '-0.045em', color: 'var(--ink)',
          margin: '0 0 40px',
        }}>
          We import Apple.<br />
          <span style={{ display: 'inline-block', position: 'relative' }}>
            From Apple.
            <svg
              style={{ position: 'absolute', left: 0, right: 0, bottom: -8, width: '100%' }}
              height="14" viewBox="0 0 400 14" preserveAspectRatio="none"
            >
              <path d="M 2 8 Q 100 2, 200 7 T 398 6"
                stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </span>{' '}
          To you.
        </h1>

        {/* Hero CTAs */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
          <button onClick={() => navigate('shop')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'var(--accent)', color: 'white',
            border: 'none', borderRadius: 14,
            padding: isMobile ? '14px 28px' : '16px 36px',
            fontFamily: 'var(--font-body)', fontWeight: 700,
            fontSize: isMobile ? 15 : 16, cursor: 'pointer',
            letterSpacing: '-0.01em',
          }}>
            Shop Apple →
          </button>
          <button onClick={() => navigate('track')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'transparent', color: 'var(--ink)',
            border: '1.5px solid var(--border)', borderRadius: 14,
            padding: isMobile ? '14px 28px' : '16px 36px',
            fontFamily: 'var(--font-body)', fontWeight: 600,
            fontSize: isMobile ? 15 : 16, cursor: 'pointer',
            letterSpacing: '-0.01em',
          }}>
            Track your order
          </button>
        </div>

        <div style={{
          borderTop: '1px solid var(--hairline)', paddingTop: 32,
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 24 : 36,
          marginBottom: 36,
        }}>
          {PRINCIPLES.map(p => (
            <div key={p.num}>
              <div style={{
                fontFamily: 'var(--font-head)', fontWeight: 800,
                fontSize: isMobile ? 36 : 44, color: 'var(--accent)',
                letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 10,
              }}>{p.num}</div>
              <div style={{
                fontFamily: 'var(--font-head)', fontWeight: 700,
                fontSize: isMobile ? 14 : 17, color: 'var(--ink)',
                letterSpacing: '-0.01em', lineHeight: 1.25, marginBottom: 8,
              }}>{p.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{p.body}</div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 'auto', paddingTop: 24, borderTop: '1px solid var(--hairline)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 20 : 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: 'var(--muted)' }}>
            <span style={{
              fontFamily: 'var(--font-head)', fontStyle: 'italic',
              fontWeight: 600, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.01em',
            }}>— Certo</span>
            <span style={{ width: 24, height: 1, background: 'var(--border)', display: 'inline-block' }} />
            <span>Personally overseen, Lagos</span>
          </div>
          <PrimaryCTA label="See the proof" dark onClick={() => {
            document.getElementById('certificate')?.scrollIntoView({ behavior: 'smooth' });
          }} />
        </div>
      </div>

      {/* Scroll cue */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
        color: 'var(--subtle)', textTransform: 'uppercase',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        Scroll
        <span style={{
          width: 1, height: 28, background: 'var(--border)',
          display: 'block', position: 'relative', overflow: 'hidden',
        }}>
          <span style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 12,
            background: 'var(--accent)', animation: 'certoScrollPulse 2s ease-in-out infinite',
          }} />
        </span>
      </div>
    </section>
  );
}

// ─── 2. CERTIFICATE · Proof on paper ─────────────────────────────────────────

function SectionCertificate({ navigate }) {
  const isMobile = useIsMobile();
  return (
    <section id="certificate" style={{
      background: 'var(--cream)',
      padding: isMobile ? '64px 20px' : '120px 48px',
      borderTop: '1px solid var(--hairline)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '20%', right: '-10%',
        width: 600, height: 600,
        background: 'radial-gradient(circle, var(--accent-tint) 0%, transparent 65%)',
        opacity: 0.5, pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1440, margin: '0 auto', position: 'relative',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '0.85fr 1.15fr',
        gap: isMobile ? 48 : 80,
        alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
            color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 28,
          }}>Chapter II · The Proof</div>

          <h2 style={{
            fontFamily: 'var(--font-head)', fontWeight: 800,
            fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.95,
            letterSpacing: '-0.04em', color: 'var(--ink)', margin: '0 0 28px',
          }}>
            And here's<br />
            the <span style={{ color: 'var(--accent)' }}>paperwork</span>.
          </h2>

          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--muted)', margin: '0 0 24px' }}>
            Every device ships with a printed certificate that lists the serial number,
            the chain of custody from Cupertino to your door, and the exchange rate locked at checkout.
          </p>

          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--muted)', margin: '0 0 36px' }}>
            You can independently verify the serial on{' '}
            <span style={{ color: 'var(--ink)', fontWeight: 600, borderBottom: '1.5px solid var(--accent)' }}>
              checkcoverage.apple.com
            </span>{' '}
            before you accept delivery. If it doesn't check out, you don't pay.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
            {[
              ['Serial number',       'cross-referenced with Apple before shipping'],
              ['Chain of custody',    'every leg from US to Nigeria, timestamped'],
              ['Forex rate',          'locked at the moment you pay'],
              ['Recipient + address', 'on record, on paper'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: 'var(--sage)', flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 9, fontWeight: 700,
                }}>✓</span>
                <span style={{ fontSize: 14, color: 'var(--ink)' }}>
                  <strong style={{ fontWeight: 600 }}>{k}</strong>
                  <span style={{ color: 'var(--muted)' }}> — {v}</span>
                </span>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('verify')} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontSize: 14, fontWeight: 600, color: 'var(--ink)',
            borderBottom: '1.5px solid var(--ink)', paddingBottom: 3,
          }}>
            View a sample certificate →
          </button>
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <Certificate isMobile={isMobile} />
        </div>
      </div>
    </section>
  );
}

// ─── 3. CHAIN OF CUSTODY · Dark ──────────────────────────────────────────────

function SectionChainOfCustody() {
  const isMobile = useIsMobile();
  const STEPS = [
    { day: 'Day 0',  city: 'Cupertino',  country: 'USA',       label: 'Order placed on apple.com',   desc: 'Within 24 hours of your payment, we purchase your exact device.' },
    { day: 'Day 3',  city: 'Apple HQ',   country: 'CA, USA',   label: 'Device ships to US partner',  desc: 'Apple ships directly to our logistics partner for inspection.' },
    { day: 'Day 6',  city: 'New York',   country: 'NY, USA',   label: 'Air freight booked',          desc: 'Carrier confirmed. Tracking issued. Photo of sealed box captured.' },
    { day: 'Day 9',  city: 'In transit', country: 'JFK → LOS', label: 'Crossing the Atlantic',       desc: 'Onboard direct flight to Murtala Muhammed Airport, Lagos.' },
    { day: 'Day 12', city: 'Lagos',      country: 'Nigeria',   label: 'Customs clearance',           desc: 'Duties paid in full. No surprise charges land on you.' },
    { day: 'Day 14', city: 'Your door',  country: 'Nigeria',   label: 'Hand-delivered to recipient', desc: 'Inspect the sealed box before signing. Certificate in person.' },
  ];

  return (
    <section style={{
      background: 'var(--ink)', color: 'white',
      padding: isMobile ? '64px 20px' : '120px 48px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      <div style={{ maxWidth: 1440, margin: '0 auto', position: 'relative' }}>
        {/* Section header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
          alignItems: 'flex-end',
          gap: isMobile ? 20 : 40,
          marginBottom: isMobile ? 48 : 80,
        }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
              color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 24,
            }}>Chapter III · Chain of Custody</div>
            <h2 style={{
              fontFamily: 'var(--font-head)', fontWeight: 800,
              fontSize: 'clamp(32px, 5vw, 64px)', lineHeight: 0.95,
              letterSpacing: '-0.04em', color: 'white', margin: 0, maxWidth: 800,
            }}>
              From Cupertino to your couch.<br />
              <span style={{ color: 'var(--accent)' }}>You watch every step.</span>
            </h2>
          </div>
          <div style={{
            display: 'inline-flex', alignSelf: isMobile ? 'flex-start' : 'flex-end',
            alignItems: 'center', gap: 10,
            padding: '7px 14px', borderRadius: 100,
            border: '1px solid rgba(255,255,255,0.15)',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: '#ef4444',
              animation: 'certoLiveBlink 1.6s ease-in-out infinite',
              display: 'inline-block',
            }} />
            Live tracking
          </div>
        </div>

        {/* Steps — horizontal on desktop, vertical on mobile */}
        {isMobile ? (
          /* Mobile: vertical list */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STEPS.map((s, i) => {
              const isLast = i === STEPS.length - 1;
              return (
                <div key={i} style={{ display: 'flex', gap: 20, paddingBottom: isLast ? 0 : 28 }}>
                  {/* Left: dot + connector */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: isLast ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                      border: `2px solid ${isLast ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isLast ? '0 0 0 8px rgba(217,119,87,0.15)' : 'none',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                        color: isLast ? 'white' : 'var(--accent)',
                      }}>{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    {!isLast && (
                      <div style={{ width: 2, flex: 1, minHeight: 24, background: 'rgba(255,255,255,0.15)', marginTop: 4 }} />
                    )}
                  </div>
                  {/* Right: content */}
                  <div style={{ paddingBottom: 4 }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                      color: 'var(--accent)', letterSpacing: '0.1em',
                      textTransform: 'uppercase', marginBottom: 2,
                    }}>{s.day}</div>
                    <div style={{
                      fontFamily: 'var(--font-head)', fontWeight: 700,
                      fontSize: 16, color: 'white', letterSpacing: '-0.01em', marginBottom: 2,
                    }}>{s.city}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em', marginBottom: 8 }}>{s.country}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500, marginBottom: 4, lineHeight: 1.35 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop: horizontal grid */
          <div style={{ position: 'relative' }}>
            {/* Progress line */}
            <div style={{
              position: 'absolute', top: 28, left: 28, right: 28, height: 2,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, var(--accent) 100%)',
              zIndex: 0,
            }} />
            <div style={{
              display: 'grid', gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
              gap: 16, position: 'relative', zIndex: 1,
            }}>
              {STEPS.map((s, i) => {
                const isLast = i === STEPS.length - 1;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: isLast ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                      border: `2px solid ${isLast ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backdropFilter: 'blur(4px)',
                      boxShadow: isLast ? '0 0 0 8px rgba(217,119,87,0.15), 0 0 0 16px rgba(217,119,87,0.07)' : 'none',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                        color: isLast ? 'white' : 'var(--accent)',
                      }}>{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                        color: 'var(--accent)', letterSpacing: '0.1em',
                        textTransform: 'uppercase', marginBottom: 4,
                      }}>{s.day}</div>
                      <div style={{
                        fontFamily: 'var(--font-head)', fontWeight: 700,
                        fontSize: 16, color: 'white', letterSpacing: '-0.01em', marginBottom: 2,
                      }}>{s.city}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em', marginBottom: 14 }}>{s.country}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500, marginBottom: 6, lineHeight: 1.35 }}>{s.label}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{
          marginTop: isMobile ? 56 : 80, paddingTop: 36,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 32 : 48,
        }}>
          {[
            ['14 days',       'Average door-to-door delivery'],
            ['Photo every leg', 'We take a picture at every handoff. You see it on your tracking page.'],
            ['One contact',   'You can WhatsApp the founder directly. We pick up.'],
          ].map(([n, l]) => (
            <div key={n}>
              <div style={{
                fontFamily: 'var(--font-head)', fontWeight: 800,
                fontSize: 28, color: 'white', letterSpacing: '-0.02em',
                lineHeight: 1, marginBottom: 10,
              }}>{n}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 4. CATALOG ──────────────────────────────────────────────────────────────

function ProductIcon({ type }) {
  const props = { fill: 'none', stroke: 'var(--ink)', strokeWidth: 1.4 };
  if (type === 'iphone') return (
    <svg width="56" height="80" viewBox="0 0 56 80">
      <rect x="3" y="3" width="50" height="74" rx="9" {...props} />
      <rect x="6" y="9" width="44" height="62" rx="3" stroke="var(--accent)" fill="none" strokeWidth="0.5" opacity="0.5" />
      <rect x="22" y="6" width="12" height="1.5" rx="0.75" fill="var(--ink)" />
    </svg>
  );
  if (type === 'laptop') return (
    <svg width="84" height="60" viewBox="0 0 84 60">
      <rect x="8" y="4" width="68" height="44" rx="3" {...props} />
      <rect x="11" y="7" width="62" height="38" rx="1" stroke="var(--accent)" strokeWidth="0.5" opacity="0.5" />
      <path d="M2 49 L82 49 L78 56 L6 56 Z" {...props} />
    </svg>
  );
  if (type === 'pods') return (
    <svg width="80" height="60" viewBox="0 0 80 60">
      <rect x="14" y="10" width="52" height="44" rx="10" {...props} />
      <line x1="40" y1="14" x2="40" y2="50" stroke="var(--ink)" strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
  if (type === 'ipad') return (
    <svg width="68" height="86" viewBox="0 0 68 86">
      <rect x="3" y="3" width="62" height="80" rx="6" {...props} />
      <rect x="7" y="7" width="54" height="72" rx="2" stroke="var(--accent)" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
  return null;
}

function SectionCatalog({ navigate }) {
  const isMobile = useIsMobile();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/products?in_stock=true&limit=4')
      .then(r => r.ok ? r.json() : [])
      .then(rows => { setProducts(Array.isArray(rows) ? rows.slice(0, 4) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section style={{
      background: 'var(--cream)',
      padding: isMobile ? '64px 20px' : '120px 48px',
      borderTop: '1px solid var(--hairline)',
    }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
          alignItems: 'flex-end',
          gap: isMobile ? 16 : 40,
          marginBottom: 48,
        }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
              color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 20,
            }}>Chapter IV · The Catalog</div>
            <h2 style={{
              fontFamily: 'var(--font-head)', fontWeight: 800,
              fontSize: 'clamp(32px, 5vw, 64px)', lineHeight: 0.95,
              letterSpacing: '-0.04em', color: 'var(--ink)', margin: 0, maxWidth: 700,
            }}>
              Apple's latest.<br />
              Honest prices.
            </h2>
          </div>
          <button onClick={() => navigate('shop')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, color: 'var(--ink)',
            borderBottom: '1.5px solid var(--ink)', paddingBottom: 3,
            alignSelf: isMobile ? 'flex-start' : 'flex-end',
          }}>View full catalog →</button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 14 : 20,
        }}>
          {loading
            ? Array(4).fill(0).map((_, i) => (
                <div key={i} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 18, height: isMobile ? 240 : 320, opacity: 0.4,
                  animation: 'certoPulse 1.4s ease-in-out infinite',
                }} />
              ))
            : products.map(p => {
                const usd = parseFloat(p.usd_price) || 0;
                const ngn = Math.round(usd * CERTO_RATE);
                const img = p.image_urls?.[0];
                return (
                <article key={p.id} onClick={() => navigate('product', p.id)} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
                }}>
                  <div style={{
                    height: isMobile ? 160 : 220,
                    background: 'var(--cream)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderBottom: '1px solid var(--hairline)', position: 'relative',
                  }}>
                    {img
                      ? <img
                          src={`/api/img?url=${encodeURIComponent(img.replace(/[&?]\.v=[^&]*/,''))}`}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: isMobile ? 16 : 24 }}
                        />
                      : <ProductIcon type={
                          /macbook|mac/i.test(p.name) ? 'laptop'
                          : /ipad/i.test(p.name)     ? 'ipad'
                          : /airpods/i.test(p.name)  ? 'pods'
                          : 'iphone'
                        } />
                    }
                    {p.badge && (
                      <span style={{
                        position: 'absolute', top: 10, left: 10,
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                        color: 'var(--accent)', textTransform: 'uppercase',
                        background: 'var(--accent-tint)', padding: '3px 8px',
                        borderRadius: 100,
                      }}>{p.badge}</span>
                    )}
                  </div>
                  <div style={{ padding: isMobile ? '14px 16px 16px' : '20px 22px 22px' }}>
                    <div style={{
                      fontFamily: 'var(--font-head)', fontWeight: 700,
                      fontSize: isMobile ? 14 : 18, color: 'var(--ink)',
                      letterSpacing: '-0.02em', marginBottom: 4,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{p.name}</div>
                    {!isMobile && (
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18, minHeight: 18 }}>{p.subtitle || ''}</div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: isMobile ? 8 : 0 }}>
                      <div>
                        <div style={{
                          fontFamily: 'var(--font-num)', fontWeight: 800,
                          fontSize: isMobile ? 16 : 22, color: 'var(--ink)',
                          letterSpacing: '-0.02em', lineHeight: 1,
                        }}>₦{ngn.toLocaleString()}</div>
                        {!isMobile && (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--subtle)', marginTop: 4 }}>
                            ≈ ${usd.toLocaleString()} USD
                          </div>
                        )}
                      </div>
                      <span style={{ color: 'var(--accent)', fontSize: isMobile ? 18 : 22 }}>→</span>
                    </div>
                  </div>
                </article>
                );
              })
          }
        </div>
      </div>
    </section>
  );
}

// ─── 5. FOREX ────────────────────────────────────────────────────────────────

function SectionForex() {
  const isMobile = useIsMobile();
  const [time, setTime] = useState(new Date());
  const [liveRate, setLiveRate] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('/api/forex')
      .then(r => r.ok ? r.json() : {})
      .then(d => { if (d.rate) setLiveRate(d.rate); })
      .catch(() => {});
  }, []);

  const rate = liveRate || CERTO_RATE;
  const timeStr = time.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const exampleNgn = Math.round(999 * rate).toLocaleString();

  return (
    <section style={{
      background: 'var(--cream)',
      padding: isMobile ? '64px 20px' : '120px 48px',
      borderTop: '1px solid var(--hairline)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: 1200, height: 600,
        background: 'radial-gradient(ellipse, var(--accent-tint) 0%, transparent 60%)',
        opacity: 0.5, pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1100, margin: '0 auto', position: 'relative',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr',
        gap: isMobile ? 40 : 80,
        alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
            color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 24,
          }}>Chapter V · The Forex Promise</div>
          <h2 style={{
            fontFamily: 'var(--font-head)', fontWeight: 800,
            fontSize: 'clamp(32px, 4.5vw, 56px)', lineHeight: 0.95,
            letterSpacing: '-0.04em', color: 'var(--ink)', margin: '0 0 24px',
          }}>
            You pay the rate<br />
            you <span style={{ fontStyle: 'italic', fontWeight: 700, color: 'var(--accent)' }}>see</span>.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--muted)', margin: 0 }}>
            We check the exchange rate every minute and show it on every product page.
            The moment you check out, that rate is locked — even if the naira moves
            against us between then and when we buy your device. That's our risk to carry, not yours.
          </p>
        </div>

        {/* Live rate card */}
        <div style={{
          background: 'var(--ink)', borderRadius: 24,
          padding: isMobile ? '28px 24px' : 40,
          color: 'white', position: 'relative', overflow: 'hidden',
          boxShadow: '0 32px 80px -20px rgba(26,23,20,0.35)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 24, flexWrap: 'wrap', gap: 8,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
              color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: '#34d399',
                animation: 'certoLiveBlink 1.6s ease-in-out infinite',
                display: 'inline-block',
              }} />
              Live rate · {timeStr}
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
              color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em',
            }}>USD → NGN</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-num)', fontWeight: 800,
              fontSize: isMobile ? 60 : 92,
              color: 'white', letterSpacing: '-0.04em', lineHeight: 1,
            }}>₦{rate.toLocaleString()}</span>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>/ $1</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: '#34d399', flexWrap: 'wrap' }}>
            <span>↑ 0.6% from yesterday</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>30-day avg ₦1,572</span>
          </div>

          {/* Sparkline */}
          <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none" style={{ marginBottom: 24 }}>
            <defs>
              <linearGradient id="certoSpark" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M 0,40 L 25,38 L 50,42 L 75,35 L 100,32 L 125,38 L 150,30 L 175,28 L 200,32 L 225,26 L 250,22 L 275,28 L 300,20 L 325,18 L 350,22 L 375,14 L 400,10 L 400,60 L 0,60 Z"
              fill="url(#certoSpark)"
            />
            <path
              d="M 0,40 L 25,38 L 50,42 L 75,35 L 100,32 L 125,38 L 150,30 L 175,28 L 200,32 L 225,26 L 250,22 L 275,28 L 300,20 L 325,18 L 350,22 L 375,14 L 400,10"
              fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
            />
          </svg>

          <div style={{
            paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center',
          }}>
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6,
              }}>iPhone 15 Pro 256GB</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 12 : 14, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.04em' }}>$999 USD</div>
            </div>
            <span style={{ color: 'var(--accent)', fontSize: 20 }}>→</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6,
              }}>You pay today</div>
              <div style={{
                fontFamily: 'var(--font-head)', fontWeight: 800,
                fontSize: isMobile ? 16 : 20, color: 'var(--accent)', letterSpacing: '-0.02em',
              }}>₦{exampleNgn}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 6. VOICES ───────────────────────────────────────────────────────────────

function SectionVoices() {
  const isMobile = useIsMobile();
  const QUOTES = [
    {
      stars: 5,
      text: "I was scared to send over ₦2 million to a website. But the tracking page and the WhatsApp updates every step of the way made it feel safe. My MacBook arrived sealed, serial checked, everything perfect.",
      name: 'Tobi A.', location: 'Maitama, Abuja', product: 'MacBook Air M3',
    },
    {
      stars: 5,
      text: "Bought my first iPhone through Certo after years of buying from open markets and getting burned twice. The forex explanation was clear, the price was honest, and it arrived in 14 days. I'm a convert.",
      name: 'Chioma N.', location: 'Lekki, Lagos', product: 'iPhone 15 Pro',
    },
    {
      stars: 5,
      text: "Serial number checked out on Apple's website. The packaging was perfect — clearly never opened. The certificate they include is a nice touch. Certo is the only way I'm buying Apple products from now on.",
      name: 'Emeka O.', location: 'GRA, Port Harcourt', product: 'AirPods Pro',
    },
  ];

  return (
    <section style={{
      background: 'var(--cream)',
      padding: isMobile ? '64px 20px' : '120px 48px',
      borderTop: '1px solid var(--hairline)',
    }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ marginBottom: isMobile ? 40 : 64 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
            color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 20,
          }}>Chapter VI · The People</div>
          <h2 style={{
            fontFamily: 'var(--font-head)', fontWeight: 800,
            fontSize: 'clamp(32px, 5vw, 64px)', lineHeight: 0.95,
            letterSpacing: '-0.04em', color: 'var(--ink)', margin: 0, maxWidth: 700,
          }}>
            Who took the leap.<br />What happened next.
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 20 : 24,
        }}>
          {QUOTES.map((q, i) => (
            <figure key={i} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 18, padding: isMobile ? '24px 20px' : 32, margin: 0,
              display: 'flex', flexDirection: 'column',
              transform: (!isMobile && i === 1) ? 'translateY(-12px)' : 'none',
              boxShadow: (!isMobile && i === 1) ? '0 24px 64px -24px rgba(26,23,20,0.18)' : 'none',
            }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
                {Array.from({ length: q.stars }).map((_, j) => (
                  <svg key={j} width="16" height="16" viewBox="0 0 16 16" fill="var(--accent)">
                    <path d="M8 0l2.4 5.2L16 6l-4 3.8L13 16 8 13l-5 3 1-6.2L0 6l5.6-.8z" />
                  </svg>
                ))}
              </div>
              <blockquote style={{
                fontSize: isMobile ? 15 : 16, lineHeight: 1.65, color: 'var(--ink)',
                margin: '0 0 20px', flex: 1, fontWeight: 400,
              }}>
                <span style={{
                  fontFamily: 'var(--font-head)', fontSize: 32,
                  color: 'var(--accent)', lineHeight: 0.5,
                  display: 'inline-block', verticalAlign: '-0.4em',
                  marginRight: 4, fontWeight: 800,
                }}>"</span>
                {q.text}
              </blockquote>
              <figcaption style={{
                paddingTop: 16, borderTop: '1px solid var(--hairline)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{q.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{q.location}</div>
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                  color: 'var(--accent)', textTransform: 'uppercase',
                  background: 'var(--accent-tint)', padding: '4px 10px', borderRadius: 100,
                  whiteSpace: 'nowrap',
                }}>{q.product}</div>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Stats bar */}
        <div style={{
          marginTop: isMobile ? 56 : 80, padding: isMobile ? '32px 0' : '40px 0',
          borderTop: '1px solid var(--hairline)',
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 24 : 0,
        }}>
          {[
            ['1,247', 'devices delivered'],
            ['100%',  'serial verified'],
            ['4.9★',  'avg customer rating'],
            ['0',     'fakes shipped'],
          ].map(([n, l], i) => (
            <div key={n} style={{
              textAlign: 'center',
              borderRight: (!isMobile && i < 3) ? '1px solid var(--hairline)' : 'none',
              padding: isMobile ? '0 8px' : '0 16px',
            }}>
              <div style={{
                fontFamily: 'var(--font-head)', fontWeight: 800,
                fontSize: isMobile ? 36 : 44, color: 'var(--ink)', letterSpacing: '-0.02em',
                lineHeight: 1, marginBottom: 8,
              }}>{n}</div>
              <div style={{
                fontSize: 11, color: 'var(--subtle)', letterSpacing: '0.12em',
                textTransform: 'uppercase', fontWeight: 600,
              }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 7. FOUNDER ──────────────────────────────────────────────────────────────

function SectionFounder() {
  const isMobile = useIsMobile();
  return (
    <section style={{
      background: 'var(--cream)',
      padding: isMobile ? '64px 20px' : '120px 48px',
      borderTop: '1px solid var(--hairline)', position: 'relative',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
          color: 'var(--accent)', textTransform: 'uppercase',
          marginBottom: 32, textAlign: 'center',
        }}>Chapter VII · A note from the founder</div>

        <div style={{
          fontFamily: 'var(--font-head)', fontStyle: 'italic',
          fontSize: 'clamp(20px, 3vw, 34px)', lineHeight: 1.4,
          letterSpacing: '-0.015em', color: 'var(--ink)', marginBottom: 32,
        }}>
          "Two devices. Two different kinds of dishonesty. The same lesson both times: in this market,
          trust has to be earned with evidence, not just promised. Nobody was going to build that bridge —
          so I built it."
        </div>

        <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--muted)', margin: '0 0 24px' }}>
          Certo buys directly from Apple US. Every device comes with the original Apple order receipt
          and a verified serial number you can check yourself on Apple's website. The name comes from
          Italian — <em>certo</em> means "certainly." That's the standard I hold myself to.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--muted)', margin: '0 0 40px' }}>
          This is my business. My name is behind every order. If you have a question before buying,
          message us on WhatsApp — we actually pick up.
        </p>

        <div style={{
          paddingTop: 28, borderTop: '1px solid var(--hairline)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          gap: isMobile ? 20 : 0,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-head)', fontStyle: 'italic',
              fontWeight: 600, fontSize: 32, color: 'var(--ink)',
              letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 12,
              borderBottom: '1px solid var(--ink)', display: 'inline-block', paddingBottom: 8,
            }}>Chidile</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              Founder &amp; sole operator · Lagos, Nigeria
            </div>
          </div>
          <a href="https://wa.me/2348057575906" target="_blank" rel="noopener noreferrer" style={{
            fontSize: 13, fontWeight: 600, color: 'var(--ink)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            borderBottom: '1.5px solid var(--ink)', paddingBottom: 3, textDecoration: 'none',
          }}>WhatsApp the founder →</a>
        </div>
      </div>
    </section>
  );
}

// ─── 8. FINAL CTA ─────────────────────────────────────────────────────────────

function SectionFinalCTA({ navigate }) {
  const isMobile = useIsMobile();
  return (
    <section style={{
      background: 'var(--accent)',
      padding: isMobile ? '80px 20px' : '120px 48px',
      color: 'white', position: 'relative', overflow: 'hidden',
    }}>
      {/* Giant ghost text */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-head)', fontWeight: 800,
          fontSize: isMobile ? 200 : 600,
          color: 'rgba(255,255,255,0.05)',
          letterSpacing: '-0.05em', whiteSpace: 'nowrap',
          userSelect: 'none', transform: 'translateY(40px)',
        }}>Certo</div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', textAlign: 'center' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 28,
        }}>Chapter VIII · Begin</div>

        <h2 style={{
          fontFamily: 'var(--font-head)', fontWeight: 800,
          fontSize: isMobile ? 'clamp(40px, 13vw, 72px)' : 'clamp(48px, 7vw, 92px)',
          lineHeight: 0.95,
          letterSpacing: '-0.045em', color: 'white', margin: '0 0 28px',
        }}>
          Buy Apple<br />the right way.
        </h2>

        <p style={{
          fontSize: isMobile ? 16 : 19, lineHeight: 1.6,
          color: 'rgba(255,255,255,0.85)', margin: '0 auto 40px', maxWidth: 560,
        }}>
          No fakes. No surprise charges. No fine print buried somewhere.
          One certificate, one promise, one founder picking up the phone.
        </p>

        <div style={{
          display: 'flex', gap: 16, alignItems: 'center',
          flexWrap: 'wrap', justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          <button onClick={() => navigate('shop')} style={{
            background: 'white', color: 'var(--ink)',
            padding: isMobile ? '18px 36px' : '20px 40px',
            borderRadius: 14,
            fontSize: 16, fontWeight: 700, letterSpacing: '0.01em',
            border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 12,
            width: isMobile ? '100%' : 'auto', justifyContent: 'center',
          }}>Shop Apple →</button>
          <button onClick={() => document.getElementById('certificate')?.scrollIntoView({ behavior: 'smooth' })} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'white', fontSize: 15, fontWeight: 600,
            borderBottom: '1.5px solid rgba(255,255,255,0.8)', paddingBottom: 3,
          }}>See a sample certificate</button>
        </div>
      </div>
    </section>
  );
}


// ─── Root ─────────────────────────────────────────────────────────────────────

const HomePage = ({ navigate }) => {
  useEffect(() => {
    // Inject keyframe animations (design tokens already in index.html :root)
    if (document.getElementById('certo-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'certo-keyframes';
    style.textContent = `
      @keyframes certoScrollPulse {
        0%   { top: -12px; opacity: 0; }
        30%  { opacity: 1; }
        80%  { opacity: 1; }
        100% { top: 28px;  opacity: 0; }
      }
      @keyframes certoLiveBlink {
        0%, 100% { opacity: 0.4; transform: scale(0.85); }
        50%      { opacity: 1;   transform: scale(1); }
      }
      @keyframes certoPulse {
        0%, 100% { opacity: 0.4; }
        50%      { opacity: 0.2; }
      }
    `;
    document.head.appendChild(style);

    // Scroll-reveal observer (uses data-certo-reveal)
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-certo-reveal]').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <main>
      <div data-screen-label="01 Hero · Manifesto">
        <SectionHero navigate={navigate} />
      </div>
      <div data-screen-label="02 Certificate · Proof on paper" data-certo-reveal>
        <SectionCertificate navigate={navigate} />
      </div>
      <div data-screen-label="03 Chain of custody" data-certo-reveal>
        <SectionChainOfCustody />
      </div>
      <div data-screen-label="04 Catalog · Featured" data-certo-reveal>
        <SectionCatalog navigate={navigate} />
      </div>
      <div data-screen-label="05 Forex · The promise" data-certo-reveal>
        <SectionForex />
      </div>
      <div data-screen-label="06 Voices · Testimonials" data-certo-reveal>
        <SectionVoices />
      </div>
      <div data-screen-label="07 Founder note" data-certo-reveal>
        <SectionFounder />
      </div>
      <div data-screen-label="08 Final CTA" data-certo-reveal>
        <SectionFinalCTA navigate={navigate} />
      </div>
    </main>
  );
};

const fmt = (usd) => `₦${Math.round(usd * CERTO_RATE).toLocaleString()}`;
export { HomePage, ProductIcon, fmt };
