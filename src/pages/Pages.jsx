
// Certo — Supporting Pages: How It Works, Track My Order, About, FAQ, Contact
import React from 'react';
import { TESTIMONIALS, useResponsive } from '../data.js';

// ─── How It Works ─────────────────────────────────────────────────────────────
const HowItWorksPage = ({ navigate }) => {
  const { isMobile } = useResponsive();
  const steps = [
    {
      num: '01', title: 'You browse & order',
      certo: 'Every listing shows the live naira price, the US retail price, and our margin — openly.',
      customer: 'Browse the catalog, pick your device, choose your AppleCare option, and complete checkout.',
    },
    {
      num: '02', title: 'We confirm receipt',
      certo: 'Within 2 hours of payment, our team sends a WhatsApp confirmation with your order ID and next steps.',
      customer: 'You receive a WhatsApp message and can start tracking via your order ID immediately.',
    },
    {
      num: '03', title: 'We purchase from Apple',
      certo: 'Within 24 hours we purchase your exact device from Apple.com US using the funds received.',
      customer: 'You get a notification when the device is purchased, including the Apple order number.',
    },
    {
      num: '04', title: 'Device ships to our US partner',
      certo: 'Apple ships to our trusted US logistics partner who inspects, documents, and re-packages your device.',
      customer: 'Tracking page updates with "In Transit to US Partner" and an estimated handoff date.',
    },
    {
      num: '05', title: 'We handle customs',
      certo: 'Our partner ships the device to Nigeria. We handle all customs declarations and duties — no surprise charges for you.',
      customer: 'Tracking shows "Customs Clearance" status. This typically takes 1–2 business days.',
    },
    {
      num: '06', title: 'Delivery to your door',
      certo: 'Once cleared, a registered courier delivers to your stated address. You get a same-day call before delivery.',
      customer: 'You inspect the package on delivery. If anything looks wrong, you can refuse it and contact us immediately.',
    },
    {
      num: '07', title: 'Serial verification',
      certo: 'We include a printed serial certificate. You can verify independently on apple.com/coverage.',
      customer: 'If the serial doesn\'t check out as genuine — we refund 100%. No negotiation. No delay.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '40px 20px 80px' : '60px 48px 100px' }}>
        <div style={{ marginBottom: isMobile ? 40 : 64 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>The full process</div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 20 }}>How Certo works</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.75, maxWidth: 640 }}>
            This page exists for one reason: you're about to send a significant amount of money to a website you may have just found. You deserve to know exactly what happens after you pay.
          </p>
        </div>

        <div>
          {steps.map((s, i) => (
            <div key={s.num} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 32, marginBottom: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: i === 0 ? 'var(--accent)' : 'var(--bg-alt)',
                  border: `2px solid ${i === 0 ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16,
                  color: i === 0 ? 'white' : 'var(--text-muted)',
                  flexShrink: 0,
                }}>{s.num}</div>
                {i < steps.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: 'var(--border)', minHeight: 60, marginTop: 8 }} />
                )}
              </div>

              <div style={{ paddingBottom: 48 }}>
                <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, color: 'var(--text)', marginBottom: 20, marginTop: 12 }}>{s.title}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'var(--accent-tint)', borderRadius: 14, padding: isMobile ? 16 : 20 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Certo does</div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>{s.certo}</p>
                  </div>
                  <div style={{ background: 'var(--bg-alt)', borderRadius: 14, padding: isMobile ? 16 : 20, border: '1px solid var(--border)' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>You see</div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>{s.customer}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', paddingTop: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 28, color: 'var(--text)', marginBottom: 16 }}>Ready to order?</h3>
          <button onClick={() => navigate('shop')} style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 12, padding: '16px 36px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700 }}>Browse Products →</button>
        </div>
      </div>
    </div>
  );
};

// ─── Track My Order ───────────────────────────────────────────────────────────

const ORDER_STATUS_SEQUENCE = [
  { key: 'Order Confirmed',          label: 'Order Confirmed',          note: 'Your order has been received and payment confirmed. We\'re preparing to procure your device.' },
  { key: 'Purchased from Apple',     label: 'Purchased from Apple',     note: 'Your device has been purchased directly from Apple.com US.' },
  { key: 'In Transit to US Partner', label: 'In Transit to US Partner', note: 'Your device is on its way to our US logistics partner for inspection and packaging.' },
  { key: 'Customs Clearance',        label: 'Customs Clearance',        note: 'Your package is being processed through Nigerian customs. This typically takes 1–2 business days.' },
  { key: 'Arrived in Nigeria',       label: 'Arrived in Nigeria',       note: 'Your device has cleared customs and arrived in Nigeria.' },
  { key: 'Out for Delivery',         label: 'Out for Delivery',         note: 'Your device is with our delivery partner and on its way to you.' },
  { key: 'Delivered',                label: 'Delivered',                note: 'Your device has been delivered. Enjoy your new Apple product!' },
];

const TrackOrderPage = ({ initialOrderId }) => {
  const { isMobile } = useResponsive();
  const [orderId, setOrderId] = React.useState(initialOrderId || '');
  const [order, setOrder] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (initialOrderId) handleTrack(initialOrderId);
  }, [initialOrderId]);

  const handleTrack = async (id) => {
    const target = (id || orderId).trim().toUpperCase();
    if (!target) return;
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`/api/orders/${target}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Order not found. Please check your order ID.'); setOrder(null); }
      else          { setOrder(data); }
    } catch (e) {
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentIdx = order
    ? ORDER_STATUS_SEQUENCE.findIndex(s => s.key === order.status)
    : -1;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: isMobile ? '40px 20px 80px' : '60px 48px 100px' }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 32 : 44, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 8 }}>Track My Order</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-muted)', marginBottom: 40, lineHeight: 1.7 }}>
          Enter your order ID to see where your device is right now. No login needed.
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <input
            value={orderId} onChange={e => setOrderId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTrack()}
            placeholder="e.g. CRT-220426-8841"
            style={{
              flex: 1, padding: '14px 18px', borderRadius: 12,
              border: '1.5px solid var(--border)', background: 'var(--bg)',
              fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text)',
              outline: 'none', letterSpacing: '0.02em',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button onClick={() => handleTrack()} disabled={!orderId.trim() || loading} style={{
            padding: '14px 28px', borderRadius: 12, border: 'none',
            background: 'var(--accent)', color: 'white', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
            opacity: !orderId.trim() ? 0.6 : 1,
          }}>
            {loading ? '...' : 'Track'}
          </button>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 36 }}>
          Enter the order ID from your confirmation email to track your device.
        </p>

        {error && (
          <div style={{ padding: '14px 18px', borderRadius: 12, background: 'oklch(97% 0.02 20)', border: '1px solid oklch(85% 0.05 20)', fontFamily: 'var(--font-body)', fontSize: 14, color: 'oklch(40% 0.15 20)', marginBottom: 24 }}>
            {error}
          </div>
        )}

        {order && (
          <div>
            <div style={{ background: 'var(--bg-alt)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>ORDER ID</div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>{order.id}</div>
                </div>
                <span style={{
                  background: order.status === 'Delivered' ? 'oklch(93% 0.06 155)' : 'oklch(90% 0.08 160)',
                  color: order.status === 'Delivered' ? 'oklch(35% 0.15 155)' : 'oklch(35% 0.15 160)',
                  padding: '4px 12px', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
                }}>{order.status}</span>
              </div>
              {/* Items list — shows all products in the order */}
              {Array.isArray(order.items) && order.items.length > 0 ? (
                <div style={{ marginTop: 4 }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ marginBottom: i < order.items.length - 1 ? 8 : 0 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        {item.name}{item.subtitle ? ` · ${item.subtitle}` : ''}{item.applecare && item.applecare !== 'none' ? ` + ${item.applecare}` : ''}
                      </div>
                      {(item.variant_color || item.variant_storage) && (
                        <div style={{ display: 'flex', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
                          {item.variant_color && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text)' }}>
                              {item.variant_color_hex && <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.variant_color_hex, display: 'inline-block', border: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 }} />}
                              {item.variant_color}
                            </span>
                          )}
                          {item.variant_storage && (
                            <span style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text)' }}>
                              {item.variant_storage}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 6, opacity: 0.7 }}>{order.customer_name}</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>
                    {order.product_name}{order.product_subtitle ? ` · ${order.product_subtitle}` : ''}{order.applecare && order.applecare !== 'none' ? ` + ${order.applecare}` : ''}
                  </div>
                  {(order.variant_color || order.variant_storage) && (
                    <div style={{ display: 'flex', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
                      {order.variant_color && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text)' }}>
                          {order.variant_color_hex && <span style={{ width: 8, height: 8, borderRadius: '50%', background: order.variant_color_hex, display: 'inline-block', border: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 }} />}
                          {order.variant_color}
                        </span>
                      )}
                      {order.variant_storage && (
                        <span style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text)' }}>
                          {order.variant_storage}
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 4, opacity: 0.7 }}>{order.customer_name}</div>
                </div>
              )}
            </div>

            <div>
              {ORDER_STATUS_SEQUENCE.map((s, i) => {
                const isDone   = i < currentIdx;
                const isActive = i === currentIdx;

                // Find the timestamp for this status from status_timeline
                const timeline = Array.isArray(order.status_timeline) ? order.status_timeline : [];
                const entry    = timeline.find(e => e.status === s.key);
                const entryDate = entry?.timestamp
                  ? new Date(entry.timestamp).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
                  : null;

                return (
                  <div key={s.key} style={{ display: 'flex', gap: 20, marginBottom: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: isDone ? 'oklch(50% 0.18 145)' : isActive ? 'var(--accent)' : 'var(--bg-alt)',
                        border: `2px solid ${isDone ? 'oklch(50% 0.18 145)' : isActive ? 'var(--accent)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {isDone   && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        {isActive && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                      </div>
                      {i < ORDER_STATUS_SEQUENCE.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 32, background: isDone ? 'oklch(50% 0.18 145)' : 'var(--border)', marginTop: 4 }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: 28, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 2 }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: isDone || isActive ? 'var(--text)' : 'var(--text-muted)' }}>{s.label}</div>
                        {(isDone || isActive) && entryDate && (
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{entryDate}</div>
                        )}
                      </div>
                      {isActive && s.note && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 4 }}>{s.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 16, padding: '16px 20px', background: 'var(--accent-tint)', borderRadius: 12, border: '1px solid var(--accent-tint2)' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>
                Questions about your order? Contact us at <strong>hello@certo.ng</strong> or via <a href={`https://wa.me/${typeof CERTO_WA_NUMBER !== 'undefined' ? CERTO_WA_NUMBER : '2348057575906'}`} target="_blank" style={{ color: 'var(--accent)', fontWeight: 600 }}>WhatsApp</a>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── About ────────────────────────────────────────────────────────────────────
const AboutPage = ({ navigate }) => (
  <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 48px 100px' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 20 }}>Our story</div>
      <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1, marginBottom: 48 }}>
        Why I built<br/>Certo
      </h1>

      {[
        { p: `In 2025, I was trying to buy an iPhone 15 Pro Max. Jumia's prices were insane, so I went looking elsewhere. That's when I came across a Twitter post — not from a brand, but from a girl sharing how she'd relocated to the US and gone to an Apple Store to trade in her iPhone 14 Pro for a new one. The staff checked her phone, stopped the process, and called the police. They told her the device was stolen. A phone she had bought brand new from a popular store in Lagos. She had receipts. Unboxing videos. Everything. That was the only reason they let her go.` },
        { p: `That story shook me. I spent the next few weeks reading more of them — people receiving wrong devices, cloned serials, refurbished units sold as new. It made me put off buying for another three months. Eventually, a close friend who sold gadgets helped me understand how these scams worked and offered to sell me a used iPhone 15 Pro Max — 95% battery health — for ₦1.3M. He promised a full refund or free replacement if anything went wrong. I only trusted it because it was him. That's how I got my first Apple device.` },
        { p: `Then there was my MacBook. I ordered it online. The listing said brand new. It arrived in perfect condition, sealed box and everything. Two months later the RAM started failing randomly. I took it to an engineer and he told me it had been repaired before — refurbished components, no Apple warranty, nothing. I had paid full price and had no idea.` },
        { p: `Two devices. Two different kinds of dishonesty. And the same lesson both times: in this market, trust has to be earned with evidence, not just promised. Nobody was going to build that bridge for me, so I decided to build it myself.` },
        { p: `Certo buys directly from Apple US. Every device comes with the original Apple order receipt and a verified serial number you can check yourself on Apple's website. We handle shipping, customs, and delivery door-to-door — no middlemen, no surprises. And if anything goes wrong, you get your money back. Full stop.` },
        { p: `The name comes from Italian. Certo means "certainly" — as in, yes, absolutely, without a doubt. That's the standard I'm holding myself to. You should know exactly what you're buying, exactly where it came from, and exactly what happens if something isn't right.` },
        { p: `This is my business. My name is behind every order. If you have a question before buying, message us on WhatsApp — we actually pick up.` },
      ].map((block, i) => (
        <p key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.85, color: i === 6 ? 'var(--text)' : 'var(--text-muted)', marginBottom: 28 }}>
          {block.p}
        </p>
      ))}

      {/* Transparency note */}
      <div style={{ margin: '40px 0 32px', padding: '24px 28px', borderRadius: 14, background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>In the interest of full transparency</div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.75, color: 'var(--text-muted)', margin: '0 0 10px' }}>
          Certo is <strong style={{ color: 'var(--text)' }}>not an Apple Authorized Reseller or distributor</strong>. We purchase genuine Apple products directly from Apple US as retail customers and import them to Nigeria. Every device is factory-sealed, serial-verified, and comes with its original Apple US warranty intact at the time of sale.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.75, color: 'var(--text-muted)', margin: 0 }}>
          We do not claim to be owned by, affiliated with, endorsed by, or in any way connected to Apple Inc. Apple, iPhone, iPad, Mac, AirPods, Apple Watch, and AppleCare are trademarks of Apple Inc., registered in the US and other countries.
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 40, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('shop')} style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 10, padding: '14px 28px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700 }}>Shop now →</button>
        <button onClick={() => navigate('contact')} style={{ background: 'transparent', color: 'var(--text)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '14px 28px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15 }}>Get in touch</button>
      </div>
    </div>
  </div>
);

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQPage = () => {
  const [open, setOpen] = React.useState(null);

  const sections = [
    {
      title: 'About the products',
      items: [
        { q: 'Are these genuine Apple products?', a: 'Yes. Every device is purchased directly from Apple.com US. We include the Apple order confirmation and a serial certificate with every delivery. You can verify any serial on apple.com/coverage.' },
        { q: 'What does "New" condition mean?', a: 'Sealed box, never activated. The device has never been opened since leaving the Apple factory.' },
        { q: 'What does "Refurbished" mean on Certo?', a: 'Grade A Apple-certified refurbished units. Tested to Apple\'s own standards. Minor cosmetic marks possible but fully functional. Comes with new battery and all accessories.' },
        { q: 'Where exactly are the products sourced?', a: 'Directly from Apple.com US. We do not buy from third-party resellers, grey markets, or grey importers.' },
      ]
    },
    {
      title: 'About payment',
      items: [
        { q: 'What currencies do you accept?', a: 'Naira (₦) via Flutterwave, US Dollars via card or crypto (USDC / BTC).' },
        { q: 'How does the forex clause work?', a: 'Naira prices are calculated at the current buying rate shown on the site. When you pay, you pay at that rate. We do not benefit from rate movement after payment — if the naira depreciates before we procure your device, we still buy at the rate locked in at checkout.' },
        { q: 'When are you charged?', a: 'Immediately at checkout. We begin procurement within 24 hours of payment clearing.' },
        { q: 'Is the Flutterwave payment secure?', a: 'Yes. Flutterwave is PCI-DSS compliant and processes transactions securely across Nigeria. We never see your card details.' },
      ]
    },
    {
      title: 'About delivery',
      items: [
        { q: 'How long does delivery take?', a: 'Most orders deliver within 10–20 business days depending on the product. MacBooks take slightly longer due to size. We give you a specific estimate on each product page.' },
        { q: 'What happens if delivery exceeds 25 days?', a: 'If your order has not been delivered after 25 business days from the date of payment, you are entitled to a full refund — no questions, no conditions.' },
        { q: 'Do I pay any customs charges?', a: 'No. All customs duties and clearance fees are included in the price you pay. There are no surprise charges on delivery.' },
        { q: 'Do you deliver to all states?', a: 'Yes. We deliver to all 36 states and the FCT. Delivery times may vary slightly by location.' },
      ]
    },
    {
      title: 'About warranty & AppleCare',
      items: [
        { q: 'What does the Certo warranty cover?', a: 'Manufacturing defects for 12 months from delivery date. If your device develops a hardware fault within 12 months of delivery that is not caused by physical damage, we cover repair or replacement.' },
        { q: 'Who are the authorized service providers in Nigeria?', a: 'Mac Center Nigeria, iStore Nigeria, and Ensure Services (Lagos, Abuja, and other locations). The full list is on apple.com/retail/authorized.' },
        { q: 'How do I activate AppleCare+?', a: 'Download the AppleCare app or go to settings.apple.com within 60 days of receiving your device. You\'ll need your Apple ID and the serial number. Important: AppleCare purchased for a US device does not provide service coverage in Nigeria — repairs under AppleCare would need to be processed in the US. If you need help with activation, message us on WhatsApp.' },
        { q: 'Can I use AppleCare at a service provider in Nigeria?', a: 'No. AppleCare coverage for a US-purchased device does not apply in Nigeria. This is Apple\'s regional policy and is outside our control. What does apply is Certo\'s own 12-month warranty, which covers manufacturing defects and is serviced through Apple Authorised Service Providers in Nigeria.' },
      ]
    },
    {
      title: 'About Certo',
      items: [
        { q: 'Who runs Certo?', a: 'Certo is run by a single founder based in Lagos. Every order is personally overseen. There\'s no call center — you reach the person who runs the business.' },
        { q: 'How do I reach you?', a: 'WhatsApp is fastest. Our number is on the contact page. We also respond to email and DMs on Twitter (@certo_ng), Instagram (@certo.ng), and TikTok (@certo.ng) within 24 hours on business days.' },
        { q: 'What happens if something goes wrong?', a: 'We fix it. If your device arrives damaged, failed, or with a serial that doesn\'t check out — you get a refund or replacement. We\'ve built our business on not having to argue about this.' },
        { q: 'Is Certo a registered business?', a: 'Yes. Certo Technologies is a registered business in Nigeria under the Corporate Affairs Commission (CAC).' },
      ]
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 48px 100px' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>FAQ</div>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 48, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 16 }}>Frequently Asked Questions</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 56 }}>
          Every question a reasonable person would ask before sending ₦1.7M to a website.
        </p>

        {sections.map((section, si) => (
          <div key={si} style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid var(--accent)' }}>{section.title}</h2>
            {section.items.map((item, qi) => {
              const key = `${si}-${qi}`;
              const isOpen = open === key;
              return (
                <div key={qi} style={{ borderBottom: '1px solid var(--border)' }}>
                  <button onClick={() => setOpen(isOpen ? null : key)} style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                  }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: 'var(--text)', textAlign: 'left' }}>{item.q}</span>
                    <span style={{ color: 'var(--accent)', fontSize: 20, flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(45deg)' : 'none' }}>+</span>
                  </button>
                  {isOpen && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.75, paddingBottom: 20, marginTop: -4 }}>
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Contact ──────────────────────────────────────────────────────────────────

const Eyebrow = ({ children, color = 'var(--accent)' }) => (
  <div style={{
    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.16em', textTransform: 'uppercase',
    color, marginBottom: 16,
  }}>{children}</div>
);

const SLAPill = () => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 12px', borderRadius: 100,
    background: 'oklch(95% 0.05 155)',
    color: 'oklch(35% 0.15 155)',
    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  }}>
    <span style={{
      width: 6, height: 6, borderRadius: '50%',
      background: 'oklch(45% 0.18 155)',
      animation: 'certoLivePulse 1.8s ease-in-out infinite',
    }} />
    Within 24 hrs · usually faster
  </div>
);

const WhatsAppIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 2.5a9.5 9.5 0 0 0-8.13 14.46L2.5 21.5l4.7-1.32A9.5 9.5 0 1 0 12 2.5Zm5.4 13.42c-.23.65-1.36 1.25-1.9 1.32-.5.07-1.13.1-1.83-.12a17.4 17.4 0 0 1-1.66-.61 13.1 13.1 0 0 1-5.03-4.45c-.37-.5-.97-1.34-.97-2.56 0-1.21.63-1.81.86-2.06.23-.25.5-.31.66-.31h.5c.16 0 .37-.06.57.43.23.55.78 1.92.85 2.06.07.14.11.31.02.5-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.04.92 1.92 1.21 2.2 1.35.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.6.76 1.87.9.27.14.46.21.52.32.07.12.07.66-.15 1.31Z"
      fill={color}
    />
  </svg>
);

const EmailIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2.5" y="4" width="15" height="12" rx="2" stroke={color} strokeWidth="1.5"/>
    <path d="M3 5l7 5 7-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TwitterIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M14.5 3h2.6l-5.7 6.5L18 17h-5.3l-4.1-5.4L3.7 17H1.1l6.1-7-5.8-7h5.4l3.7 4.9L14.5 3Zm-.9 12.5h1.5L6.5 4.4H4.9l8.7 11.1Z" fill={color}/>
  </svg>
);

const TikTokIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    {/* Minimal TikTok glyph — a music-note shape with the brand fork */}
    <path d="M12.5 2v8.7a2.3 2.3 0 11-2.3-2.3v2a.3.3 0 00-.3.3.3.3 0 10.6 0V2h2zm.5 0a3.5 3.5 0 003.5 3.5v2A5.5 5.5 0 0113 5.6z" fill={color}/>
  </svg>
);

const InstagramIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="14" height="14" rx="4" stroke={color} strokeWidth="1.5"/>
    <circle cx="10" cy="10" r="3.5" stroke={color} strokeWidth="1.5"/>
    <circle cx="14.2" cy="5.8" r="1" fill={color}/>
  </svg>
);

const FloatingInput = ({ label, value, onChange, type = 'text', autoComplete, multiline = false }) => {
  const [focused, setFocused] = React.useState(false);
  const active = focused || (value && value.length > 0);

  const baseStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: multiline ? '24px 16px 14px' : '24px 16px 10px',
    borderRadius: 12,
    border: `1.5px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
    background: 'var(--bg)',
    fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text)',
    outline: 'none', resize: multiline ? 'vertical' : 'none',
    minHeight: multiline ? 140 : 'auto',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: focused ? '0 0 0 4px var(--accent-tint, rgba(217,119,87,0.12))' : 'none',
  };

  const labelStyle = {
    position: 'absolute',
    left: 16,
    top: active ? 7 : multiline ? 22 : 18,
    fontSize: active ? 11 : 14,
    fontFamily: 'var(--font-body)',
    fontWeight: active ? 600 : 500,
    color: focused ? 'var(--accent)' : 'var(--text-muted)',
    letterSpacing: active ? '0.06em' : 'normal',
    textTransform: active ? 'uppercase' : 'none',
    pointerEvents: 'none',
    transition: 'all 0.15s cubic-bezier(0.22, 1, 0.36, 1)',
    background: 'transparent',
  };

  const handlers = {
    value,
    onChange,
    onFocus: () => setFocused(true),
    onBlur:  () => setFocused(false),
    autoComplete,
  };

  return (
    <div style={{ position: 'relative', marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {multiline ? (
        <textarea rows={5} style={baseStyle} {...handlers} />
      ) : (
        <input type={type} style={baseStyle} {...handlers} />
      )}
    </div>
  );
};

const ContactPage = () => {
  const { isMobile } = useResponsive();
  const [form,    setForm]      = React.useState({ name: '', email: '', message: '' });
  const [sent,    setSent]      = React.useState(false);
  const [sending, setSending]   = React.useState(false);
  const [sendError, setSendError] = React.useState('');

  const canSend = form.name && form.email && form.message && !sending;

  const send = async () => {
    setSending(true);
    setSendError('');
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to send');
      setSent(true);
    } catch (e) {
      setSendError(e.message || 'Something went wrong. Please try WhatsApp or email directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', paddingTop: 80,
      position: 'relative', overflow: 'hidden',
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', top: -120, right: -180,
        width: 600, height: 600, pointerEvents: 'none',
        background: 'radial-gradient(circle, var(--accent-tint, rgba(217,119,87,0.18)) 0%, transparent 65%)',
        opacity: 0.7,
      }} />

      <style>{`
        @keyframes certoLivePulse {
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50%      { opacity: 1;   transform: scale(1); }
        }
        @keyframes certoSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        position: 'relative',
        maxWidth: 1200, margin: '0 auto',
        padding: isMobile ? '36px 20px 80px' : '72px 48px 120px',
      }}>
        {/* Hero */}
        <header style={{ marginBottom: isMobile ? 40 : 64, maxWidth: 760 }}>
          <Eyebrow>Talk to us</Eyebrow>
          <h1 style={{
            fontFamily: 'var(--font-head)', fontWeight: 800,
            fontSize: isMobile ? 52 : 'clamp(56px, 6vw, 96px)',
            letterSpacing: '-0.04em', color: 'var(--text)',
            margin: 0, lineHeight: 0.95,
          }}>
            One founder.<br />
            <span style={{ fontStyle: 'italic', fontWeight: 700, color: 'var(--accent)' }}>
              One inbox.
            </span>
          </h1>
          <p style={{
            marginTop: 28, maxWidth: 540,
            fontFamily: 'var(--font-body)', fontSize: isMobile ? 16 : 18,
            color: 'var(--text-muted)', lineHeight: 1.65,
          }}>
            We don't run a call centre and we don't use bots. Every message comes
            straight to the person who runs Certo — usually replied to within
            a few hours, never longer than a business day.
          </p>
        </header>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 32 : 64,
          alignItems: 'start',
        }}>
          {/* Left: contact methods */}
          <div>
            {/* WhatsApp hero card */}
            <a
              href="https://wa.me/2348057575906"
              target="_blank" rel="noreferrer"
              style={{
                display: 'block', textDecoration: 'none',
                padding: 24, borderRadius: 18,
                background: 'var(--text)', color: 'white',
                marginBottom: 16,
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 20px 40px -16px rgba(26,23,20,0.25)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 24px 48px -16px rgba(26,23,20,0.32)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 20px 40px -16px rgba(26,23,20,0.25)';
              }}
            >
              <div aria-hidden="true" style={{
                position: 'absolute', top: -20, right: -20,
                opacity: 0.06, pointerEvents: 'none',
              }}>
                <WhatsAppIcon size={180} color="white" />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.6)', marginBottom: 12,
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#34d399',
                  animation: 'certoLivePulse 1.8s ease-in-out infinite',
                }} />
                Fastest channel
              </div>
              <div style={{
                fontFamily: 'var(--font-head)', fontWeight: 700,
                fontSize: 28, letterSpacing: '-0.02em',
                lineHeight: 1.05, marginBottom: 8,
              }}>
                WhatsApp us<br />
                <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
                  +234 805 757 5906
                </span>
              </div>
              <div style={{
                marginTop: 20,
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '11px 18px', borderRadius: 10,
                background: 'rgba(255,255,255,0.12)',
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              }}>
                <WhatsAppIcon size={16} color="white" />
                Open in WhatsApp →
              </div>
            </a>

            {/* Secondary channels */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 18, background: 'var(--bg)', overflow: 'hidden' }}>
              {[
                { Icon: EmailIcon,     label: 'Email',       val: 'hello@certo.ng',  sub: 'Replies within 24 hours on business days', href: 'mailto:hello@certo.ng' },
                { Icon: TwitterIcon,   label: 'Twitter / X', val: '@certo_ng',       sub: 'DMs open · public questions welcome',      href: 'https://x.com/certo_ng' },
                { Icon: InstagramIcon, label: 'Instagram',   val: '@certo.ng',       sub: 'DMs open · behind-the-scenes content',     href: 'https://instagram.com/certo.ng' },
                { Icon: TikTokIcon,    label: 'TikTok',      val: '@certo.ng',       sub: 'Unboxings, real device tests, customer wins', href: 'https://www.tiktok.com/@certo.ng' },
              ].map((c, i, arr) => (
                <a
                  key={c.label}
                  href={c.href} target="_blank" rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '18px 20px', textDecoration: 'none', color: 'inherit',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'var(--bg-alt)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, color: 'var(--text)',
                  }}>
                    <c.Icon size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{c.val}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{c.label}</span>
                      {' · '}{c.sub}
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>→</span>
                </a>
              ))}
            </div>

            {/* Founder note */}
            <div style={{
              marginTop: 32, padding: '20px 24px', borderRadius: 14,
              background: 'var(--bg-alt)', borderLeft: '3px solid var(--accent)',
            }}>
              <div style={{
                fontFamily: 'var(--font-head)', fontStyle: 'italic',
                fontWeight: 600, fontSize: 16, color: 'var(--text)',
                letterSpacing: '-0.01em', lineHeight: 1.5, marginBottom: 8,
              }}>
                "If you message me at 11pm, I'll probably reply at 11pm."
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
                — Chidile, Founder &amp; sole operator, Lagos
              </div>
            </div>
          </div>

          {/* Right: form card */}
          <div style={{
            border: '1px solid var(--border)', borderRadius: 20,
            background: 'var(--bg)',
            padding: isMobile ? 24 : 32,
            boxShadow: '0 20px 40px -24px rgba(26,23,20,0.12)',
            position: 'sticky', top: 96,
          }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '40px 12px' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'var(--bg-alt)', border: '2px solid var(--accent)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 24, color: 'var(--accent)',
                  fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 32,
                }}>✓</div>
                <h3 style={{
                  fontFamily: 'var(--font-head)', fontWeight: 800,
                  fontSize: 32, letterSpacing: '-0.03em',
                  color: 'var(--text)', margin: '0 0 12px', lineHeight: 1,
                }}>
                  Message<br />
                  <span style={{ fontStyle: 'italic', fontWeight: 700, color: 'var(--accent)' }}>received.</span>
                </h3>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 15,
                  color: 'var(--text-muted)', lineHeight: 1.65,
                  maxWidth: 360, margin: '0 auto 28px',
                }}>
                  Thanks {form.name ? form.name.split(' ')[0] : 'for reaching out'}. I'll get back to you within 24 hours on business days — usually faster.
                </p>
                <a
                  href="https://wa.me/2348057575906"
                  target="_blank" rel="noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '12px 22px', borderRadius: 10,
                    background: 'var(--text)', color: 'white',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
                  }}
                >
                  <WhatsAppIcon size={16} color="white" />
                  Need a faster reply? WhatsApp
                </a>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap',
                }}>
                  <div>
                    <h2 style={{
                      fontFamily: 'var(--font-head)', fontWeight: 800,
                      fontSize: 24, letterSpacing: '-0.02em',
                      color: 'var(--text)', margin: '0 0 6px',
                    }}>Send a message</h2>
                    <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
                      Or just say hello.
                    </p>
                  </div>
                  <SLAPill />
                </div>

                <FloatingInput
                  label="Your name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  autoComplete="name"
                />
                <FloatingInput
                  label="Email address"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
                <FloatingInput
                  label="What's on your mind?"
                  multiline
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                />

                {sendError && (
                  <div style={{
                    marginTop: 4, marginBottom: 14,
                    padding: '12px 16px', borderRadius: 10,
                    background: 'oklch(97% 0.02 20)', border: '1px solid oklch(85% 0.05 20)',
                    fontFamily: 'var(--font-body)', fontSize: 13, color: 'oklch(40% 0.15 20)',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
                    <span>{sendError}</span>
                  </div>
                )}

                <button
                  disabled={!canSend}
                  onClick={send}
                  style={{
                    width: '100%', marginTop: 8,
                    padding: '18px 20px', borderRadius: 12, border: 'none',
                    background: canSend ? 'var(--accent)' : 'var(--border)',
                    color: canSend ? 'white' : 'var(--text-muted)',
                    cursor: canSend ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
                    letterSpacing: '0.01em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: canSend ? '0 8px 20px -8px rgba(217,119,87,0.5)' : 'none',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { if (canSend) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { if (canSend) e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {sending ? (
                    <>
                      <span style={{
                        width: 14, height: 14, borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: 'white',
                        animation: 'certoSpin 0.8s linear infinite',
                        display: 'inline-block',
                      }} />
                      Sending…
                    </>
                  ) : (
                    <>Send message <span>→</span></>
                  )}
                </button>

                <p style={{
                  marginTop: 16, marginBottom: 0,
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6,
                }}>
                  By sending, you agree we may reply via email.<br />
                  We don't share your details with anyone.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Privacy Policy ───────────────────────────────────────────────────────────
const PrivacyPolicyPage = ({ navigate }) => {
  const { isMobile } = useResponsive();

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, color: 'var(--text)', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid var(--accent)' }}>{title}</h2>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.85 }}>{children}</div>
    </div>
  );

  const P = ({ children }) => <p style={{ marginBottom: 16 }}>{children}</p>;
  const Ul = ({ children }) => <ul style={{ marginBottom: 16, paddingLeft: 22, lineHeight: 1.85 }}>{children}</ul>;
  const Li = ({ children }) => <li style={{ marginBottom: 6 }}>{children}</li>;
  const Bold = ({ children }) => <strong style={{ color: 'var(--text)' }}>{children}</strong>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '40px 20px 80px' : '60px 48px 100px' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>Legal</div>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 36 : 52, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 12 }}>Privacy Policy</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-muted)', marginBottom: 56 }}>Last updated: June 2026 · Version 2.0</p>

        <Section title="1. About this policy">
          <P>
            This policy explains how Certo Technologies ("Certo", "we", "us") collects, uses, stores,
            and protects your personal data. It is written to comply with the
            <Bold> Nigeria Data Protection Act 2023</Bold> ("NDPA") and the
            <Bold> Nigeria Data Protection Regulation 2019</Bold> ("NDPR"), as supplemented by
            guidance from the <Bold>Nigeria Data Protection Commission (NDPC)</Bold>.
          </P>
          <P>
            Certo is the <Bold>data controller</Bold> of your personal data. The point of contact
            for all data protection matters is our Data Protection Officer
            (see §10).
          </P>
        </Section>

        <Section title="2. What we collect">
          <P>When you place an order, we collect:</P>
          <Ul>
            <Li>Your full legal name</Li>
            <Li>Your phone number (for delivery + WhatsApp support)</Li>
            <Li>Your delivery address and state</Li>
            <Li>Your email address</Li>
            <Li>For orders above ₦1,000,000: government-issued ID as required by our AML/CFT/CPF Policy</Li>
          </Ul>
          <P>
            When you pay in naira via Flutterwave, your card details go directly to Flutterwave —
            we never see, store, or have access to your card number, CVV, or any banking
            credentials. Flutterwave is PCI-DSS compliant. We retain only the Flutterwave
            transaction reference for reconciliation.
          </P>
          <P>
            We also retain your order history, the messages you exchange with us via WhatsApp or
            email, and basic technical information (IP address used at order time, browser type) for
            security and fraud-prevention purposes.
          </P>
        </Section>

        <Section title="3. Lawful basis for processing">
          <P>
            Under section 25 of the NDPA, we must identify a lawful basis for each processing
            activity. Our bases are:
          </P>
          <Ul>
            <Li><Bold>Performance of a contract</Bold> — to process your order, take payment, arrange delivery, and provide warranty/refund service.</Li>
            <Li><Bold>Legal obligation</Bold> — to retain transaction records and identification information under the NDPA, the Money Laundering (Prevention and Prohibition) Act 2022, and the Companies and Allied Matters Act.</Li>
            <Li><Bold>Legitimate interests</Bold> — to prevent fraud, secure our systems, and improve our service. Where we rely on legitimate interests, you may object (see §6).</Li>
            <Li><Bold>Consent</Bold> — for any optional communications (e.g. post-purchase follow-up). You may withdraw consent at any time without affecting any prior lawful processing.</Li>
          </Ul>
        </Section>

        <Section title="4. How we use your data">
          <P>We use your information to:</P>
          <Ul>
            <Li>Process, fulfil, and deliver your order</Li>
            <Li>Send you order, delivery, and warranty updates</Li>
            <Li>Provide customer support and resolve disputes</Li>
            <Li>Comply with our anti-money-laundering, tax, and accounting obligations</Li>
            <Li>Detect and prevent fraud, abuse, and security incidents</Li>
            <Li>With your separate consent, send you post-purchase product feedback requests</Li>
          </Ul>
          <P>
            We <Bold>do not</Bold> sell your personal data. We <Bold>do not</Bold> use it for
            third-party advertising. We <Bold>do not</Bold> profile you for automated
            decision-making that produces legal or similarly significant effects.
          </P>
        </Section>

        <Section title="5. Who we share data with">
          <P>We share the minimum data necessary with the following categories of processor:</P>
          <Ul>
            <Li><Bold>Flutterwave</Bold> — for naira payment processing (PCI-DSS, Nigeria & global)</Li>
            <Li><Bold>Our logistics partner</Bold> — for last-mile delivery (Nigeria)</Li>
            <Li><Bold>Kuda Bank</Bold> — when you pay via bank transfer to our Kuda business account</Li>
            <Li><Bold>SMTP provider</Bold> — for transactional emails (servers located in Germany)</Li>
            <Li><Bold>Vercel Inc.</Bold> — our website hosting partner (global edge network)</Li>
            <Li><Bold>Neon Inc.</Bold> — our database hosting provider (servers located in the EU)</Li>
          </Ul>
          <P>
            We may also disclose your data to law-enforcement agencies (EFCC, NPF, NFIU, NDPC,
            FIRS) where required by a valid Nigerian legal order or where disclosure is required
            for the prevention or detection of crime.
          </P>
        </Section>

        <Section title="6. Your rights as a data subject">
          <P>
            Under Part V of the NDPA, you have the following rights with respect to your personal
            data:
          </P>
          <Ul>
            <Li><Bold>Right to be informed</Bold> about how your data is processed (this policy)</Li>
            <Li><Bold>Right of access</Bold> — request a copy of the personal data we hold on you</Li>
            <Li><Bold>Right to rectification</Bold> — correct inaccurate or incomplete data</Li>
            <Li><Bold>Right to erasure</Bold> ("right to be forgotten") — subject to our legal record-keeping obligations</Li>
            <Li><Bold>Right to restrict processing</Bold> while a complaint or query is investigated</Li>
            <Li><Bold>Right to data portability</Bold> — receive your data in a structured, commonly-used machine-readable format</Li>
            <Li><Bold>Right to object</Bold> to processing carried out on the basis of legitimate interests, or for direct marketing</Li>
            <Li><Bold>Right to withdraw consent</Bold> at any time where consent is the basis for processing</Li>
            <Li><Bold>Right not to be subject to automated decision-making</Bold> that produces legal or similarly significant effects</Li>
            <Li><Bold>Right to lodge a complaint</Bold> with the Nigeria Data Protection Commission (NDPC) — see §11</Li>
          </Ul>
          <P>
            To exercise any of these rights, email us at <Bold>dpo@certo.ng</Bold> with the subject
            line "Data Request". We will respond within <Bold>14 days</Bold> as required by the
            NDPA, and free of charge. We may ask for proof of identity before acting on the request.
          </P>
        </Section>

        <Section title="7. Data retention">
          <P>
            We retain different categories of data for different periods, based on the purpose and
            applicable legal obligations:
          </P>
          <Ul>
            <Li><Bold>Order and transaction records</Bold> — 7 years (Companies and Allied Matters Act, FIRS, AML record-keeping)</Li>
            <Li><Bold>Customer identification documents</Bold> — 5 years from the end of the relationship (MLPPA 2022 s. 7)</Li>
            <Li><Bold>Warranty and certificate-of-authenticity records</Bold> — indefinitely (the certificate is a living public record)</Li>
            <Li><Bold>Email correspondence</Bold> — 3 years</Li>
            <Li><Bold>WhatsApp conversation history</Bold> — held on the WhatsApp platform; subject to Meta's privacy terms</Li>
            <Li><Bold>Marketing-consent records</Bold> — until consent is withdrawn, plus 1 year for audit purposes</Li>
          </Ul>
          <P>
            After the applicable retention period expires, your personal data is securely deleted
            or fully anonymised unless there is an unresolved legal, regulatory, or warranty matter.
          </P>
        </Section>

        <Section title="8. Cross-border data transfers">
          <P>
            Some of our processors operate outside Nigeria. We transfer personal data
            internationally only where:
          </P>
          <Ul>
            <Li>The destination country has been recognised by the NDPC as providing an adequate level of protection (e.g. EU member states under the GDPR), or</Li>
            <Li>The processor has signed standard contractual clauses providing equivalent protection, or</Li>
            <Li>You have given your explicit consent to the transfer.</Li>
          </Ul>
          <P>
            Specifically, your data may be processed in: <Bold>Nigeria</Bold> (Certo, Flutterwave,
            Kuda), <Bold>Germany</Bold> (SMTP / email infrastructure), <Bold>European Union</Bold>
            (database hosting via Neon), and <Bold>multiple Vercel edge regions</Bold> (website
            hosting). All transfers outside Nigeria are made under contractual safeguards
            consistent with section 41 of the NDPA.
          </P>
        </Section>

        <Section title="9. Security & breach notification">
          <P>We protect your personal data using:</P>
          <Ul>
            <Li>TLS / HTTPS encryption for all data in transit</Li>
            <Li>Encryption at rest in our database</Li>
            <Li>Role-based access control to admin systems</Li>
            <Li>HMAC-signed admin session tokens</Li>
            <Li>Rate limiting on login and public endpoints</Li>
            <Li>Server-side webhook signature verification for payment provider events</Li>
            <Li>PII-redaction in all production server logs</Li>
          </Ul>
          <P>
            In the event of a personal data breach likely to result in harm to any data subject, we
            will notify the <Bold>Nigeria Data Protection Commission (NDPC)</Bold> within
            <Bold> 72 hours</Bold> of becoming aware of the breach, and will notify affected data
            subjects without undue delay, in accordance with section 40 of the NDPA.
          </P>
        </Section>

        <Section title="10. Cookies & local storage">
          <P>
            This website does not use advertising cookies, tracking pixels, cross-site identifiers,
            or third-party analytics. We use only essential, first-party storage:
          </P>
          <Ul>
            <Li>Admin session token (sessionStorage; cleared when the tab closes)</Li>
            <Li>Locked exchange rate (localStorage; cached for 24 hours)</Li>
            <Li>Cart contents (localStorage; cleared when you complete or cancel an order)</Li>
          </Ul>
          <P>None of this data is transmitted to third parties.</P>
        </Section>

        <Section title="11. Data Protection Officer & complaints">
          <P>
            Our Data Protection Officer is responsible for all NDPA / NDPR matters, including
            data-subject requests, breach response, and internal compliance.
          </P>
          <P>
            Contact: <Bold>dpo@certo.ng</Bold> (we will respond within 14 days)
          </P>
          <P>
            If you are unsatisfied with our handling of your data, you have the right to lodge a
            complaint with the Nigeria Data Protection Commission:
          </P>
          <Ul>
            <Li>Nigeria Data Protection Commission (NDPC) — <a href="https://ndpc.gov.ng" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>ndpc.gov.ng</a></Li>
            <Li>Address: 18 Bobo Street, off Gimbiya Street, Garki II, Abuja, FCT</Li>
          </Ul>
        </Section>

        <Section title="12. Children">
          <P>
            Certo's services are intended for adults aged 18 and over. We do not knowingly collect
            personal data from children. If you believe a child has provided personal data to us,
            contact <Bold>dpo@certo.ng</Bold> and we will delete the data and any associated
            account.
          </P>
        </Section>

        <Section title="13. Changes to this policy">
          <P>
            We will publish a new version of this policy whenever there is a material change to how
            we process personal data. The "Last updated" date at the top of this page reflects the
            most recent version. Historical versions are available on request.
          </P>
        </Section>

        <Section title="14. Contact">
          <P>
            Certo Technologies is incorporated in Nigeria under the Companies and Allied Matters
            Act. General privacy queries go to <Bold>dpo@certo.ng</Bold>. AML/CFT/CPF queries go to
            <Bold> compliance@certo.ng</Bold>. All other contact details are on our
            <a onClick={(e) => { e.preventDefault(); navigate('contact'); }} href="/contact" style={{ color: 'var(--accent)', marginLeft: 4 }}>contact page</a>.
          </P>
        </Section>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('terms')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>Terms of Service →</button>
          <button onClick={() => navigate('refund')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>Refund Policy →</button>
          <button onClick={() => navigate('aml')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>AML / CFT / CPF Policy →</button>
        </div>
      </div>
    </div>
  );
};

