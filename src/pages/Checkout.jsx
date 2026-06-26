
// Certo — Checkout Flow (5 steps)
import React from 'react';
import { CERTO_RATE, useResponsive } from '../data.js';
import { ProductIcon, fmt } from './HomePage.jsx';
import { calcCouponDiscount, calcOrderTotal, SERVICE_FEE, DANGEROUS_FEE_UNIT } from '../lib/pricing.js';

// Defined outside CheckoutFlow so the component identity stays stable across re-renders
const CheckoutInput = ({ label, value, onChange, placeholder, type = 'text', inputId }) => {
  const id = inputId || `checkout-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
  return (
  <div style={{ marginBottom: 18 }}>
    <label htmlFor={id} style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>{label}</label>
    <input
      id={id}
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
};

// ── Delivery fee table (NGN) — from courier pricing sheet, keyed by max weight (kg) ──
const DELIVERY_TABLE = [
  [0.5,74246.11],[1,74480.82],[1.5,74715.51],[2,74950.22],[2.5,101344.14],
  [3,125504.95],[3.5,149665.75],[4,180673.26],[4.5,197441.06],[5,202486.39],
  [6,236540.20],[7,265464.82],[8,294389.47],[9,323314.10],[10,358036.42],
  [11,376021.10],[12,399803.47],[13,423585.84],[14,447368.19],[15,498279.05],
  [16,523428.70],[17,548578.37],[18,573728.06],[19,598877.73],[20,628879.52],
  [21,632462.58],[22,662579.85],[23,692697.13],[24,722814.37],[25,689534.51],
  [26,787171.32],[27,814752.70],[28,842334.07],[29,869915.46],[30,897496.84],
  [31,1051285.60],[32,1082938.19],[33,1114590.78],[34,1146243.36],[35,1177895.96],
  [36,1209548.53],[37,1241201.13],[38,1272853.71],[39,1304506.27],[40,1336158.89],
  [41,1367811.47],[42,1399464.05],[43,1431116.64],[44,1462769.23],[45,1494421.81],
  [46,1526074.38],[47,1557726.99],[48,1589379.57],[49,1621032.16],[50,1518879.78],
  [51,1547884.90],[52,1576890.00],[53,1605895.12],[54,1634900.25],[55,1663905.36],
  [56,1692910.48],[57,1721915.61],[58,1750920.70],[59,1779925.84],[60,1808930.95],
  [61,1837936.06],[62,1866941.20],[63,1895946.30],[64,1924951.44],[65,1953956.56],
  [66,1982961.66],[67,2011966.77],[68,2040971.89],[69,2069977.00],[70,2098982.13],
];

// Category fallback weights (kg) for products that have no weight_kg stored yet
const CATEGORY_WEIGHT_KG = {
  iPhone: 0.25, iPad: 0.65, Mac: 3.0, AirPods: 0.1,
  Watch: 0.1, 'Apple TV': 0.5, HomePod: 1.4, Accessories: 0.35,
};

const CheckoutFlow = ({ cart, navigate, clearCart, updateCartItemQty }) => {
  const { isMobile } = useResponsive();
  const [step, setStep] = React.useState(0);
  const [delivery, setDelivery] = React.useState({ name: '', email: '', phone: '', address: '', state: '' });
  const [forexConfirmed, setForexConfirmed] = React.useState(false);
  const [orderId, setOrderId] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');
  const [payConfig, setPayConfig] = React.useState({ flutterwaveKey: '', helioPayLink: '', testMode: false });
  const orderIdRef = React.useRef(''); // stable ref kept in case it's needed across handlers

  React.useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(d => setPayConfig(d)).catch(() => {});
  }, []);

  // Lazily inject Flutterwave's checkout SDK only on the checkout page.
  // Previously this script lived in index.html and loaded on every route,
  // causing CORP/403 noise in the console on dashboard / shop / blog pages.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.FlutterwaveCheckout || document.querySelector('script[data-flutterwave-sdk]')) return;

    const s = document.createElement('script');
    s.src   = 'https://checkout.flutterwave.com/v3.js';
    s.async = true;
    s.dataset.flutterwaveSdk = '1';
    s.onerror = () => console.warn('[checkout] Flutterwave SDK failed to load');
    document.head.appendChild(s);
  }, []);

  const cartItems = cart || [];
  // SERVICE_FEE + DANGEROUS_FEE_UNIT are imported from ../lib/pricing.js (single source of truth)

  const getItemWeightKg = (product) => {
    if (product.weight_kg) return Number(product.weight_kg);
    return CATEGORY_WEIGHT_KG[product.category || product.type] || 0.5;
  };

  const lookupDeliveryNgn = (totalKg) => {
    const kg = Math.max(totalKg, 0.5); // minimum 0.5 kg tier
    for (const [maxKg, price] of DELIVERY_TABLE) {
      if (kg <= maxKg) return price;
    }
    return DELIVERY_TABLE[DELIVERY_TABLE.length - 1][1];
  };

  const totalWeightKg = cartItems.reduce(
    (sum, item) => sum + getItemWeightKg(item.product) * (item.qty || 1), 0,
  );
  const deliveryFeeNgn = cartItems.length > 0 ? lookupDeliveryNgn(totalWeightKg) * 1.05 : 0;
  const deliveryFeeUsd = CERTO_RATE > 0 ? deliveryFeeNgn / CERTO_RATE : 0;

  const [couponInput,   setCouponInput]   = React.useState('');
  const [couponData,    setCouponData]    = React.useState(null); // validated coupon object
  const [couponError,   setCouponError]   = React.useState('');
  const [couponLoading, setCouponLoading] = React.useState(false);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const r = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Invalid coupon');
      setCouponData(d);
    } catch (e) {
      setCouponError(e.message);
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => { setCouponData(null); setCouponInput(''); setCouponError(''); };

  // Use variant price if customer selected a storage tier, otherwise base product price
  const itemDevicePrice = (item) => item.variant?.price_usd ?? item.product.usdPrice;

  const itemsSubtotal = cartItems.reduce((sum, item) => {
    return sum + (itemDevicePrice(item) + (item.applecare?.annualUsd || 0)) * (item.qty || 1);
  }, 0);
  const totalQty = cartItems.reduce((sum, item) => sum + (item.qty || 1), 0);
  const dangerousFee = totalQty * DANGEROUS_FEE_UNIT;

  // Pricing math lives in src/lib/pricing.js so it can be unit-tested.
  // See tests in src/lib/__tests__/pricing.test.js.
  const _priceParts = { itemsSubtotal, dangerousFee, deliveryFeeUsd };
  const couponDiscount = calcCouponDiscount(couponData, _priceParts, CERTO_RATE);
  const { totalUsd, totalNgn } = calcOrderTotal(_priceParts, couponData, CERTO_RATE);

  const STEPS = ['Cart', 'Delivery', 'Forex', 'Payment'];

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
          {cartItems.map((item, i) => {
            const qty = item.qty || 1;
            const unitPrice = itemDevicePrice(item) + (item.applecare?.annualUsd || 0);
            const lineTotal = unitPrice * qty;
            const pid = item.product.id;
            const vid = item.variant?.id || 'none';
            const acid = item.applecare?.id || 'none';
            return (
              <div key={i} style={{ padding: '20px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'center' }}>
                {/* Product image */}
                <div style={{ width: 72, height: 72, background: 'var(--bg-alt)', borderRadius: 12, border: '1px solid var(--border)', flexShrink: 0, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.product.images && item.product.images[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
                    />
                  ) : null}
                  <div style={{ display: item.product.images && item.product.images[0] ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: 0 }}>
                    <ProductIcon type={(item.product.type || 'iphone').toLowerCase()} size={48} color="var(--accent)" />
                  </div>
                </div>

                {/* Name + coverage + qty stepper */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 2 }}>{item.product.name}</div>
                  {item.variant && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                      {item.variant.color_hex && (
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.variant.color_hex, display: 'inline-block', border: '1px solid var(--border)', flexShrink: 0 }} />
                      )}
                      {/* Prefer the N-axis `selection` map (shows Chip · Screen ·
                          RAM · etc.) and fall back to the legacy color/storage
                          fields so old carts still render. */}
                      <span>
                        {item.variant.selection
                          ? Object.values(item.variant.selection).map(v => v.value).filter(Boolean).join(' · ')
                          : `${item.variant.color || ''}${item.variant.storage ? ' · ' + item.variant.storage : ''}`}
                      </span>
                    </div>
                  )}
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{item.product.subtitle}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: item.applecare?.id !== 'none' ? 'var(--accent)' : 'var(--text-muted)', marginBottom: 10 }}>
                    Coverage: {item.applecare?.name || 'None'}
                  </div>
                  {/* Qty stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: 'fit-content', border: '1.5px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    <button
                      onClick={() => updateCartItemQty && updateCartItemQty(pid, vid, acid, -1)}
                      style={{ width: 32, height: 32, background: 'var(--bg-alt)', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 400, lineHeight: 1 }}
                    >−</button>
                    <span style={{ minWidth: 32, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: 'var(--text)', padding: '0 4px', lineHeight: '32px' }}>{qty}</span>
                    <button
                      onClick={() => updateCartItemQty && updateCartItemQty(pid, vid, acid, +1)}
                      style={{ width: 32, height: 32, background: 'var(--bg-alt)', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 400, lineHeight: 1 }}
                    >+</button>
                  </div>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
                    {fmt(lineTotal)}
                  </div>
                  {qty > 1 && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {qty} × ${unitPrice.toLocaleString()}
                    </div>
                  )}
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>${lineTotal.toLocaleString()} USD</div>
                </div>
              </div>
            );
          })}

          {/* Fee breakdown */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            {[
              { label: 'Items subtotal',       value: `$${itemsSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
              { label: 'Service fee',          value: `$${SERVICE_FEE.toFixed(2)}` },
              { label: `Dangerous goods fee (${totalQty} item${totalQty !== 1 ? 's' : ''} × $${DANGEROUS_FEE_UNIT})`, value: `$${dangerousFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
              { label: `Delivery fee (${totalWeightKg.toFixed(2)} kg)`, value: `$${deliveryFeeUsd.toFixed(2)}` },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>{row.label}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{row.value}</span>
              </div>
            ))}
            {couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'oklch(40% 0.18 145)' }}>Coupon ({couponData.code})</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'oklch(40% 0.18 145)' }}>−${couponDiscount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Coupon input */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            {couponData ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'oklch(95% 0.06 145)', border: '1px solid oklch(80% 0.1 145)', borderRadius: 10 }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'oklch(35% 0.15 145)' }}>✓ {couponData.code}</span>
                  {couponData.description && <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'oklch(45% 0.12 145)', marginLeft: 8 }}>{couponData.description}</span>}
                </div>
                <button onClick={removeCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, color: 'oklch(45% 0.12 145)', padding: '2px 6px' }}>Remove</button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={couponInput}
                    onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                    onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                    placeholder="Coupon code"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${couponError ? 'oklch(60% 0.2 20)' : 'var(--border)'}`, fontFamily: 'var(--font-body)', fontSize: 14, background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: couponInput.trim() ? 'var(--accent)' : 'var(--border)', color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, cursor: couponInput.trim() ? 'pointer' : 'not-allowed' }}
                  >{couponLoading ? '…' : 'Apply'}</button>
                </div>
                {couponError && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'oklch(45% 0.2 20)', marginTop: 6 }}>{couponError}</div>}
              </div>
            )}
          </div>

          <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>Order Total</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 26, color: 'var(--text)' }}>{fmt(totalUsd)}</div>
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
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--accent)', marginTop: -10, marginBottom: 18, lineHeight: 1.5 }}>WhatsApp number preferred — we'll send your order updates here.</p>
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
          <span style={{ fontFamily: 'var(--font-num)', fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{fmt(totalUsd)}</span>
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

  const handlePay = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      // Step 1 — create the order record in the DB
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
          variant_id:        firstItem?.variant?.id      || null,
          variant_color:     firstItem?.variant?.color   || null,
          variant_storage:   firstItem?.variant?.storage || null,
          variant_color_hex: firstItem?.variant?.color_hex || null,
          qty:               cartItems.reduce((sum, item) => sum + (item.qty || 1), 0),
          usd_price:         totalUsd,
          ngn_price:         totalNgn,
          forex_rate:        CERTO_RATE,
          // All orders start as Payment Pending — confirmed only after payment is verified
          initial_status:    'Payment Pending',
          payment_method:    payConfig.testMode ? 'Test Mode' : 'Flutterwave',
          coupon_code:     couponData?.code || null,
          coupon_discount: couponDiscount || 0,
          // All cart items stored so the full order is visible in the admin
          items: cartItems.map(item => ({
            product_id:    item.product.id || '',
            name:          item.product.name || '',
            subtitle:      item.product.subtitle || '',
            usd_price:     itemDevicePrice(item) || 0,
            image_url:     (item.product.image_urls || item.product.images || [])[0] || '',
            apple_url:     item.product.apple_url || '',
            applecare:     item.applecare?.name || 'none',
            qty:           item.qty || 1,
            variant_id:    item.variant?.id      || null,
            variant_color: item.variant?.color   || null,
            variant_storage: item.variant?.storage || null,
            variant_color_hex: item.variant?.color_hex || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Prefer the friendly message (e.g. "iPhone 15 Pro only has 0 available")
        // over the generic error code ("Out of stock"). 409 = inventory rejection.
        throw new Error(data.message || data.error || 'Order submission failed');
      }
      const newOrderId = data.id;
      setOrderId(newOrderId);
      orderIdRef.current = newOrderId;

      if (payConfig.testMode) {
        // TEST MODE — directly confirm the order without going through a payment gateway
        await fetch(`/api/orders/${newOrderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Order Confirmed' }),
        });
        clearCart && clearCart();
        setSubmitting(false);
        navigate('thank-you', newOrderId);
      } else {
        // Open Flutterwave inline popup
        if (typeof window.FlutterwaveCheckout !== 'function') throw new Error('Flutterwave failed to load — check your connection and try again');
        if (!payConfig.flutterwaveKey) throw new Error('Payment is not configured yet — please contact us directly');
        window.FlutterwaveCheckout({
          public_key:      payConfig.flutterwaveKey,
          tx_ref:          `${newOrderId}-${Date.now()}`,
          amount:          Math.round(totalNgn), // NGN whole units (not kobo)
          currency:        'NGN',
          payment_options: 'card, banktransfer, ussd',
          customer: {
            name:         delivery.name,
            email:        delivery.email,
            phone_number: delivery.phone,
          },
          customizations: {
            title:       'Certo',
            description: `Order ${newOrderId}`,
            logo:        'https://certo.ng/logo.png',
          },
          callback: async (data) => {
            // Flutterwave client confirmed — verify server-side before showing confirmation
            if (data.status === 'successful' || data.status === 'completed') {
              try {
                const vRes = await fetch('/api/flutterwave/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ transaction_id: data.transaction_id, orderId: newOrderId }),
                });
                const vData = await vRes.json();
                if (!vRes.ok) throw new Error(vData.error || 'Payment verification failed');
                clearCart && clearCart();
                setSubmitting(false);
                navigate('thank-you', newOrderId);
              } catch (verifyErr) {
                setSubmitError(`Payment received but verification failed: ${verifyErr.message}. Please contact us with your order ID: ${newOrderId}`);
                setSubmitting(false);
              }
            } else {
              setSubmitError(`Payment failed. Please try again or contact us with your order ID: ${newOrderId}`);
              setSubmitting(false);
            }
          },
          onclose: () => {
            setSubmitError(`Payment cancelled. Your order ${newOrderId} is saved — you can complete payment anytime by contacting us.`);
            setSubmitting(false);
          },
        });
        // Do NOT setSubmitting(false) here — Flutterwave is open; wait for callback/onclose
      }
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const handleWhatsAppPay = async () => {
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
          variant_id:        firstItem?.variant?.id      || null,
          variant_color:     firstItem?.variant?.color   || null,
          variant_storage:   firstItem?.variant?.storage || null,
          variant_color_hex: firstItem?.variant?.color_hex || null,
          qty:               cartItems.reduce((sum, item) => sum + (item.qty || 1), 0),
          usd_price:         totalUsd,
          ngn_price:         totalNgn,
          forex_rate:        CERTO_RATE,
          initial_status:    'Payment Pending',
          payment_method:    'WhatsApp (USD/Crypto)',
          coupon_code:       couponData?.code || null,
          coupon_discount:   couponDiscount || 0,
          items: cartItems.map(item => ({
            product_id:        item.product.id || '',
            name:              item.product.name || '',
            subtitle:          item.product.subtitle || '',
            usd_price:         itemDevicePrice(item) || 0,
            image_url:         (item.product.image_urls || item.product.images || [])[0] || '',
            apple_url:         item.product.apple_url || '',
            applecare:         item.applecare?.name || 'none',
            qty:               item.qty || 1,
            variant_id:        item.variant?.id        || null,
            variant_color:     item.variant?.color     || null,
            variant_storage:   item.variant?.storage   || null,
            variant_color_hex: item.variant?.color_hex || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Order creation failed');
      const newOrderId = data.id;
      setOrderId(newOrderId);
      orderIdRef.current = newOrderId;
      clearCart && clearCart();

      // Open WhatsApp with order ID + total pre-filled
      const msg = `Hi, I'd like to pay in USD/Crypto for my Certo order.\n\nOrder ID: ${newOrderId}\nTotal: $${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD\n\nPlease let me know how to proceed.`;
      window.open(`https://wa.me/2348057575906?text=${encodeURIComponent(msg)}`, '_blank');

      navigate('thank-you', newOrderId);
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const PaymentStep = () => (
    <div>
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 24 }}>Payment</h2>

      {payConfig.testMode && (
        <div style={{ background: '#fffbe6', border: '1.5px solid #f5c400', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontFamily: 'var(--font-body)', fontSize: 13, color: '#7a5c00', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠️</span>
          <span><strong>Test Mode is ON</strong> — payment gateway is bypassed. Set <code>TEST_MODE=false</code> in <code>.env</code> before launch.</span>
        </div>
      )}

      {/* Method selector */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        {/* Naira via Flutterwave */}
        <div style={{
          flex: 1, padding: '18px 16px', borderRadius: 14,
          border: '2px solid var(--accent)', background: 'var(--accent-tint)',
        }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--accent)', marginBottom: 4 }}>🇳🇬  Pay in Naira</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>via Flutterwave · bank transfer, card, USSD</div>
        </div>

        {/* USD / Crypto — creates order then opens WhatsApp */}
        <button
          onClick={handleWhatsAppPay}
          disabled={submitting}
          style={{
            flex: 1, padding: '18px 16px', borderRadius: 14,
            border: '2px solid var(--border)', background: 'var(--bg)',
            textAlign: 'left', cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
            opacity: submitting ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!submitting) { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.background = 'var(--bg-alt)'; }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; }}
        >
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>🌍  Pay in USD / Crypto</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>card, USDC, BTC, ETH</div>
          <div style={{
            marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
            color: 'var(--text)', letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
            WhatsApp us →
          </div>
        </button>
      </div>

      {/* USD/Crypto note */}
      <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'var(--bg-alt)', border: '1px solid var(--border)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        💬 <strong style={{ color: 'var(--text)' }}>Paying in USD or crypto?</strong> Tap the card above to message us on WhatsApp — we'll handle the transaction directly and confirm your order manually.
      </div>

      {/* Payment summary */}
      <div style={{ background: 'var(--bg-alt)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>Order total (USD)</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>${totalUsd.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>Rate applied</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>₦{CERTO_RATE.toLocaleString()}/$</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0' }}>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>You pay (NGN)</span>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>₦{Math.round(totalNgn).toLocaleString()}</span>
        </div>
        <div style={{ marginTop: 16, padding: '12px 14px', background: 'oklch(96% 0.03 145)', borderRadius: 10, border: '1px solid oklch(88% 0.05 145)' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'oklch(35% 0.12 145)' }}>
            🔒 Secured by Flutterwave — bank transfer, debit card, or USSD accepted
          </span>
        </div>
      </div>

      {submitError && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'oklch(97% 0.02 20)', border: '1px solid oklch(85% 0.05 20)', fontFamily: 'var(--font-body)', fontSize: 14, color: 'oklch(40% 0.15 20)', marginBottom: 16, lineHeight: 1.6 }}>
          {submitError}
        </div>
      )}

      <button disabled={submitting} onClick={handlePay} style={{
        width: '100%', padding: '18px', borderRadius: 12, border: 'none',
        background: submitting ? 'var(--border)' : 'var(--accent)',
        color: submitting ? 'var(--text-muted)' : 'white',
        cursor: submitting ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 700,
      }}>
        {submitting ? 'Processing…' : `Pay ₦${Math.round(totalNgn).toLocaleString()} via Flutterwave →`}
      </button>
    </div>
  );

  const steps = [CartStep, DeliveryStep, ForexStep, PaymentStep];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: isMobile ? '24px 20px 80px' : '40px 24px 80px' }}>
        {(
          <div style={{ display: 'flex', gap: isMobile ? 12 : 24, marginBottom: 32, alignItems: 'center' }}>
            {STEPS.slice(0, 4).map((_, i) => (
              <React.Fragment key={i}>
                <StepDot i={i} />
                {i < 3 && <div style={{ flex: 1, height: 1, background: i < step ? 'oklch(50% 0.18 145)' : 'var(--border)' }} />}
              </React.Fragment>
            ))}
          </div>
        )}
        {steps[step]()}
      </div>

    </div>
  );
};

export { CheckoutFlow };
