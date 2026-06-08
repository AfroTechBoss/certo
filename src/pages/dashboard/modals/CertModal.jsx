import { useState } from 'react';
import { Modal } from '../components/Modal.jsx';
import { authFetch } from '../lib/auth.js';
import { useIsMobile } from '../lib/useIsMobile.js';
import { inputS, primaryBtn, actionBtn, miniBtn } from '../lib/styles.js';

// Three modes:
//   isCreate    → no existingCert → create a new cert for this order
//   isDraft     → existingCert.status === 'draft' → fill in & publish (or re-save)
//   isPublished → existingCert.status === 'published' → read-only public view
//
// onDone receives the raw API response (cert row).
//
// Saving as draft only writes serial + apple_order_ref; chain of custody is
// stored but only timestamped when the cert moves to 'published'.

export function CertModal({ order, existingCert, onClose, onDone }) {
  const isMobile    = useIsMobile();
  const isPublished = existingCert?.status === 'published';
  const isDraft     = existingCert?.status === 'draft';
  const isCreate    = !existingCert;

  const initCoc = (isDraft && Array.isArray(existingCert?.chain_of_custody) && existingCert.chain_of_custody.length)
    ? existingCert.chain_of_custody.map(e => ({ step: e.step || '', actor: e.actor || '' }))
    : [{ step: '', actor: 'Certo' }];

  const [serial,   setSerial]   = useState(existingCert?.serial_number    || '');
  const [appleRef, setAppleRef] = useState(existingCert?.apple_order_ref  || '');
  const [asDraft,  setAsDraft]  = useState(false);
  const [coc,      setCoc]      = useState(initCoc);
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState('');

  const addStep    = ()        => setCoc(p => [...p, { step: '', actor: 'Certo' }]);
  const removeStep = (i)       => setCoc(p => p.filter((_, j) => j !== i));
  const setStep    = (i, k, v) => setCoc(p => p.map((e, j) => j === i ? { ...e, [k]: v } : e));

  const labelS = {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    display: 'block', marginBottom: 6,
  };

  const submit = async () => {
    setErr('');
    const status    = asDraft ? 'draft' : 'published';
    const filledCoc = coc.filter(e => e.step.trim());
    if (!asDraft) {
      if (!serial.trim())    { setErr('Serial number is required to publish.');     return; }
      if (!appleRef.trim())  { setErr('Apple order reference is required to publish.'); return; }
      if (!filledCoc.length) { setErr('At least one chain of custody step is required to publish.'); return; }
    }
    setBusy(true);
    try {
      const cocWithTs = filledCoc.map(e => ({
        step:  e.step.trim(),
        actor: e.actor.trim() || 'Certo',
        ts:    new Date().toISOString(),
      }));
      const body = {
        serial_number:   serial.trim(),
        apple_order_ref: appleRef.trim(),
        chain_of_custody: asDraft ? [] : cocWithTs,
        status,
        ...(isCreate ? {
          order_id:          order.id,
          product_name:      order.product,
          product_subtitle:  order.product_subtitle || '',
          recipient_name:    order.customer,
          recipient_address: order.address,
        } : {}),
      };
      const url    = isDraft ? `/api/certificates/${existingCert.id}` : '/api/certificates';
      const method = isDraft ? 'PATCH' : 'POST';
      const res    = await authFetch(url, { method, body: JSON.stringify(body) });
      const json   = await res.json();
      if (!res.ok) { setErr(json.error || 'Failed to save certificate'); setBusy(false); return; }
      onDone && onDone(json);
      onClose();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  // ── Published: read-only view ──────────────────────────────────────────────
  if (isPublished) {
    const pubCoc  = Array.isArray(existingCert.chain_of_custody) ? existingCert.chain_of_custody : [];
    const pubDate = existingCert.published_at || existingCert.issued_at || existingCert.created_at;
    return (
      <Modal title="Certificate" onClose={onClose} width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              padding: '4px 12px', borderRadius: 100,
              background: 'oklch(93% 0.06 155)', color: 'oklch(35% 0.15 155)',
              fontSize: 11.5, fontWeight: 700,
            }}>✓ Published</span>
            {pubDate && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {new Date(pubDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          <div style={{ padding: '12px 16px', background: 'var(--bg-alt)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Certificate ID</div>
            <div style={{ fontFamily: 'var(--font-mono,monospace)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{existingCert.id}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{order.id} — {order.customer} — {order.product}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <div style={labelS}>Serial number</div>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 14, fontWeight: 700, color: 'var(--text)', padding: '8px 12px', background: 'var(--bg-alt)', borderRadius: 8, border: '1px solid var(--border)' }}>{existingCert.serial_number || '—'}</div>
            </div>
            <div>
              <div style={labelS}>Apple order ref</div>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 14, fontWeight: 700, color: 'var(--text)', padding: '8px 12px', background: 'var(--bg-alt)', borderRadius: 8, border: '1px solid var(--border)' }}>{existingCert.apple_order_ref || '—'}</div>
            </div>
          </div>

          <div>
            <div style={labelS}>Chain of custody</div>
            {pubCoc.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
                {pubCoc.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderTop: i ? '1px solid var(--border)' : 'none', background: 'var(--bg)' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{e.step}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {e.actor}{e.ts && ` · ${new Date(e.ts).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No chain of custody recorded.</div>}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href={`/verify/${order.id}`}
              target="_blank" rel="noreferrer"
              style={{ ...primaryBtn, textDecoration: 'none', flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15,3 21,3 21,9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Open public certificate
            </a>
            <button onClick={onClose} style={{ ...actionBtn, flex: 1, justifyContent: 'center' }}>Close</button>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Create / Edit draft ────────────────────────────────────────────────────
  const title = isDraft ? 'Edit draft certificate' : 'Publish certificate';
  return (
    <Modal title={title} onClose={onClose} width={540}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '75vh', overflowY: 'auto', paddingRight: 2 }}>
        <div style={{ padding: '12px 16px', background: 'var(--bg-alt)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Order</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{order.id} — {order.customer}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.product}</div>
        </div>

        <div>
          <label style={labelS}>Serial number {!asDraft && '*'}</label>
          <input
            value={serial}
            onChange={e => setSerial(e.target.value)}
            placeholder="e.g. F2LWQ1JKXXX"
            style={{ ...inputS, width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-mono,monospace)', letterSpacing: '0.04em' }}
          />
        </div>

        <div>
          <label style={labelS}>Apple order reference {!asDraft && '*'}</label>
          <input
            value={appleRef}
            onChange={e => setAppleRef(e.target.value)}
            placeholder="e.g. W12345678"
            style={{ ...inputS, width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ ...labelS, marginBottom: 0 }}>Chain of custody {!asDraft && '*'}</label>
            <button
              onClick={addStep}
              style={{ ...miniBtn, color: 'var(--accent)', borderColor: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add step
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {coc.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: isMobile ? 'flex-start' : 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-alt)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, marginTop: isMobile ? 10 : 0 }}>{i + 1}</div>
                <input
                  value={entry.step}
                  onChange={e => setStep(i, 'step', e.target.value)}
                  placeholder={i === 0 ? 'e.g. Purchased from Apple US' : i === 1 ? 'e.g. Shipped to Certo Nigeria' : 'e.g. Quality checked and packaged'}
                  style={{ ...inputS, flex: isMobile ? '1 1 100%' : 2, minWidth: 0 }}
                />
                <input
                  value={entry.actor}
                  onChange={e => setStep(i, 'actor', e.target.value)}
                  placeholder="Actor"
                  style={{ ...inputS, flex: isMobile ? '1 1 calc(100% - 30px)' : 1, minWidth: 0 }}
                />
                {coc.length > 1 && (
                  <button
                    onClick={() => removeStep(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 6px', borderRadius: 6, flexShrink: 0, fontSize: 14, lineHeight: 1, marginTop: isMobile ? 2 : 0 }}
                    title="Remove step"
                  >✕</button>
                )}
              </div>
            ))}
          </div>
          {!asDraft && (
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8 }}>
              Timestamps are recorded automatically on publish.
            </div>
          )}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
          <input
            type="checkbox"
            checked={asDraft}
            onChange={e => setAsDraft(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Save as draft only</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              Fill in the details later — chain of custody won't be recorded until you publish
            </div>
          </div>
        </label>

        {err && (
          <div style={{ fontSize: 12.5, color: 'oklch(50% 0.18 25)', padding: '10px 14px', background: 'oklch(97% 0.03 25)', borderRadius: 9, border: '1px solid oklch(85% 0.1 25)' }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={submit} disabled={busy} style={{ ...primaryBtn, flex: 1, opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Saving…' : asDraft ? 'Save draft' : `✓ ${isDraft ? 'Publish draft' : 'Publish certificate'}`}
          </button>
          <button onClick={onClose} style={{ ...actionBtn, flex: 1, justifyContent: 'center' }}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
