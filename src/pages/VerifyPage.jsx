
// Certo — Public Verification Certificate Page
import React from 'react';
import { useResponsive } from '../data.js';

// ── Sample certificate data (shown before any real lookup) ────────────────────
const SAMPLE_CERT = {
  order_id: 'CRT-2204-8841',
  product_name: 'iPhone 15 Pro',
  product_subtitle: 'A17 Pro · 5G',
  variant_storage: '256GB',
  variant_color: 'Natural Titanium',
  serial_number: 'M82FX19JH3RQ',
  apple_order_ref: 'W1234567890',
  recipient_name: 'Adaeze Okoye',
  recipient_address: '14 Karimu Kotun St, Victoria Island',
  recipient_state: 'Lagos',
  forex_rate: 1590,
  usd_price: 1098,
  ngn_price: 1745820,
  published_at: '2026-05-17T10:00:00Z',
  chain_of_custody: [
    { title: 'Apple Inc.',             subtitle: 'Cupertino, CA · United States',                              date: 'MAY 03' },
    { title: 'Air freight in transit', subtitle: 'JFK New York → MMA Lagos · via licensed carrier',           date: 'MAY 09' },
    { title: 'Customs clearance',      subtitle: 'Murtala Muhammed Airport, Lagos · duties paid in full',     date: 'MAY 12' },
    { title: 'Delivered to recipient', subtitle: 'Victoria Island, Lagos · signed for in person',             date: 'MAY 17' },
  ],
};

