import { useState } from 'react';
import { Modal } from '../components/Modal.jsx';
import { authFetch } from '../lib/auth.js';
import { mapOrder } from '../lib/mappers.js';
import { primaryBtn, actionBtn } from '../lib/styles.js';

// Soft-deletes an order by PATCHing { admin_hidden: true }.
// onDone receives the updated (mapped) order so the caller can update its list.

export function DeleteOrderModal({ order, onClose, onDone }) {
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await authFetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ admin_hidden: true }),
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
    <Modal title="Delete order" onClose={onClose} width={380}>
      <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, marginBottom: 24 }}>
        Are you sure you want to delete this?
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={submit}
          disabled={busy}
          style={{ ...primaryBtn, background: 'oklch(48% 0.2 25)', flex: 1, opacity: busy ? 0.7 : 1 }}
        >
          {busy ? 'Deleting…' : 'Delete'}
        </button>
        <button onClick={onClose} style={{ ...actionBtn, flex: 1, justifyContent: 'center' }}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
