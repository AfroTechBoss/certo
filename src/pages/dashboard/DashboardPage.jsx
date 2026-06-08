import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TOKEN_KEY, NAME_KEY, getToken, getName, authFetch } from './lib/auth.js';
import { useIsMobile } from './lib/useIsMobile.js';
import { mapOrder, mapProduct, mapCert, mapMessage, mapCoupon, mapLog, buildRevenueSeries } from './lib/mappers.js';
import { fmtN, fmtU } from './lib/format.js';
import { inputS, thS, tdS, primaryBtn, actionBtn, miniBtn, linkBtn } from './lib/styles.js';
import { DASH_STATUS_COLORS, dashStatus, DONUT_COLORS } from './lib/constants.js';
import { Icon } from './components/Icon.jsx';
import { StatusPill } from './components/StatusPill.jsx';
import { Sparkline } from './components/Sparkline.jsx';
import { StatCard } from './components/StatCard.jsx';
import { Empty } from './components/Empty.jsx';
import { Panel } from './components/Panel.jsx';
import { Segmented } from './components/Segmented.jsx';
import { Modal } from './components/Modal.jsx';
import { AreaChart } from './components/AreaChart.jsx';
import { DonutChart } from './components/DonutChart.jsx';
import { BarList } from './components/BarList.jsx';
import { WhatsAppModal } from './modals/WhatsAppModal.jsx';
import { FlagModal } from './modals/FlagModal.jsx';
import { DeleteOrderModal } from './modals/DeleteOrderModal.jsx';
import { CouponCreateModal } from './modals/CouponCreateModal.jsx';
import { CertModal } from './modals/CertModal.jsx';
import { CreateOrderModal } from './modals/CreateOrderModal.jsx';
import { ProductEditModal } from './modals/ProductEditModal.jsx';
import { ProductCreateModal } from './modals/ProductCreateModal.jsx';

// All UI primitives (Icon, StatusPill, Sparkline, StatCard, Empty, AreaChart,
// DonutChart, BarList, Panel, Segmented, Modal) live in ./components/*.jsx — imported above.
// Shared style atoms, mappers, auth, fmtN/fmtU — imported from ./lib/* above.

