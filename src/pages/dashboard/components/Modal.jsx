import { useEffect } from 'react';

// Reusable modal shell. Click-outside-to-close, Escape-to-close, scroll-locked body.
//
// Props:
//   title    : header text (left-aligned, large)
//   subtitle : optional smaller line below the title
//   onClose  : called when the user clicks the backdrop, presses Escape, or hits ✕
//   children : modal body
//   footer   : optional footer (rendered with its own top border)
//   width    : max-width in px (default 480)

export function Modal({ title, subtitle, onClose, children, footer, width = 480 }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(26,23,20,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px 12px', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: width,
          boxShadow: '0 24px 80px rgba(26,23,20,0.22)',
          overflow: 'hidden',
          maxHeight: 'calc(100dvh - 32px)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div>
            <span style={{
              fontFamily: 'var(--font-head)',
              fontWeight: 800,
              fontSize: 17,
              color: 'var(--text)',
              letterSpacing: '-0.01em',
            }}>{title}</span>
            {subtitle && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: 4, display: 'flex',
              borderRadius: 7, lineHeight: 1,
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
