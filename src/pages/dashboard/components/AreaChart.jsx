import { useState } from 'react';
import { Empty } from './Empty.jsx';

// Responsive SVG area chart with hover dot + tooltip.
//
// Props:
//   data        : array of points (returns Empty if length === 0)
//   xKey        : x label key on each point (default 'day')
//   yKey        : y value key on each point (default 'views')
//   color       : line + area colour (default 'var(--accent)')
//   height      : SVG viewBox height (default 200)
//   formatValue : optional (v) => string for tooltip number; defaults handle 1k/1M.

export const AreaChart = ({ data, xKey = 'day', yKey = 'views', color = 'var(--accent)', height = 200, formatValue }) => {
  const [hovered, setHovered] = useState(null);
  if (!data || !data.length) return <Empty label="No data yet for this period"/>;
  const W = 720, H = height, PL = 8, PR = 8, PB = 28, PT = 12;
  const innerW = W - PL - PR, innerH = H - PB - PT;
  const ys = data.map(d => d[yKey]);
  const maxV = Math.max(...ys, 1);
  const pts = data.map((d, i) => ({
    x: PL + (i / Math.max(data.length - 1, 1)) * innerW,
    y: PT + (innerH - (d[yKey] / maxV) * innerH),
    d,
  }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${PT + innerH} L${pts[0].x.toFixed(1)},${PT + innerH} Z`;
  const gid = 'dashArea-' + color.replace(/[^a-z0-9]/gi, '').slice(0, 8);
  const fmt = formatValue || (v => v >= 1e6 ? '₦' + (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? v.toLocaleString() : String(v));

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * W;
    let closest = 0, minD = Infinity;
    pts.forEach((p, i) => { const d = Math.abs(p.x - rawX); if (d < minD) { minD = d; closest = i; } });
    setHovered(closest);
  };

  const hp = hovered !== null ? pts[hovered] : null;
  const tooltipX = hp ? Math.min(Math.max(hp.x, 40), W - 40) : 0;
  const tooltipAbove = hp && hp.y > H / 2;

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.28"/>
            <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map(t => (
          <line key={t}
            x1={PL} y1={(PT + innerH * t).toFixed(1)}
            x2={W - PR} y2={(PT + innerH * t).toFixed(1)}
            stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4"/>
        ))}
        <path d={area} fill={`url(#${gid})`}/>
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y}
              r={hovered === i ? 5 : 3.5}
              fill={hovered === i ? color : 'var(--bg)'}
              stroke={color} strokeWidth="2"
              style={{ transition: 'r 0.1s' }}/>
            <text x={p.x} y={H - 8} textAnchor="middle" fontSize="11"
              fill="var(--text-muted)" fontFamily="var(--font-body)">{p.d[xKey]}</text>
          </g>
        ))}
        {hp && (
          <line x1={hp.x} y1={PT} x2={hp.x} y2={PT + innerH}
            stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>
        )}
      </svg>
      {hp && (
        <div style={{
          position: 'absolute',
          left: `${(tooltipX / W) * 100}%`,
          top: tooltipAbove ? 'auto' : '8px',
          bottom: tooltipAbove ? '32px' : 'auto',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          background: 'var(--ink,#1a1714)',
          color: 'white',
          borderRadius: 9,
          padding: '8px 14px',
          fontSize: 12,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(26,23,20,0.25)',
          zIndex: 10,
        }}>
          <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{hp.d[xKey]}</div>
          <div style={{ fontSize: 14, fontFamily: 'var(--font-num)', fontWeight: 800 }}>{fmt(hp.d[yKey])}</div>
        </div>
      )}
    </div>
  );
};
