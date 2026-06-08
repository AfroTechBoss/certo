import { Modal } from '../components/Modal.jsx';
import { primaryBtn, actionBtn } from '../lib/styles.js';

// Shows a QR code for opening wa.me/<phone> on a phone (so the admin can
// keep working on their laptop while the convo happens on mobile).

export function WhatsAppModal({ phone, name, onClose }) {
  const cleaned = (phone || '').replace(/[^0-9]/g, '');
  const waUrl   = `https://wa.me/${cleaned}`;
  const qrSrc   = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=1a1714&bgcolor=faf9f7&data=${encodeURIComponent(waUrl)}`;

  return (
    <Modal title="WhatsApp customer" onClose={onClose} width={380}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          Scan with your phone to open WhatsApp with <strong style={{ color: 'var(--text)' }}>{name}</strong>
        </div>
        <div style={{
          display: 'inline-flex',
          padding: 12,
          background: 'var(--bg-alt)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          marginBottom: 20,
        }}>
          <img src={qrSrc} alt="WhatsApp QR" width={200} height={200} style={{ display: 'block', borderRadius: 8 }}/>
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          marginBottom: 24,
          fontFamily: 'var(--font-mono,monospace)',
        }}>{phone}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
            style={{
              ...primaryBtn,
              flex: 1,
              textAlign: 'center',
              textDecoration: 'none',
              background: 'oklch(50% 0.18 145)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            Continue on Web
          </a>
          <button onClick={onClose} style={{ ...actionBtn, flex: 1, justifyContent: 'center' }}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
