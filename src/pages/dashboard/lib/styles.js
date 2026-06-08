// ─── Shared style atoms used across the dashboard ────────────────────────────
// Kept as plain objects so existing inline-style call sites don't have to change.

export const inputS = {
  padding: '9px 13px',
  borderRadius: 9,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--text)',
  outline: 'none',
};

export const thS = {
  padding: '12px 18px',
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  fontWeight: 700,
  color: 'var(--text-muted)',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

export const tdS = {
  padding: '13px 18px',
  fontFamily: 'var(--font-body)',
  fontSize: 13.5,
  color: 'var(--text)',
  verticalAlign: 'middle',
};

export const primaryBtn = {
  background: 'var(--accent)',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  padding: '10px 18px',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

export const actionBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '9px 16px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

export const miniBtn = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: 7,
  padding: '5px 12px',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--text-muted)',
  fontWeight: 600,
};

export const linkBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--accent)',
};
