import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '../lib/auth.js';
import { inputS, thS, tdS, primaryBtn, actionBtn, miniBtn } from '../lib/styles.js';
import { Icon } from '../components/Icon.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { Panel } from '../components/Panel.jsx';
import { Empty } from '../components/Empty.jsx';
import { Segmented } from '../components/Segmented.jsx';

const fmtNgn = (n) => '₦' + Number(n || 0).toLocaleString('en-NG');
const fmtTime = (iso) => iso
  ? new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—';

// ─── Receiving account card ──────────────────────────────────────────────────
//
// The Certo business Kuda account. Displayed at the top of Bank Alerts so any
// admin can quickly copy and forward to a customer who wants to pay by
// transfer. Each field has its own copy button + a "Copy all" that produces
// a customer-ready message.
//
// If the account ever changes, edit the three constants below — they're not
// in env vars because the account number itself is non-sensitive (you'd give
// it to anyone who asks).
const RECEIVING_ACCOUNT = {
  number: '3003792624',
  name:   'CERTO TECHNOLOGIES',
  bank:   'KUDA BANK',
};

function ReceivingAccountCard({ isMobile }) {
  const [copied, setCopied] = React.useState(''); // 'number' | 'name' | 'bank' | 'all' | ''

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(c => (c === key ? '' : c)), 1500);
    } catch (_) { /* clipboard may be blocked; user can fall back to manual select */ }
  };

  const allText =
    `Bank: ${RECEIVING_ACCOUNT.bank}\n` +
    `Account number: ${RECEIVING_ACCOUNT.number}\n` +
    `Account name: ${RECEIVING_ACCOUNT.name}`;

  const Row = ({ label, value, copyKey, mono = false }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, padding: '10px 0', borderTop: '1px solid var(--border)',
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3,
        }}>{label}</div>
        <div style={{
          fontFamily: mono ? 'var(--font-mono,monospace)' : 'var(--font-body)',
          fontWeight: mono ? 700 : 600,
          fontSize: mono ? 17 : 14.5,
          color: 'var(--text)',
          letterSpacing: mono ? '0.04em' : 'normal',
          wordBreak: 'break-all',
        }}>{value}</div>
      </div>
      <button
        onClick={() => copy(value, copyKey)}
        style={{
          background: copied === copyKey ? 'oklch(93% 0.06 155)' : 'var(--bg)',
          color: copied === copyKey ? 'oklch(35% 0.15 155)' : 'var(--text)',
          border: `1px solid ${copied === copyKey ? 'oklch(72% 0.12 155)' : 'var(--border)'}`,
          borderRadius: 8, padding: '6px 12px',
          cursor: 'pointer', fontWeight: 600, fontSize: 12,
          whiteSpace: 'nowrap', flexShrink: 0,
          transition: 'background 0.15s, color 0.15s, border 0.15s',
        }}
      >
        {copied === copyKey ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: isMobile ? '16px 18px' : '20px 24px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginBottom: 8, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            fontSize: 10.5, fontWeight: 700, color: 'var(--accent)',
            textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4,
          }}>Receiving Account</div>
          <div style={{
            fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 16,
            color: 'var(--text)', letterSpacing: '-0.01em',
          }}>For naira bank transfers</div>
        </div>
        <button
          onClick={() => copy(allText, 'all')}
          style={{
            background: copied === 'all' ? 'oklch(93% 0.06 155)' : 'var(--accent)',
            color:      copied === 'all' ? 'oklch(35% 0.15 155)' : 'white',
            border: 'none', borderRadius: 10,
            padding: '10px 16px', cursor: 'pointer',
            fontWeight: 700, fontSize: 12.5,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {copied === 'all' ? '✓ Copied all' : '📋 Copy all (send to customer)'}
        </button>
      </div>
      <Row label="Bank"           value={RECEIVING_ACCOUNT.bank}   copyKey="bank"/>
      <Row label="Account number" value={RECEIVING_ACCOUNT.number} copyKey="number" mono/>
      <Row label="Account name"   value={RECEIVING_ACCOUNT.name}   copyKey="name"/>
    </div>
  );
}

