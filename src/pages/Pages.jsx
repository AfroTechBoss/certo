
// Certo — Supporting Pages: How It Works, Track My Order, About, FAQ, Contact

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
      <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '40px 20px 80px' : '60px 24px 100px' }}>
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
      <div style={{ maxWidth: 680, margin: '0 auto', padding: isMobile ? '40px 20px 80px' : '60px 24px 100px' }}>
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
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>
                {order.product_name}{order.product_subtitle ? ` · ${order.product_subtitle}` : ''} · {order.customer_name}
              </div>
            </div>

            <div>
              {ORDER_STATUS_SEQUENCE.map((s, i) => {
                const isDone   = i < currentIdx;
                const isActive = i === currentIdx;
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
                    <div style={{ paddingBottom: 28 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: isDone || isActive ? 'var(--text)' : 'var(--text-muted)', marginBottom: 2 }}>{s.label}</div>
                      {isActive && s.note && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 4 }}>{s.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 16, padding: '16px 20px', background: 'var(--accent-tint)', borderRadius: 12, border: '1px solid var(--accent-tint2)' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>
                Questions about your order? Contact us at <strong>hello@certo.ng</strong> or via <a href={`https://wa.me/${typeof CERTO_WA_NUMBER !== 'undefined' ? CERTO_WA_NUMBER : '2348000000000'}`} target="_blank" style={{ color: 'var(--accent)', fontWeight: 600 }}>WhatsApp</a>.
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
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 100px' }}>
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
        { q: 'What currencies do you accept?', a: 'Naira (₦) via Paystack, US Dollars via card or crypto (USDC / BTC).' },
        { q: 'How does the forex clause work?', a: 'Naira prices are calculated at the current buying rate shown on the site. When you pay, you pay at that rate. We do not benefit from rate movement after payment — if the naira depreciates before we procure your device, we still buy at the rate locked in at checkout.' },
        { q: 'When are you charged?', a: 'Immediately at checkout. We begin procurement within 24 hours of payment clearing.' },
        { q: 'Is the Paystack payment secure?', a: 'Yes. Paystack is PCI-DSS compliant and processes millions of transactions across Nigeria daily. We never see your card details.' },
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
        { q: 'How do I activate AppleCare+?', a: 'Download the AppleCare app or go to settings.apple.com within 60 days of receiving your device. You\'ll need your Apple ID and the serial number. If you need help, message us on WhatsApp.' },
        { q: 'Can I use AppleCare at a service provider in Nigeria?', a: 'Yes. Apple Authorized Service Providers in Nigeria can perform AppleCare repairs. Walk in with your device and your Apple ID.' },
      ]
    },
    {
      title: 'About Certo',
      items: [
        { q: 'Who runs Certo?', a: 'Certo is run by a single founder based in Lagos. Every order is personally overseen. There\'s no call center — you reach the person who runs the business.' },
        { q: 'How do I reach you?', a: 'WhatsApp is fastest. Our number is on the contact page. We also respond to email and DMs on Twitter and Instagram within 24 hours on business days.' },
        { q: 'What happens if something goes wrong?', a: 'We fix it. If your device arrives damaged, failed, or with a serial that doesn\'t check out — you get a refund or replacement. We\'ve built our business on not having to argue about this.' },
        { q: 'Is Certo a registered business?', a: 'Yes. Certo Technologies is a registered business in Nigeria under the Corporate Affairs Commission (CAC).' },
      ]
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '60px 24px 100px' }}>
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
const ContactPage = () => {
  const { isMobile } = useResponsive();
  const [form, setForm] = React.useState({ name: '', email: '', message: '' });
  const [sent, setSent] = React.useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '40px 20px 80px' : '60px 24px 100px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 40 : 80 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>Contact</div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 44, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 16 }}>Talk to us</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 48 }}>
            WhatsApp is fastest. We respond to every message personally — no bots.
          </p>

          {[
            { icon: '💬', label: 'WhatsApp', val: '+234 805 757 5906', href: 'https://wa.me/2348057575906', sub: 'Fastest response' },
            { icon: '✉️', label: 'Email', val: 'hello@certo.ng', href: 'mailto:hello@certo.ng', sub: 'Within 24hrs on business days' },
            { icon: '𝕏', label: 'Twitter / X', val: '@certong', sub: 'DMs open' },
            { icon: '📷', label: 'Instagram', val: '@certo.ng', sub: 'DMs open' },
          ].map(c => (
            <div key={c.label} style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-alt)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{c.icon}</div>
              <div>
                {c.href ? (
                  <a href={c.href} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--accent)', marginBottom: 2, display: 'block', textDecoration: 'none' }}>{c.val}</a>
                ) : (
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{c.val}</div>
                )}
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{c.label} · {c.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
              <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 24, color: 'var(--text)', marginBottom: 12 }}>Message sent</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7 }}>We'll get back to you within 24 hours on business days. For faster response, send a WhatsApp message.</p>
            </div>
          ) : (
            <div>
              {[
                { label: 'Your Name', key: 'name', placeholder: 'Full name' },
                { label: 'Email', key: 'email', placeholder: 'your@email.com', type: 'email' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 18 }}>
                  <label style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} placeholder={f.placeholder} type={f.type || 'text'}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg)', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              ))}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>Message</label>
                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="What can we help you with?" rows={5}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg)', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <button onClick={() => setSent(true)} disabled={!form.name || !form.email || !form.message}
                style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', background: (form.name && form.email && form.message) ? 'var(--accent)' : 'var(--border)', color: (form.name && form.email && form.message) ? 'white' : 'var(--text-muted)', cursor: (form.name && form.email && form.message) ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700 }}>
                Send Message →
              </button>
            </div>
          )}
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: isMobile ? '40px 20px 80px' : '60px 24px 100px' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>Legal</div>
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 36 : 52, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 12 }}>Privacy Policy</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-muted)', marginBottom: 56 }}>Last updated: April 2026</p>

        <Section title="What we collect">
          <P>When you place an order, we collect your name, phone number, delivery address, and email address. This is the minimum we need to process and deliver your order.</P>
          <P>When you make a naira payment via Paystack, your card details go directly to Paystack — we never see, store, or have access to your card number, CVV, or any banking credentials. Paystack is PCI-DSS compliant.</P>
          <P>We also collect your order history and communication history (WhatsApp messages, emails) to support ongoing service and dispute resolution.</P>
        </Section>

        <Section title="How we use your data">
          <P>We use your information to fulfil your order, send you delivery updates, and provide customer support. We do not use your data for advertising. We do not sell your data. We do not share it with third parties except those directly involved in delivering your order (our logistics partner and Paystack).</P>
          <P>We may contact you after delivery to ask how your device is working. That is the full extent of our marketing — and you can opt out by asking us not to contact you again.</P>
        </Section>

        <Section title="Data storage">
          <P>Order records are stored securely and retained for seven years for accounting and regulatory compliance. After seven years, your personal data is deleted unless there is an unresolved legal or warranty matter.</P>
          <P>WhatsApp conversations are on the WhatsApp platform (Meta's privacy policy applies). Emails are retained for three years.</P>
        </Section>

        <Section title="Your rights">
          <P>You can request a copy of all personal data we hold on you. You can request correction of any incorrect data. You can request deletion of your data at any time — subject to our legal obligation to retain transaction records for seven years.</P>
          <P>To exercise any of these rights, email us at hello@certo.ng with the subject line "Data Request" and we will respond within 5 business days.</P>
        </Section>

        <Section title="Cookies">
          <P>This website does not use advertising cookies, tracking pixels, or third-party analytics services. The exchange rate we fetch from ExchangeRate-API and the admin session token are stored in your browser's localStorage — this data never leaves your device and is not accessible to anyone but you.</P>
        </Section>

        <Section title="Contact">
          <P>All privacy queries go to hello@certo.ng. Certo Technologies is registered in Nigeria under the Corporate Affairs Commission (CAC) and operates under Nigerian data protection law (NDPA 2023).</P>
        </Section>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('terms')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>Terms of Service →</button>
          <button onClick={() => navigate('refund')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>Refund Policy →</button>
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
      <div style={{ maxWidth: 780, margin: '0 auto', padding: isMobile ? '40px 20px 80px' : '60px 24px 100px' }}>
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
          <P>AppleCare+ and AppleCare One are separate products sold by Apple. They are activated by you on Apple's platform. We assist with activation but we are not responsible for Apple's decisions regarding coverage claims.</P>
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
      <div style={{ maxWidth: 780, margin: '0 auto', padding: isMobile ? '40px 20px 80px' : '60px 24px 100px' }}>
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
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { HowItWorksPage, TrackOrderPage, AboutPage, FAQPage, ContactPage, PrivacyPolicyPage, TermsOfServicePage, RefundPolicyPage });