// ─── TAB: Overview ────────────────────────────────────────────────────────────
function OverviewTab({ isMobile, setTab, orders, revenueSeries, messages, products }) {
  const visible   = orders.filter(o => !o.admin_hidden);
  const totalNgn  = visible.reduce((s,o) => s+o.ngn, 0);
  const delivered = visible.filter(o => o.status==='Delivered').length;
  const active    = visible.filter(o => !['Delivered','Cancelled','Payment Pending'].includes(o.status)).length;
  const pending   = visible.filter(o => o.status==='Payment Pending').length;
  const unreadMsg = messages.filter(m => !m.read).length;
  const outOfStock= products.filter(p => p.stock===0 && p.listingStatus!=='coming_soon').length;
  const recent    = visible.slice(0,5);
  const sparkData = revenueSeries.map(r => r.ngn);
  const revTotal  = totalNgn >= 1e6 ? '₦'+(totalNgn/1e6).toFixed(1)+'M' : fmtN(totalNgn);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:14 }}>
        <StatCard label="Revenue (all)" value={revTotal} sub={`${visible.length} orders`} spark={sparkData} icon={<Icon name="coins" size={16}/>}/>
        <StatCard label="Active Orders" value={active} sub="in transit" accent="var(--accent)" icon={<Icon name="box" size={16}/>}/>
        <StatCard label="Delivered" value={delivered} sub="genuine verified" accent="oklch(45% 0.15 155)" icon={<Icon name="cert" size={16}/>}/>
        <StatCard label="Awaiting Pay" value={pending} sub={pending?'unconfirmed':'none'} accent="oklch(48% 0.18 55)" icon={<Icon name="ticket" size={16}/>}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1.6fr 1fr', gap:16 }}>
        <Panel title="Revenue trend" action={<span style={{ fontFamily:'var(--font-num)', fontWeight:800, fontSize:18, color:'var(--text)' }}>{revTotal}</span>}>
          <AreaChart data={revenueSeries} xKey="day" yKey="ngn" height={200}/>
        </Panel>
        <Panel title="Orders by status">
          <DonutChart total="ORDERS" segments={(() => {
            const m = {};
            orders.forEach(o => {
              const k = o.status==='Delivered' ? 'delivered' : o.status==='Payment Pending' ? 'pending' : 'in_progress';
              m[k] = (m[k]||0)+1;
            });
            return Object.entries(m).map(([label,value]) => ({ label, value }));
          })()}/>
        </Panel>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1.6fr 1fr', gap:16 }}>
        <Panel title="Recent orders" pad={0} action={<button onClick={() => setTab('orders')} style={linkBtn}>View all →</button>}>
          {recent.length ? recent.map((o,i) => (
            <div key={o.id} onClick={() => setTab('orders')} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderTop:i?'1px solid var(--border)':'none', cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-alt)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div style={{ width:36, height:36, borderRadius:9, background:'var(--bg-alt)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'var(--font-head)', fontWeight:700, fontSize:12, color:'var(--accent)' }}>
                {o.customer.split(' ').map(n=>n[0]).join('').slice(0,2)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{o.customer}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{o.product}</div>
              </div>
              {!isMobile && <StatusPill status={o.status}/>}
              <div style={{ fontFamily:'var(--font-num)', fontWeight:700, fontSize:13.5, color:'var(--text)', flexShrink:0 }}>{fmtN(o.ngn)}</div>
            </div>
          )) : <Empty label="No orders yet"/>}
        </Panel>

        <Panel title="Needs attention">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <AlertRow color="oklch(55% 0.18 55)" icon="ticket" title={`${pending} order${pending!==1?'s':''} awaiting payment`} sub="Confirm crypto payment to proceed" onClick={() => setTab('orders')}/>
            <AlertRow color="oklch(55% 0.18 25)" icon="flag" title={`${orders.filter(o=>o.flag).length} flagged order${orders.filter(o=>o.flag).length!==1?'s':''}`} sub="Address change — confirm before shipping" onClick={() => setTab('orders')}/>
            <AlertRow color="oklch(50% 0.16 250)" icon="mail" title={`${unreadMsg} unread message${unreadMsg!==1?'s':''}`} sub="Customers waiting on a reply" onClick={() => setTab('messages')}/>
            {outOfStock>0 && <AlertRow color="oklch(55% 0.16 60)" icon="tag" title={`${outOfStock} product${outOfStock!==1?'s':''} out of stock`} sub="Update stock or hide listing" onClick={() => setTab('products')}/>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function AlertRow({ color, icon, title, sub, onClick }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:12, width:'100%', textAlign:'left', padding:'12px 14px', borderRadius:11, border:'1px solid var(--border)', background:'var(--bg-alt)', cursor:'pointer' }}
      onMouseEnter={e => e.currentTarget.style.borderColor=color}
      onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
      <span style={{ width:32, height:32, borderRadius:8, background:'var(--bg)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon name={icon} size={16} c={color}/>
      </span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{title}</div>
        <div style={{ fontSize:11.5, color:'var(--text-muted)' }}>{sub}</div>
      </div>
      <Icon name="chevron" size={15} c="var(--text-muted)"/>
    </button>
  );
}

// CreateOrderModal moved to ./modals/CreateOrderModal.jsx (NG_STATES → lib/constants.js)

// ─── TAB: Orders ──────────────────────────────────────────────────────────────
function OrdersTab({ isMobile, orders, onOrdersChange, certificates, products, rate }) {
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

// Modal is imported from ./components/Modal.jsx

// WhatsAppModal moved to ./modals/WhatsAppModal.jsx
// FlagModal moved to ./modals/FlagModal.jsx

// CertModal moved to ./modals/CertModal.jsx

// ProductEditModal moved to ./modals/ProductEditModal.jsx (PROD_CATS → lib/constants.js)

// ProductCreateModal moved to ./modals/ProductCreateModal.jsx

// DeleteOrderModal moved to ./modals/DeleteOrderModal.jsx

function PayPill({ method }) {
  const m = method==='MoonPay'
    ? { bg:'oklch(94% 0.05 280)', fg:'oklch(42% 0.16 280)' }
    : { bg:'oklch(93% 0.06 145)', fg:'oklch(36% 0.15 145)' };
  return <span style={{ padding:'3px 9px', borderRadius:6, background:m.bg, color:m.fg, fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>{method||'Paystack'}</span>;
}

function OrderDetail({ order: initialOrder, onBack, isMobile, onOrdersChange, existingCerts }) {
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

// ─── TAB: Products ────────────────────────────────────────────────────────────
function ProductsTab({ isMobile, products, onProductUpdate }) {
  const [q,            setQ]           = useState('');
  const [editId,       setEditId]      = useState(null);
  const [showCreate,   setShowCreate]  = useState(false);
  const [deleteTarget, setDeleteTarget]= useState(null);
  const [deleting,     setDeleting]    = useState(false);
  const [localProds,   setLocalProds]  = useState(products);
  const [savingOrder,  setSavingOrder] = useState(false);
  const [dragIdx,      setDragIdx]     = useState(null);
  const [dragOverIdx,  setDragOverIdx] = useState(null);

  useEffect(() => { setLocalProds(products); }, [products]);

  const filtered = localProds.filter(p => !q.trim() || (p.name+p.subtitle+p.type).toLowerCase().includes(q.toLowerCase()));
  const STATUS_MAP = {
    live:        { label:'Live',         bg:'oklch(93% 0.06 155)', fg:'oklch(35% 0.15 155)' },
    out_of_stock:{ label:'Out of stock', bg:'oklch(94% 0.02 0)',   fg:'oklch(48% 0.05 0)'   },
    coming_soon: { label:'Coming soon',  bg:'oklch(95% 0.07 70)',  fg:'oklch(45% 0.16 55)'  },
    hidden:      { label:'Hidden',       bg:'oklch(94% 0.02 0)',   fg:'oklch(48% 0.05 0)'   },
  };

  const handleEditDone = (raw) => {
    const mapped = mapProduct(raw);
    setLocalProds(prev => prev.map(p => p.id===mapped.id ? mapped : p));
    onProductUpdate && onProductUpdate(mapped);
  };

  const handleCreateDone = (raw) => {
    const mapped = mapProduct(raw);
    setLocalProds(prev => [mapped, ...prev]);
    onProductUpdate && onProductUpdate(mapped);
  };

  // ── Drag-to-reorder ──────────────────────────────────────────────────────────
  const onDragStart = (i) => setDragIdx(i);
  const onDragOver  = (e, i) => { e.preventDefault(); setDragOverIdx(i); };
  const onDrop = (i) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...localProds];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setLocalProds(next);
    setDragIdx(null);
    setDragOverIdx(null);
    // Auto-save immediately after drop
    setSavingOrder(true);
    const payload = next.map((p, idx) => ({ id: p.id, sort_order: idx + 1 }));
    authFetch('/api/products/reorder', { method:'PATCH', body: JSON.stringify({ order: payload }) })
      .catch(e => console.error('Reorder failed:', e))
      .finally(() => setSavingOrder(false));
  };
  const onDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await authFetch(`/api/products/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { setLocalProds(prev => prev.filter(x => x.id !== deleteTarget.id)); setDeleteTarget(null); }
    } catch(e) { console.error(e); }
    setDeleting(false);
  };

  return (
    <>
      {editId && <ProductEditModal productId={editId} onClose={() => setEditId(null)} onDone={handleEditDone}/>}
      {showCreate && <ProductCreateModal onClose={() => setShowCreate(false)} onDone={handleCreateDone}/>}
      {deleteTarget && (
        <Modal title="Delete product" onClose={() => setDeleteTarget(null)} width={380}>
          <p style={{ fontSize:14, color:'var(--text)', lineHeight:1.65, marginBottom:6 }}>
            Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
          </p>
          <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, marginBottom:24 }}>
            This cannot be undone. Any existing orders for this product will not be affected.
          </p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={confirmDelete} disabled={deleting} style={{ ...primaryBtn, background:'oklch(48% 0.2 25)', flex:1, opacity:deleting?0.7:1 }}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button onClick={() => setDeleteTarget(null)} style={{ ...actionBtn, flex:1, justifyContent:'center' }}>Cancel</button>
          </div>
        </Modal>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:'1 1 220px' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', display:'flex' }}><Icon name="search" size={15}/></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…" style={{ ...inputS, paddingLeft:34, width:'100%', boxSizing:'border-box' }}/>
          </div>
          <span style={{ fontSize:12.5, color:'var(--text-muted)' }}>{filtered.length} of {localProds.length}</span>
          {savingOrder && <span style={{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic' }}>Saving…</span>}
          <button onClick={() => setShowCreate(true)} style={{ ...primaryBtn, display:'flex', alignItems:'center', gap:7 }}><Icon name="plus" size={16} c="white"/> Add product</button>
        </div>

        {isMobile ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map((p, i) => {
              const st = STATUS_MAP[p.listingStatus]||STATUS_MAP.live;
              const isDragOver = dragOverIdx === i;
              return (
                <div key={p.id}
                  draggable={!q.trim()}
                  onDragStart={() => onDragStart(i)}
                  onDragOver={e => onDragOver(e, i)}
                  onDrop={() => onDrop(i)}
                  onDragEnd={onDragEnd}
                  style={{ opacity: dragIdx===i ? 0.4 : 1, borderTop: isDragOver ? '2px solid var(--accent)' : '2px solid transparent', transition:'border-color 0.15s' }}
                >
                  <Panel pad={16}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
                      {!q.trim() && <div title="Drag to reorder" style={{ cursor:'grab', color:'var(--text-muted)', fontSize:16, alignSelf:'center', flexShrink:0 }}>⠿</div>}
                      <div style={{ minWidth:0, flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, color:'var(--text)' }}>{p.name}{p.featured&&<span style={{ color:'var(--accent)', marginLeft:4 }}>★</span>}</div>
                          {p.code && <span style={{ fontFamily:'var(--font-mono,monospace)', fontWeight:700, fontSize:11, color:'var(--accent)', background:'var(--accent-tint)', padding:'2px 7px', borderRadius:6, letterSpacing:'0.05em', flexShrink:0 }}>#{p.code}</span>}
                        </div>
                        <div style={{ fontSize:12.5, color:'var(--text-muted)', marginBottom:8 }}>{p.subtitle}</div>
                        <span style={{ padding:'3px 9px', borderRadius:6, background:st.bg, color:st.fg, fontSize:11, fontWeight:700 }}>{st.label}</span>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontFamily:'var(--font-num)', fontWeight:800, fontSize:16, color:'var(--text)' }}>{fmtU(p.usdPrice)}</div>
                        <div style={{ fontSize:12, color:p.stock===0?'oklch(55% 0.18 25)':'var(--text-muted)', marginTop:4 }}>{p.stock} in stock</div>
                        <div style={{ display:'flex', gap:6, marginTop:8, justifyContent:'flex-end' }}>
                          {p.listingStatus==='live' && <a href={`/shop/${p.id}`} target="_blank" rel="noreferrer" style={{ ...miniBtn, textDecoration:'none' }}>View ↗</a>}
                          <button onClick={() => setEditId(p.id)} style={miniBtn}>Edit</button>
                          <button onClick={() => setDeleteTarget(p)} style={{ ...miniBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(88% 0.08 25)' }}>Delete</button>
                        </div>
                      </div>
                    </div>
                  </Panel>
                </div>
              );
            })}
          </div>
        ) : (
          <Panel pad={0}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:720 }}>
                <thead><tr style={{ background:'var(--bg-alt)' }}>{[!q.trim()?'⠿':'','Product','Type','Condition','USD','Stock','Status',''].map((h,i)=><th key={i} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const st = STATUS_MAP[p.listingStatus]||STATUS_MAP.live;
                    const isDragOver = dragOverIdx === i;
                    return (
                      <tr key={p.id}
                        draggable={!q.trim()}
                        onDragStart={() => onDragStart(i)}
                        onDragOver={e => onDragOver(e, i)}
                        onDrop={() => onDrop(i)}
                        onDragEnd={onDragEnd}
                        style={{ borderTop: isDragOver ? '2px solid var(--accent)' : '1px solid var(--border)', opacity: dragIdx===i ? 0.4 : 1, cursor: q.trim() ? 'default' : 'grab' }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--bg-alt)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={{ ...tdS, color:'var(--text-muted)', fontSize:18, width:32, textAlign:'center' }}>{!q.trim() ? '⠿' : ''}</td>
                        <td style={tdS}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ fontWeight:700, color:'var(--text)' }}>{p.name}{p.featured&&<span title="Featured" style={{ color:'var(--accent)' }}>★</span>}</div>
                            {p.code && <span style={{ fontFamily:'var(--font-mono,monospace)', fontWeight:700, fontSize:11, color:'var(--accent)', background:'var(--accent-tint)', padding:'2px 7px', borderRadius:6, letterSpacing:'0.05em', flexShrink:0 }}>#{p.code}</span>}
                          </div>
                          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{p.subtitle}</div>
                        </td>
                        <td style={{ ...tdS, color:'var(--text-muted)', fontSize:12.5 }}>{p.type}</td>
                        <td style={tdS}><CondBadge condition={p.condition}/></td>
                        <td style={{ ...tdS, fontSize:13 }}>{fmtU(p.usdPrice)}</td>
                        <td style={{ ...tdS, color:p.stock===0?'oklch(55% 0.18 25)':'var(--text)', fontWeight:600 }}>{p.stock}</td>
                        <td style={tdS}><span style={{ padding:'3px 9px', borderRadius:6, background:st.bg, color:st.fg, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>{st.label}</span></td>
                        <td style={{ ...tdS, whiteSpace:'nowrap' }}>
                          <div style={{ display:'flex', gap:6 }}>
                            {p.listingStatus==='live' && <a href={`/shop/${p.id}`} target="_blank" rel="noreferrer" style={{ ...miniBtn, textDecoration:'none' }}>View ↗</a>}
                            <button onClick={() => setEditId(p.id)} style={miniBtn}>Edit</button>
                            <button onClick={() => setDeleteTarget(p)} style={{ ...miniBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(88% 0.08 25)' }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!filtered.length&&<Empty label="No products found"/>}
          </Panel>
        )}
      </div>
    </>
  );
}

function CondBadge({ condition }) {
  const s = condition==='Refurb'||condition==='refurb'
    ? { bg:'oklch(94% 0.06 250)', fg:'oklch(40% 0.15 250)', label:'Refurb' }
    : { bg:'oklch(93% 0.06 155)', fg:'oklch(35% 0.15 155)', label:'New' };
  return <span style={{ padding:'3px 9px', borderRadius:6, background:s.bg, color:s.fg, fontSize:11, fontWeight:700 }}>{s.label}</span>;
}

// ─── TAB: Certificates ────────────────────────────────────────────────────────
function CertificatesTab({ isMobile, certificates }) {
  const [q, setQ] = useState('');
  const certs = certificates.filter(c => !q.trim() || (c.id+c.order_id+c.product_name+c.serial_number).toLowerCase().includes(q.toLowerCase()));
  const published = certificates.filter(c => c.status==='published').length;
  const drafts    = certificates.filter(c => c.status==='draft').length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:14 }}>
        <StatCard label="Published"   value={published}           accent="oklch(45% 0.15 155)" icon={<Icon name="cert" size={16}/>}/>
        <StatCard label="Drafts"      value={drafts}              accent="oklch(48% 0.18 55)"  icon={<Icon name="cert" size={16}/>}/>
        <StatCard label="Total issued" value={certificates.length} sub="all time"              icon={<Icon name="cert" size={16}/>}/>
      </div>

      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', display:'flex' }}><Icon name="search" size={15}/></span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by serial, order, product…" style={{ ...inputS, paddingLeft:34, width:'100%', boxSizing:'border-box' }}/>
      </div>

      <Panel pad={0}>
        {certs.length ? certs.map((c,i) => (
          <div key={c.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'15px 20px', borderTop:i?'1px solid var(--border)':'none' }}>
            <div style={{ width:40, height:40, borderRadius:10, background:c.status==='published'?'oklch(93% 0.06 155)':'oklch(95% 0.07 70)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name="cert" size={18} c={c.status==='published'?'oklch(40% 0.15 155)':'oklch(48% 0.16 55)'}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{c.product_name}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-mono,monospace)' }}>{c.order_id}{c.serial_number?` · ${c.serial_number}`:' · no serial yet'}</div>
            </div>
            {!isMobile&&<div style={{ fontSize:12, color:'var(--text-muted)' }}>{c.date}</div>}
            <span style={{ padding:'4px 11px', borderRadius:100, fontSize:11, fontWeight:700, whiteSpace:'nowrap', background:c.status==='published'?'oklch(93% 0.06 155)':'oklch(95% 0.07 70)', color:c.status==='published'?'oklch(35% 0.15 155)':'oklch(45% 0.16 55)' }}>{c.status==='published'?'✓ Published':'⏳ Draft'}</span>
            <button style={miniBtn}>{c.status==='published'?'View':'Edit'}</button>
          </div>
        )) : <Empty label="No certificates yet"/>}
      </Panel>
    </div>
  );
}

// ─── TAB: Messages ────────────────────────────────────────────────────────────
function MessagesTab({ isMobile, messages: initialMessages }) {
  const [sel,  setSel]  = useState(null);
  const [msgs, setMsgs] = useState(initialMessages);

  useEffect(() => { setMsgs(initialMessages); }, [initialMessages]);

  const open = async (m) => {
    setSel(m);
    if (!m.read) {
      setMsgs(prev => prev.map(x => x.id===m.id ? {...x, read:true} : x));
      setSel(s => s?.id===m.id ? {...s, read:true} : s);
      try { await authFetch(`/api/contact/${m.id}`, { method:'PATCH', body: JSON.stringify({ read:true }) }); } catch(e){}
    }
  };

  const markUnread = async () => {
    if (!sel) return;
    setMsgs(prev => prev.map(x => x.id===sel.id ? {...x, read:false} : x));
    setSel(s => ({...s, read:false}));
    try { await authFetch(`/api/contact/${sel.id}`, { method:'PATCH', body: JSON.stringify({ read:false }) }); } catch(e){}
  };

  const deleteMsg = async () => {
    if (!sel) return;
    try {
      const res = await authFetch(`/api/contact/${sel.id}`, { method:'DELETE' });
      if (res.ok) {
        setMsgs(prev => prev.filter(x => x.id !== sel.id));
        setSel(null);
      }
    } catch(e) { console.error(e); }
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'340px 1fr', gap:16, alignItems:'start' }}>
      <Panel pad={0} title={`Inbox · ${msgs.filter(m=>!m.read).length} unread`}>
        {msgs.length ? msgs.map((m,i) => {
          const active = sel?.id===m.id;
          return (
            <button key={m.id} onClick={() => open(m)} style={{ display:'block', width:'100%', textAlign:'left', cursor:'pointer', padding:'14px 18px', border:'none', borderTop:i?'1px solid var(--border)':'none', borderLeft:active?'3px solid var(--accent)':'3px solid transparent', background:active?'var(--bg-alt)':'var(--bg)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                {!m.read&&<span style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)', flexShrink:0 }}/>}
                <span style={{ fontSize:13.5, fontWeight:m.read?600:800, color:'var(--text)', flex:1 }}>{m.name}</span>
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>{m.created_at.split('·')[0]}</span>
              </div>
              <div style={{ fontSize:12.5, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.message}</div>
            </button>
          );
        }) : <Empty label="No messages yet"/>}
      </Panel>

      {(sel||!isMobile)&&(
        <Panel style={{ minHeight:300 }}>
          {sel ? (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, gap:12, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:20, color:'var(--text)' }}>{sel.name}</div>
                  <a href={`mailto:${sel.email}`} style={{ fontSize:13, color:'var(--accent)', textDecoration:'none' }}>{sel.email}</a>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{sel.created_at}</div>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <a href={`mailto:${sel.email}`} style={{ ...primaryBtn, textDecoration:'none' }}>Reply</a>
                  <button onClick={markUnread} disabled={!sel.read} style={{ ...actionBtn, opacity:sel.read?1:0.4, cursor:sel.read?'pointer':'default' }}>Mark unread</button>
                  <button onClick={deleteMsg} style={{ ...actionBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(88% 0.08 25)' }}>Delete</button>
                </div>
              </div>
              <div style={{ background:'var(--bg-alt)', borderRadius:12, padding:20, fontSize:15, lineHeight:1.7, color:'var(--text)' }}>{sel.message}</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:280, gap:12, color:'var(--text-muted)' }}>
              <Icon name="mail" size={32} c="var(--border)"/>
              <span style={{ fontSize:13 }}>Select a message to read</span>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

// CouponCreateModal moved to ./modals/CouponCreateModal.jsx

// ─── TAB: Coupons ─────────────────────────────────────────────────────────────
function CouponsTab({ isMobile, coupons: initialCoupons }) {
  const [localCoupons, setLocalCoupons] = useState(initialCoupons);
  const [showCreate,   setShowCreate]   = useState(false);

  useEffect(() => { setLocalCoupons(initialCoupons); }, [initialCoupons]);

  const handleCreated = (raw) => {
    setLocalCoupons(prev => [mapCoupon(raw), ...prev]);
  };

  const toggleActive = async (c) => {
    try {
      const res = await authFetch(`/api/coupons/${c.id}`, { method:'PATCH', body: JSON.stringify({ is_active: !c.active }) });
      if (res.ok) {
        const updated = mapCoupon(await res.json());
        setLocalCoupons(prev => prev.map(x => x.id===updated.id ? updated : x));
      }
    } catch(e) { console.error(e); }
  };

  const deleteCoupon = async (c) => {
    if (!window.confirm(`Delete coupon "${c.code}"? This cannot be undone.`)) return;
    try {
      const res = await authFetch(`/api/coupons/${c.id}`, { method:'DELETE' });
      if (res.ok) setLocalCoupons(prev => prev.filter(x => x.id !== c.id));
    } catch(e) { console.error(e); }
  };

  return (
    <>
      {showCreate && <CouponCreateModal onClose={() => setShowCreate(false)} onDone={handleCreated}/>}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:18, color:'var(--text)', margin:0 }}>Discount codes</h2>
          <button onClick={() => setShowCreate(true)} style={{ ...primaryBtn, display:'flex', alignItems:'center', gap:7 }}><Icon name="plus" size={16} c="white"/> New coupon</button>
        </div>
        {localCoupons.length ? (
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)', gap:14 }}>
            {localCoupons.map(c => {
              const usagePct = c.max_uses ? Math.min(100, Math.round((c.uses / c.max_uses) * 100)) : 0;
              return (
                <div key={c.id} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:16, padding:20, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-12, right:-12, width:70, height:70, borderRadius:'50%', background:c.active?'var(--accent-tint,#f7e9df)':'var(--bg-alt)', opacity:0.6 }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, position:'relative' }}>
                    <div style={{ fontFamily:'var(--font-mono,monospace)', fontWeight:700, fontSize:16, color:'var(--text)', letterSpacing:'0.04em', background:'var(--bg-alt)', border:'1px dashed var(--border)', borderRadius:8, padding:'5px 12px' }}>{c.code}</div>
                    <button onClick={() => toggleActive(c)} style={{ padding:'3px 9px', borderRadius:100, fontSize:10.5, fontWeight:700, cursor:'pointer', border:'none', background:c.active?'oklch(93% 0.06 155)':'oklch(94% 0.02 0)', color:c.active?'oklch(35% 0.15 155)':'oklch(50% 0.04 0)' }}>{c.active?'Active':'Inactive'}</button>
                  </div>
                  <div style={{ fontFamily:'var(--font-num)', fontWeight:800, fontSize:28, color:'var(--accent)', letterSpacing:'-0.02em', marginBottom:2 }}>
                    {c.type==='percent' ? `${c.value}% off` : `₦${Number(c.value).toLocaleString()} off`}
                  </div>
                  {c.description && <div style={{ fontSize:12.5, color:'var(--text-muted)', marginBottom:4 }}>{c.description}</div>}
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>Expires {c.expires}</div>
                  {c.max_uses ? (<>
                    <div style={{ marginBottom:6, display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)' }}>
                      <span>{c.uses} / {c.max_uses} used</span>
                      <span>{usagePct}%</span>
                    </div>
                    <div style={{ height:6, background:'var(--bg-alt)', borderRadius:4, overflow:'hidden', marginBottom:14 }}>
                      <div style={{ height:'100%', width:`${usagePct}%`, background:'var(--accent)', borderRadius:4 }}/>
                    </div>
                  </>) : (
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>{c.uses} uses · No limit</div>
                  )}
                  <button onClick={() => deleteCoupon(c)} style={{ ...miniBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(88% 0.08 25)' }}>Delete</button>
                </div>
              );
            })}
          </div>
        ) : <Empty label="No coupons yet"/>}
      </div>
    </>
  );
}

// ─── TAB: Analytics ───────────────────────────────────────────────────────────
function AnalyticsTab({ isMobile, analytics: analyticsData }) {
  const [tf, setTf] = useState('7days');
  const [data, setData] = useState(analyticsData);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async (timeframe) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/analytics?timeframe=${timeframe}`);
      if (res.ok) setData(await res.json());
    } catch(e){}
    setLoading(false);
  }, []);

  useEffect(() => { reload(tf); }, [tf]);

  const ov = data?.overview || {};
  const NG = { LA:'Lagos', FC:'Abuja (FCT)', RV:'Rivers', OY:'Oyo' };
  const locLabel = r => r.country==='NG' ? '🇳🇬 '+(NG[r.region]||r.region||r.location) : '🌍 '+(r.location||r.country||'Unknown');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18, opacity:loading?0.7:1, transition:'opacity 0.2s' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'8px 14px', borderRadius:10, background:'oklch(93% 0.06 155)', border:'1px solid oklch(82% 0.1 155)' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'oklch(50% 0.17 155)' }}/>
          <span style={{ fontSize:12.5, fontWeight:700, color:'oklch(35% 0.15 155)' }}>Server online</span>
        </div>
        <Segmented value={tf} onChange={v => { setTf(v); }} options={[{key:'today',label:'Today'},{key:'7days',label:'7d'},{key:'30days',label:'30d'},{key:'90days',label:'90d'}]}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:14 }}>
        <StatCard label="Page Views"      value={(ov.pageviews||0).toLocaleString()}         sub={`${(ov.unique_sessions||0).toLocaleString()} unique`}    icon={<Icon name="chart"  size={16}/>}/>
        <StatCard label="Product Views"   value={(ov.product_views||0).toLocaleString()}     accent="oklch(50% 0.18 250)"                                  icon={<Icon name="tag"    size={16}/>}/>
        <StatCard label="Add to Cart"     value={(ov.add_to_cart||0).toLocaleString()}       accent="oklch(45% 0.18 155)"                                  icon={<Icon name="box"    size={16}/>}/>
        <StatCard label="Checkout Starts" value={(ov.checkout_starts||0).toLocaleString()}   accent="oklch(48% 0.18 55)"                                   icon={<Icon name="ticket" size={16}/>}/>
        <StatCard label="Conversion"      value={ov.unique_sessions ? ((ov.checkout_starts||0)/ov.unique_sessions*100).toFixed(1)+'%':'—'} sub="sessions → checkout" accent="oklch(50% 0.16 310)" icon={<Icon name="pulse" size={16}/>}/>
        <StatCard label="Total Events"    value={ov.total_events ? ((ov.total_events/1000).toFixed(1)+'k') : '0'} sub="tracked actions" accent="var(--text-muted)" icon={<Icon name="grid" size={16}/>}/>
      </div>

      {data?.daily?.length ? (
        <Panel title="Daily page views">
          <AreaChart data={data.daily.map(x => ({ day: new Date(x.day+'T12:00').toLocaleDateString('en-NG',{month:'short',day:'numeric'}), views: x.views }))} xKey="day" yKey="views" height={200}/>
        </Panel>
      ) : null}

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:16 }}>
        <Panel title="Top pages">{data?.topPages?.length ? <BarList items={data.topPages} labelKey="page" valueKey="views"/> : <Empty label="No page data yet"/>}</Panel>
        <Panel title="Top products">{data?.topProducts?.length ? <BarList items={data.topProducts} labelKey="product_name" valueKey="views" color="oklch(52% 0.18 250)"/> : <Empty label="No product view data yet"/>}</Panel>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:16 }}>
        <Panel title="Visitor locations">{data?.locations?.length ? <BarList items={data.locations.map(l => ({ ...l, label:locLabel(l) }))} labelKey="label" valueKey="sessions" color="oklch(50% 0.16 310)"/> : <Empty label="No location data yet"/>}</Panel>
        <Panel title="Event breakdown">{data?.eventBreakdown?.length ? <DonutChart total="EVENTS" segments={data.eventBreakdown.map(e => ({ label:e.event_type, value:e.count }))}/> : <Empty label="No event data yet"/>}</Panel>
      </div>
    </div>
  );
}

