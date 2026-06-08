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
import { CouponCreateModal } from '../modals/CouponCreateModal.jsx';

export function CouponsTab({ isMobile, coupons: initialCoupons }) {
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
