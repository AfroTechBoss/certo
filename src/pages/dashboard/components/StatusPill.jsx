import { dashStatus } from '../lib/constants.js';

// Inline pill showing an order's lifecycle status (Order Confirmed, Delivered, …)
// Colours come from DASH_STATUS_COLORS in lib/constants.js.
//
// Props:
//   status : exact status string (any unknown value falls back to "Order Confirmed" colours)
//   dot    : whether to show the leading coloured dot (default true)

export const StatusPill = ({ status, dot = true }) => {
  const c = dashStatus(status);
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 11px',
      borderRadius: 100,
      background: c.bg,
      color: c.fg,
      fontFamily: 'var(--font-body)',
      fontSize: 11.5,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      letterSpacing: '0.01em',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }}/>}
      {status}
    </span>
  );
};
