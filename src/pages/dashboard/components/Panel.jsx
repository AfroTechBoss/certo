// Card wrapper with an optional title bar + action slot.
//
// Props:
//   title    : optional title bar text (when omitted the bar is hidden)
//   action   : optional React node aligned right inside the title bar
//   children : panel body
//   pad      : body padding (default 22)
//   style    : extra container styles

export const Panel = ({ title, action, children, pad = 22, style }) => (
  <div style={{
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    overflow: 'hidden',
    ...style,
  }}>
    {title && (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '16px 22px',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{
          fontFamily: 'var(--font-head)',
          fontWeight: 700,
          fontSize: 15,
          color: 'var(--text)',
          letterSpacing: '-0.01em',
        }}>{title}</span>
        {action}
      </div>
    )}
    <div style={{ padding: pad }}>{children}</div>
  </div>
);
