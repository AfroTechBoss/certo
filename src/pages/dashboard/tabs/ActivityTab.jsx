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

export function ActivityTab({ isMobile, logs, onLogsCleared }) {
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
