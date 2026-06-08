// Pill-style segmented control. Active option gets a subtle white background + shadow.
//
// Props:
//   options : [{ key, label }]
//   value   : currently-selected key
//   onChange: (newKey) → void
//   size    : 'sm' | 'md'  (default 'md')

export const Segmented = ({ options, value, onChange, size = 'md' }) => (
  <div style={{
    display: 'inline-flex',
    gap: 3,
    background: 'var(--bg-alt)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: 3,
  }}>
    {options.map(o => {
      const active = value === o.key;
      return (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          style={{
            padding: size === 'sm' ? '5px 11px' : '7px 15px',
            borderRadius: 7,
            border: 'none',
            cursor: 'pointer',
            background: active ? 'var(--bg)' : 'transparent',
            color: active ? 'var(--text)' : 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            fontSize: size === 'sm' ? 12 : 13,
            fontWeight: active ? 700 : 500,
            boxShadow: active ? '0 1px 3px rgba(26,23,20,0.08)' : 'none',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);
