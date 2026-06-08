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

export function CustAvatar({ name }) {
  return <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--accent-tint,#f7e9df)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-head)', fontWeight:700, fontSize:12, flexShrink:0 }}>{(name||'?').split(' ').map(n=>n[0]).join('').slice(0,2)}</div>;
}

export function CustomersTab({ isMobile, orders }) {
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
