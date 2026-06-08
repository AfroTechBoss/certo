import { useState } from 'react';
import { Modal } from '../components/Modal.jsx';
import { authFetch, getName } from '../lib/auth.js';
import { mapOrder } from '../lib/mappers.js';
import { inputS, primaryBtn, actionBtn } from '../lib/styles.js';

// Add / edit / remove a flag on an order.
// The flag_reason is prefixed with [adminName] so the audit trail is preserved.
// onDone receives the updated (mapped) order.

export function FlagModal({ order, onClose, onDone }) {
  const [reason, setReason] = useState(order.flag_reason || '');
  const [busy, setBusy]     = useState(false);
  const adminName = getName();
  const isFlagged = order.flag;

  const labelS = {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: 8,
  };

  const patch = async (body) => {
    setBusy(true);
    try {
      const res = await authFetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        onDone(mapOrder(updated));
      }
    } catch (e) { console.error(e); }
    setBusy(false);
    onClose();
  };

  return (
    <Modal title={isFlagged ? 'Edit flag' : 'Flag order'} onClose={onClose} width={440}>
      {isFlagged ? (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Updating as <strong style={{ color: 'var(--text)' }}>{adminName}</strong>. Reason is visible to all admins.
          </div>
          <label style={labelS}>Flag reason *</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Customer requested address change — confirm before shipping"
            rows={4}
            style={{ ...inputS, width: '100%', boxSizing: 'border-box', resize: 'vertical', marginBottom: 20, lineHeight: 1.6 }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => patch({ flag_reason: `[${adminName}] ${reason.trim()}` })}
              disabled={busy || !reason.trim()}
              style={{ ...primaryBtn, background: 'oklch(50% 0.18 25)', flex: 1, opacity: (!reason.trim() || busy) ? 0.6 : 1 }}
            >
              {busy ? 'Saving…' : 'Update reason'}
            </button>
            <button
              onClick={() => patch({ flagged: false, flag_reason: '' })}
              disabled={busy}
              style={{ ...actionBtn, flex: 1, justifyContent: 'center', color: 'oklch(45% 0.18 25)', borderColor: 'oklch(85% 0.1 25)' }}
            >
              Remove flag
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Flagging as <strong style={{ color: 'var(--text)' }}>{adminName}</strong>. The reason will be visible to all admins.
          </div>
          <label style={labelS}>Reason *</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Customer requested address change — confirm before shipping"
            rows={4}
            style={{ ...inputS, width: '100%', boxSizing: 'border-box', resize: 'vertical', marginBottom: 20, lineHeight: 1.6 }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => patch({ flagged: true, flag_reason: `[${adminName}] ${reason.trim()}` })}
              disabled={busy || !reason.trim()}
              style={{ ...primaryBtn, background: 'oklch(50% 0.18 25)', flex: 1, opacity: (!reason.trim() || busy) ? 0.6 : 1 }}
            >
              {busy ? 'Flagging…' : 'Flag order'}
            </button>
            <button onClick={onClose} style={{ ...actionBtn, flex: 1, justifyContent: 'center' }}>
              Cancel
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
