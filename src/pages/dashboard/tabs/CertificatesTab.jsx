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

export function CertificatesTab({ isMobile, certificates }) {
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