// ─── Terms of Service ─────────────────────────────────────────────────────────
const TermsOfServicePage = ({ navigate }) => {
  const { isMobile } = useResponsive();

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, color: 'var(--text)', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid var(--accent)' }}>{title}</h2>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.85 }}>{children}</div>
    </div>
  );

  const P = ({ children }) => <p style={{ marginBottom: 16 }}>{children}</p>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '40px 20px 80px' : '60px 48px 100px' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>Legal</div>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 36 : 52, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 12 }}>Terms of Service</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-muted)', marginBottom: 56 }}>Last updated: April 2026</p>

        <Section title="Who you are buying from">
          <P>You are purchasing from Certo Technologies, a registered Nigerian business. When you place an order, you enter into a contract directly with us. We are the importer, seller, and service provider. There is no marketplace or middleman.</P>
        </Section>

        <Section title="What we promise">
          <P>Every device sold on Certo is purchased directly from Apple.com US. Every serial number is verified on Apple's official coverage checker before dispatch. The Apple US warranty is intact at the time of sale — we will provide the Apple order confirmation as proof.</P>
          <P>We will deliver your order within the estimated timeframe shown on the product page. If we fail to deliver within 25 business days of payment, you are entitled to a full refund under our Refund Policy.</P>
          <P>The naira price you see at checkout is the price you pay. We will not change the price after payment has been received.</P>
        </Section>

        <Section title="The forex clause">
          <P>Naira prices are calculated at the live USD/NGN buying rate at the time of your checkout. By completing payment, you confirm that you understand and accept the naira amount charged at the rate shown. This rate is not negotiable after payment is made.</P>
          <P>If you pay in USD, no forex conversion applies. You are charged the exact USD amount shown at checkout.</P>
        </Section>

        <Section title="Your responsibilities">
          <P>You must provide an accurate delivery address and a working phone number. If a delivery attempt fails because of an incorrect address or an unreachable phone number, you may incur a redelivery fee. If a second attempt also fails, the device will be held for 10 business days before being returned — and a refund will be issued minus the return logistics cost.</P>
          <P>You must inspect your device on delivery and report any damage within 24 hours of receipt. Damage reported after 24 hours may not be eligible for a return.</P>
        </Section>

        <Section title="What we do not cover">
          <P>We do not cover damage caused by accidents, drops, liquid exposure, or unauthorised repairs. We do not cover consumable parts (batteries after the first 12 months, charging cables, earphones). We do not cover software issues unrelated to hardware faults.</P>
          <P>AppleCare+ and AppleCare One are separate products sold by Apple. They are activated by you on Apple's platform. We assist with activation but we are not responsible for Apple's decisions regarding coverage claims. Please note: AppleCare coverage for US-purchased devices does not apply in Nigeria. If you add AppleCare through Certo, repairs under that plan would need to be processed in the United States.</P>
        </Section>

        <Section title="Governing law">
          <P>These terms are governed by Nigerian law. Any dispute that cannot be resolved between us directly will be referred to a mutually agreed mediator in Lagos, Nigeria. You agree that Nigerian courts have jurisdiction over any unresolved dispute. The registered trading name is Certo Technologies.</P>
        </Section>

        <Section title="Updates to these terms">
          <P>We may update these terms from time to time. The terms that apply to your order are the terms in effect at the date of your payment. We will not apply new terms retroactively to completed transactions.</P>
        </Section>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('privacy')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>Privacy Policy →</button>
          <button onClick={() => navigate('refund')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>Refund Policy →</button>
          <button onClick={() => navigate('aml')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>AML / CFT / CPF Policy →</button>
        </div>
      </div>
    </div>
  );
};