// ─── TAB: Activity ────────────────────────────────────────────────────────────
function ActivityTab({ isMobile, logs, onLogsCleared }) {
  const [clearing, setClearing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const iconFor = a => a.includes('order')||a.includes('status') ? 'box' : a.includes('certificate') ? 'cert' : a.includes('product') ? 'tag' : a.includes('forex')||a.includes('rate') ? 'coins' : a.includes('message') ? 'mail' : 'pulse';

  const doClear = async () => {
    setConfirmOpen(false);
    setClearing(true);
    try {
      const res = await authFetch('/api/admin/logs', { method: 'DELETE' });
      if (res.ok) onLogsCleared();
    } catch(e) { console.error(e); }
    setClearing(false);
  };

  return (
    <>
      {confirmOpen && (
        <Modal title="Clear activity log?" onClose={() => setConfirmOpen(false)} width={380}>
          <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.6, margin:'0 0 20px' }}>
            This will permanently delete all {logs.length} log {logs.length === 1 ? 'entry' : 'entries'}. This action cannot be undone.
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={() => setConfirmOpen(false)} style={{ ...actionBtn }}>Cancel</button>
            <button onClick={doClear} style={{ ...actionBtn, background:'oklch(48% 0.2 25)', color:'white', borderColor:'transparent' }}>
              Delete all
            </button>
          </div>
        </Modal>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:18, color:'var(--text)', margin:0 }}>Activity log</h2>
          {logs.length > 0 && (
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={clearing}
              style={{ ...actionBtn, color:'oklch(48% 0.2 25)', borderColor:'oklch(85% 0.1 25)', background:'oklch(98% 0.01 25)', opacity:clearing?0.5:1 }}
            >
              {clearing ? 'Clearing…' : 'Clear log'}
            </button>
          )}
        </div>
        <Panel pad={0}>
          {logs.length ? logs.map((l,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'15px 20px', borderTop:i?'1px solid var(--border)':'none' }}>
              <div style={{ width:36, height:36, borderRadius:9, background:'var(--bg-alt)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name={iconFor(l.action.toLowerCase())} size={16} c="var(--accent)"/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text)' }}>{l.action}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{l.details}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{l.admin}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{l.ts}</div>
              </div>
            </div>
          )) : <Empty label="No activity yet"/>}
        </Panel>
      </div>
    </>
  );
}

