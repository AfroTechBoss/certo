// ─── Shared public-page style atoms ──────────────────────────────────────────
//
// Reusable inline-style fragments used by the customer-facing pages
// (HomePage, ShopPage, Pages.jsx, Checkout, BlogPage, VerifyPage, ThankYouPage).
//
// The dashboard has its own atoms in src/pages/dashboard/lib/styles.js — keep
// these two files separate so admin changes don't leak into the customer UI.
//
// Usage:
//   import { primaryButton, eyebrow, sectionPadding } from '../lib/styles.js';
//   <button style={primaryButton}>Shop Apple</button>
//   <div style={{ ...sectionPadding, background: 'var(--cream)' }}>…</div>

// ── Buttons ────────────────────────────────────────────────────────────────

export const primaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  background: 'var(--accent)',
  color: 'white',
  textDecoration: 'none',
  border: 'none',
  cursor: 'pointer',
  borderRadius: 12,
  padding: '14px 28px',
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: '0.01em',
};

export const secondaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  background: 'transparent',
  color: 'var(--ink)',
  textDecoration: 'none',
  border: '1.5px solid var(--border)',
  cursor: 'pointer',
  borderRadius: 12,
  padding: '14px 28px',
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: '0.01em',
};

export const darkButton = {
  ...primaryButton,
  background: 'var(--ink)',
};

// ── Typography ─────────────────────────────────────────────────────────────

// The small uppercase orange label above every section heading.
export const eyebrow = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.18em',
  color: 'var(--accent)',
  textTransform: 'uppercase',
};

// Large display heading (Hero, section H1).
export const displayHeading = {
  fontFamily: 'var(--font-head)',
  fontWeight: 800,
  letterSpacing: '-0.04em',
  lineHeight: 0.95,
  color: 'var(--ink)',
  margin: 0,
};

// Section subtitle — smaller intro paragraph under a heading.
export const sectionSubtitle = {
  fontSize: 16,
  lineHeight: 1.7,
  color: 'var(--muted)',
  margin: 0,
  maxWidth: 540,
};

// ── Layout ─────────────────────────────────────────────────────────────────

export const container = {
  maxWidth: 1440,
  width: '100%',
  margin: '0 auto',
};

// Standard section vertical padding. Pass isMobile to override horizontal padding.
export const sectionPadding = (isMobile) => ({
  padding: isMobile ? '64px 20px' : '120px 48px',
});

// ── Cards ──────────────────────────────────────────────────────────────────

export const card = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 18,
  overflow: 'hidden',
};

export const cardHover = {
  cursor: 'pointer',
  transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s',
};
