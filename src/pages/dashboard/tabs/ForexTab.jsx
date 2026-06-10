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

export function ForexTab({ isMobile, liveRate, rateFetched, onRateChange, products }) {
  // `displayRate` is what we show on the card — kept in sync with the prop
  const [displayRate, setDisplayRate] = useState(liveRate || 1590);
  // override input state
  const [overrideInput, setOverrideInput] = useState(String(liveRate || 1590));
  const [overrideSaved, setOverrideSaved] = useState(false);
  // fetch state
  const [fetching,   setFetching]   = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [fetchedAt,  setFetchedAt]  = useState(rateFetched || null);
  // Raw inter-bank market rate (returned by /api/forex). Only set after a fetch.
  const [marketRate, setMarketRate] = useState(null);
  // Markup added on top of marketRate. Server returns this — never hardcoded
  // here, so any future change to FOREX_MARKUP_NGN propagates automatically.
  const [markup,     setMarkup]     = useState(null);
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
      const withMarkup    = Number(data.rate);
      const apiMarkup     = Number(data.markup ?? 0);
      // Prefer the server-supplied market rate; fall back to (display − markup)
      // for older deploys that don't return it yet.
      const rawMarketRate = Number(data.marketRate ?? (withMarkup - apiMarkup));
      setMarketRate(rawMarketRate);
      setMarkup(apiMarkup);
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
              <span style={{ fontWeight:700, color:'#34d399' }}>₦{(markup ?? 0).toLocaleString()}</span>
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
          Click <strong>Fetch live</strong> to pull the current market rate (already including the server-side +₦{(markup ?? 50).toLocaleString()} markup). Or type a custom rate below and hit <strong>Override</strong> to lock it instantly across the whole catalog.
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