// ─── TAB: Forex ───────────────────────────────────────────────────────────────
function ForexTab({ isMobile, liveRate, rateFetched, onRateChange, products }) {
  // `displayRate` is what we show on the card — kept in sync with the prop
  const [displayRate, setDisplayRate] = useState(liveRate || 1590);
  // override input state
  const [overrideInput, setOverrideInput] = useState(String(liveRate || 1590));
  const [overrideSaved, setOverrideSaved] = useState(false);
  // fetch state
  const [fetching,   setFetching]   = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [fetchedAt,  setFetchedAt]  = useState(rateFetched || null);
  // raw market rate (= display rate − 100 markup) — only set after an explicit fetch
  const [marketRate, setMarketRate] = useState(null);
  // whether the current rate is an override (vs. auto-fetched)
  const [isOverride, setIsOverride] = useState(() => {
    try { return localStorage.getItem('certo_rate_override') === '1'; } catch(_) { return false; }
  });

  // Keep display rate in sync with prop (e.g. auto-refresh in App.jsx)
  useEffect(() => {
    if (liveRate) {
      setDisplayRate(liveRate);
      if (!isOverride) setOverrideInput(String(liveRate));
    }
  }, [liveRate]);

  useEffect(() => { if (rateFetched) setFetchedAt(rateFetched); }, [rateFetched]);

  // Keep a ref to fetchLive so the interval always calls the latest version
  const fetchLiveRef = React.useRef(null);
  useEffect(() => { fetchLiveRef.current = fetchLive; });

  // Auto-fetch on mount + every 5 min — skipped when override is active
  useEffect(() => {
    if (localStorage.getItem('certo_rate_override') === '1') return;
    fetchLiveRef.current?.();
    const t = setInterval(() => {
      if (localStorage.getItem('certo_rate_override') !== '1') fetchLiveRef.current?.();
    }, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLive = async () => {
    setFetching(true);
    setFetchError('');
    try {
      const res = await fetch('/api/forex');
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      const withMarkup = Number(data.rate);          // already includes +₦100
      const raw        = withMarkup - 100;            // pure market rate
      setMarketRate(raw);
      setDisplayRate(withMarkup);
      setOverrideInput(String(withMarkup));
      setIsOverride(false);
      try { localStorage.removeItem('certo_rate_override'); } catch(_) {}
      setFetchedAt(new Date());
      if (onRateChange) onRateChange(withMarkup);
    } catch(e) {
      setFetchError(e.message || 'Failed to fetch rate');
    }
    setFetching(false);
  };

  const applyOverride = () => {
    const n = Number(overrideInput);
    if (!n || n < 100) return;
    setDisplayRate(n);
    setIsOverride(true);
    try { localStorage.setItem('certo_rate_override', '1'); } catch(_) {}
    setMarketRate(null);
    setOverrideSaved(true);
    setTimeout(() => setOverrideSaved(false), 2000);
    if (onRateChange) onRateChange(n);
  };

  const fmtTs = (ts) => {
    if (!ts) return null;
    const d = ts instanceof Date ? ts : new Date(ts);
    return d.toLocaleTimeString('en-NG', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:16, alignItems:'start', maxWidth:900 }}>
      {/* ── Left dark card ── */}
      <div style={{ background:'var(--ink,#1a1714)', borderRadius:18, padding:isMobile?22:32, color:'white', position:'relative', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background: isOverride ? 'var(--accent,#d97757)' : '#34d399', flexShrink:0 }}/>
            {isOverride ? 'Custom override' : 'Live buying rate'}
          </div>
          <button
            onClick={fetchLive}
            disabled={fetching}
            style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, padding:'6px 12px', color:'white', fontSize:12, fontWeight:600, cursor:fetching?'not-allowed':'pointer', opacity:fetching?0.6:1, whiteSpace:'nowrap' }}
          >
            <span style={{ display:'flex', animation: fetching ? 'spin 0.75s linear infinite' : 'none' }}>
              <Icon name="refresh" size={13} c="white"/>
            </span>
            {fetching ? 'Fetching…' : 'Fetch live'}
          </button>
        </div>

        <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
          <span style={{ fontFamily:'var(--font-num)', fontWeight:800, fontSize:isMobile?48:64, letterSpacing:'-0.04em', lineHeight:1 }}>₦{displayRate.toLocaleString()}</span>
          <span style={{ fontSize:16, color:'rgba(255,255,255,0.5)', fontFamily:'var(--font-mono,monospace)' }}>/ $1</span>
        </div>

        {/* Rate breakdown row */}
        {marketRate !== null && (
          <div style={{ display:'flex', gap:12, marginTop:14, flexWrap:'wrap' }}>
            <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:8, padding:'6px 12px', fontSize:12 }}>
              <span style={{ color:'rgba(255,255,255,0.5)' }}>Market rate  </span>
              <span style={{ fontWeight:700, color:'white' }}>₦{marketRate.toLocaleString()}</span>
            </div>
            <div style={{ background:'rgba(52,211,153,0.15)', borderRadius:8, padding:'6px 12px', fontSize:12 }}>
              <span style={{ color:'rgba(255,255,255,0.5)' }}>+ markup  </span>
              <span style={{ fontWeight:700, color:'#34d399' }}>₦100</span>
            </div>
          </div>
        )}

        <div style={{ fontSize:12, color: fetchError ? 'oklch(65% 0.2 25)' : '#34d399', marginTop:12 }}>
          {fetchError
            ? `⚠ ${fetchError}`
            : fetchedAt
              ? `Last fetched at ${fmtTs(fetchedAt)}`
              : 'Not yet fetched this session'}
        </div>

        <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.12)' }}>
          <svg width="100%" height="44" viewBox="0 0 320 48" preserveAspectRatio="none">
            <defs><linearGradient id="fxg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4"/><stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/></linearGradient></defs>
            <path d="M0,32 L40,30 L80,34 L120,26 L160,28 L200,20 L240,24 L280,14 L320,10 L320,48 L0,48 Z" fill="url(#fxg)"/>
            <path d="M0,32 L40,30 L80,34 L120,26 L160,28 L200,20 L240,24 L280,14 L320,10" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ── Right panel ── */}
      <Panel title="Override rate">
        <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, margin:'0 0 16px' }}>
          Click <strong>Fetch live</strong> to pull the current market rate (already including +₦100 markup). Or type a custom rate below and hit <strong>Override</strong> to lock it instantly across the whole catalog.
        </p>

        <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:8 }}>Custom rate (₦ per $1)</label>
        <div style={{ display:'flex', gap:10 }}>
          <input
            type="number"
            value={overrideInput}
            onChange={e => { setOverrideInput(e.target.value); setOverrideSaved(false); }}
            onKeyDown={e => { if (e.key === 'Enter') applyOverride(); }}
            style={{ ...inputS, flex:1, fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, padding:'12px 16px' }}
          />
          <button
            onClick={applyOverride}
            style={{ ...primaryBtn, padding:'12px 22px', background: overrideSaved ? 'oklch(50% 0.17 155)' : 'var(--accent)', minWidth:96 }}
          >
            {overrideSaved ? '✓ Saved' : 'Override'}
          </button>
        </div>

        {isOverride && (
          <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:7, fontSize:12, color:'var(--accent)', fontWeight:600 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', flexShrink:0 }}/>
            Custom override active — fetch live to reset
          </div>
        )}

        <div style={{ marginTop:20, background:'var(--bg-alt)', borderRadius:12, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>
            Preview at ₦{Number(overrideInput || displayRate).toLocaleString()}
          </div>
          {products.slice(0,4).map(p => (
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderTop:'1px solid var(--border)', fontSize:13, gap:8 }}>
              <span style={{ color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{p.name} {(p.subtitle||'').split('·')[0].trim()}</span>
              <span style={{ fontFamily:'var(--font-num)', fontWeight:700, color:'var(--text)', flexShrink:0 }}>{fmtN(p.usdPrice * Number(overrideInput || displayRate))}</span>
            </div>
          ))}
          {!products.length && <div style={{ fontSize:13, color:'var(--text-muted)' }}>No products to preview.</div>}
        </div>
      </Panel>
    </div>
  );
}

// ─── TAB: Revenue ─────────────────────────────────────────────────────────────
// ── Est. net helpers ─────────────────────────────────────────────────────────
// Service fee: $35 flat + $20 per extra unit (2nd item onwards)
function orderServiceFee(order) {
  const totalUnits = (order.items || []).reduce((s, it) => s + (it.qty || 1), 0) || 1;
  return 35 + Math.max(0, totalUnits - 1) * 20;
}
// Price margin: 7% of the USD selling price
function orderPriceMargin(order) { return order.usd * 0.07; }
// Forex margin: ₦100 per every $1 charged → total NGN gain
function orderForexGainNgn(order) { return order.usd * 100; }
// Combined Est. Net in USD (service fee + 7% margin)
function orderEstNetUsd(order) { return orderServiceFee(order) + orderPriceMargin(order); }
// Combined Est. Net in NGN: USD net converted at implied rate + ₦100/$ forex gain
function orderEstNetNgn(order) {
  const impliedRate = order.usd > 0 ? order.ngn / order.usd : 1590;
  return orderEstNetUsd(order) * impliedRate + orderForexGainNgn(order);
}

