// Certo Dashboard — shared visual primitives
// Status pills, stat cards, sparklines, area + donut charts, segmented controls.
// All consume the Certo token set (--ink, --accent, --cream, Syne, etc.)

// ─── Status color map ───────────────────────────────────────────────────────

const DASH_STATUS_COLORS = {
    'Payment Pending':          { bg: 'oklch(95% 0.07 70)',  fg: 'oklch(45% 0.16 55)',  dot: 'oklch(60% 0.18 55)'  },
    'Order Confirmed':          { bg: 'oklch(94% 0.05 250)', fg: 'oklch(42% 0.15 250)', dot: 'oklch(55% 0.16 250)' },
    'Purchased from Apple':     { bg: 'oklch(95% 0.04 30)',  fg: 'oklch(45% 0.13 30)',  dot: 'oklch(58% 0.15 30)'  },
    'In Transit to US Partner': { bg: 'oklch(94% 0.05 220)', fg: 'oklch(43% 0.13 220)', dot: 'oklch(56% 0.14 220)' },
    'Customs Clearance':        { bg: 'oklch(96% 0.06 80)',  fg: 'oklch(46% 0.14 65)',  dot: 'oklch(60% 0.16 65)'  },
    'Arrived in Nigeria':       { bg: 'oklch(94% 0.07 155)', fg: 'oklch(38% 0.15 155)', dot: 'oklch(52% 0.16 155)' },
    'Out for Delivery':         { bg: 'oklch(95% 0.07 60)',  fg: 'oklch(44% 0.16 55)',  dot: 'oklch(60% 0.17 55)'  },
    'Delivered':                { bg: 'oklch(93% 0.06 155)', fg: 'oklch(35% 0.15 155)', dot: 'oklch(50% 0.17 155)' },
    'Cancelled':                { bg: 'oklch(94% 0.02 0)',   fg: 'oklch(48% 0.04 0)',   dot: 'oklch(60% 0.04 0)'   },
  };
  const dashStatus = (s) => DASH_STATUS_COLORS[s] || DASH_STATUS_COLORS['Order Confirmed'];
  
  const StatusPill = ({ status, dot = true }) => {
    const c = dashStatus(status);
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 11px', borderRadius: 100,
        background: c.bg, color: c.fg,
        fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 700,
        whiteSpace: 'nowrap', letterSpacing: '0.01em',
      }}>
        {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />}
        {status}
      </span>
    );
  };
  
  // ─── Sparkline ──────────────────────────────────────────────────────────────
  
  const Sparkline = ({ data, color = 'var(--accent)', width = 96, height = 32, fill = true }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data), min = Math.min(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return [x, y];
    });
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `${line} L${width},${height} L0,${height} Z`;
    const gid = 'spark-' + Math.random().toString(36).slice(2, 8);
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
        {fill && (
          <>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gid})`} />
          </>
        )}
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
      </svg>
    );
  };
  
  // ─── Stat card (with optional trend + sparkline) ────────────────────────────
  
  const StatCard = ({ label, value, sub, delta, deltaUp, spark, sparkColor, accent, icon }) => (
    <div style={{
      background: 'var(--bg)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 0,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)',
        }}>{label}</span>
        {icon && (
          <span style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: 'var(--bg-alt)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accent || 'var(--accent)',
          }}>{icon}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-head)', fontWeight: 800,
            fontSize: 30, color: accent || 'var(--text)',
            letterSpacing: '-0.025em', lineHeight: 1,
          }}>{value}</div>
          {(sub || delta) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              {delta && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 2,
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
                  color: deltaUp ? 'oklch(50% 0.16 155)' : 'oklch(55% 0.18 25)',
                }}>
                  {deltaUp ? '↑' : '↓'} {delta}
                </span>
              )}
              {sub && <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{sub}</span>}
            </div>
          )}
        </div>
        {spark && <Sparkline data={spark} color={sparkColor || accent || 'var(--accent)'} />}
      </div>
    </div>
  );
  
  // ─── Area chart ─────────────────────────────────────────────────────────────
  
  const AreaChart = ({ data, xKey = 'day', yKey = 'views', color = 'var(--accent)', height = 200, format }) => {
    if (!data || !data.length) return <Empty label="No data yet for this period" />;
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
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map(t => (
          <line key={t} x1={PL} y1={(PT + innerH * t).toFixed(1)} x2={W - PR} y2={(PT + innerH * t).toFixed(1)}
            stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4" />
        ))}
        <path d={area} fill="url(#dashArea)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="var(--bg)" stroke={color} strokeWidth="2" />
            <text x={p.x} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-muted)" fontFamily="var(--font-body)">
              {p.d[xKey]}
            </text>
          </g>
        ))}
      </svg>
    );
  };
  
  // ─── Donut chart ────────────────────────────────────────────────────────────
  
  const DONUT_COLORS = ['var(--accent)', 'oklch(55% 0.16 250)', 'oklch(55% 0.15 155)', 'oklch(60% 0.16 60)', 'oklch(52% 0.16 310)', 'oklch(50% 0.08 220)'];
  
  const DonutChart = ({ segments, total: totalLabel }) => {
    if (!segments || !segments.length) return null;
    const total = segments.reduce((s, e) => s + e.value, 0) || 1;
    const R = 38, C = 2 * Math.PI * R;
    let cum = 0;
    const slices = segments.map((seg, i) => {
      const arc = (seg.value / total) * C;
      const slice = { ...seg, arc, offset: C / 4 - cum, color: DONUT_COLORS[i % DONUT_COLORS.length] };
      cum += arc;
      return slice;
    });
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        <svg viewBox="0 0 100 100" style={{ width: 116, height: 116, flexShrink: 0 }}>
          {slices.map((s, i) => (
            <circle key={i} cx="50" cy="50" r={R} fill="none" stroke={s.color} strokeWidth="15"
              strokeDasharray={`${s.arc.toFixed(2)} ${(C - s.arc).toFixed(2)}`} strokeDashoffset={s.offset.toFixed(2)}
              strokeLinecap="butt" />
          ))}
          <text x="50" y="47" textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--text)" fontFamily="var(--font-head)">
            {total >= 1000 ? (total / 1000).toFixed(1) + 'k' : total}
          </text>
          <text x="50" y="60" textAnchor="middle" fontSize="7" fill="var(--text-muted)" fontFamily="var(--font-body)" letterSpacing="0.1em">
            {totalLabel || 'TOTAL'}
          </text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1, minWidth: 180 }}>
          {slices.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', flex: 1, textTransform: 'capitalize' }}>{s.label.replace(/_/g, ' ')}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.value.toLocaleString()}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', minWidth: 34, textAlign: 'right' }}>{Math.round((s.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // ─── Horizontal bar list (top pages, products, etc.) ────────────────────────
  
  const BarList = ({ items, labelKey, valueKey, color = 'var(--accent)', format }) => {
    if (!items || !items.length) return <Empty label="No data yet" />;
    const max = Math.max(...items.map(i => i[valueKey]), 1);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 16, fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 5 }}>
                {format ? format(it[labelKey]) : it[labelKey]}
              </div>
              <div style={{ height: 6, background: 'var(--bg-alt)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(it[valueKey] / max) * 100}%`, background: color, borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
              {it[valueKey].toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  };
  
  // ─── Card wrapper + section title ───────────────────────────────────────────
  
  const Panel = ({ title, action, children, pad = 22, style }) => (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', ...style }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</span>
          {action}
        </div>
      )}
      <div style={{ padding: pad }}>{children}</div>
    </div>
  );
  
  const Empty = ({ label }) => (
    <div style={{ textAlign: 'center', padding: '36px 0', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
  );
  
  // ─── Segmented control ──────────────────────────────────────────────────────
  
  const Segmented = ({ options, value, onChange, size = 'md' }) => (
    <div style={{ display: 'inline-flex', gap: 3, background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
      {options.map(o => {
        const active = value === o.key;
        return (
          <button key={o.key} onClick={() => onChange(o.key)} style={{
            padding: size === 'sm' ? '5px 11px' : '7px 15px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: active ? 'var(--bg)' : 'transparent',
            color: active ? 'var(--text)' : 'var(--text-muted)',
            fontFamily: 'var(--font-body)', fontSize: size === 'sm' ? 12 : 13, fontWeight: active ? 700 : 500,
            boxShadow: active ? '0 1px 3px rgba(26,23,20,0.08)' : 'none',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
  
  window.CertoDashUI = {
    dashStatus, StatusPill, Sparkline, StatCard, AreaChart, DonutChart,
    BarList, Panel, Empty, Segmented,
  };
  