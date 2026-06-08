// Centred placeholder text. Used by panels/tables when there's no data.

export const Empty = ({ label }) => (
  <div style={{
    textAlign: 'center',
    padding: '36px 0',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'var(--text-muted)',
  }}>
    {label}
  </div>
);
