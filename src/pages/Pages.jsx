
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
const TrackOrderPage = () => {
  const { isMobile } = useResponsive();
  const [orderId, setOrderId] = React.useState('');
  const [order, setOrder] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleTrack = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (orderId.trim().toUpperCase() === MOCK_ORDER.id) {
        setOrder(MOCK_ORDER);
      } else {
        setError('Order not found. Please check your order ID and try again.');
      }
    }, 800);
  };

  const currentIdx = order ? order.statuses.findLastIndex(s => s.done) : -1;

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
            placeholder="e.g. CRT-2204-8841"
            style={{
              flex: 1, padding: '14px 18px', borderRadius: 12,
              border: '1.5px solid var(--border)', background: 'var(--bg)',
              fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text)',
              outline: 'none', letterSpacing: '0.02em',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button onClick={handleTrack} disabled={!orderId.trim() || loading} style={{
            padding: '14px 28px', borderRadius: 12, border: 'none',
            background: 'var(--accent)', color: 'white', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
            opacity: !orderId.trim() ? 0.6 : 1,
          }}>
            {loading ? '...' : 'Track'}
          </button>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 36 }}>
          Try demo: <button onClick={() => setOrderId('CRT-2204-8841')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, padding: 0, fontFamily: 'var(--font-body)', fontWeight: 600 }}>CRT-2204-8841</button>
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
                <span style={{ background: 'oklch(90% 0.08 160)', color: 'oklch(35% 0.15 160)', padding: '4px 12px', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700 }}>In Progress</span>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>
                {order.product.name} · {order.product.subtitle} · {order.customer}
              </div>
            </div>

            <div>
              {order.statuses.map((s, i) => {
                const isActive = i === currentIdx + 1 && !s.done;
                const isDone = s.done;
                return (
                  <div key={s.key} style={{ display: 'flex', gap: 20, marginBottom: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: isDone ? 'oklch(50% 0.18 145)' : isActive ? 'var(--accent)' : 'var(--bg-alt)',
                        border: `2px solid ${isDone ? 'oklch(50% 0.18 145)' : isActive ? 'var(--accent)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {isDone && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        {isActive && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                      </div>
                      {i < order.statuses.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 32, background: isDone ? 'oklch(50% 0.18 145)' : 'var(--border)', marginTop: 4 }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: 28 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: isDone || isActive ? 'var(--text)' : 'var(--text-muted)', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: s.note ? 8 : 0 }}>{s.ts}</div>
                      {s.note && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.note}</p>}
                    </div>
                  </div>
                );
              })}
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
        { p: `I got arrested at an Apple Store in the UK. Not for stealing. For trying to buy too many iPhones at once to bring back to Nigeria. The store manager called security, I had to explain myself to three people, and I walked out empty-handed and humiliated. That was three years ago.` },
        { p: `Before that trip, I had spent three months researching how to get genuine Apple products into Nigeria without the middlemen who add 40% to the price and swap in refurbished units when they feel like it. I watched my cousin pay ₦980,000 for an "iPhone 13 Pro" that turned out to be a Grade C refurb with a cracked chassis under the skin. She cried. I remembered that.` },
        { p: `After the Apple Store incident I came home and used a battered refurbished PC with a failing RAM stick to build the first version of what you're looking at right now. It took me three months and I launched with zero products listed because I was terrified of getting it wrong.` },
        { p: `Certo means "certainly" in Italian. I chose it because certainty is exactly what the Nigerian gadget market doesn't give you. We buy directly from Apple. We verify every serial number. We show you our margin. We track every order in real time. And if anything goes wrong — the full 25-day guarantee, no arguments.` },
        { p: `This is my business and my name is behind every order that leaves this site. If you have a question, my WhatsApp number is on the contact page and I pick up.` },
      ].map((block, i) => (
        <p key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.85, color: i === 4 ? 'var(--text)' : 'var(--text-muted)', marginBottom: 28 }}>
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
        { q: 'Is Certo a registered business?', a: 'Yes. Certo is a registered business in Nigeria under the Corporate Affairs Commission (CAC).' },
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
            { icon: '💬', label: 'WhatsApp', val: '+234 800 000 0000', sub: 'Fastest response' },
            { icon: '✉️', label: 'Email', val: 'hello@certo.ng', sub: 'Within 24hrs on business days' },
            { icon: '𝕏', label: 'Twitter / X', val: '@certong', sub: 'DMs open' },
            { icon: '📷', label: 'Instagram', val: '@certo.ng', sub: 'DMs open' },
          ].map(c => (
            <div key={c.label} style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-alt)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{c.icon}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{c.val}</div>
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

Object.assign(window, { HowItWorksPage, TrackOrderPage, AboutPage, FAQPage, ContactPage });