// ─── Refund Policy ────────────────────────────────────────────────────────────
const RefundPolicyPage = ({ navigate }) => {
  const { isMobile } = useResponsive();

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, color: 'var(--text)', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid var(--accent)' }}>{title}</h2>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.85 }}>{children}</div>
    </div>
  );

  const P = ({ children }) => <p style={{ marginBottom: 16 }}>{children}</p>;

  const scenarios = [
    {
      label: 'Serial fails Apple verification',
      outcome: 'Full refund',
      detail: 'If the serial number of your device does not pass as genuine on apple.com/coverage when you receive it, we issue a full refund within 24 hours — no questions, no negotiation.',
      accent: true,
    },
    {
      label: 'Delivery exceeds 25 business days',
      outcome: 'Full refund',
      detail: 'If your order has not been delivered 25 business days after your payment date, you can request a full refund at any time. We process it within 3 business days.',
      accent: true,
    },
    {
      label: 'Device arrives physically damaged',
      outcome: 'Full refund or replacement',
      detail: 'Damage must be reported within 24 hours of delivery with photos. We will arrange collection at our cost and either replace the device or issue a full refund — your choice.',
      accent: true,
    },
    {
      label: 'Device is dead on arrival (DOA)',
      outcome: 'Full refund or replacement',
      detail: 'If your device does not power on or shows a critical hardware fault on first use, report it within 48 hours. We replace or refund.',
      accent: true,
    },
    {
      label: 'You changed your mind (before procurement)',
      outcome: 'Full refund',
      detail: 'If you cancel before we have purchased the device from Apple (typically within the first 12 hours after payment), we issue a full refund.',
      accent: false,
    },
    {
      label: 'You changed your mind (after procurement)',
      outcome: 'No refund',
      detail: 'Once we have purchased your specific device from Apple, the order cannot be cancelled. The device is configured and purchased for you specifically.',
      accent: false,
    },
    {
      label: 'Hardware fault within 12 months',
      outcome: 'Repair or replacement',
      detail: 'Manufacturing defects within 12 months of delivery are covered under our warranty. We arrange repair with an Apple Authorised Service Provider or replace the device.',
      accent: false,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '40px 20px 80px' : '60px 48px 100px' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>Legal</div>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 36 : 52, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 12 }}>Refund Policy</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-muted)', marginBottom: 24 }}>Last updated: April 2026</p>

        <div style={{ background: 'var(--accent-tint)', border: '1px solid var(--accent-tint2)', borderRadius: 16, padding: isMobile ? 20 : 28, marginBottom: 56 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text)', lineHeight: 1.75, margin: 0 }}>
            <strong>The short version:</strong> if something goes wrong on our end — the serial fails, the device is damaged, delivery takes longer than 25 days — you get a full refund, fast. We have never argued with a legitimate refund request and we do not intend to start.
          </p>
        </div>

        <Section title="Scenario by scenario">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {scenarios.map((s, i) => (
              <div key={i} style={{ borderRadius: 14, border: `1.5px solid ${s.accent ? 'var(--accent-tint2)' : 'var(--border)'}`, background: s.accent ? 'var(--accent-tint)' : 'var(--bg-alt)', padding: isMobile ? 16 : 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{s.label}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, padding: '3px 12px', borderRadius: 20, background: s.accent ? 'var(--accent)' : 'var(--border)', color: s.accent ? 'white' : 'var(--text-muted)', flexShrink: 0 }}>{s.outcome}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{s.detail}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="How to request a refund">
          <P>Message us on WhatsApp or email hello@certo.ng with your order ID and a description of the issue. If the issue involves physical damage or a serial failure, include photos. We will acknowledge your request within 4 hours on business days.</P>
          <P>Once a refund is approved, it is processed within 3 business days. Naira refunds go back to the original payment source. USD refunds are returned to the original card or crypto address.</P>
        </Section>

        <Section title="What is not covered">
          <P>Accidental damage, liquid damage, or damage from unauthorised repairs is not covered. Cosmetic wear that does not affect functionality is not covered. Software issues that can be resolved by a factory reset are not covered. Buyer's remorse after device procurement has begun is not covered.</P>
        </Section>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('privacy')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>Privacy Policy →</button>
          <button onClick={() => navigate('terms')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>Terms of Service →</button>
          <button onClick={() => navigate('aml')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>AML / CFT / CPF Policy →</button>
        </div>
      </div>
    </div>
  );
};

// ─── AML / CFT / CPF Policy ──────────────────────────────────────────────────
// Anti-Money Laundering, Countering the Financing of Terrorism, and Countering
// Proliferation Financing Policy. Based on:
//   • Money Laundering (Prevention and Prohibition) Act 2022
//   • Terrorism (Prevention and Prohibition) Act 2022
//   • Counter-Terrorism Financing Regulations
//   • NFIU (Nigerian Financial Intelligence Unit) reporting thresholds
//   • SCUML guidance for Designated Non-Financial Businesses & Professions (DNFBPs)
//
// IMPORTANT: this page is a starting template. Have it reviewed by a Nigerian
// lawyer experienced in AML/CFT/CPF compliance before publishing — particularly
// the SCUML registration status claim and the named compliance officer.
const AmlPolicyPage = ({ navigate }) => {
  const { isMobile } = useResponsive();

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, color: 'var(--text)', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid var(--accent)' }}>{title}</h2>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.85 }}>{children}</div>
    </div>
  );

  const P = ({ children }) => <p style={{ marginBottom: 16 }}>{children}</p>;
  const Ul = ({ children }) => <ul style={{ marginBottom: 16, paddingLeft: 22, lineHeight: 1.85 }}>{children}</ul>;
  const Li = ({ children }) => <li style={{ marginBottom: 6 }}>{children}</li>;
  const Bold = ({ children }) => <strong style={{ color: 'var(--text)' }}>{children}</strong>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '40px 20px 80px' : '60px 48px 100px' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>Legal · Compliance</div>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 32 : 46, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 12, lineHeight: 1.1 }}>
          AML / CFT / CPF Policy
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
          Anti-Money Laundering, Countering the Financing of Terrorism, and Countering Proliferation Financing.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', marginBottom: 56 }}>Last updated: June 2026 · Version 1.0</p>

        <Section title="1. Purpose & Commitment">
          <P>
            Certo Technologies ("Certo", "we", "us") is committed to the highest standards of
            anti-money laundering (AML), countering the financing of terrorism (CFT), and countering
            proliferation financing (CPF) compliance. We have a zero-tolerance approach to financial
            crime and will refuse, terminate, or report any business relationship that we reasonably
            suspect involves the proceeds of unlawful activity.
          </P>
          <P>
            This policy sets out how Certo identifies, manages, and reports money laundering,
            terrorist financing, and proliferation financing risks across all aspects of our
            business — from accepting customer orders to processing payments and shipping devices.
          </P>
        </Section>

        <Section title="2. Regulatory Framework">
          <P>This policy is designed to comply with the following Nigerian laws and regulations:</P>
          <Ul>
            <Li><Bold>Money Laundering (Prevention and Prohibition) Act, 2022</Bold> ("MLPPA 2022")</Li>
            <Li><Bold>Terrorism (Prevention and Prohibition) Act, 2022</Bold> ("TPPA 2022")</Li>
            <Li>The <Bold>Nigerian Financial Intelligence Unit (NFIU) Act, 2018</Bold> and NFIU reporting regulations</Li>
            <Li><Bold>Counter-Terrorism Financing Regulations, 2022</Bold></Li>
            <Li><Bold>Targeted Financial Sanctions Regulations</Bold> (UN Security Council Resolutions 1267, 1373, 1540)</Li>
            <Li>Guidance issued by <Bold>SCUML (Special Control Unit Against Money Laundering)</Bold> for Designated Non-Financial Businesses and Professions (DNFBPs)</Li>
            <Li>The <Bold>Economic and Financial Crimes Commission (Establishment) Act, 2004</Bold></Li>
          </Ul>
          <P>
            As a dealer in high-value consumer electronics, Certo treats itself as a
            DNFBP-equivalent for compliance purposes and applies risk-based AML/CFT/CPF controls
            even where statutory thresholds are not strictly triggered.
          </P>
        </Section>

        <Section title="3. Risk-Based Approach">
          <P>
            We apply a risk-based approach — meaning the depth of due diligence is proportionate
            to the assessed risk of the transaction. Risk indicators include:
          </P>
          <Ul>
            <Li><Bold>Transaction value</Bold> — orders above ₦5,000,000 trigger Enhanced Due Diligence (see §5).</Li>
            <Li><Bold>Payment method</Bold> — cryptocurrency and out-of-band USD payments require additional verification.</Li>
            <Li><Bold>Customer profile</Bold> — Politically Exposed Persons (PEPs), high-risk jurisdictions, and corporate structures with unclear beneficial owners.</Li>
            <Li><Bold>Order pattern</Bold> — repeat orders for high-value items by the same customer/address in a short period; orders structured just below reporting thresholds.</Li>
            <Li><Bold>Geography</Bold> — delivery to addresses in jurisdictions listed by the FATF as high-risk or non-cooperative.</Li>
            <Li><Bold>Behaviour</Bold> — reluctance to provide identity information, unusual urgency, or refusal to disclose source of funds for very large orders.</Li>
          </Ul>
        </Section>

        <Section title="4. Customer Due Diligence (CDD)">
          <P>For every order, we collect and retain at minimum:</P>
          <Ul>
            <Li>Full legal name</Li>
            <Li>Phone number (verified by WhatsApp contact)</Li>
            <Li>Delivery address</Li>
            <Li>Email address</Li>
            <Li>Payment trail (Flutterwave transaction ID for naira payments; bank reference for transfers)</Li>
          </Ul>
          <P>
            For orders <Bold>above ₦1,000,000</Bold> we may additionally request a valid
            government-issued ID (NIN slip, driver's licence, voter card, or international passport)
            and proof of address before dispatch.
          </P>
          <P>
            We rely on regulated third parties (Flutterwave) to complete their own customer
            identification on payment instruments. We do not waive CDD on the basis of payment
            processor verification alone.
          </P>
        </Section>

        <Section title="5. Enhanced Due Diligence (EDD)">
          <P>EDD applies when one or more of the following apply:</P>
          <Ul>
            <Li>The transaction value exceeds <Bold>₦5,000,000</Bold> in a single order or across
                multiple related orders within a 30-day period.</Li>
            <Li>The customer is identified as a Politically Exposed Person (PEP), a close associate
                of a PEP, or a family member of a PEP.</Li>
            <Li>Payment is made in cryptocurrency or by a third party other than the named customer.</Li>
            <Li>The delivery address is outside Nigeria, or to a freight forwarder.</Li>
            <Li>Other risk factors identified during the order's review.</Li>
          </Ul>
          <P>EDD measures include any combination of:</P>
          <Ul>
            <Li>Verifying the customer's identity using two independent documents</Li>
            <Li>Establishing the source of funds and source of wealth</Li>
            <Li>Senior-management approval before processing the order</Li>
            <Li>Ongoing monitoring of the customer relationship</Li>
            <Li>Refusing the transaction and, where required, filing a Suspicious Transaction Report (STR)</Li>
          </Ul>
        </Section>

        <Section title="6. Sanctions & PEP Screening">
          <P>
            Before fulfilling any order over ₦1,000,000, Certo screens the customer's name and,
            where relevant, the delivery address against:
          </P>
          <Ul>
            <Li>The <Bold>United Nations Security Council Consolidated Sanctions List</Bold></Li>
            <Li>The <Bold>OFAC SDN list</Bold> (Office of Foreign Assets Control, U.S. Department of the Treasury)</Li>
            <Li>The <Bold>EU consolidated sanctions list</Bold></Li>
            <Li>The <Bold>Nigeria Sanctions List</Bold> issued under the TPPA 2022</Li>
            <Li>Publicly available PEP databases</Li>
          </Ul>
          <P>
            A positive sanctions match results in an immediate order suspension and, where required,
            asset freezing and disclosure to the NFIU and the relevant security agency. We will not
            "tip off" the screened individual.
          </P>
        </Section>

        <Section title="7. Suspicious Transaction Reporting (STR)">
          <P>
            Certo will file a Suspicious Transaction Report (STR) with the
            <Bold> Nigerian Financial Intelligence Unit (NFIU)</Bold> within the timelines required
            by law whenever we form a reasonable suspicion that a transaction or attempted
            transaction may involve:
          </P>
          <Ul>
            <Li>The proceeds of any unlawful activity</Li>
            <Li>Money laundering as defined in section 18 of the MLPPA 2022</Li>
            <Li>Terrorism financing as defined in the TPPA 2022</Li>
            <Li>Proliferation financing as defined in the Counter-Terrorism Financing Regulations</Li>
          </Ul>
          <P>
            STRs are filed regardless of the transaction amount and regardless of whether the
            transaction was completed. We will not notify the customer that an STR has been or may
            be filed ("anti-tipping-off" rule, MLPPA 2022 s. 16).
          </P>
        </Section>

        <Section title="8. Cash & High-Value Transaction Reporting">
          <P>
            In compliance with the MLPPA 2022 and NFIU reporting thresholds, Certo:
          </P>
          <Ul>
            <Li>Does <Bold>not accept cash payments above ₦5,000,000 from an individual</Bold>, nor
                above ₦10,000,000 from a body corporate, in a single transaction or in aggregate
                over a 7-day period (MLPPA 2022 s. 2).</Li>
            <Li>Files a Currency Transaction Report (CTR) where applicable for any cash transaction
                exceeding the statutory threshold.</Li>
            <Li>Does not engage in structured transactions ("smurfing") and will refuse orders that
                appear to be structured below reporting thresholds.</Li>
          </Ul>
        </Section>

        <Section title="9. Record Keeping">
          <P>
            Certo retains the following records for a minimum of <Bold>five (5) years</Bold> from
            the date of the relevant transaction, in line with MLPPA 2022 s. 7:
          </P>
          <Ul>
            <Li>Customer identification information and supporting documents</Li>
            <Li>Order and transaction details (amount, parties, dates, payment method, delivery route)</Li>
            <Li>Communications relating to the order (email, WhatsApp transcripts)</Li>
            <Li>Internal STR / CTR records and their NFIU receipt acknowledgements</Li>
            <Li>Records of sanctions screening and risk-assessment decisions</Li>
          </Ul>
          <P>
            Records are kept in a secure, access-controlled electronic store and are produced on
            lawful request from competent authorities including the EFCC, NFIU, ICPC, CBN, and SCUML.
          </P>
        </Section>

        <Section title="10. Designated Compliance Officer">
          <P>
            The day-to-day implementation of this policy is owned by Certo's
            <Bold> Compliance Officer</Bold>, who is responsible for:
          </P>
          <Ul>
            <Li>Reviewing transactions flagged for AML/CFT/CPF risk</Li>
            <Li>Approving or rejecting orders requiring EDD</Li>
            <Li>Filing STRs and CTRs with the NFIU</Li>
            <Li>Maintaining sanctions screening procedures</Li>
            <Li>Training all Certo staff on AML/CFT/CPF obligations at least annually</Li>
            <Li>Maintaining the integrity of the Certo customer record</Li>
          </Ul>
          <P>
            The Compliance Officer can be reached at <Bold>compliance@certo.ng</Bold>. All Certo
            employees and contractors are required to escalate any concern to the Compliance
            Officer without delay and without notifying the customer.
          </P>
        </Section>

        <Section title="11. Staff Training">
          <P>
            All Certo personnel — including the founder, employees, and contracted logistics
            partners — receive training on:
          </P>
          <Ul>
            <Li>How to identify suspicious customer behaviour and red flags</Li>
            <Li>The CDD and EDD procedures in this policy</Li>
            <Li>How to escalate concerns to the Compliance Officer</Li>
            <Li>The prohibition on "tipping off" customers about reports made under MLPPA 2022</Li>
            <Li>Personal criminal liability for failure to comply with the MLPPA 2022 / TPPA 2022</Li>
          </Ul>
          <P>Training is documented and refreshed at least once every twelve (12) months.</P>
        </Section>

        <Section title="12. Refused Customers & Prohibited Transactions">
          <P>Certo will not knowingly do business with, and will refuse orders from:</P>
          <Ul>
            <Li>Any individual or entity on a UN, EU, OFAC, or Nigeria sanctions list</Li>
            <Li>Any customer providing materially false identification information</Li>
            <Li>Any transaction where the source of funds cannot be reasonably established for high-value orders</Li>
            <Li>Customers requesting delivery to anonymising freight services with no clear end recipient</Li>
            <Li>Customers refusing CDD/EDD information requests that we are required by law to obtain</Li>
          </Ul>
          <P>
            A refusal under this section is not a denial of service for arbitrary reasons — it is a
            compliance obligation. We will refund any payment already received from a refused
            customer through the same channel it was paid, after retaining records as required by §9.
          </P>
        </Section>

        <Section title="13. Periodic Review">
          <P>
            This policy is reviewed at least annually, and immediately upon any of the following:
          </P>
          <Ul>
            <Li>Amendment to the MLPPA 2022, TPPA 2022, or other applicable legislation</Li>
            <Li>Updated guidance from the NFIU, SCUML, FATF, or CBN</Li>
            <Li>A material change to Certo's business model or risk profile</Li>
            <Li>A material AML/CFT/CPF incident</Li>
          </Ul>
        </Section>

        <Section title="14. Contact & Reporting">
          <P>
            If you are a customer, supplier, employee, or member of the public with information
            concerning a possible breach of this policy, contact us in confidence at
            <Bold> compliance@certo.ng</Bold>. We do not retaliate against good-faith reporters.
          </P>
          <P>
            If you believe you have been the target of money laundering, terrorist financing, or
            other financial crime involving Certo, you may also report directly to:
          </P>
          <Ul>
            <Li>Nigerian Financial Intelligence Unit (NFIU) — <a href="https://www.nfiu.gov.ng" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>nfiu.gov.ng</a></Li>
            <Li>Economic and Financial Crimes Commission (EFCC) — <a href="https://www.efcc.gov.ng" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>efcc.gov.ng</a></Li>
            <Li>Special Control Unit Against Money Laundering (SCUML) — <a href="https://www.scuml.org" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>scuml.org</a></Li>
          </Ul>
        </Section>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('privacy')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>Privacy Policy →</button>
          <button onClick={() => navigate('terms')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>Terms of Service →</button>
          <button onClick={() => navigate('refund')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>Refund Policy →</button>
        </div>
      </div>
    </div>
  );
};

export { HowItWorksPage, TrackOrderPage, AboutPage, FAQPage, ContactPage, PrivacyPolicyPage, TermsOfServicePage, RefundPolicyPage, AmlPolicyPage };
