import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { authFetch, getName } from '../lib/auth.js';
import { useIsMobile } from '../lib/useIsMobile.js';
import { mapOrder, mapProduct, mapCert, mapMessage, mapCoupon, mapLog, buildRevenueSeries } from '../lib/mappers.js';
import { fmtN, fmtU } from '../lib/format.js';
import { inputS, thS, tdS, primaryBtn, actionBtn, miniBtn, linkBtn } from '../lib/styles.js';
import { Icon } from '../components/Icon.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { Empty } from '../components/Empty.jsx';
import { Panel } from '../components/Panel.jsx';
import { Segmented } from '../components/Segmented.jsx';
import { Modal } from '../components/Modal.jsx';
import { AreaChart } from '../components/AreaChart.jsx';
import { DonutChart } from '../components/DonutChart.jsx';
import { BarList } from '../components/BarList.jsx';
import { CreateOrderModal } from '../modals/CreateOrderModal.jsx';
import { DeleteOrderModal } from '../modals/DeleteOrderModal.jsx';
import { WhatsAppModal }    from '../modals/WhatsAppModal.jsx';
import { FlagModal }        from '../modals/FlagModal.jsx';
import { CertModal }        from '../modals/CertModal.jsx';

// PayPill keeps a purple variant for historical 'MoonPay' orders so they render
// correctly in the admin list, even though MoonPay is no longer offered to new
// customers. Everything else gets the default green pill.
export function PayPill({ method }) {
  const m = method==='MoonPay'
    ? { bg:'oklch(94% 0.05 280)', fg:'oklch(42% 0.16 280)' }
    : { bg:'oklch(93% 0.06 145)', fg:'oklch(36% 0.15 145)' };
  return <span style={{ padding:'3px 9px', borderRadius:6, background:m.bg, color:m.fg, fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>{method||'Paystack'}</span>;
}

export function OrderDetail({ order: initialOrder, onBack, isMobile, onOrdersChange, existingCerts }) {
  const [order,   setOrder]   = useState(initialOrder);
  const [status,  setStatus]  = useState(initialOrder.status);
  const [saving,  setSaving]  = useState(false);
  const [resend,      setResend]      = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'
  const [resendError, setResendError] = useState('');
  const [waModal,     setWaModal]     = useState(false);
  const [flagModal,   setFlagModal]   = useState(false);
  const [certModal,   setCertModal]   = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [localCerts,  setLocalCerts]  = useState(existingCerts || []);

  useEffect(() => { setLocalCerts(existingCerts || []); }, [existingCerts]);

  const existingCert    = localCerts[0] || null;
  const certIsPublished = existingCert?.status === 'published';
  const certIsDraft     = existingCert?.status === 'draft';
  const certBtnLabel    = certIsPublished ? '✓ View certificate' : certIsDraft ? '⏳ Edit draft certificate' : '＋ Publish certificate';
  const certBtnStyle    = certIsPublished
    ? { ...actionBtn, borderColor:'oklch(70% 0.15 155)', color:'oklch(35% 0.15 155)', background:'oklch(93% 0.06 155)' }
    : certIsDraft
    ? { ...actionBtn, borderColor:'oklch(75% 0.12 55)', color:'oklch(42% 0.14 55)', background:'oklch(95% 0.07 70)' }
    : { ...actionBtn, borderColor:'var(--accent)', color:'var(--accent)', background:'var(--accent-tint,#f7e9df)' };

  const STATUSES = ['Payment Pending','Order Confirmed','Purchased from Apple','In Transit to US Partner','Customs Clearance','Arrived in Nigeria','Out for Delivery','Delivered','Cancelled'];

  const updateStatus = async (newStatus) => {
    setStatus(newStatus);
    setSaving(true);
    try {
      const res = await authFetch(`/api/orders/${order.id}`, { method:'PATCH', body: JSON.stringify({ status: newStatus }) });
      if (res.ok) {
        const updated = await res.json();
        const mapped  = mapOrder(updated);
        setOrder(mapped);
        onOrdersChange && onOrdersChange(mapped);
      }
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const handleFlagDone = (updated) => {
    setOrder(updated);
    onOrdersChange && onOrdersChange(updated);
  };

  const resendEmail = async () => {
    setResend('sending');
    setResendError('');
    try {
      const res = await authFetch(`/api/orders/${order.id}/resend-email`, { method:'POST' });
      if (res.ok) {
        setResend('sent');
        setTimeout(() => setResend('idle'), 4000);
      } else {
        let msg = 'Send failed';
        try { const j = await res.json(); msg = j.error || msg; } catch(_) {}
        setResendError(msg);
        setResend('error');
        setTimeout(() => { setResend('idle'); setResendError(''); }, 6000);
      }
    } catch(e) {
      setResendError(e.message || 'Network error');
      setResend('error');
      setTimeout(() => { setResend('idle'); setResendError(''); }, 6000);
    }
  };

  const infoFields = [
    ['Customer', order.customer],
    ['Phone',    order.phone],
    ['Email',    order.email],
    ['USD Total',fmtU(order.usd)],
    ['NGN Total',fmtN(order.ngn)],
    ['Payment',  order.payment_method],
    ['Order Date',order.date],
    ['Address',  order.address],
  ];

  return (
    <>
      {waModal     && <WhatsAppModal phone={order.phone} name={order.customer} onClose={() => setWaModal(false)}/>}
      {flagModal   && <FlagModal order={order} onClose={() => setFlagModal(false)} onDone={handleFlagDone}/>}
      {certModal   && <CertModal order={order} existingCert={existingCert} onClose={() => setCertModal(false)} onDone={(cert) => setLocalCerts([cert])}/>}
      {deleteModal && <DeleteOrderModal order={order} onClose={() => setDeleteModal(false)} onDone={(updated) => { onOrdersChange && onOrdersChange(updated); onBack(); }}/>}

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <button onClick={onBack} style={{ ...linkBtn, alignSelf:'flex-start', display:'flex', alignItems:'center', gap:6 }}>← Back to orders</button>
        <Panel>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:24 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>Order</div>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:26, color:'var(--text)', letterSpacing:'-0.02em', display:'flex', alignItems:'center', gap:10 }}>
                {order.flag && <span title={order.flag_reason}>🚩</span>}{order.id}
              </div>
            </div>
            <select value={status} onChange={e => updateStatus(e.target.value)} disabled={saving} style={{ padding:'10px 16px', borderRadius:10, border:'1.5px solid var(--accent)', background:'var(--accent-tint,#f7e9df)', color:'var(--accent)', fontFamily:'var(--font-body)', fontSize:14, fontWeight:700, cursor:'pointer', outline:'none' }}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Info grid */}
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:18, marginBottom:24 }}>
            {infoFields.map(([k,v]) => (
              <div key={k} style={{ minWidth:0 }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:600 }}>{k}</div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', wordBreak:'break-word' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Order items */}
          <div style={{ background:'var(--bg-alt)', borderRadius:12, border:'1px solid var(--border)', padding:16, marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>Order items ({order.items.length})</div>
            {order.items.map((it,i) => (
              <div key={i} style={{ padding:'10px 0', borderTop:i?'1px solid var(--border)':'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{it.qty>1&&`${it.qty}× `}{it.name}</div>
                    {it.subtitle&&<div style={{ fontSize:12, color:'var(--text-muted)' }}>{it.subtitle}</div>}
                    {(it.variant_color || it.variant_storage) && (
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
                        {it.variant_color && (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'2px 9px', borderRadius:6, background:'var(--bg)', border:'1px solid var(--border)', fontSize:12, fontWeight:500, color:'var(--text)' }}>
                            {it.variant_color_hex && <span style={{ width:10, height:10, borderRadius:'50%', background:it.variant_color_hex, border:'1px solid rgba(0,0,0,0.12)', display:'inline-block', flexShrink:0 }}/>}
                            {it.variant_color}
                          </span>
                        )}
                        {it.variant_storage && (
                          <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 9px', borderRadius:6, background:'var(--bg)', border:'1px solid var(--border)', fontSize:12, fontWeight:500, color:'var(--text)' }}>
                            {it.variant_storage}
                          </span>
                        )}
                      </div>
                    )}
                    {it.applecare&&it.applecare!=='none'&&<div style={{ fontSize:12, color:'var(--accent)', marginTop:4 }}>+ {it.applecare}</div>}
                  </div>
                  <div style={{ fontFamily:'var(--font-num)', fontWeight:700, fontSize:14, color:'var(--text)' }}>{fmtU(it.usd_price*(it.qty||1))}</div>
                </div>
                {(it.apple_url || it.product_id) && (
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                    {it.apple_url && (
                      <a href={it.apple_url} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:7, background:'var(--bg)', border:'1px solid var(--border)', fontSize:12, fontWeight:600, color:'var(--text)', textDecoration:'none' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        Apple.com
                      </a>
                    )}
                    {it.product_id && (
                      <a href={`/shop/${it.product_id}`} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:7, background:'var(--bg)', border:'1px solid var(--border)', fontSize:12, fontWeight:600, color:'var(--text)', textDecoration:'none' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                        Certo listing
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={() => setWaModal(true)} style={{ ...actionBtn, background:'oklch(93% 0.08 145)', borderColor:'oklch(80% 0.12 145)', color:'oklch(35% 0.15 145)' }}>💬 WhatsApp customer</button>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <button
                onClick={resendEmail}
                disabled={resend === 'sending' || resend === 'sent'}
                style={{
                  ...actionBtn,
                  ...(resend === 'sent'  ? { color:'oklch(35% 0.15 155)', borderColor:'oklch(72% 0.12 155)', background:'oklch(93% 0.06 155)' } : {}),
                  ...(resend === 'error' ? { color:'oklch(48% 0.2 25)',   borderColor:'oklch(85% 0.1 25)',   background:'oklch(98% 0.01 25)'  } : {}),
                }}
              >
                {resend === 'sending' ? '⏳ Sending…' : resend === 'sent' ? '✓ Email sent' : resend === 'error' ? '✕ Failed — retry' : '✉ Resend confirmation'}
              </button>
              {resend === 'error' && resendError && (
                <span style={{ fontSize:11, color:'oklch(48% 0.2 25)', paddingLeft:2 }}>{resendError}</span>
              )}
            </div>
            <button onClick={() => setFlagModal(true)} style={{ ...actionBtn, color:order.flag?'oklch(45% 0.18 25)':'var(--text-muted)', borderColor:order.flag?'oklch(85% 0.1 25)':'var(--border)', background:order.flag?'oklch(97% 0.03 25)':'var(--bg)' }}>
              🚩 {order.flag?'Unflag':'Flag'} order
            </button>
            <button onClick={() => setCertModal(true)} style={certBtnStyle}>{certBtnLabel}</button>
            {isMobile ? (
              <button onClick={() => setDeleteModal(true)} style={{ ...actionBtn, color:'oklch(48% 0.2 25)', borderColor:'oklch(85% 0.1 25)', background:'oklch(98% 0.01 25)', width:'100%', justifyContent:'center' }}>🗑 Delete order</button>
            ) : (
              <button onClick={() => setDeleteModal(true)} style={{ ...actionBtn, color:'oklch(48% 0.2 25)', borderColor:'oklch(85% 0.1 25)', background:'oklch(98% 0.01 25)', marginLeft:'auto' }}>🗑 Delete order</button>
            )}
          </div>

          {/* Flag reason banner */}
          {order.flag && (
            <div style={{ marginTop:16, padding:14, background:'oklch(97% 0.03 25)', border:'1.5px solid oklch(85% 0.1 25)', borderRadius:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'oklch(45% 0.18 25)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>🚩 Flag reason</div>
              <div style={{ fontSize:14, color:'oklch(35% 0.15 25)', lineHeight:1.6 }}>{order.flag_reason}</div>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

export function OrdersTab({ isMobile, orders, onOrdersChange, certificates, products, rate }) {
  const [sel,        setSel]        = useState(null);
  const [statusF,    setStatusF]    = useState('all');
  const [q,          setQ]          = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Hidden orders are completely invisible — filtered out at the source
  const visible = orders.filter(o => !o.admin_hidden);

  const filtered = visible.filter(o => {
    if (statusF==='open'    && ['Delivered','Cancelled'].includes(o.status)) return false;
    if (statusF==='flagged' && !o.flag) return false;
    if (statusF==='pending' && o.status!=='Payment Pending') return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      return o.id.toLowerCase().includes(s) || o.customer.toLowerCase().includes(s) || o.product.toLowerCase().includes(s);
    }
    return true;
  });

  if (sel) return <OrderDetail order={sel} onBack={() => setSel(null)} isMobile={isMobile} onOrdersChange={(updated) => { onOrdersChange && onOrdersChange(updated); if (updated.admin_hidden) setSel(null); }} existingCerts={(certificates||[]).filter(c => c.order_id===sel.id)}/>;

  const handleCreatedOrder = (raw) => {
    const mapped = mapOrder(raw);
    onOrdersChange && onOrdersChange(mapped, true); // true = new order
    setSel(mapped); // open the new order detail immediately
  };

  const delivered = visible.filter(o => o.status==='Delivered').length;
  const active    = visible.filter(o => !['Delivered','Cancelled','Payment Pending'].includes(o.status)).length;
  const pending   = visible.filter(o => o.status==='Payment Pending').length;
  const flagged   = visible.filter(o => o.flag).length;

  return (
    <>
      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} onDone={handleCreatedOrder} products={products} rate={rate}/>}
      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:14 }}>
        <StatCard label="Active"       value={active}    accent="var(--accent)"       icon={<Icon name="box"    size={16}/>}/>
        <StatCard label="Delivered"    value={delivered} accent="oklch(45% 0.15 155)" icon={<Icon name="cert"   size={16}/>}/>
        <StatCard label="Awaiting Pay" value={pending}   accent="oklch(48% 0.18 55)"  icon={<Icon name="ticket" size={16}/>}/>
        <StatCard label="Flagged"      value={flagged}   accent="oklch(52% 0.18 25)"  icon={<Icon name="flag"   size={16}/>}/>
      </div>

      <Panel pad={0}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, padding:'14px 18px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
          <div style={{ position:'relative', flex:'1 1 200px', minWidth:0 }}>
            <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', display:'flex' }}><Icon name="search" size={15}/></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search orders…" style={{ ...inputS, paddingLeft:33, width:'100%', boxSizing:'border-box' }}/>
          </div>
          <Segmented value={statusF} onChange={setStatusF} options={[
            {key:'all',     label:'All'},
            {key:'open',    label:'Open'},
            {key:'pending', label:'Awaiting Pay'},
            {key:'flagged', label:'Flagged'},
          ]}/>
          <button onClick={() => setShowCreate(true)} style={{ ...primaryBtn, display:'flex', alignItems:'center', gap:6, marginLeft:'auto' }}>
            <Icon name="plus" size={15} c="white"/> New order
          </button>
          <span style={{ fontSize:12.5, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{filtered.length} of {visible.length}</span>
        </div>

        {isMobile ? (
          <div>
            {filtered.map((o,i) => (
              <div key={o.id} onClick={() => setSel(o)} style={{ padding:'14px 18px', borderTop:i?'1px solid var(--border)':'none', cursor:'pointer' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontFamily:'var(--font-body)', fontWeight:700, fontSize:13, color:'var(--accent)' }}>{o.flag&&'🚩 '}{o.id}</span>
                  <span style={{ fontFamily:'var(--font-num)', fontWeight:700, fontSize:14, color:'var(--text)' }}>{fmtN(o.ngn)}</span>
                </div>
                <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{o.customer}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>{o.product}</div>
                <StatusPill status={o.status}/>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:640 }}>
              <thead>
                <tr style={{ background:'var(--bg-alt)' }}>
                  {['Order','Customer','Product','Status','Via','Total',''].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} onClick={() => setSel(o)} style={{ borderTop:'1px solid var(--border)', cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ ...tdS, fontWeight:700, color:'var(--accent)' }}>{o.status==='Payment Pending'&&'⏳ '}{o.flag&&'🚩 '}{o.id}</td>
                    <td style={tdS}><div style={{ fontWeight:600, color:'var(--text)' }}>{o.customer}</div><div style={{ fontSize:12, color:'var(--text-muted)' }}>{o.phone}</div></td>
                    <td style={{ ...tdS, maxWidth:180, color:'var(--text-muted)', fontSize:12.5 }}><div style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{o.product}</div>{o.items.length>1&&<span style={{ color:'var(--accent)', fontSize:11 }}>+{o.items.length-1} more</span>}</td>
                    <td style={tdS}><StatusPill status={o.status}/></td>
                    <td style={tdS}><PayPill method={o.payment_method}/></td>
                    <td style={{ ...tdS, fontFamily:'var(--font-num)', fontWeight:700, color:'var(--text)' }}>{fmtN(o.ngn)}</td>
                    <td style={tdS}><Icon name="chevron" size={15} c="var(--accent)"/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!filtered.length && <Empty label="No orders match this filter"/>}
      </Panel>
    </div>
    </>
  );
}
