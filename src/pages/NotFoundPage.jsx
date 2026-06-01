// Certo — 404 / Not Found  (Concept C: Simple)
// Restrained and confident. Wordmark, a clear message, the brand's hand-drawn
// underline as the single flourish, and two actions. Nothing else.
import React, { useState, useEffect } from 'react';

export function NotFoundPage({ navigate }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 600);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const go = (page) => (e) => { e.preventDefault(); if (navigate) navigate(page); };

  return (
    <div style={{ ...sm.page, padding: isMobile ? '72px 20px 80px' : '48px 24px' }}>
      <main style={{ ...sm.main, width: '100%' }}>
        <div style={sm.code}>404</div>

        <h1 style={{ ...sm.head, fontSize: isMobile ? 36 : 46 }}>
          This page&nbsp;
          <span style={sm.underlineWrap}>
            isn&rsquo;t here.
            <svg style={sm.underline} height="14" viewBox="0 0 320 14" preserveAspectRatio="none" aria-hidden="true">
              <path d="M 2 8 Q 80 2, 160 7 T 318 6" stroke="var(--accent, #d97757)" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h1>

        <p style={{ ...sm.body, fontSize: isMobile ? 15 : 16.5 }}>
          The link may be broken, or the page may have moved. Let&rsquo;s get you
          back to something real.
        </p>

        <div style={{ ...sm.ctaRow, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 14 : 20 }}>
          <a href="/" onClick={go('home')} style={{ ...sm.primary, width: isMobile ? '100%' : 'auto', boxSizing: 'border-box' }}>Back to home</a>
          <a href="/shop" onClick={go('shop')} style={sm.secondary}>Shop Apple &rarr;</a>
        </div>
      </main>

      <div style={{ ...sm.foot, fontSize: isMobile ? 12 : 12.5 }}>&mdash; Certo · Lagos</div>
    </div>
  );
}

const sm = {
  page: {
    minHeight: '100vh', width: '100%', boxSizing: 'border-box',
    background: 'var(--bg, #faf9f7)', color: 'var(--text, #1a1714)',
    fontFamily: 'var(--font-body, sans-serif)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '48px 24px', position: 'relative', textAlign: 'center',
  },
  main: { maxWidth: 480 },
  code: {
    fontFamily: 'var(--font-mono, monospace)', fontSize: 13, fontWeight: 600,
    letterSpacing: '0.32em', color: 'var(--accent, #d97757)', marginBottom: 22,
  },
  head: {
    fontFamily: 'var(--font-head, serif)', fontWeight: 800, fontSize: 46,
    lineHeight: 1.04, letterSpacing: '-0.035em', color: 'var(--text, #1a1714)',
    margin: '0 0 20px',
  },
  underlineWrap: { position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' },
  underline: { position: 'absolute', left: 0, right: 0, bottom: -8, width: '100%' },

  body: {
    fontSize: 16.5, lineHeight: 1.62, color: 'var(--text-muted, #706b60)',
    margin: '0 auto 34px', maxWidth: 380,
  },

  ctaRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' },
  primary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--text, #1a1714)', color: '#fff', textDecoration: 'none',
    fontSize: 14.5, fontWeight: 600, padding: '13px 26px', borderRadius: 11, whiteSpace: 'nowrap',
  },
  secondary: {
    fontSize: 14.5, fontWeight: 600, color: 'var(--text, #1a1714)', textDecoration: 'none',
    borderBottom: '1.5px solid var(--text, #1a1714)', paddingBottom: 2, whiteSpace: 'nowrap',
  },

  foot: {
    position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
    fontSize: 12.5, color: 'var(--text-muted, #706b60)',
    fontFamily: 'var(--font-head, serif)', fontStyle: 'italic',
    whiteSpace: 'nowrap',
  },
};
