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

export function MessagesTab({ isMobile, messages: initialMessages }) {
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
