
// Certo — Checkout Flow (5 steps)

// Defined outside CheckoutFlow so the component identity stays stable across re-renders
const CheckoutInput = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)',
        fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text)',
        background: 'var(--bg)', outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.15s',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
    />
  </div>
);

const CheckoutFlow = ({ cart, navigate, clearCart }) => {
  const { isMobile } = useResponsive();
  const [step, setStep] = React.useState(0);
  const [delivery, setDelivery] = React.useState({ name: '', email: '', phone: '', address: '', state: '' });
  const [forexConfirmed, setForexConfirmed] = React.useState(false);
  const [payMethod, setPayMethod] = React.useState('naira');
  const [orderId, setOrderId] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');

  const cartItems = cart || [];
  const totalUsd = cartItems.reduce((sum, item) => {
    return sum + item.product.usdPrice + (item.applecare?.annualUsd || 0);
  }, 0);
  const totalNgn = totalUsd * CERTO_RATE;

  const STEPS = ['Cart', 'Delivery', 'Forex', 'Payment', 'Confirmed'];

  const StepDot = ({ i }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: i < step ? 'oklch(50% 0.18 145)' : i === step ? 'var(--accent)' : 'var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>
        {i < step ? '✓' : i + 1}
      </div>
      {!isMobile && (
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 13,
          fontWeight: i === step ? 600 : 400,
          color: i === step ? 'var(--text)' : 'var(--text-muted)',
        }}>{STEPS[i]}</span>
      )}
    </div>
  );

  const STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT - Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

  const CartStep = () => (
    <div>
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 24 }}>Your Order</h2>

      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-muted)', marginBottom: 24 }}>Your cart is empty.</p>
          <button onClick={() => navigate('shop')} style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 10, padding: '12px 28px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600 }}>Browse Products</button>
        </div>
      ) : (
        <>
          {cartItems.map((item, i) => (
            <div key={i} style={{ padding: '20px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ width: 72, height: 72, background: 'var(--bg-alt)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0 }}>
                <ProductIcon type={item.product.type.toLowerCase()} size={52} color="var(--accent)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 2 }}>{item.product.name}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{item.product.subtitle}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: item.applecare?.id !== 'none' ? 'var(--accent)' : 'var(--text-muted)' }}>
                  Coverage: {item.applecare?.name || 'None'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
                  {fmt(item.product.usdPrice + (item.applecare?.annualUsd || 0))}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>${(item.product.usdPrice + (item.applecare?.annualUsd || 0)).toLocaleString()} USD</div>
              </div>
            </div>
          ))}

          <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>Order Total</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 26, color: 'var(--text)' }}>{fmt(totalUsd)}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>${totalUsd.toLocaleString()} USD</div>
            </div>
          </div>

          <button onClick={() => setStep(1)} style={{
            width: '100%', padding: '16px', borderRadius: 12, border: 'none',
            background: 'var(--accent)', color: 'white', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700, marginTop: 8,
          }}>Continue to Delivery →</button>
        </>
      )}
    </div>
  );

  const deliveryValid = delivery.name && delivery.email && delivery.phone && delivery.address && delivery.state;
  const DeliveryStep = () => (
    <div>
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 24 }}>Delivery Details</h2>
      <CheckoutInput label="Full Name" value={delivery.name} onChange={v => setDelivery({...delivery, name: v})} placeholder="e.g. Adaeze Okoye" />
      <CheckoutInput label="Email Address" value={delivery.email} onChange={v => setDelivery({...delivery, email: v})} placeholder="you@email.com" type="email" />
      <CheckoutInput label="Phone Number" value={delivery.phone} onChange={v => setDelivery({...delivery, phone: v})} placeholder="+234 800 000 0000" type="tel" />
      <CheckoutInput label="Delivery Address" value={delivery.address} onChange={v => setDelivery({...delivery, address: v})} placeholder="Street address, area" />
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>State</label>
        <select value={delivery.state} onChange={e => setDelivery({...delivery, state: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', fontFamily: 'var(--font-body)', fontSize: 15, color: delivery.state ? 'var(--text)' : 'var(--text-muted)', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box' }}>
          <option value="">Select state</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <button onClick={() => setStep(2)} disabled={!deliveryValid} style={{
        width: '100%', padding: '16px', borderRadius: 12, border: 'none',
        background: deliveryValid ? 'var(--accent)' : 'var(--border)',
        color: deliveryValid ? 'white' : 'var(--text-muted)', cursor: deliveryValid ? 'pointer' : 'not-allowed',
        fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700, marginTop: 8,
      }}>Continue to Forex Acknowledgment →</button>
    </div>
  );

  const ForexStep = () => (
    <div>
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 8 }}>Forex Acknowledgment</h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28 }}>
        This is the part we want you to understand clearly before you pay. Not fine print — just honesty.
      </p>

      <div style={{ background: 'var(--bg-alt)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 16 }}>Current Forex Calculation</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>Order total (USD)</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>${totalUsd.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>Today's buying rate</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>₦{CERTO_RATE.toLocaleString()} / $1</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0' }}>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>You pay today</span>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{fmt(totalUsd)}</span>
        </div>
      </div>

      <div style={{ background: 'oklch(97% 0.015 65)', border: '1px solid oklch(88% 0.03 65)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', lineHeight: 1.75 }}>
          <strong>What the forex clause means:</strong> If you pay in naira, you pay at the rate shown above. Certo does not benefit from exchange rate movement after your payment is received. If the naira weakens before we procure your device, we still buy at the rate we gave you.
        </p>
      </div>

      <label style={{ display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 28 }}>
        <input type="checkbox" checked={forexConfirmed} onChange={e => setForexConfirmed(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>
          I understand that my payment of <strong>{fmt(totalUsd)}</strong> is calculated at today's rate of ₦{CERTO_RATE.toLocaleString()}/USD, and I confirm I am happy with this amount before proceeding.
        </span>
      </label>

      <button onClick={() => setStep(3)} disabled={!forexConfirmed} style={{
        width: '100%', padding: '16px', borderRadius: 12, border: 'none',
        background: forexConfirmed ? 'var(--accent)' : 'var(--border)',
        color: forexConfirmed ? 'white' : 'var(--text-muted)', cursor: forexConfirmed ? 'pointer' : 'not-allowed',
        fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700,
      }}>I Understand — Continue to Payment →</button>
    </div>
  );

  const PaymentStep = () => (
    <div>
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 24 }}>Payment</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        {[
          { id: 'naira', label: 'Pay with Naira', sub: 'via Paystack' },
          { id: 'usd', label: 'Pay with USD or Crypto', sub: 'Card, USDC, or BTC' },
        ].map(opt => (
          <div key={opt.id} onClick={() => setPayMethod(opt.id)} style={{
            flex: 1, padding: '18px 20px', borderRadius: 14, cursor: 'pointer',
            border: `2px solid ${payMethod === opt.id ? 'var(--accent)' : 'var(--border)'}`,
            background: payMethod === opt.id ? 'var(--accent-tint)' : 'var(--bg)',
            transition: 'all 0.15s',
          }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: payMethod === opt.id ? 'var(--accent)' : 'var(--text)', marginBottom: 4 }}>{opt.label}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>{opt.sub}</div>
          </div>
        ))}
      </div>

      {payMethod === 'naira' && (
        <div style={{ background: 'var(--bg-alt)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>You will be redirected to Paystack to complete payment of</div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 32, color: 'var(--text)' }}>{fmt(totalUsd)}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>via Paystack · SSL Secured</div>
        </div>
      )}

      {payMethod === 'usd' && (
        <div style={{ background: 'var(--bg-alt)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 16 }}>USD Payment Options</div>
          {['Visa / Mastercard (USD card)', 'USDC (ERC-20 or BEP-20)', 'BTC (Bitcoin)'].map(opt => (
            <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>{opt}</span>
            </div>
          ))}
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6 }}>
            USD payments are charged at exact USD amount (${totalUsd.toLocaleString()}). No forex conversion applies.
          </div>
        </div>
      )}

      {submitError && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'oklch(97% 0.02 20)', border: '1px solid oklch(85% 0.05 20)', fontFamily: 'var(--font-body)', fontSize: 14, color: 'oklch(40% 0.15 20)', marginBottom: 16 }}>
          {submitError}
        </div>
      )}
      <button
        disabled={submitting}
        onClick={async () => {
          setSubmitting(true);
          setSubmitError('');
          try {
            const firstItem = cartItems[0];
            const res = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customer_name:     delivery.name,
                customer_email:    delivery.email,
                customer_phone:    delivery.phone,
                address:           delivery.address,
                state:             delivery.state,
                product_id:        firstItem?.product?.id || null,
                product_name:      firstItem?.product?.name || '',
                product_subtitle:  firstItem?.product?.subtitle || '',
                product_image_url: (firstItem?.product?.image_urls || firstItem?.product?.images || [])[0] || '',
                apple_url:         firstItem?.product?.apple_url || '',
                applecare:         firstItem?.applecare?.name || 'none',
                qty:               cartItems.length,
                usd_price:         totalUsd,
                ngn_price:         totalNgn,
                forex_rate:        CERTO_RATE,
              }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Order submission failed');
            setOrderId(data.id);
            clearCart && clearCart();
            setStep(4);
          } catch (err) {
            setSubmitError(err.message || 'Something went wrong. Please try again.');
          } finally {
            setSubmitting(false);
          }
        }}
        style={{
          width: '100%', padding: '18px', borderRadius: 12, border: 'none',
          background: submitting ? 'var(--border)' : 'var(--accent)',
          color: submitting ? 'var(--text-muted)' : 'white',
          cursor: submitting ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 700,
        }}>
        {submitting ? 'Placing Order…' : payMethod === 'naira' ? `Pay ${fmt(totalUsd)} via Paystack →` : `Complete Payment ($${totalUsd.toLocaleString()}) →`}
      </button>
    </div>
  );

  const ConfirmationStep = () => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'oklch(50% 0.18 145)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M8 16l6 6 10-12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 32, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 8 }}>Order Confirmed</h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32, maxWidth: 420, margin: '0 auto 32px' }}>
        Your payment has been received. We're starting procurement within 24 hours.
      </p>

      <div style={{ background: 'var(--bg-alt)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 28, maxWidth: 420, margin: '0 auto 28px' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Your Order ID</div>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 28, color: 'var(--text)', letterSpacing: '0.02em' }}>{orderId}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Save this — you'll use it to track your order</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420, margin: '0 auto' }}>
        <button onClick={() => navigate('track', orderId)} style={{ padding: '14px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700 }}>
          Track My Order →
        </button>
        <button onClick={() => navigate('shop')} style={{ padding: '14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15 }}>
          Continue Shopping
        </button>
      </div>

      <div style={{ marginTop: 32, maxWidth: 420, margin: '32px auto 0' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text)' }}>What happens next:</strong> A confirmation email is on its way to {delivery.email}. We'll also send you a WhatsApp message within 2 hours confirming receipt.
        </p>
      </div>
    </div>
  );

  const steps = [CartStep, DeliveryStep, ForexStep, PaymentStep, ConfirmationStep];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: isMobile ? '24px 20px 80px' : '40px 24px 80px' }}>
        {step < 4 && (
          <div style={{ display: 'flex', gap: isMobile ? 12 : 24, marginBottom: 32, alignItems: 'center' }}>
            {STEPS.slice(0, 5).map((_, i) => (
              <React.Fragment key={i}>
                <StepDot i={i} />
                {i < 4 && <div style={{ flex: 1, height: 1, background: i < step ? 'oklch(50% 0.18 145)' : 'var(--border)' }} />}
              </React.Fragment>
            ))}
          </div>
        )}
        {steps[step]()}
      </div>
    </div>
  );
};

Object.assign(window, { CheckoutFlow });
