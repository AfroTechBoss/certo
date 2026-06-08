import { useState } from 'react';
import { DONUT_COLORS } from '../lib/constants.js';

// SVG donut chart with hover-highlight + side legend.
//
// Props:
//   segments : array of { label, value }
//   total    : optional label shown in the centre (default 'TOTAL')

export const DonutChart = ({ segments, total: totalLabel }) => {
  const [hovSeg, setHovSeg] = useState(null);
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
  const hov = hovSeg !== null ? slices[hovSeg] : null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg viewBox="0 0 100 100" style={{ width: 116, height: 116, display: 'block' }}>
          {slices.map((s, i) => (
            <circle key={i} cx="50" cy="50"
              r={hovSeg === i ? 40 : R}
              fill="none"
              stroke={s.color}
              strokeWidth={hovSeg === i ? 11 : 15}
              strokeDasharray={`${s.arc.toFixed(2)} ${(C - s.arc).toFixed(2)}`}
              strokeDashoffset={s.offset.toFixed(2)}
              strokeLinecap="butt"
              style={{
                cursor: 'pointer',
                transition: 'r 0.15s, stroke-width 0.15s',
                opacity: hovSeg !== null && hovSeg !== i ? 0.45 : 1,
              }}
              onMouseEnter={() => setHovSeg(i)}
              onMouseLeave={() => setHovSeg(null)}
            />
          ))}
          {hov ? (
            <>
              <text x="50" y="44" textAnchor="middle" fontSize="13" fontWeight="800"
                fill="var(--text)" fontFamily="var(--font-num)">{hov.value}</text>
              <text x="50" y="56" textAnchor="middle" fontSize="6.5"
                fill="var(--text-muted)" fontFamily="var(--font-body)" letterSpacing="0.06em">
                {Math.round((hov.value / total) * 100)}%
              </text>
            </>
          ) : (
            <>
              <text x="50" y="47" textAnchor="middle" fontSize="15" fontWeight="800"
                fill="var(--text)" fontFamily="var(--font-num)">
                {total >= 1000 ? (total / 1000).toFixed(1) + 'k' : total}
              </text>
              <text x="50" y="60" textAnchor="middle" fontSize="7"
                fill="var(--text-muted)" fontFamily="var(--font-body)" letterSpacing="0.1em">
                {totalLabel || 'TOTAL'}
              </text>
            </>
          )}
        </svg>
        {hov && (
          <div style={{
            position: 'absolute', top: -38, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--ink,#1a1714)', color: 'white',
            borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700,
            whiteSpace: 'nowrap', pointerEvents: 'none',
            boxShadow: '0 4px 16px rgba(26,23,20,0.25)',
          }}>
            {hov.label.replace(/_/g, ' ')} · {hov.value}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1, minWidth: 180 }}>
        {slices.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            padding: '3px 6px', borderRadius: 7,
            background: hovSeg === i ? 'var(--bg-alt)' : 'transparent',
            transition: 'background 0.15s',
          }}
            onMouseEnter={() => setHovSeg(i)}
            onMouseLeave={() => setHovSeg(null)}
          >
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flexShrink: 0 }}/>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', flex: 1, textTransform: 'capitalize' }}>
              {s.label.replace(/_/g, ' ')}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              {s.value.toLocaleString()}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', minWidth: 34, textAlign: 'right' }}>
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
