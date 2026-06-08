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

export function AnalyticsTab({ isMobile, analytics: analyticsData }) {
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
