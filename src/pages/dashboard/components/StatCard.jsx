import { Sparkline } from './Sparkline.jsx';

// One stat tile used throughout the dashboard (Overview, Orders, Revenue, etc.).
//
// Props:
//   label       : the small uppercase eyebrow ("ORDERS", "REVENUE", …)
//   value       : the big number/text
//   sub         : optional muted descriptor under the value
//   delta       : optional change indicator like "+12%"
//   deltaUp     : true → green up arrow, false → red down arrow
//   spark       : optional array of numbers → tiny sparkline on the right
//   sparkColor  : sparkline colour override
//   accent      : accent colour for the value text + sparkline default
//   icon        : optional React node rendered in the top-right tile

export const StatCard = ({ label, value, sub, delta, deltaUp, spark, sparkColor, accent, icon }) => (
  <div style={{
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
      }}>{label}</span>
      {icon && (
        <span style={{
          width: 30, height: 30,
          borderRadius: 9, flexShrink: 0,
          background: 'var(--bg-alt)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent || 'var(--accent)',
        }}>
          {icon}
        </span>
      )}
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{
          fontFamily: 'var(--font-num)',
          fontWeight: 800,
          fontSize: 30,
          color: accent || 'var(--text)',
          letterSpacing: '-0.025em',
          lineHeight: 1,
        }}>
          {value}
        </div>
        {(sub || delta) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            {delta && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 700,
                color: deltaUp ? 'oklch(50% 0.16 155)' : 'oklch(55% 0.18 25)',
              }}>
                {deltaUp ? '↑' : '↓'} {delta}
              </span>
            )}
            {sub && (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
                {sub}
              </span>
            )}
          </div>
        )}
      </div>
      {spark && <Sparkline data={spark} color={sparkColor || accent || 'var(--accent)'}/>}
    </div>
  </div>
);