// ─── BankAlertsTab ───────────────────────────────────────────────────────────
//
// Live view of incoming payments to the Kuda business account. Workflow:
//   1. Employee opens this tab → sees the latest synced alerts.
//   2. Click "Sync now" to pull fresh data from Kuda (last 24 hours).
//   3. When a customer says "I sent ₦X via bank transfer", search for the
//      amount → if it shows up, payment is real.
//   4. Optionally tag the alert with the order id so the next admin can see
//      it's been matched.
// ─────────────────────────────────────────────────────────────────────────────

export function BankAlertsTab({ isMobile }) {
  const [alerts,      setAlerts]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [syncing,     setSyncing]     = useState(false);
  const [filter,      setFilter]      = useState('all');     // all | matched | unmatched
  const [search,      setSearch]      = useState('');
  const [error,       setError]       = useState('');
  const [lastSync,    setLastSync]    = useState(null);
  const [syncWindow,  setSyncWindow]  = useState(24);        // hours
  const [matchOpen,   setMatchOpen]   = useState(null);      // alert id being edited
  const [matchInput,  setMatchInput]  = useState('');
  const [notesInput,  setNotesInput]  = useState('');
  const [diagnostic,  setDiagnostic]  = useState(null);      // result of /diagnostic call

  const load = useCallback(async () => {
    setError('');
    try {
      const params = new URLSearchParams({ matched: filter, limit: '200' });
      if (search.trim()) params.set('search', search.trim());
      const res = await authFetch(`/api/admin/bank-alerts?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load alerts');
      setAlerts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  const sync = async () => {
    setSyncing(true);
    setError('');
    try {
      const res = await authFetch('/api/admin/bank-alerts/sync', {
        method: 'POST',
        body: JSON.stringify({ hours: syncWindow }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Server-side 502 → include the hint (Kuda env vars missing etc.)
        throw new Error(data.message || data.error || 'Sync failed');
      }
      setLastSync({
        at: new Date(),
        inserted: data.inserted,
        skipped: data.skipped,
        windowHours: data.windowHours,
      });
      await load();
    } catch (e) {
      setError('Sync failed: ' + e.message);
    }
    setSyncing(false);
  };

  const saveMatch = async (alertId) => {
    try {
      const res = await authFetch(`/api/admin/bank-alerts/${alertId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          matched_order_id: matchInput.trim() || null,
          notes:            notesInput,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Save failed');
      }
      setMatchOpen(null);
      setMatchInput('');
      setNotesInput('');
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const openMatchEditor = (alert) => {
    setMatchOpen(alert.id);
    setMatchInput(alert.matched_order_id || '');
    setNotesInput(alert.notes || '');
  };

  // Run the server-side diagnostic — shows which of (env vars / Kuda login)
  // is failing so the admin can fix the root cause without reading server logs.
  const runDiagnostic = async () => {
    setError('');
    setDiagnostic({ loading: true });
    try {
      const res  = await authFetch('/api/admin/bank-alerts/diagnostic');
      const data = await res.json();
      setDiagnostic(data);
    } catch (e) {
      setDiagnostic({ error: e.message });
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalCount = alerts.length;
  const totalNgn   = alerts.reduce((s, a) => s + Number(a.amount_ngn || 0), 0);
  const matchedN   = alerts.filter(a => a.matched_order_id).length;
  const unmatchedN = totalCount - matchedN;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Receiving account — copy-friendly card for admins to forward to customers */}
      <ReceivingAccountCard isMobile={isMobile} />

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 14 }}>
        <StatCard label="Alerts shown"  value={totalCount}              icon={<Icon name="mail" size={16}/>}/>
        <StatCard label="Total received" value={fmtNgn(totalNgn)}
                  accent="oklch(45% 0.15 155)"  icon={<Icon name="coins" size={16}/>}/>
        <StatCard label="Matched"       value={matchedN}   accent="oklch(45% 0.15 155)"  icon={<Icon name="cert" size={16}/>}/>
        <StatCard label="Unmatched"     value={unmatchedN} accent={unmatchedN ? 'oklch(48% 0.18 55)' : 'var(--text-muted)'}
                  icon={<Icon name="ticket" size={16}/>}/>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 11, background: 'oklch(97% 0.03 25)',
          border: '1px solid oklch(85% 0.1 25)', color: 'oklch(50% 0.18 25)', fontSize: 13.5,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <span>⚠ {error}</span>
          <button onClick={runDiagnostic} style={{
            background: 'oklch(50% 0.18 25)', color: 'white', border: 'none',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
          }}>Run diagnostic</button>
        </div>
      )}

      {/* Diagnostic result panel — shows EXACTLY what is set / what failed */}
      {diagnostic && !diagnostic.loading && (
        <div style={{
          padding: '14px 18px', borderRadius: 11,
          background: 'var(--bg-alt)', border: '1px solid var(--border)',
          fontSize: 13, fontFamily: 'var(--font-mono,monospace)', lineHeight: 1.7,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontFamily: 'var(--font-body)', color: 'var(--text)' }}>Kuda Diagnostic</strong>
            <button onClick={() => setDiagnostic(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: 0,
            }}>✕</button>
          </div>
          {diagnostic.error ? (
            <div style={{ color: 'oklch(50% 0.18 25)' }}>diagnostic failed: {diagnostic.error}</div>
          ) : (
            <>
              <div style={{ marginBottom: 4 }}>Env vars:</div>
              {diagnostic.env && Object.entries(diagnostic.env).map(([k, v]) => (
                <div key={k} style={{ paddingLeft: 12, color: String(v).startsWith('set') ? 'oklch(40% 0.16 145)' : 'oklch(50% 0.18 25)' }}>
                  {k}: {v}
                </div>
              ))}
              {diagnostic.login !== null && (
                <div style={{ marginTop: 8, paddingLeft: 0, color: String(diagnostic.login).startsWith('ok') ? 'oklch(40% 0.16 145)' : 'oklch(50% 0.18 25)' }}>
                  Login: {diagnostic.login}
                </div>
              )}
              {diagnostic.trackingRef !== undefined && diagnostic.trackingRef !== null && (
                <div style={{ marginTop: 4, paddingLeft: 0, color: String(diagnostic.trackingRef).startsWith('ok') ? 'oklch(40% 0.16 145)' : 'oklch(50% 0.18 25)', wordBreak: 'break-all' }}>
                  Tracking ref: {diagnostic.trackingRef}
                </div>
              )}
              {diagnostic.nextStep && (
                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
                  → {diagnostic.nextStep}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Last sync status */}
      {lastSync && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, background: 'var(--bg-alt)',
          border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12.5,
        }}>
          Last sync at {lastSync.at.toLocaleTimeString('en-NG')} — pulled {lastSync.windowHours}h of history,
          inserted <strong>{lastSync.inserted}</strong> new alert{lastSync.inserted === 1 ? '' : 's'}
          {lastSync.skipped ? `, ${lastSync.skipped} already seen.` : '.'}
        </div>
      )}

      {/* Toolbar */}
      <Panel pad={0}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 10, padding: '14px 18px',
          borderBottom: '1px solid var(--border)', alignItems: 'center',
        }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <Icon name="search" size={15}/>
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sender, narration, reference…"
              style={{ ...inputS, paddingLeft: 33, width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <Segmented value={filter} onChange={setFilter} options={[
            { key: 'all',       label: 'All' },
            { key: 'unmatched', label: 'Unmatched' },
            { key: 'matched',   label: 'Matched' },
          ]}/>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
            <span>Window:</span>
            <select
              value={syncWindow}
              onChange={e => setSyncWindow(Number(e.target.value))}
              style={{ ...inputS, padding: '6px 10px', cursor: 'pointer' }}
            >
              <option value={1}>1h</option>
              <option value={6}>6h</option>
              <option value={24}>24h</option>
              <option value={72}>3d</option>
              <option value={168}>7d</option>
            </select>
          </div>

          <button
            onClick={sync}
            disabled={syncing}
            style={{ ...primaryBtn, display: 'flex', alignItems: 'center', gap: 6, opacity: syncing ? 0.7 : 1 }}
          >
            <Icon name="refresh" size={14} c="white"/>
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>

        {/* Table / list */}
        {loading ? (
          <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : !alerts.length ? (
          <Empty label="No bank alerts in this window. Hit Sync to pull the latest from Kuda."/>
        ) : isMobile ? (
          <div>
            {alerts.map((a, i) => (
              <div key={a.id} style={{ padding: '14px 18px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-num)', fontWeight: 800, fontSize: 16, color: 'oklch(40% 0.16 145)' }}>
                    +{fmtNgn(a.amount_ngn)}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtTime(a.transaction_at)}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.sender_name || '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{a.narration || '—'}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {a.matched_order_id ? (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'oklch(93% 0.06 155)', color: 'oklch(35% 0.15 155)' }}>
                      ✓ {a.matched_order_id}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'var(--bg-alt)', color: 'var(--text-muted)' }}>
                      Unmatched
                    </span>
                  )}
                  <button onClick={() => openMatchEditor(a)} style={miniBtn}>
                    {a.matched_order_id ? 'Edit match' : 'Tag order'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
              <thead>
                <tr style={{ background: 'var(--bg-alt)' }}>
                  {['Received', 'Amount', 'Sender', 'Bank', 'Narration', 'Reference', 'Match', ''].map(h => (
                    <th key={h} style={thS}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{fmtTime(a.transaction_at)}</td>
                    <td style={{ ...tdS, fontFamily: 'var(--font-num)', fontWeight: 800, color: 'oklch(40% 0.16 145)', whiteSpace: 'nowrap' }}>
                      +{fmtNgn(a.amount_ngn)}
                    </td>
                    <td style={{ ...tdS, fontWeight: 600 }}>{a.sender_name || '—'}</td>
                    <td style={{ ...tdS, color: 'var(--text-muted)' }}>{a.sender_bank || '—'}</td>
                    <td style={{ ...tdS, color: 'var(--text-muted)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={a.narration}>
                      {a.narration || '—'}
                    </td>
                    <td style={{ ...tdS, fontFamily: 'var(--font-mono,monospace)', fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {a.transaction_ref?.slice(0, 14) || '—'}
                    </td>
                    <td style={tdS}>
                      {a.matched_order_id ? (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: 'oklch(93% 0.06 155)', color: 'oklch(35% 0.15 155)', whiteSpace: 'nowrap' }}>
                          ✓ {a.matched_order_id}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: 'var(--bg-alt)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          Unmatched
                        </span>
                      )}
                    </td>
                    <td style={tdS}>
                      <button onClick={() => openMatchEditor(a)} style={miniBtn}>
                        {a.matched_order_id ? 'Edit' : 'Tag'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Inline match editor (simple inline drawer, not a full modal) */}
      {matchOpen !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(26,23,20,0.45)',
          backdropFilter: 'blur(4px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => setMatchOpen(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg)', borderRadius: 16, border: '1px solid var(--border)',
            width: '100%', maxWidth: 440, padding: 24,
            boxShadow: '0 24px 80px rgba(26,23,20,0.22)',
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--text)' }}>
              Tag this alert
            </h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
              Link the bank alert to a Certo order so the rest of the team knows the payment was acknowledged.
            </div>

            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              Order ID
            </label>
            <input
              value={matchInput}
              onChange={e => setMatchInput(e.target.value)}
              placeholder="e.g. CRT-060826-1234 (leave empty to clear match)"
              style={{ ...inputS, width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-mono,monospace)' }}
            />

            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginTop: 14, marginBottom: 6 }}>
              Notes (optional)
            </label>
            <textarea
              value={notesInput}
              onChange={e => setNotesInput(e.target.value)}
              rows={3}
              placeholder="e.g. Customer also paid for AppleCare separately"
              style={{ ...inputS, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'var(--font-body)' }}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => saveMatch(matchOpen)} style={{ ...primaryBtn, flex: 1 }}>Save</button>
              <button onClick={() => setMatchOpen(null)} style={{ ...actionBtn, flex: 1, justifyContent: 'center' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
