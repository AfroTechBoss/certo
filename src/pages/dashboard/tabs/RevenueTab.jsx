import { useState } from 'react';
import { fmtN, fmtU } from '../lib/format.js';
import { thS, tdS } from '../lib/styles.js';
import { Icon } from '../components/Icon.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { Panel } from '../components/Panel.jsx';
import { Empty } from '../components/Empty.jsx';
import { Segmented } from '../components/Segmented.jsx';
import { AreaChart } from '../components/AreaChart.jsx';

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

export function RevenueTab({ isMobile, orders, revenueSeries }) {
  const [cur, setCur] = useState('ngn');
  const visible      = orders.filter(o => !o.admin_hidden);
  const totalNgn     = visible.reduce((s, o) => s + o.ngn, 0);
  const totalUsd     = visible.reduce((s, o) => s + o.usd, 0);
  const totalNetUsd  = visible.reduce((s, o) => s + orderEstNetUsd(o), 0);
  const totalNetNgn  = visible.reduce((s, o) => s + orderEstNetNgn(o), 0);

  const netDisplay = cur === 'ngn'
    ? '₦' + Math.round(totalNetNgn / 1000).toLocaleString('en-NG') + 'k'
    : fmtU(totalNetUsd.toFixed(0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Segmented value={cur} onChange={setCur} options={[{ key: 'ngn', label: '₦ NGN' }, { key: 'usd', label: '$ USD' }]}/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 14 }}>
        <StatCard label="Gross Revenue"   value={cur === 'ngn' ? '₦' + (totalNgn / 1e6).toFixed(1) + 'M' : fmtU(totalUsd)} spark={revenueSeries.map(r => r.ngn)} icon={<Icon name="coins" size={16}/>}/>
        <StatCard label="Est. Net Profit" value={netDisplay} sub="fee + 7% + forex" accent="oklch(45% 0.15 155)" icon={<Icon name="pulse" size={16}/>}/>
        <StatCard label="Avg Order Value" value={visible.length ? (cur === 'ngn' ? '₦' + Math.round(totalNgn / visible.length / 1000).toLocaleString('en-NG') + 'k' : fmtU((totalUsd / visible.length).toFixed(0))) : '—'} icon={<Icon name="box" size={16}/>}/>
        <StatCard label="Orders"          value={visible.length} sub="this period" accent="var(--accent)" icon={<Icon name="ticket" size={16}/>}/>
      </div>

      <Panel
        title="Revenue trend"
        action={<span style={{ fontFamily: 'var(--font-num)', fontWeight: 800, fontSize: 18 }}>
          {cur === 'ngn' ? '₦' + (totalNgn / 1e6).toFixed(1) + 'M' : fmtU(totalUsd)}
        </span>}
      >
        <AreaChart data={revenueSeries} xKey="day" yKey="ngn" color="oklch(50% 0.15 155)" height={210}/>
      </Panel>

      <Panel title="Per-order breakdown" pad={0}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ background: 'var(--bg-alt)' }}>
                {['Order', 'Customer', 'Revenue', 'Service fee', 'Price margin', 'Forex gain', 'Est. Net'].map(h => <th key={h} style={thS}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const sf    = orderServiceFee(o);
                const pm    = orderPriceMargin(o);
                const fxNgn = orderForexGainNgn(o);
                const netUsd = sf + pm;
                const impliedRate = o.usd > 0 ? o.ngn / o.usd : 1590;
                const netNgn = netUsd * impliedRate + fxNgn;
                return (
                  <tr key={o.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ ...tdS, fontWeight: 700, color: 'var(--accent)' }}>{o.id}</td>
                    <td style={tdS}>{o.customer}</td>
                    <td style={{ ...tdS, fontFamily: 'var(--font-num)', fontWeight: 700 }}>{cur === 'ngn' ? fmtN(o.ngn) : fmtU(o.usd)}</td>
                    <td style={{ ...tdS, color: 'var(--text-muted)' }}>{fmtU(sf.toFixed(0))}</td>
                    <td style={{ ...tdS, color: 'var(--text-muted)' }}>{fmtU(pm.toFixed(0))}</td>
                    <td style={{ ...tdS, color: 'var(--text-muted)' }}>{fmtN(fxNgn)}</td>
                    <td style={{ ...tdS, color: 'oklch(45% 0.15 155)', fontWeight: 700 }}>
                      {cur === 'ngn' ? fmtN(netNgn) : fmtU(netUsd.toFixed(0))}
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