function RevenueTab({ isMobile, orders, revenueSeries }) {
  const [cur, setCur] = useState('ngn');
  const visible      = orders.filter(o => !o.admin_hidden);
  const totalNgn     = visible.reduce((s,o) => s+o.ngn, 0);
  const totalUsd     = visible.reduce((s,o) => s+o.usd, 0);
  const totalNetUsd  = visible.reduce((s,o) => s+orderEstNetUsd(o), 0);
  const totalNetNgn  = visible.reduce((s,o) => s+orderEstNetNgn(o), 0);

  const netDisplay = cur === 'ngn'
    ? '₦' + Math.round(totalNetNgn / 1000).toLocaleString('en-NG') + 'k'
    : fmtU(totalNetUsd.toFixed(0));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <Segmented value={cur} onChange={setCur} options={[{key:'ngn',label:'₦ NGN'},{key:'usd',label:'$ USD'}]}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:14 }}>
        <StatCard label="Gross Revenue"   value={cur==='ngn'?'₦'+(totalNgn/1e6).toFixed(1)+'M':fmtU(totalUsd)} spark={revenueSeries.map(r=>r.ngn)} icon={<Icon name="coins" size={16}/>}/>
        <StatCard label="Est. Net Profit" value={netDisplay} sub="fee + 7% + forex" accent="oklch(45% 0.15 155)" icon={<Icon name="pulse" size={16}/>}/>
        <StatCard label="Avg Order Value" value={visible.length?(cur==='ngn'?'₦'+Math.round(totalNgn/visible.length/1000).toLocaleString('en-NG')+'k':fmtU((totalUsd/visible.length).toFixed(0))):'—'} icon={<Icon name="box" size={16}/>}/>
        <StatCard label="Orders"          value={visible.length} sub="this period" accent="var(--accent)" icon={<Icon name="ticket" size={16}/>}/>
      </div>

      <Panel title="Revenue trend" action={<span style={{ fontFamily:'var(--font-num)', fontWeight:800, fontSize:18 }}>{cur==='ngn'?'₦'+(totalNgn/1e6).toFixed(1)+'M':fmtU(totalUsd)}</span>}>
        <AreaChart data={revenueSeries} xKey="day" yKey="ngn" color="oklch(50% 0.15 155)" height={210}/>
      </Panel>

      <Panel title="Per-order breakdown" pad={0}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:640 }}>
            <thead>
              <tr style={{ background:'var(--bg-alt)' }}>
                {['Order','Customer','Revenue','Service fee','Price margin','Forex gain','Est. Net'].map(h=><th key={h} style={thS}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const sf   = orderServiceFee(o);
                const pm   = orderPriceMargin(o);
                const fxNgn = orderForexGainNgn(o);
                const netUsd = sf + pm;
                const impliedRate = o.usd > 0 ? o.ngn / o.usd : 1590;
                const netNgn = netUsd * impliedRate + fxNgn;
                return (
                  <tr key={o.id} style={{ borderTop:'1px solid var(--border)' }}>
                    <td style={{ ...tdS, fontWeight:700, color:'var(--accent)' }}>{o.id}</td>
                    <td style={tdS}>{o.customer}</td>
                    <td style={{ ...tdS, fontFamily:'var(--font-num)', fontWeight:700 }}>{cur==='ngn'?fmtN(o.ngn):fmtU(o.usd)}</td>
                    <td style={{ ...tdS, color:'var(--text-muted)' }}>{fmtU(sf.toFixed(0))}</td>
                    <td style={{ ...tdS, color:'var(--text-muted)' }}>{fmtU(pm.toFixed(0))}</td>
                    <td style={{ ...tdS, color:'var(--text-muted)' }}>{fmtN(fxNgn)}</td>
                    <td style={{ ...tdS, color:'oklch(45% 0.15 155)', fontWeight:700 }}>
                      {cur==='ngn' ? fmtN(netNgn) : fmtU(netUsd.toFixed(0))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!orders.length && <Empty label="No revenue data yet"/>}
        </div>
      </Panel>
    </div>
  );
}

// ─── TAB: Customers ───────────────────────────────────────────────────────────
function CustAvatar({ name }) {
  return <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--accent-tint,#f7e9df)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-head)', fontWeight:700, fontSize:12, flexShrink:0 }}>{(name||'?').split(' ').map(n=>n[0]).join('').slice(0,2)}</div>;
}

function CustomersTab({ isMobile, orders }) {
  const [waCustomer, setWaCustomer] = useState(null);

  const map = new Map();
  orders.forEach(o => {
    if (!map.has(o.customer)) map.set(o.customer, { name:o.customer, phone:o.phone, orders:0, spent:0, last:o.date });
    const c = map.get(o.customer); c.orders++; c.spent+=o.ngn;
  });
  const customers = [...map.values()].sort((a,b) => b.spent-a.spent);

  return (
    <>
      {waCustomer && <WhatsAppModal phone={waCustomer.phone} name={waCustomer.name} onClose={() => setWaCustomer(null)}/>}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:14 }}>
          <StatCard label="Total Customers" value={customers.length} icon={<Icon name="users" size={16}/>}/>
          <StatCard label="Repeat Buyers"   value={customers.filter(c=>c.orders>1).length} accent="var(--accent)" sub="more than 1 order" icon={<Icon name="pulse" size={16}/>}/>
          <StatCard label="Avg Lifetime"    value={customers.length?'₦'+Math.round(customers.reduce((s,c)=>s+c.spent,0)/customers.length/1000).toLocaleString('en-NG')+'k':'—'} accent="oklch(45% 0.15 155)" icon={<Icon name="coins" size={16}/>}/>
        </div>
        <Panel pad={0}>
          {isMobile ? customers.map((c,i) => (
            <div key={c.name} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderTop:i?'1px solid var(--border)':'none' }}>
              <CustAvatar name={c.name}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{c.name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{c.orders} order{c.orders>1?'s':''} · {c.last}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                <div style={{ fontFamily:'var(--font-num)', fontWeight:700, fontSize:14 }}>{fmtN(c.spent)}</div>
                <button onClick={() => setWaCustomer(c)} style={{ ...miniBtn, background:'oklch(93% 0.08 145)', borderColor:'oklch(80% 0.12 145)', color:'oklch(35% 0.15 145)' }}>💬 WhatsApp</button>
              </div>
            </div>
          )) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:560 }}>
                <thead><tr style={{ background:'var(--bg-alt)' }}>{['Customer','Phone','Orders','Total Spent','Last Order',''].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.name} style={{ borderTop:'1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg-alt)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={tdS}><div style={{ display:'flex', alignItems:'center', gap:10 }}><CustAvatar name={c.name}/><span style={{ fontWeight:600 }}>{c.name}</span></div></td>
                      <td style={{ ...tdS, color:'var(--text-muted)', fontSize:12.5, fontFamily:'var(--font-mono,monospace)' }}>{c.phone||'—'}</td>
                      <td style={tdS}>{c.orders}</td>
                      <td style={{ ...tdS, fontFamily:'var(--font-num)', fontWeight:700 }}>{fmtN(c.spent)}</td>
                      <td style={{ ...tdS, color:'var(--text-muted)' }}>{c.last}</td>
                      <td style={tdS}>
                        <button onClick={() => setWaCustomer(c)} style={{ ...miniBtn, background:'oklch(93% 0.08 145)', borderColor:'oklch(80% 0.12 145)', color:'oklch(35% 0.15 145)' }}>💬 WhatsApp</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!customers.length && <Empty label="No customers yet"/>}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

// ─── Nav config ───────────────────────────────────────────────────────────────
// ─── TAB: Blog — Post Editor ──────────────────────────────────────────────────
const BLOG_CATS    = ['Buying Guide', 'Repairs & Costs', 'Authenticity', 'How Certo Works', 'Tips & Tricks'];
const BLOG_REL     = ['iPhone', 'Mac', 'iPad', 'Apple Watch', 'AirPods'];
const slugify      = (t) => t.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');

function PostEditor({ post, onSave, onCancel, saving, serverError, isMobile }) {
  const isNew = !post;
  const [form, setForm] = useState({
    title:              post?.title || '',
    slug:               post?.slug  || '',
    excerpt:            post?.excerpt || '',
    category:           post?.category || 'Buying Guide',
    image_url:          post?.image_url || '',
    read_time:          post?.read_time || '5 min read',
    post_date:          post?.post_date || new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'}),
    featured:           post?.featured || false,
    published:          post?.published !== false,
    tags:               Array.isArray(post?.tags) ? post.tags.join(', ') : '',
    related_categories: Array.isArray(post?.related_categories) ? post.related_categories : [],
    sections:           Array.isArray(post?.sections) && post.sections.length
      ? post.sections.map(s => ({ heading: s.heading||'', body: Array.isArray(s.body) ? s.body.join('\n\n') : (s.body||'') }))
      : [{ heading:'', body:'' }],
  });
  const [slugManual, setSlugManual] = useState(!isNew);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onTitle = (v) => {
    set('title', v);
    if (!slugManual) set('slug', slugify(v));
  };

  const addSec    = () => set('sections', [...form.sections, { heading:'', body:'' }]);
  const removeSec = (i) => set('sections', form.sections.filter((_,j) => j!==i));
  const setSec    = (i, k, v) => set('sections', form.sections.map((s,j) => j===i ? {...s,[k]:v} : s));
  const toggleRel = (cat) => {
    const l = form.related_categories;
    set('related_categories', l.includes(cat) ? l.filter(c=>c!==cat) : [...l,cat]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const sections = form.sections
      .filter(s => s.heading.trim() || s.body.trim())
      .map(s => ({
        ...(s.heading.trim() ? { heading: s.heading.trim() } : {}),
        body: s.body.includes('\n\n')
          ? s.body.split('\n\n').map(p=>p.trim()).filter(Boolean)
          : s.body.trim(),
      }));
    onSave({
      title: form.title.trim(), slug: form.slug.trim(),
      excerpt: form.excerpt.trim(), category: form.category,
      image_url: form.image_url, read_time: form.read_time.trim(),
      post_date: form.post_date.trim(), featured: form.featured,
      published: form.published,
      tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean),
      related_categories: form.related_categories, sections,
    }, isNew);
  };

  const lS = { fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 };

  return (
    <Panel title={isNew ? 'New Post' : `Edit: ${post.title}`} action={
      <button onClick={onCancel} style={miniBtn}>← Back to list</button>
    }>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
        {serverError && <div style={{ padding:'10px 16px', background:'oklch(97% 0.03 25)', border:'1px solid oklch(85% 0.1 25)', borderRadius:10, color:'oklch(50% 0.18 25)', fontSize:13 }}>{serverError}</div>}

        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:14 }}>
          <div>
            <label style={lS}>Title *</label>
            <input value={form.title} onChange={e=>onTitle(e.target.value)} required style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="Post title"/>
          </div>
          <div>
            <label style={lS}>Slug * (URL path)</label>
            <input value={form.slug} onChange={e=>{setSlugManual(true);set('slug',e.target.value);}} required style={{...inputS,width:'100%',boxSizing:'border-box',fontFamily:'var(--font-mono,monospace)',fontSize:12}} placeholder="post-url-slug"/>
          </div>
        </div>

        <div>
          <label style={lS}>Excerpt (shown in listing)</label>
          <textarea value={form.excerpt} onChange={e=>set('excerpt',e.target.value)} rows={2} style={{...inputS,width:'100%',boxSizing:'border-box',resize:'vertical'}} placeholder="Brief summary…"/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:14 }}>
          <div>
            <label style={lS}>Category</label>
            <select value={form.category} onChange={e=>set('category',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}}>
              {BLOG_CATS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lS}>Read Time</label>
            <input value={form.read_time} onChange={e=>set('read_time',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="5 min read"/>
          </div>
          <div>
            <label style={lS}>Date</label>
            <input value={form.post_date} onChange={e=>set('post_date',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="June 2025"/>
          </div>
        </div>

        {/* Cover image */}
        <div>
          <label style={lS}>Cover Image <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, color:'var(--text-muted)', fontSize:10 }}>— recommended 1200×630 px · JPEG or WebP · max 1.5 MB</span></label>
          {form.image_url && (
            <div style={{ borderRadius:10, overflow:'hidden', marginBottom:8, background:'var(--bg-alt)', maxHeight:180 }}>
              <img src={form.image_url} alt="Cover preview" style={{ width:'100%', maxHeight:180, objectFit:'cover', display:'block' }}/>
            </div>
          )}
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:8 }}>
            <label style={{ ...miniBtn, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px' }}>
              <Icon name="upload" size={13}/> Upload Image
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 1.5 * 1024 * 1024) { alert('Image must be under 1.5 MB.\nTip: resize to 1200×630 px before uploading.'); e.target.value=''; return; }
                const reader = new FileReader();
                reader.onload = ev => set('image_url', ev.target.result);
                reader.readAsDataURL(file);
              }}/>
            </label>
            {form.image_url && (
              <button type="button" onClick={() => set('image_url', '')} style={{...miniBtn, color:'oklch(50% 0.18 25)'}}>Remove</button>
            )}
          </div>
          <input
            value={form.image_url.startsWith('data:') ? '' : form.image_url}
            onChange={e => set('image_url', e.target.value)}
            style={{...inputS, width:'100%', boxSizing:'border-box', fontSize:12}}
            placeholder={form.image_url.startsWith('data:') ? '— using uploaded image —' : 'Or paste an image URL (https://...)'}
          />
        </div>

        <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
          <label style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer', fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:'var(--text)' }}>
            <input type="checkbox" checked={form.featured} onChange={e=>set('featured',e.target.checked)} style={{ width:16, height:16 }}/>
            Featured post
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer', fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:'var(--text)' }}>
            <input type="checkbox" checked={form.published} onChange={e=>set('published',e.target.checked)} style={{ width:16, height:16 }}/>
            Published (visible on site)
          </label>
        </div>

        <div>
          <label style={lS}>Tags (comma-separated)</label>
          <input value={form.tags} onChange={e=>set('tags',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="iPhone, Buying Guide, Nigeria"/>
        </div>

        <div>
          <label style={lS}>Related Product Categories</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
            {BLOG_REL.map(c => (
              <button key={c} type="button" onClick={()=>toggleRel(c)} style={{
                ...miniBtn,
                color: form.related_categories.includes(c) ? 'var(--accent)' : 'var(--text-muted)',
                background: form.related_categories.includes(c) ? 'var(--accent-tint)' : 'var(--bg)',
                borderColor: form.related_categories.includes(c) ? 'var(--accent)' : 'var(--border)',
                fontWeight: form.related_categories.includes(c) ? 700 : 500,
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <label style={{...lS, marginBottom:0}}>Sections</label>
            <button type="button" onClick={addSec} style={{...miniBtn, color:'var(--accent)', borderColor:'var(--accent)'}}>+ Add Section</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {form.sections.map((s,i) => (
              <div key={i} style={{ border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Section {i+1}</span>
                  {form.sections.length > 1 && (
                    <button type="button" onClick={()=>removeSec(i)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'var(--text-muted)', padding:'0 4px', lineHeight:1 }}>×</button>
                  )}
                </div>
                <input value={s.heading} onChange={e=>setSec(i,'heading',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="Section heading (optional)"/>
                <textarea value={s.body} onChange={e=>setSec(i,'body',e.target.value)} rows={4} style={{...inputS,width:'100%',boxSizing:'border-box',resize:'vertical'}} placeholder="Body text. Separate paragraphs with a blank line to create a bullet list."/>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:8, borderTop:'1px solid var(--border)' }}>
          <button type="button" onClick={onCancel} style={actionBtn}>Cancel</button>
          <button type="submit" disabled={saving} style={{...primaryBtn, opacity:saving?0.7:1}}>
            {saving ? 'Saving…' : isNew ? 'Create Post' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Panel>
  );
}

// ─── TAB: Blog — Post List ────────────────────────────────────────────────────
function BlogTab({ isMobile }) {
  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [editing,    setEditing]    = useState(null); // null=list, 'new'=create, object=edit
  const [delConfirm, setDelConfirm] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [serverError,setServerError]= useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch('/api/blog/admin');
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch(e) { setServerError('Failed to load posts'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleField = async (post, field) => {
    try {
      const res = await authFetch(`/api/blog/${post.id}`, {
        method: 'PATCH', body: JSON.stringify({ [field]: !post[field] }),
      });
      if (res.ok) setPosts(prev => prev.map(p => p.id===post.id ? {...p,[field]:!p[field]} : p));
    } catch(e) { setServerError('Update failed'); }
  };

  const handleDelete = async (id) => {
    try {
      await authFetch(`/api/blog/${id}`, { method:'DELETE' });
      setPosts(prev => prev.filter(p => p.id!==id));
      setDelConfirm(null);
    } catch(e) { setServerError('Delete failed'); }
  };

  const handleSave = async (payload, isNew) => {
    setSaving(true); setServerError('');
    try {
      const res = await authFetch(
        isNew ? '/api/blog' : `/api/blog/${editing.id}`,
        { method: isNew ? 'POST' : 'PATCH', body: JSON.stringify(payload) }
      );
      if (!res.ok) {
        const err = await res.json();
        setServerError(err.error || 'Save failed');
        setSaving(false); return;
      }
      const saved = await res.json();
      if (isNew) setPosts(prev => [saved, ...prev]);
      else       setPosts(prev => prev.map(p => p.id===saved.id ? saved : p));
      setEditing(null);
    } catch(e) { setServerError('Save failed'); }
    setSaving(false);
  };

  if (editing !== null) {
    return <PostEditor
      post={editing === 'new' ? null : editing}
      onSave={handleSave} onCancel={() => { setEditing(null); setServerError(''); }}
      saving={saving} serverError={serverError} isMobile={isMobile}
    />;
  }

  const published = posts.filter(p => p.published).length;
  const drafts    = posts.filter(p => !p.published).length;
  const featured  = posts.filter(p => p.featured).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:14 }}>
        <StatCard label="Published" value={published} icon={<Icon name="book" size={16}/>}/>
        <StatCard label="Drafts"    value={drafts}    accent="oklch(50% 0.08 220)" icon={<Icon name="pen" size={16}/>}/>
        <StatCard label="Featured"  value={featured}  accent="var(--accent)" icon={<Icon name="flag" size={16}/>}/>
      </div>

      {serverError && <div style={{ padding:'10px 16px', background:'oklch(97% 0.03 25)', border:'1px solid oklch(85% 0.1 25)', borderRadius:10, color:'oklch(50% 0.18 25)', fontSize:13 }}>{serverError}</div>}

      <Panel title={`All Posts (${posts.length})`} pad={0} action={
        <button onClick={() => { setServerError(''); setEditing('new'); }} style={primaryBtn}>
          <span style={{ display:'flex', alignItems:'center', gap:6 }}><Icon name="plus" size={14} c="white"/> New Post</span>
        </button>
      }>
        {loading ? (
          <div style={{ padding:'32px 0', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Loading…</div>
        ) : posts.length === 0 ? (
          <Empty label="No blog posts yet. Create your first post."/>
        ) : isMobile ? (
          <div style={{ display:'flex', flexDirection:'column' }}>
            {posts.map((post, i) => (
              <div key={post.id} style={{ padding:'14px 16px', borderTop:i?'1px solid var(--border)':'none' }}>
                <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
                  {post.image_url ? (
                    <img src={post.image_url} alt="" style={{ width:44, height:30, objectFit:'cover', borderRadius:5, flexShrink:0 }}/>
                  ) : (
                    <span style={{ fontSize:22, flexShrink:0, width:44, textAlign:'center' }}>{post.emoji||'📝'}</span>
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13.5, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.title}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2, fontFamily:'var(--font-mono,monospace)' }}>/{post.slug}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontSize:11.5, background:'var(--accent-tint)', color:'var(--accent)', borderRadius:100, padding:'3px 9px', fontWeight:700, whiteSpace:'nowrap' }}>{post.category}</span>
                  <button onClick={() => toggleField(post,'published')} style={{ ...miniBtn, color:post.published?'oklch(40% 0.14 155)':'oklch(50% 0.04 0)', background:post.published?'oklch(95% 0.06 155)':'var(--bg-alt)', borderColor:post.published?'oklch(80% 0.1 155)':'var(--border)' }}>
                    {post.published ? '● Published' : '○ Draft'}
                  </button>
                  <button onClick={() => toggleField(post,'featured')} style={{ ...miniBtn, color:post.featured?'var(--accent)':'var(--text-muted)', background:post.featured?'var(--accent-tint)':'transparent', borderColor:post.featured?'var(--accent)':'var(--border)' }}>
                    {post.featured ? '★ Featured' : '☆ Normal'}
                  </button>
                </div>
                <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                  <button onClick={() => { setServerError(''); setEditing(post); }} style={miniBtn}>Edit</button>
                  {delConfirm===post.id ? (
                    <>
                      <button onClick={() => handleDelete(post.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(80% 0.12 25)'}}>Confirm</button>
                      <button onClick={() => setDelConfirm(null)} style={miniBtn}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setDelConfirm(post.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)'}}>Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
              <thead>
                <tr style={{ background:'var(--bg-alt)' }}>
                  <th style={thS}>Post</th>
                  <th style={thS}>Category</th>
                  <th style={thS}>Status</th>
                  <th style={thS}>Featured</th>
                  <th style={thS}>Date</th>
                  <th style={{...thS, textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post, i) => (
                  <tr key={post.id} style={{ borderTop:i?'1px solid var(--border)':'none' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg-alt)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={tdS}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        {post.image_url ? (
                          <img src={post.image_url} alt="" style={{ width:44, height:30, objectFit:'cover', borderRadius:5, flexShrink:0 }}/>
                        ) : (
                          <span style={{ fontSize:22, flexShrink:0, width:44, textAlign:'center' }}>{post.emoji||'📝'}</span>
                        )}
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:13.5, color:'var(--text)', maxWidth:300, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.title}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2, fontFamily:'var(--font-mono,monospace)' }}>/{post.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdS}>
                      <span style={{ fontSize:11.5, background:'var(--accent-tint)', color:'var(--accent)', borderRadius:100, padding:'3px 9px', fontWeight:700, whiteSpace:'nowrap' }}>{post.category}</span>
                    </td>
                    <td style={tdS}>
                      <button onClick={() => toggleField(post,'published')} style={{ ...miniBtn, color:post.published?'oklch(40% 0.14 155)':'oklch(50% 0.04 0)', background:post.published?'oklch(95% 0.06 155)':'var(--bg-alt)', borderColor:post.published?'oklch(80% 0.1 155)':'var(--border)' }}>
                        {post.published ? '● Published' : '○ Draft'}
                      </button>
                    </td>
                    <td style={tdS}>
                      <button onClick={() => toggleField(post,'featured')} style={{ ...miniBtn, color:post.featured?'var(--accent)':'var(--text-muted)', background:post.featured?'var(--accent-tint)':'transparent', borderColor:post.featured?'var(--accent)':'var(--border)' }}>
                        {post.featured ? '★ Featured' : '☆ Normal'}
                      </button>
                    </td>
                    <td style={{...tdS, color:'var(--text-muted)', fontSize:12.5, whiteSpace:'nowrap'}}>{post.post_date||'—'}</td>
                    <td style={{...tdS, textAlign:'right'}}>
                      <div style={{ display:'flex', gap:6, justifyContent:'flex-end', flexWrap:'nowrap' }}>
                        <button onClick={() => { setServerError(''); setEditing(post); }} style={miniBtn}>Edit</button>
                        {delConfirm===post.id ? (
                          <>
                            <button onClick={() => handleDelete(post.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(80% 0.12 25)'}}>Confirm</button>
                            <button onClick={() => setDelConfirm(null)} style={miniBtn}>Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => setDelConfirm(post.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)'}}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

// ─── TAB: Refunds ─────────────────────────────────────────────────────────────
const REFUND_STATUSES = ['pending','processing','completed','rejected'];
const REFUND_METHODS  = ['Bank Transfer','Cash','Paystack Reversal','Flutterwave Reversal','Other'];

const NG_BANKS = [
  { name: 'Access Bank',     code: '044'    },
  { name: 'ALAT by WEMA',    code: '035A'   },
  { name: 'Carbon',          code: '565'    },
  { name: 'Citibank',        code: '023'    },
  { name: 'Ecobank',         code: '050'    },
  { name: 'Fidelity Bank',   code: '070'    },
  { name: 'First Bank',      code: '011'    },
  { name: 'FCMB',            code: '214'    },
  { name: 'GTBank',          code: '058'    },
  { name: 'Keystone Bank',   code: '082'    },
  { name: 'Kuda Bank',       code: '50211'  },
  { name: 'Lotus Bank',      code: '303'    },
  { name: 'Moniepoint',      code: '50515'  },
  { name: 'OPay',            code: '999992' },
  { name: 'PalmPay',         code: '999991' },
  { name: 'Polaris Bank',    code: '076'    },
  { name: 'Providus Bank',   code: '101'    },
  { name: 'Stanbic IBTC',    code: '221'    },
  { name: 'Sterling Bank',   code: '232'    },
  { name: 'TAJ Bank',        code: '302'    },
  { name: 'Union Bank',      code: '032'    },
  { name: 'UBA',             code: '033'    },
  { name: 'Unity Bank',      code: '215'    },
  { name: 'Vale Finance',     code: '050020' },
  { name: 'VFD MFB',         code: '566'    },
  { name: 'Wema Bank',       code: '035'    },
  { name: 'Zenith Bank',     code: '057'    },
];

function refundStatusStyle(s) {
  return {
    pending:    { color:'oklch(48% 0.12 60)',  background:'oklch(96% 0.06 60)',  border:'1px solid oklch(82% 0.1 60)'  },
    processing: { color:'oklch(38% 0.14 240)', background:'oklch(96% 0.05 240)', border:'1px solid oklch(82% 0.1 240)' },
    completed:  { color:'oklch(38% 0.14 155)', background:'oklch(95% 0.06 155)', border:'1px solid oklch(80% 0.1 155)' },
    rejected:   { color:'oklch(50% 0.18 25)',  background:'oklch(97% 0.03 25)',  border:'1px solid oklch(85% 0.1 25)'  },
  }[s] || { color:'var(--text-muted)', background:'var(--bg-alt)', border:'1px solid var(--border)' };
}

function RefundEditor({ refund, orders, onSave, onCancel, saving, serverError, isMobile }) {
  const isNew = !refund;
  const [form, setForm] = useState({
    order_id:       refund?.order_id       || '',
    customer_name:  refund?.customer_name  || '',
    customer_email: refund?.customer_email || '',
    customer_phone: refund?.customer_phone || '',
    product_name:   refund?.product_name   || '',
    amount_ngn:     refund?.amount_ngn     || '',
    amount_usd:     refund?.amount_usd     || '',
    reason:         refund?.reason         || '',
    status:         refund?.status         || 'pending',
    payment_method: refund?.payment_method || 'Bank Transfer',
    bank_name:      refund?.bank_name      || '',
    account_number: refund?.account_number || '',
    account_name:   refund?.account_name   || '',
    notes:          refund?.notes          || '',
  });
  const [lookupMsg, setLookupMsg] = useState('');
  const [bankCode, setBankCode] = useState(
    () => NG_BANKS.find(b => b.name === refund?.bank_name)?.code || ''
  );
  const [acctLookup, setAcctLookup] = useState('idle'); // idle | loading | found | error
  const [acctLookupMsg, setAcctLookupMsg] = useState('');
  const didMount = React.useRef(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    const digits = form.account_number.replace(/\D/g, '');
    if (digits.length !== 10 || !bankCode) return;
    setAcctLookup('loading');
    setAcctLookupMsg('');
    set('account_name', '');
    let cancelled = false;
    const timer = setTimeout(() => {
      authFetch(`/api/refunds/resolve-account?account_number=${encodeURIComponent(digits)}&bank_code=${encodeURIComponent(bankCode)}`)
        .then(r => r.json())
        .then(data => {
          if (cancelled) return;
          if (data.account_name) {
            set('account_name', data.account_name);
            setAcctLookup('found');
          } else {
            setAcctLookup('error');
            setAcctLookupMsg(data.error || 'Could not verify — enter name manually.');
          }
        })
        .catch(() => {
          if (!cancelled) { setAcctLookup('error'); setAcctLookupMsg('Could not verify — enter name manually.'); }
        });
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [form.account_number, bankCode]);

  const lookupOrder = () => {
    const id = form.order_id.trim();
    if (!id) return;
    const order = orders.find(o => o.id === id || o.id?.toLowerCase() === id.toLowerCase());
    if (!order) { setLookupMsg('Order not found in current session.'); return; }
    setForm(f => ({
      ...f,
      customer_name:  order.customer  || f.customer_name,
      customer_email: order.email     || f.customer_email,
      customer_phone: order.phone     || f.customer_phone,
      product_name:   order.product   || f.product_name,
      amount_ngn:     order.ngn       || f.amount_ngn,
      amount_usd:     order.usd       || f.amount_usd,
    }));
    setLookupMsg('✓ Order found — fields pre-filled.');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, amount_ngn: Number(form.amount_ngn)||0, amount_usd: Number(form.amount_usd)||0 }, isNew);
  };

  const lS = { fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 };

  return (
    <Panel title={isNew ? 'New Refund' : `Edit Refund #${refund.id}`} action={
      <button onClick={onCancel} style={miniBtn}>← Back to list</button>
    }>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
        {serverError && <div style={{ padding:'10px 16px', background:'oklch(97% 0.03 25)', border:'1px solid oklch(85% 0.1 25)', borderRadius:10, color:'oklch(50% 0.18 25)', fontSize:13 }}>{serverError}</div>}

        {/* Order lookup */}
        <div>
          <label style={lS}>Order ID <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional — auto-fills customer details)</span></label>
          <div style={{ display:'flex', gap:8 }}>
            <input value={form.order_id} onChange={e=>{set('order_id',e.target.value); setLookupMsg('');}} style={{...inputS,flex:1}} placeholder="e.g. CRT-010224-1234"/>
            <button type="button" onClick={lookupOrder} style={{...miniBtn, padding:'8px 14px', whiteSpace:'nowrap'}}>Lookup Order</button>
          </div>
          {lookupMsg && <div style={{ fontSize:12, color: lookupMsg.startsWith('✓') ? 'oklch(40% 0.14 155)' : 'var(--accent)', marginTop:5 }}>{lookupMsg}</div>}
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>For deleted orders, leave blank and fill in details manually.</div>
        </div>

        {/* Customer */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:14 }}>
          <div>
            <label style={lS}>Customer Name *</label>
            <input value={form.customer_name} onChange={e=>set('customer_name',e.target.value)} required style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="Full name"/>
          </div>
          <div>
            <label style={lS}>Phone</label>
            <input value={form.customer_phone} onChange={e=>set('customer_phone',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="+234…"/>
          </div>
          <div>
            <label style={lS}>Email</label>
            <input type="email" value={form.customer_email} onChange={e=>set('customer_email',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}}/>
          </div>
          <div>
            <label style={lS}>Product</label>
            <input value={form.product_name} onChange={e=>set('product_name',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="iPhone 16 Pro 256GB"/>
          </div>
        </div>

        {/* Amounts + status */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:14 }}>
          <div>
            <label style={lS}>Amount (₦)</label>
            <input type="number" min="0" value={form.amount_ngn} onChange={e=>set('amount_ngn',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="0"/>
          </div>
          <div>
            <label style={lS}>Amount ($)</label>
            <input type="number" min="0" value={form.amount_usd} onChange={e=>set('amount_usd',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="0"/>
          </div>
          <div>
            <label style={lS}>Status</label>
            <select value={form.status} onChange={e=>set('status',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}}>
              {REFUND_STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lS}>Payment Method</label>
            <select value={form.payment_method} onChange={e=>set('payment_method',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}}>
              {REFUND_METHODS.map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Bank details */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr', gap:14 }}>
          <div>
            <label style={lS}>Bank Name</label>
            <select
              value={bankCode}
              onChange={e => {
                const b = NG_BANKS.find(b => b.code === e.target.value);
                setBankCode(e.target.value);
                set('bank_name', b?.name || '');
                setAcctLookup('idle');
                setAcctLookupMsg('');
              }}
              style={{...inputS,width:'100%',boxSizing:'border-box'}}
            >
              <option value="">-- Select bank --</option>
              {NG_BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lS}>Account Number</label>
            <input
              value={form.account_number}
              onChange={e => { set('account_number', e.target.value); setAcctLookup('idle'); setAcctLookupMsg(''); }}
              style={{...inputS,width:'100%',boxSizing:'border-box'}}
              placeholder="0123456789"
              maxLength={10}
            />
          </div>
          <div>
            <label style={lS}>
              Account Name
              {acctLookup === 'loading' && <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, color:'var(--text-muted)', marginLeft:6 }}>Verifying…</span>}
              {acctLookup === 'found'   && <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, color:'oklch(40% 0.14 155)', marginLeft:6 }}>✓ Verified</span>}
            </label>
            <input
              value={form.account_name}
              onChange={e => { set('account_name', e.target.value); setAcctLookup('idle'); }}
              style={{...inputS,width:'100%',boxSizing:'border-box', opacity: acctLookup==='loading' ? 0.5 : 1}}
              placeholder={acctLookup === 'loading' ? 'Verifying…' : 'Auto-filled or enter manually'}
              readOnly={acctLookup === 'loading'}
            />
          </div>
        </div>
        {acctLookupMsg && (
          <div style={{ fontSize:12, color:'oklch(50% 0.18 25)', marginTop:-10 }}>{acctLookupMsg}</div>
        )}

        {/* Reason + notes */}
        <div>
          <label style={lS}>Reason for Refund</label>
          <textarea value={form.reason} onChange={e=>set('reason',e.target.value)} rows={2} style={{...inputS,width:'100%',boxSizing:'border-box',resize:'vertical'}} placeholder="Customer returned item / wrong product ordered…"/>
        </div>
        <div>
          <label style={lS}>Internal Notes</label>
          <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={2} style={{...inputS,width:'100%',boxSizing:'border-box',resize:'vertical'}} placeholder="Admin-only notes…"/>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:8, borderTop:'1px solid var(--border)' }}>
          <button type="button" onClick={onCancel} style={actionBtn}>Cancel</button>
          <button type="submit" disabled={saving} style={{...primaryBtn, opacity:saving?0.7:1}}>
            {saving ? 'Saving…' : isNew ? 'Create Refund' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Panel>
  );
}

function RefundsTab({ isMobile, orders }) {
  const [refunds,    setRefunds]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [editing,    setEditing]    = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [serverError,setServerError]= useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch('/api/refunds');
      const data = await res.json();
      setRefunds(Array.isArray(data) ? data : []);
    } catch { setServerError('Failed to load refunds'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (payload, isNew) => {
    setSaving(true); setServerError('');
    try {
      const res = await authFetch(
        isNew ? '/api/refunds' : `/api/refunds/${editing.id}`,
        { method: isNew ? 'POST' : 'PATCH', body: JSON.stringify(payload) },
      );
      if (!res.ok) {
        const err = await res.json();
        setServerError(err.error || 'Save failed');
        setSaving(false); return;
      }
      const saved = await res.json();
      if (isNew) setRefunds(prev => [saved, ...prev]);
      else       setRefunds(prev => prev.map(r => r.id===saved.id ? saved : r));
      setEditing(null);
    } catch { setServerError('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await authFetch(`/api/refunds/${id}`, { method:'DELETE' });
      setRefunds(prev => prev.filter(r => r.id !== id));
      setDelConfirm(null);
    } catch { setServerError('Delete failed'); }
  };

  if (editing !== null) {
    return <RefundEditor
      refund={editing === 'new' ? null : editing}
      orders={orders}
      onSave={handleSave} onCancel={() => { setEditing(null); setServerError(''); }}
      saving={saving} serverError={serverError} isMobile={isMobile}
    />;
  }

  const pending    = refunds.filter(r => r.status === 'pending').length;
  const completed  = refunds.filter(r => r.status === 'completed').length;
  const totalNgn   = refunds.filter(r => r.status !== 'rejected').reduce((s, r) => s + Number(r.amount_ngn||0), 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:14 }}>
        <StatCard label="Total Refunds"   value={refunds.length}                                 icon={<Icon name="undo"  size={16}/>}/>
        <StatCard label="Pending"         value={pending}   accent="oklch(48% 0.12 60)"          icon={<Icon name="pulse" size={16}/>}/>
        <StatCard label="Completed"       value={completed} accent="oklch(38% 0.14 155)"         icon={<Icon name="check" size={16}/>}/>
        <StatCard label="Total Refunded"  value={`₦${totalNgn.toLocaleString()}`} accent="oklch(50% 0.18 25)" icon={<Icon name="coins" size={16}/>}/>
      </div>

      {serverError && <div style={{ padding:'10px 16px', background:'oklch(97% 0.03 25)', border:'1px solid oklch(85% 0.1 25)', borderRadius:10, color:'oklch(50% 0.18 25)', fontSize:13 }}>{serverError}</div>}

      <Panel title={`All Refunds (${refunds.length})`} pad={0} action={
        <button onClick={() => { setServerError(''); setEditing('new'); }} style={primaryBtn}>
          <span style={{ display:'flex', alignItems:'center', gap:6 }}><Icon name="plus" size={14} c="white"/> New Refund</span>
        </button>
      }>
        {loading ? (
          <div style={{ padding:'32px 0', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Loading…</div>
        ) : refunds.length === 0 ? (
          <Empty label="No refunds recorded yet."/>
        ) : isMobile ? (
          <div style={{ display:'flex', flexDirection:'column' }}>
            {refunds.map((r, i) => (
              <div key={r.id} style={{ padding:'14px 16px', borderTop:i?'1px solid var(--border)':'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div style={{ flex:1, minWidth:0, marginRight:10 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>{r.customer_name}</div>
                    {r.customer_email && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{r.customer_email}</div>}
                  </div>
                  <span style={{ ...miniBtn, ...refundStatusStyle(r.status), fontWeight:700, cursor:'default', flexShrink:0 }}>{r.status}</span>
                </div>
                <div style={{ fontSize:12.5, color:'var(--text)', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {r.product_name || '—'}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>₦{Number(r.amount_ngn||0).toLocaleString()}</div>
                    {r.amount_usd > 0 && <div style={{ fontSize:11, color:'var(--text-muted)' }}>${Number(r.amount_usd||0).toLocaleString()}</div>}
                  </div>
                  {r.order_id && <div style={{ fontFamily:'var(--font-mono,monospace)', fontSize:11, color:'var(--text-muted)' }}>{r.order_id}</div>}
                </div>
                <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                  <button onClick={() => { setServerError(''); setEditing(r); }} style={miniBtn}>Edit</button>
                  {delConfirm===r.id ? (
                    <>
                      <button onClick={() => handleDelete(r.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(80% 0.12 25)'}}>Confirm</button>
                      <button onClick={() => setDelConfirm(null)} style={miniBtn}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setDelConfirm(r.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)'}}>Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:760 }}>
              <thead>
                <tr style={{ background:'var(--bg-alt)' }}>
                  <th style={thS}>Order ID</th>
                  <th style={thS}>Customer</th>
                  <th style={thS}>Product</th>
                  <th style={thS}>Amount</th>
                  <th style={thS}>Status</th>
                  <th style={thS}>Method</th>
                  <th style={thS}>Date</th>
                  <th style={{...thS, textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((r, i) => (
                  <tr key={r.id} style={{ borderTop:i?'1px solid var(--border)':'none' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg-alt)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{...tdS, fontFamily:'var(--font-mono,monospace)', fontSize:11.5, color:'var(--text-muted)'}}>
                      {r.order_id || <span style={{ color:'var(--border)' }}>—</span>}
                    </td>
                    <td style={tdS}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{r.customer_name}</div>
                      {r.customer_email && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.customer_email}</div>}
                    </td>
                    <td style={{...tdS, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12.5}}>
                      {r.product_name || '—'}
                    </td>
                    <td style={tdS}>
                      <div style={{ fontWeight:600, fontSize:13 }}>₦{Number(r.amount_ngn||0).toLocaleString()}</div>
                      {r.amount_usd > 0 && <div style={{ fontSize:11, color:'var(--text-muted)' }}>${Number(r.amount_usd||0).toLocaleString()}</div>}
                    </td>
                    <td style={tdS}>
                      <span style={{ ...miniBtn, ...refundStatusStyle(r.status), fontWeight:700, cursor:'default' }}>{r.status}</span>
                    </td>
                    <td style={{...tdS, fontSize:12, color:'var(--text-muted)'}}>{r.payment_method||'—'}</td>
                    <td style={{...tdS, fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap'}}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                    </td>
                    <td style={{...tdS, textAlign:'right'}}>
                      <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                        <button onClick={() => { setServerError(''); setEditing(r); }} style={miniBtn}>Edit</button>
                        {delConfirm===r.id ? (
                          <>
                            <button onClick={() => handleDelete(r.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(80% 0.12 25)'}}>Confirm</button>
                            <button onClick={() => setDelConfirm(null)} style={miniBtn}>Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => setDelConfirm(r.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)'}}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

const NAV = [
  { key:'overview',     label:'Overview',     icon:'grid'   },
  { key:'orders',       label:'Orders',       icon:'box'    },
  { key:'products',     label:'Products',     icon:'tag'    },
  { key:'certificates', label:'Certificates', icon:'cert'   },
  { key:'messages',     label:'Messages',     icon:'mail'   },
  { key:'coupons',      label:'Coupons',      icon:'ticket' },
  { key:'analytics',    label:'Analytics',    icon:'chart'  },
  { key:'activity',     label:'Activity',     icon:'pulse'  },
  { key:'forex',        label:'Forex',        icon:'coins'  },
  { key:'revenue',      label:'Revenue',      icon:'coins'  },
  { key:'customers',    label:'Customers',    icon:'users'  },
  { key:'blog',         label:'Blog',         icon:'book'   },
  { key:'refunds',      label:'Refunds',      icon:'undo'   },
];
const MOBILE_PRIMARY = ['overview','orders','products','analytics','blog'];

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pw, setPw]   = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!pw.trim()) return;
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/admin/login', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: pw }),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error||'Invalid password'); setBusy(false); return; }
      sessionStorage.setItem(TOKEN_KEY, json.token);
      sessionStorage.setItem(NAME_KEY,  json.name || 'Admin');
      onLogin();
    } catch {
      setErr('Network error — server may be offline');
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-alt)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'var(--font-body)' }}>
      <div style={{ width:'100%', maxWidth:380, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:20, padding:36, boxShadow:'0 8px 40px rgba(26,23,20,0.08)' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:28, letterSpacing:'-0.04em', color:'var(--text)', marginBottom:6 }}>Certo<span style={{ color:'var(--accent)' }}>.</span></div>
          <div style={{ fontSize:13.5, color:'var(--text-muted)' }}>Admin access only</div>
        </div>
        <form onSubmit={submit}>
          <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:8 }}>Password</label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Enter admin password" autoComplete="current-password" autoFocus style={{ ...inputS, width:'100%', boxSizing:'border-box', marginBottom:16, fontSize:15, padding:'13px 16px' }}/>
          {err && <div style={{ fontSize:12.5, color:'oklch(50% 0.18 25)', marginBottom:14, padding:'10px 14px', background:'oklch(97% 0.03 25)', borderRadius:9, border:'1px solid oklch(85% 0.1 25)' }}>{err}</div>}
          <button type="submit" disabled={busy} style={{ ...primaryBtn, width:'100%', padding:'13px', fontSize:15, opacity:busy?0.7:1 }}>{busy?'Signing in…':'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}

// ─── Main DashboardPage ───────────────────────────────────────────────────────
export function DashboardPage({ navigate, subPage, liveRate, rateFetched, onRateChange }) {
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [tab, setTab]           = useState(subPage || 'overview');
  const [moreOpen, setMoreOpen] = useState(false);
  const [search, setSearch]     = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Data state
  const [orders,       setOrders]       = useState([]);
  const [products,     setProducts]     = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [messages,     setMessages]     = useState([]);
  const [coupons,      setCoupons]      = useState([]);
  const [logs,         setLogs]         = useState([]);
  const [analytics,    setAnalytics]    = useState(null);
  const [revenueSeries,setRevenueSeries]= useState([]);
  const [dataLoading,  setDataLoading]  = useState(false);
  const [dataError,    setDataError]    = useState(null);
  const [refreshKey,   setRefreshKey]   = useState(0);
  const [spinning,     setSpinning]     = useState(false);

  const doRefresh = () => { setRefreshKey(k => k+1); setSpinning(true); setTimeout(() => setSpinning(false), 800); };

  // Sync tab from subPage prop
  useEffect(() => { if (subPage) setTab(subPage); }, [subPage]);

  // Responsive
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Load data after login (or on manual refresh)
  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    async function load() {
      setDataLoading(true); setDataError(null);
      try {
        const [oRes, pRes, cRes, mRes, cpRes, lRes, aRes] = await Promise.all([
          authFetch('/api/orders'),
          authFetch('/api/products?admin=true&limit=1000'),
          authFetch('/api/certificates'),
          authFetch('/api/contact'),
          authFetch('/api/coupons'),
          authFetch('/api/admin/logs'),
          authFetch('/api/analytics'),
        ]);
        const [rawOrders, rawProducts, rawCerts, rawMsgs, rawCoupons, rawLogs, analyticsData] = await Promise.all([
          oRes.json(), pRes.json(), cRes.json(), mRes.json(), cpRes.json(), lRes.json(), aRes.json(),
        ]);
        if (cancelled) return;
        setOrders(rawOrders.map(mapOrder));
        setProducts(rawProducts.map(mapProduct));
        setCertificates(rawCerts.map(mapCert));
        setMessages(rawMsgs.map(mapMessage));
        setCoupons(rawCoupons.map(mapCoupon));
        setLogs(rawLogs.map(mapLog));
        setAnalytics(analyticsData);
        setRevenueSeries(buildRevenueSeries(rawOrders));
      } catch(err) {
        if (!cancelled) setDataError(err.message);
      }
      if (!cancelled) setDataLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [loggedIn, refreshKey]);

  const handleTabChange = (key) => {
    setTab(key);
    setMoreOpen(false);
    if (navigate) navigate(key === 'overview' ? 'dashboard' : `dashboard-${key}`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(NAME_KEY);
    setLoggedIn(false);
    if (navigate) navigate('/');
  };

  const handleOrderUpdate = (updated, isNew = false) => {
    if (isNew) setOrders(prev => [updated, ...prev]);
    else       setOrders(prev => prev.map(o => o.id===updated.id ? updated : o));
  };

  const handleProductUpdate = (updated) => {
    setProducts(prev => prev.map(p => p.id===updated.id ? updated : p));
  };

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)}/>;

  const adminName  = getName();
  const unread     = messages.filter(m => !m.read).length;
  const activeOrds = orders.filter(o => !o.admin_hidden && !['Delivered','Cancelled','Payment Pending'].includes(o.status)).length;
  const counts     = { orders: activeOrds, messages: unread };
  const rate       = liveRate || 1590;

  const tabTitle = NAV.find(n => n.key===tab)?.label || 'Overview';
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  const tabContent = (
    <>
      {tab==='overview'     && <OverviewTab isMobile={isMobile} setTab={handleTabChange} orders={orders} revenueSeries={revenueSeries} messages={messages} products={products}/>}
      {tab==='orders'       && <OrdersTab isMobile={isMobile} orders={orders} onOrdersChange={handleOrderUpdate} certificates={certificates} products={products} rate={rate}/>}
      {tab==='products'     && <ProductsTab isMobile={isMobile} products={products} onProductUpdate={handleProductUpdate}/>}
      {tab==='certificates' && <CertificatesTab isMobile={isMobile} certificates={certificates}/>}
      {tab==='messages'     && <MessagesTab isMobile={isMobile} messages={messages}/>}
      {tab==='coupons'      && <CouponsTab isMobile={isMobile} coupons={coupons}/>}
      {tab==='analytics'    && <AnalyticsTab isMobile={isMobile} analytics={analytics}/>}
      {tab==='activity'     && <ActivityTab isMobile={isMobile} logs={logs} onLogsCleared={() => setLogs([])}/>}
      {tab==='forex'        && <ForexTab isMobile={isMobile} liveRate={rate} rateFetched={rateFetched} onRateChange={onRateChange} products={products}/>}
      {tab==='revenue'      && <RevenueTab isMobile={isMobile} orders={orders} revenueSeries={revenueSeries}/>}
      {tab==='customers'    && <CustomersTab isMobile={isMobile} orders={orders}/>}
      {tab==='blog'         && <BlogTab isMobile={isMobile}/>}
      {tab==='refunds'      && <RefundsTab isMobile={isMobile} orders={orders}/>}
    </>
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg-alt)', fontFamily:'var(--font-body)', color:'var(--text)' }}>
      {/* Sidebar */}
      {!isMobile && (
        <aside style={{ width:232, flexShrink:0, background:'var(--bg)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh' }}>
          <div style={{ padding:'22px 22px 18px', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:22, letterSpacing:'-0.04em', color:'var(--text)' }}>Certo</span>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--accent)' }}/>
            <span style={{ marginLeft:'auto', fontFamily:'var(--font-body)', fontSize:9.5, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:5, padding:'3px 7px' }}>Admin</span>
          </div>

          <nav style={{ flex:1, overflowY:'auto', padding:'6px 12px' }}>
            {NAV.map(n => {
              const active = tab===n.key;
              const badge  = counts[n.key];
              return (
                <button key={n.key} onClick={() => handleTabChange(n.key)} style={{ display:'flex', alignItems:'center', gap:11, width:'100%', padding:'9px 12px', marginBottom:2, borderRadius:9, border:'none', cursor:'pointer', textAlign:'left', background:active?'var(--accent-tint,#f7e9df)':'transparent', color:active?'var(--accent)':'var(--text-muted)', fontFamily:'var(--font-body)', fontSize:13.5, fontWeight:active?700:500, transition:'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background='var(--bg-alt)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background='transparent'; }}>
                  <Icon name={n.icon} size={18} c={active?'var(--accent)':'var(--text-muted)'}/>
                  <span style={{ flex:1 }}>{n.label}</span>
                  {badge>0 && <span style={{ background:active?'var(--accent)':'var(--text-muted)', color:'white', borderRadius:100, fontSize:10.5, fontWeight:700, padding:'1px 7px', minWidth:18, textAlign:'center' }}>{badge}</span>}
                </button>
              );
            })}
          </nav>

          <div style={{ padding:14, borderTop:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--ink,#1a1714)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-head)', fontWeight:700, fontSize:13, flexShrink:0 }}>{adminName[0]?.toUpperCase()||'A'}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{adminName}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>Admin</div>
              </div>
              <button title="Log out" onClick={handleLogout} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4, display:'flex' }}>
                <Icon name="logout" size={16}/>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main column */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>
        {/* Top bar */}
        <header style={{ position:'sticky', top:0, zIndex:20, background:'rgba(250,249,247,0.85)', backdropFilter:'blur(16px)', borderBottom:'1px solid var(--border)', padding:isMobile?'14px 18px':'16px 28px', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ flex:1, minWidth:0 }}>
            {isMobile ? (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:19, letterSpacing:'-0.04em' }}>Certo</span>
                <span style={{ width:4, height:4, borderRadius:'50%', background:'var(--accent)' }}/>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:5, padding:'2px 6px' }}>Admin</span>
              </div>
            ) : (
              <>
                <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:22, letterSpacing:'-0.025em', color:'var(--text)', textTransform:'capitalize', lineHeight:1 }}>{tabTitle}</div>
                <div style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:3 }}>{greeting}, {adminName} — here's where things stand today.</div>
              </>
            )}
          </div>

          {!isMobile && (
            <div style={{ position:'relative', width:240 }}>
              <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', display:'flex' }}><Icon name="search" size={15}/></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders, products…" style={{ width:'100%', boxSizing:'border-box', padding:'9px 12px 9px 34px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg)', fontFamily:'var(--font-body)', fontSize:13, color:'var(--text)', outline:'none' }}/>
            </div>
          )}

          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--border)', whiteSpace:'nowrap' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)' }}/>
            <span style={{ fontSize:12.5, color:'var(--text-muted)' }}>
              <strong style={{ color:'var(--text)', fontWeight:700 }}>₦{rate.toLocaleString()}</strong> / $1
            </span>
          </div>

          {!isMobile && (
            <>
              <button onClick={doRefresh} title="Refresh all data" style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:9, cursor:'pointer', color:'var(--text-muted)', display:'flex', transition:'opacity 0.2s' }}>
                <span style={{ display:'flex', animation:spinning?'spin 0.8s linear':'none' }}>
                  <Icon name="refresh" size={17}/>
                </span>
              </button>
              <button style={{ position:'relative', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:9, cursor:'pointer', color:'var(--text-muted)', display:'flex' }}>
                <Icon name="bell" size={17}/>
                {unread>0 && <span style={{ position:'absolute', top:6, right:6, width:7, height:7, borderRadius:'50%', background:'var(--accent)', boxShadow:'0 0 0 2px var(--bg)' }}/>}
              </button>
            </>
          )}
          <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
        </header>

        {/* Content */}
        <main style={{ flex:1, padding:isMobile?'18px 16px 96px':'24px 28px 40px', maxWidth:1280, width:'100%', margin:'0 auto' }}>
          {dataLoading ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:300, gap:14, color:'var(--text-muted)' }}>
              <span style={{ display:'flex', animation:'spin 0.75s linear infinite' }}>
                <Icon name="refresh" size={28} c="var(--accent)"/>
              </span>
              <span style={{ fontSize:14, letterSpacing:'0.02em' }}>Loading dashboard…</span>
            </div>
          ) : dataError ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:300, gap:12, color:'var(--text-muted)' }}>
              <div style={{ fontSize:15, fontWeight:600 }}>Failed to load data</div>
              <div style={{ fontSize:13 }}>{dataError}</div>
              <button onClick={() => setLoggedIn(l => !l || (setLoggedIn(true), true))} style={primaryBtn}>Retry</button>
            </div>
          ) : tabContent}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <>
          <nav style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:30, background:'rgba(250,249,247,0.94)', backdropFilter:'blur(16px)', borderTop:'1px solid var(--border)', display:'flex', padding:'8px 6px 10px' }}>
            {MOBILE_PRIMARY.map(key => {
              const n = NAV.find(x => x.key===key);
              const active = tab===key;
              const badge  = counts[key];
              return (
                <button key={key} onClick={() => handleTabChange(key)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'none', border:'none', cursor:'pointer', position:'relative', color:active?'var(--accent)':'var(--text-muted)', padding:'4px 0' }}>
                  <span style={{ position:'relative' }}>
                    <Icon name={n.icon} size={21} c={active?'var(--accent)':'var(--text-muted)'}/>
                    {badge>0 && <span style={{ position:'absolute', top:-4, right:-7, background:'var(--accent)', color:'white', borderRadius:100, fontSize:9, fontWeight:700, padding:'0px 4px', minWidth:14, textAlign:'center' }}>{badge}</span>}
                  </span>
                  <span style={{ fontSize:10, fontWeight:active?700:500 }}>{n.label}</span>
                </button>
              );
            })}
            <button onClick={() => setMoreOpen(v => !v)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'none', border:'none', cursor:'pointer', color:moreOpen?'var(--accent)':'var(--text-muted)', padding:'4px 0' }}>
              <Icon name="grid" size={21} c={moreOpen?'var(--accent)':'var(--text-muted)'}/>
              <span style={{ fontSize:10, fontWeight:moreOpen?700:500 }}>More</span>
            </button>
          </nav>

          {moreOpen && (
            <div onClick={() => setMoreOpen(false)} style={{ position:'fixed', inset:0, zIndex:29, background:'rgba(26,23,20,0.3)' }}>
              <div onClick={e => e.stopPropagation()} style={{ position:'absolute', bottom:78, left:12, right:12, background:'var(--bg)', borderRadius:18, border:'1px solid var(--border)', padding:12, boxShadow:'0 -8px 40px rgba(26,23,20,0.2)', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {NAV.filter(n => !MOBILE_PRIMARY.includes(n.key)).map(n => {
                  const active = tab===n.key;
                  return (
                    <button key={n.key} onClick={() => handleTabChange(n.key)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'16px 8px', borderRadius:12, border:'1px solid var(--border)', cursor:'pointer', background:active?'var(--accent-tint,#f7e9df)':'var(--bg-alt)', color:active?'var(--accent)':'var(--text)' }}>
                      <Icon name={n.icon} size={20} c={active?'var(--accent)':'var(--text-muted)'}/>
                      <span style={{ fontSize:11.5, fontWeight:active?700:500 }}>{n.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DashboardPage;
