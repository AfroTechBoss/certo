import { Empty } from './Empty.jsx';

// Ranked horizontal bar list — used for "Top pages", "Top products", etc.
//
// Props:
//   items    : array of records (returns <Empty/> if length === 0)
//   labelKey : string key for the label
//   valueKey : string key for the numeric value (used to size the bar)
//   color    : bar colour (default 'var(--accent)')

export const BarList = ({ items, labelKey, valueKey, color = 'var(--accent)' }) => {
  if (!items || !items.length) return <Empty label="No data yet"/>;
  const max = Math.max(...items.map(i => i[valueKey]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 16,
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: 'var(--text-muted)',
            textAlign: 'right',
            flexShrink: 0,
          }}>{i + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: 5,
            }}>{it[labelKey]}</div>
            <div style={{ height: 6, background: 'var(--bg-alt)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(it[valueKey] / max) * 100}%`,
                background: color,
                borderRadius: 4,
                transition: 'width 0.5s',
              }}/>
            </div>
          </div>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text)',
            flexShrink: 0,
          }}>{it[valueKey].toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};