// ── Certificate card — matches the provided HTML design ──────────────────────
const CertificateCard = ({ cert, orderId, isMobile, isSample = false }) => {
  const custody     = Array.isArray(cert.chain_of_custody) ? cert.chain_of_custody : [];
  const publishedAt = cert.published_at ? new Date(cert.published_at) : new Date();
  const pad         = n => String(n).padStart(2, '0');
  const issuedStr   = `${publishedAt.getFullYear()} — ${pad(publishedAt.getMonth() + 1)} — ${pad(publishedAt.getDate())}`;
  const qrUrl       = isSample
    ? null
    : `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`https://certo.ng/verify/${orderId}`)}`;

  const MONO = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
  const HEAD = { fontFamily: 'var(--font-head)' };

  const rowStyle = (first) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '160px 1fr',
    gap: isMobile ? 4 : 16,
    padding: '14px 0',
    borderTop: first ? 'none' : '1px dashed #e5e2db',
  });

  return (
    <div id={isSample ? 'cert-sample' : 'cert-printable'} style={{
      position: 'relative',
      width: '100%', maxWidth: 720,
      background: '#faf9f7',
      border: isSample ? '2px dashed #d97757' : '1px solid #e5e2db',
      borderRadius: 20,
      padding: isMobile ? '28px 20px 32px' : '48px 56px 52px',
      boxShadow: isSample
        ? '0 32px 80px -24px rgba(217,119,87,0.2)'
        : '0 60px 120px -40px rgba(26,23,20,0.28), 0 24px 48px -20px rgba(26,23,20,0.12)',
      overflow: 'hidden',
    }}>

      {/* Sample banner */}
      {isSample && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          background: '#d97757', color: 'white',
          textAlign: 'center', padding: '7px 16px',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          Sample Certificate — For Illustration Purposes Only
        </div>
      )}

      {/* Perforated top edge */}
      <div style={{ position: 'absolute', top: isSample ? 30 : 0, left: 0, right: 0, height: 8, backgroundImage: 'radial-gradient(circle, #f2f0ec 3px, transparent 3.5px)', backgroundSize: '16px 8px', backgroundPosition: 'center' }} />
      {/* Perforated bottom edge */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, backgroundImage: 'radial-gradient(circle, #f2f0ec 3px, transparent 3.5px)', backgroundSize: '16px 8px', backgroundPosition: 'center', transform: 'rotate(180deg)' }} />

      {/* Watermark */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', overflow: 'hidden', userSelect: 'none' }}>
        <span style={{ ...HEAD, fontWeight: 800, fontSize: isMobile ? '140px' : '280px', color: '#1a1714', opacity: 0.022, letterSpacing: '-0.05em', transform: 'rotate(-12deg)', whiteSpace: 'nowrap' }}>CERTO</span>
      </div>

      {/* DELIVERED stamp */}
      <div style={{ position: 'absolute', zIndex: 2, top: isSample ? 58 : 24, right: isMobile ? 8 : -22, transform: 'rotate(8deg)', background: '#1f7a4d', color: 'white', padding: isMobile ? '8px 14px' : '11px 22px', borderRadius: 6, ...HEAD, fontWeight: 800, fontSize: isMobile ? 11 : 13, letterSpacing: '0.14em', boxShadow: '0 0 0 2px #faf9f7, 0 0 0 3px #1f7a4d, 0 12px 28px -8px rgba(31,122,77,0.45)' }}>
        ✓ DELIVERED
      </div>

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
        gap: 24, alignItems: 'flex-end',
        paddingBottom: 24, marginBottom: 24,
        borderBottom: '2px solid #1a1714',
        marginTop: isSample ? 16 : 0,
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ ...HEAD, fontWeight: 800, fontSize: 18, color: '#1a1714', letterSpacing: '-0.02em' }}>Certo</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d97757', marginBottom: 8 }}>Verification Certificate</div>
          <div style={{ ...HEAD, fontWeight: 800, fontSize: isMobile ? 22 : 34, letterSpacing: '-0.02em', lineHeight: 1, color: '#1a1714' }}>{cert.order_id}</div>
        </div>
        <div style={{ textAlign: isMobile ? 'left' : 'right', paddingBottom: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9a9387', marginBottom: 6 }}>Issued</div>
          <div style={{ ...MONO, fontSize: 13, color: '#1a1714', fontWeight: 500, letterSpacing: '0.04em' }}>{issuedStr}</div>
        </div>
      </div>

      {/* Device rows */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {[
          {
            label: 'Product',
            value: cert.product_name,
            sub: [cert.product_subtitle, cert.variant_storage, cert.variant_color].filter(Boolean).join(' · '),
          },
          { label: 'Serial number',   value: cert.serial_number,  mono: true },
          { label: 'Apple QC status', value: 'Passed factory inspection', check: true },
          { label: 'Apple order ref', value: cert.apple_order_ref, mono: true },
          {
            label: 'Recipient',
            value: cert.recipient_name,
            sub: [cert.recipient_address, cert.recipient_state].filter(Boolean).join(', '),
          },
        ].map((row, i) => (
          <div key={i} style={rowStyle(i === 0)}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9a9387', paddingTop: 4 }}>{row.label}</div>
            <div style={{
              ...(row.mono ? MONO : {}),
              fontSize: row.mono ? 13 : 14,
              color: row.check ? '#1f7a4d' : '#1a1714',
              fontWeight: row.check ? 700 : 600,
              lineHeight: 1.4,
              letterSpacing: row.mono ? '0.04em' : 'normal',
            }}>
              {row.check ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: '#1f7a4d', color: 'white', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {row.value}
                </span>
              ) : row.value}
              {row.sub && <span style={{ display: 'block', fontSize: 12, color: '#706b60', fontWeight: 400, marginTop: 2, fontFamily: 'var(--font-body)' }}>{row.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Chain of custody */}
      {custody.length > 0 && (
        <>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14, margin: '28px 0 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9a9387', whiteSpace: 'nowrap' }}>Chain of custody</div>
            <div style={{ flex: 1, height: 1, background: '#ece8e0' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            {custody.map((step, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '16px 1fr auto', gap: 16, padding: '8px 0' }}>
                <div style={{ position: 'relative', height: 28 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: i === custody.length - 1 ? '#d97757' : '#1a1714',
                    marginTop: 6,
                    boxShadow: i === custody.length - 1
                      ? '0 0 0 4px #faf9f7, 0 0 0 7px #f7e9df'
                      : '0 0 0 4px #faf9f7',
                  }} />
                  {i < custody.length - 1 && (
                    <div style={{ position: 'absolute', left: 5, top: 18, width: 2, height: 28, background: '#e5e2db' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1714', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{step.title}</div>
                  {step.subtitle && <div style={{ fontSize: 12, color: '#706b60', marginTop: 2, lineHeight: 1.4 }}>{step.subtitle}</div>}
                </div>
                {step.date && (
                  <div style={{ ...MONO, fontSize: 11, color: '#9a9387', letterSpacing: '0.06em', paddingTop: 6, whiteSpace: 'nowrap' }}>{step.date}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Totals band */}
      {(Number(cert.usd_price) > 0 || Number(cert.ngn_price) > 0) && (
        <div style={{
          position: 'relative', zIndex: 1, marginTop: 28, padding: isMobile ? '18px 16px' : '22px 24px',
          background: '#f2f0ec', borderRadius: 12,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr auto auto',
          gap: isMobile ? 16 : 32,
          alignItems: 'center',
        }}>
          <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9a9387', marginBottom: 6 }}>Rate locked at checkout</div>
            <div style={{ ...MONO, fontSize: 14, color: '#1a1714', fontWeight: 500, letterSpacing: '0.04em' }}>₦{Number(cert.forex_rate).toLocaleString()} / $1</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9a9387', marginBottom: 6 }}>USD invoice</div>
            <div style={{ ...MONO, fontSize: 14, color: '#1a1714', fontWeight: 500 }}>${Number(cert.usd_price).toLocaleString()}</div>
          </div>
          <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9a9387', marginBottom: 6 }}>Total paid (NGN)</div>
            <div style={{ ...HEAD, fontWeight: 800, fontSize: isMobile ? 22 : 26, color: '#d97757', letterSpacing: '-0.02em', lineHeight: 1 }}>₦{Number(cert.ngn_price).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Footer: signature + QR */}
      <div style={{
        position: 'relative', zIndex: 1,
        marginTop: 32, paddingTop: 24,
        borderTop: '1px dashed #e5e2db',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
        gap: isMobile ? 20 : 32,
        alignItems: 'flex-end',
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9a9387', marginBottom: 8 }}>Signed by</div>
          <div style={{ ...HEAD, fontStyle: 'italic', fontWeight: 600, fontSize: 24, color: '#1a1714', letterSpacing: '-0.02em', lineHeight: 1, borderBottom: '1px solid #1a1714', paddingBottom: 6, display: 'inline-block' }}>Certo</div>
          <div style={{ fontSize: 12, color: '#706b60', marginTop: 8 }}>
            <strong style={{ color: '#1a1714', fontWeight: 600 }}>Personally overseen</strong> · Lagos, Nigeria
          </div>
        </div>
        {qrUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'center', gap: 4 }}>
            <div style={{ width: 88, height: 88, background: 'white', border: '1px solid #e5e2db', borderRadius: 8, padding: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={qrUrl} alt={`QR code — scan to verify ${cert.order_id}`} width={78} height={78} style={{ display: 'block' }} />
            </div>
            <div style={{ fontSize: 9, color: '#9a9387', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Scan to verify</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'center', gap: 4 }}>
            <div style={{ width: 88, height: 88, background: '#f2f0ec', border: '2px dashed #e5e2db', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 9, color: '#9a9387', textAlign: 'center', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.4 }}>QR<br />Code</div>
            </div>
            <div style={{ fontSize: 9, color: '#9a9387', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Unique per order</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const VerifyPage = ({ navigate, initialOrderId }) => {
  const { isMobile } = useResponsive();
  const [orderId,         setOrderId]         = React.useState(initialOrderId || '');
  const [result,          setResult]          = React.useState(null);
  const [error,           setError]           = React.useState('');
  const [loading,         setLoading]         = React.useState(false);
  const [selectedCertIdx, setSelectedCertIdx] = React.useState(0);
  const [showSample,      setShowSample]      = React.useState(false);

  // Inject print styles on mount, clean up on unmount
  React.useEffect(() => {
    const style = document.createElement('style');
    style.id = 'cert-print-style';
    style.textContent = `
      @media print {
        nav, footer,
        #cert-lookup-section,
        #cert-tab-bar,
        #cert-action-bar { display: none !important; }
        body { background: white !important; }
        #cert-stage { padding: 0 !important; }
        #cert-printable {
          box-shadow: none !important;
          border-radius: 4px !important;
          max-width: 100% !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const s = document.getElementById('cert-print-style');
      if (s) s.remove();
    };
  }, []);

  React.useEffect(() => {
    if (initialOrderId) handleLookup(initialOrderId);
  }, [initialOrderId]);

  const handleLookup = async (id) => {
    const target = (id || orderId).trim().toUpperCase();
    if (!target) return;
    setLoading(true);
    setError('');
    setResult(null);
    setShowSample(false);
    try {
      const res  = await fetch(`/api/certificates/verify/${encodeURIComponent(target)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else if (!data.certificates?.length) {
        setError('No published certificates found for this order yet. Please check back after delivery.');
      } else {
        setResult(data);
        setSelectedCertIdx(0);
      }
    } catch (e) {
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cert = result?.certificates?.[selectedCertIdx];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f2f0ec',
      backgroundImage: 'radial-gradient(ellipse 800px 600px at 20% 0%, #f7e9df 0%, transparent 60%), radial-gradient(ellipse 600px 400px at 80% 100%, #dff1e6 0%, transparent 60%)',
      backgroundAttachment: 'fixed',
    }}>

      {/* Page header + lookup form */}
      <div id="cert-lookup-section" style={{
        maxWidth: 920, margin: '0 auto',
        padding: isMobile ? '96px 20px 28px' : '120px 48px 28px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#d97757', marginBottom: 16 }}>Issued with every device</div>
        <h1 style={{
          fontFamily: 'var(--font-head)', fontWeight: 800,
          fontSize: isMobile ? 32 : 52,
          letterSpacing: '-0.03em', lineHeight: 1.0, color: '#1a1714', margin: '0 0 16px',
        }}>Verification Certificate</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: isMobile ? 15 : 16, lineHeight: 1.65, color: '#706b60', maxWidth: 520, margin: '0 auto 32px' }}>
          Enter your Certo order ID to view your certificate of authenticity. Available after your device has been delivered.
        </p>

        {/* Order ID input */}
        <div style={{
          display: 'flex', gap: 12, maxWidth: 520, margin: '0 auto',
          flexWrap: 'wrap', justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          <input
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
            placeholder="e.g. CRT-220426-8841"
            aria-label="Order ID"
            style={{
              flex: isMobile ? 'none' : '1 1 220px',
              padding: '14px 18px', borderRadius: 12,
              border: '1.5px solid #e5e2db', background: 'white',
              fontFamily: 'var(--font-body)', fontSize: 15, color: '#1a1714',
              outline: 'none', letterSpacing: '0.02em',
              width: isMobile ? '100%' : undefined,
            }}
            onFocus={e => e.target.style.borderColor = '#d97757'}
            onBlur={e => e.target.style.borderColor = '#e5e2db'}
          />
          <button
            onClick={() => handleLookup()}
            disabled={!orderId.trim() || loading}
            style={{
              padding: '14px 28px', borderRadius: 12, border: 'none',
              background: '#1a1714', color: 'white',
              cursor: !orderId.trim() || loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
              opacity: !orderId.trim() ? 0.6 : 1, whiteSpace: 'nowrap',
              width: isMobile ? '100%' : undefined,
            }}
          >
            {loading ? '…' : 'View Certificate →'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginTop: 20, padding: '14px 20px', borderRadius: 12, background: '#fff0ec', border: '1px solid #f5c8b8', fontFamily: 'var(--font-body)', fontSize: 14, color: '#b85f3d', maxWidth: 520, margin: '20px auto 0', lineHeight: 1.6 }}>
            {error === 'Certificate is only available after delivery'
              ? '🔒 Your certificate will be available once your order is marked as Delivered.'
              : error === 'Order not found'
              ? '❌ Order not found. Please double-check your order ID.'
              : `⚠ ${error}`}
          </div>
        )}

        {/* Sample certificate toggle */}
        {!result && (
          <div style={{ marginTop: 28 }}>
            <button
              onClick={() => setShowSample(s => !s)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
                color: '#1a1714',
                borderBottom: '1.5px solid #1a1714', paddingBottom: 2,
              }}
            >
              {showSample ? 'Hide sample certificate ↑' : 'See what a certificate looks like →'}
            </button>
          </div>
        )}
      </div>

      {/* Sample certificate */}
      {showSample && !result && (
        <div style={{
          padding: isMobile ? '0 16px 56px' : '0 32px 72px',
          display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center',
        }}>
          <CertificateCard
            cert={SAMPLE_CERT}
            orderId={SAMPLE_CERT.order_id}
            isMobile={isMobile}
            isSample={true}
          />
          <p style={{ marginTop: 20, fontFamily: 'var(--font-body)', fontSize: 13, color: '#9a9387', textAlign: 'center', maxWidth: 480, lineHeight: 1.6 }}>
            This is what every Certo customer receives after delivery. The real certificate includes your actual order ID, serial number, recipient details, and a unique QR code that links back to this page.
          </p>
        </div>
      )}

      {/* Multi-cert tab bar */}
      {result?.certificates?.length > 1 && (
        <div id="cert-tab-bar" style={{ display: 'flex', gap: 8, maxWidth: 720, margin: '0 auto 16px', padding: isMobile ? '0 16px' : '0 32px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {result.certificates.map((c, i) => (
            <button key={c.id} onClick={() => setSelectedCertIdx(i)} style={{
              padding: '8px 20px', borderRadius: 10,
              border: `1.5px solid ${selectedCertIdx === i ? '#1a1714' : '#e5e2db'}`,
              background: selectedCertIdx === i ? '#1a1714' : 'white',
              color: selectedCertIdx === i ? 'white' : '#706b60',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              {c.product_name ? c.product_name.split(' ').slice(0, 3).join(' ') : `Product ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Real certificate */}
      {cert && (
        <div id="cert-stage" style={{ padding: isMobile ? '0 16px 64px' : '0 48px 80px', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
          <CertificateCard cert={cert} orderId={result.order.id} isMobile={isMobile} />

          {/* Action bar */}
          <div id="cert-action-bar" style={{
            display: 'flex',
            justifyContent: isMobile ? 'flex-start' : 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 16, maxWidth: 720, width: '100%', marginTop: 24,
            padding: isMobile ? '0 4px' : '0 8px',
            flexWrap: 'wrap',
          }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#706b60' }}>
              Certificate <strong style={{ color: '#1a1714', fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: '0.02em' }}>{cert.id}</strong>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: isMobile ? '100%' : undefined }}>
              <button
                onClick={() => navigate('track', result.order.id)}
                style={{
                  background: 'white', color: '#1a1714', border: '1px solid #e5e2db',
                  borderRadius: 10, padding: '10px 18px',
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  flex: isMobile ? 1 : undefined,
                }}
              >
                View Order Tracking
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  background: '#1a1714', color: 'white', border: 'none',
                  borderRadius: 10, padding: '10px 18px',
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  flex: isMobile ? 1 : undefined,
                }}
              >
                🖨 Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export { VerifyPage };
