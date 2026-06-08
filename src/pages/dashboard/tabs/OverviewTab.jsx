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

export function AlertRow({ color, icon, title, sub, onClick }) {
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

export function OverviewTab({ isMobile, setTab, orders, revenueSeries, messages, products }) {
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
