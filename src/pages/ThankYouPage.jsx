
import React, { useEffect, useState } from 'react';
import { useResponsive } from '../data.js';

const STEPS = [
  { day: 'Day 0',  icon: '🛒', title: 'Order received',          body: 'We\'ve logged your order and started processing.' },
  { day: 'Day 1',  icon: '🍎', title: 'Purchased from Apple US', body: 'Your exact device is ordered directly on apple.com.' },
  { day: 'Day 6',  icon: '✈️', title: 'Air freight booked',      body: 'Carrier confirmed. Tracking issued. Box sealed and photographed.' },
  { day: 'Day 9',  icon: '🌊', title: 'Crossing the Atlantic',   body: 'Direct flight from JFK New York to Murtala Muhammed Airport.' },
  { day: 'Day 12', icon: '🛃', title: 'Customs clearance',       body: 'Duties paid in full — no surprise charges land on you.' },
  { day: 'Day 14', icon: '📦', title: 'Delivered to your door',  body: 'Hand-delivered to you. Inspect the sealed box before signing.' },
];

function OrderIdCard({ orderId }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(orderId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div style={{
      background: 'var(--cream)', border: '1.5px solid var(--border)',
      borderRadius: 16, padding: '20px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Order ID</div>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22, color: 'var(--ink)', letterSpacing: '0.01em' }}>{orderId}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Save this to track your delivery</div>
      </div>
      <button onClick={copy} style={{
        background: copied ? 'var(--sage)' : 'var(--ink)', color: 'white',
        border: 'none', borderRadius: 10, padding: '10px 18px',
        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
        whiteSpace: 'nowrap',
      }}>
        {copied ? '✓ Copied' : 'Copy ID'}
      </button>
    </div>
  );
}

export function ThankYouPage({ orderId, navigate }) {
  const { isMobile } = useResponsive();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!orderId) { setNotFound(true); setLoading(false); return; }
    fetch(`/api/orders/${encodeURIComponent(orderId)}`)
      .then(r => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then(d => { if (d) setOrder(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  const isWhatsApp = order?.payment_method?.toLowerCase().includes('whatsapp');
  const items = (() => {
    if (!order?.items) return [];
    if (Array.isArray(order.items)) return order.items;
    try { return JSON.parse(order.items); } catch { return []; }
  })();

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--muted)' }}>Loading your order…</div>
    </div>
  );

  if (notFound || !order) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 32, color: 'var(--ink)', marginBottom: 12 }}>Order not found</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--muted)', marginBottom: 32 }}>
        {orderId ? `We couldn't find order "${orderId}".` : 'No order ID was provided.'} Check the ID and try again, or contact us.
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => navigate('track', orderId)} style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 12, padding: '14px 28px', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Track Order</button>
        <button onClick={() => navigate('home')} style={{ background: 'none', color: 'var(--ink)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '14px 28px', fontFamily: 'var(--font-body)', fontSize: 15, cursor: 'pointer' }}>Back to Home</button>
      </div>
    </div>
  );

  const customerFirstName = (order.customer_name || '').split(' ')[0] || 'there';
  const totalNgn = Number(order.ngn_price) || 0;
  const totalUsd = Number(order.usd_price) || 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* ── Hero band ─────────────────────────────────────────────────── */}
      <section style={{
        background: 'var(--ink)', color: 'white',
        padding: isMobile ? '80px 24px 64px' : '120px 48px 96px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

        <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
          {/* Check badge */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--sage)', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 12px rgba(31,122,77,0.15)',
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 14l6 6 10-12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16 }}>
            {isWhatsApp ? 'Order Created · Awaiting Payment' : 'Order Confirmed · Payment Received'}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-head)', fontWeight: 800,
            fontSize: isMobile ? 'clamp(32px, 9vw, 56px)' : 'clamp(40px, 5vw, 72px)',
            lineHeight: 0.95, letterSpacing: '-0.04em', color: 'white',
            margin: '0 0 20px', wordBreak: 'break-word',
          }}>
            Thank you,<br />{customerFirstName}.
          </h1>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: isMobile ? 15 : 17, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: '0 0 36px', maxWidth: 520 }}>
            {isWhatsApp
              ? "Your order is saved and pending payment. We've opened WhatsApp — complete the payment there and we'll confirm your order and start procurement right away."
              : "Your payment is confirmed. We're purchasing your device from Apple US within 24 hours. You'll hear from us on WhatsApp."}
          </p>

          <OrderIdCard orderId={orderId} />

          {isWhatsApp && (
            <div style={{
              marginTop: 20, padding: '14px 18px', borderRadius: 12,
              background: 'rgba(217,119,87,0.15)', border: '1px solid rgba(217,119,87,0.3)',
              fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6,
            }}>
              ⏳ <strong style={{ color: 'var(--accent)' }}>Status: Payment Pending</strong> — your order will be confirmed once we receive your payment via WhatsApp.
            </div>
          )}
        </div>
      </section>

      {/* ── What happens next ─────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '56px 24px' : '96px 48px', borderBottom: '1px solid var(--hairline)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16 }}>
            What happens next
          </div>
          <h2 style={{
            fontFamily: 'var(--font-head)', fontWeight: 800,
            fontSize: isMobile ? 28 : 36, letterSpacing: '-0.03em',
            color: 'var(--ink)', margin: '0 0 40px',
          }}>
            Your device's journey to your door.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STEPS.map((s, i) => {
              const isLast = i === STEPS.length - 1;
              const isFirst = i === 0;
              return (
                <div key={i} style={{ display: 'flex', gap: 20, paddingBottom: isLast ? 0 : 24 }}>
                  {/* Left: icon + connector */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 44 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: isFirst ? 'var(--sage)' : 'var(--bg-alt)',
                      border: `2px solid ${isFirst ? 'var(--sage)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                      boxShadow: isFirst ? '0 0 0 8px rgba(31,122,77,0.1)' : 'none',
                    }}>
                      {s.icon}
                    </div>
                    {!isLast && (
                      <div style={{ width: 2, flex: 1, minHeight: 20, marginTop: 4, background: isFirst ? 'var(--sage)' : 'var(--hairline)' }} />
                    )}
                  </div>
                  {/* Right: content */}
                  <div style={{ paddingTop: 10, paddingBottom: isLast ? 0 : 8 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>{s.day}</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>{s.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Order summary ─────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '56px 24px' : '96px 48px', borderBottom: '1px solid var(--hairline)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16 }}>
            Your order
          </div>
          <h2 style={{
            fontFamily: 'var(--font-head)', fontWeight: 800,
            fontSize: isMobile ? 28 : 36, letterSpacing: '-0.03em',
            color: 'var(--ink)', margin: '0 0 32px',
          }}>
            {items.length > 0 ? `${items.length} item${items.length > 1 ? 's' : ''} ordered` : 'Order summary'}
          </h2>

          {/* Items list */}
          {items.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
              {items.map((item, i) => {
                const qty = item.qty || 1;
                const unitUsd = Number(item.usd_price) || 0;
                const imgUrl = item.image_url || null;
                return (
                  <div key={i} style={{
                    padding: '16px 20px',
                    borderBottom: i < items.length - 1 ? '1px solid var(--hairline)' : 'none',
                    display: 'flex', gap: 14, alignItems: 'center',
                    background: 'var(--card)',
                  }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 10,
                      background: 'var(--bg-alt)', border: '1px solid var(--border)',
                      flexShrink: 0, overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {imgUrl
                        ? <img src={`/api/img?url=${encodeURIComponent(imgUrl.replace(/[&?]\.v=[^&]*/,''))}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} onError={e => e.target.style.display = 'none'} />
                        : <span style={{ fontSize: 24 }}>📦</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--ink)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {qty > 1 ? `${qty}× ` : ''}{item.name}
                      </div>
                      {item.subtitle && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.subtitle}</div>}
                      {item.applecare && item.applecare !== 'none' && item.applecare !== 'None' && (
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>+ {item.applecare}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                        ${(unitUsd * qty).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                      {qty > 1 && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)' }}>{qty} × ${unitUsd.toLocaleString()}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals */}
          {(totalUsd > 0 || totalNgn > 0) && (
            <div style={{
              background: 'var(--ink)', borderRadius: 16, padding: isMobile ? '20px' : '24px 28px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: 4 }}>Total paid</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USD</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-num)', fontWeight: 800, fontSize: isMobile ? 24 : 32, color: 'var(--accent)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  ₦{Math.round(totalNgn).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── CTAs ──────────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '56px 24px 80px' : '96px 48px 120px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-head)', fontWeight: 800,
            fontSize: isMobile ? 28 : 36, letterSpacing: '-0.03em',
            color: 'var(--ink)', margin: '0 0 8px',
          }}>Have a question?</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, margin: '0 0 32px' }}>
            Message us on WhatsApp — we respond within 2 hours. Or use your order ID to track every step of your delivery.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
            <button
              onClick={() => navigate('track', orderId)}
              style={{
                flex: isMobile ? 'none' : 1,
                background: 'var(--ink)', color: 'white',
                border: 'none', borderRadius: 14,
                padding: '16px 28px', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              Track My Order →
            </button>
            <a
              href={`https://wa.me/2348057575906?text=${encodeURIComponent(`Hi, I have a question about my order ${orderId}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: isMobile ? 'none' : 1,
                background: '#25d366', color: 'white',
                border: 'none', borderRadius: 14,
                padding: '16px 28px', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                textDecoration: 'none',
              }}
            >
              WhatsApp Us →
            </a>
            <button
              onClick={() => navigate('shop')}
              style={{
                flex: isMobile ? 'none' : '0 0 auto',
                background: 'transparent', color: 'var(--ink)',
                border: '1.5px solid var(--border)', borderRadius: 14,
                padding: '16px 28px', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 15,
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
