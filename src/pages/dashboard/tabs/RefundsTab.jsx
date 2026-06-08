import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { authFetch } from '../lib/auth.js';
import { fmtN, fmtU } from '../lib/format.js';
import { REFUND_STATUSES, REFUND_METHODS, NG_BANKS } from '../lib/constants.js';
import { inputS, thS, tdS, primaryBtn, actionBtn, miniBtn } from '../lib/styles.js';
import { Icon } from '../components/Icon.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { Panel } from '../components/Panel.jsx';
import { Empty } from '../components/Empty.jsx';
import { Segmented } from '../components/Segmented.jsx';
import { Modal } from '../components/Modal.jsx';

function refundStatusStyle(s) {
  return {
    pending:    { color:'oklch(48% 0.12 60)',  background:'oklch(96% 0.06 60)',  border:'1px solid oklch(82% 0.1 60)'  },
    processing: { color:'oklch(38% 0.14 240)', background:'oklch(96% 0.05 240)', border:'1px solid oklch(82% 0.1 240)' },
    completed:  { color:'oklch(38% 0.14 155)', background:'oklch(95% 0.06 155)', border:'1px solid oklch(80% 0.1 155)' },
    rejected:   { color:'oklch(50% 0.18 25)',  background:'oklch(97% 0.03 25)',  border:'1px solid oklch(85% 0.1 25)'  },
  }[s] || { color:'var(--text-muted)', background:'var(--bg-alt)', border:'1px solid var(--border)' };
}

function RefundEditor({ refund, orders, onSave, onCancel, saving, serverError, isMobile }) {
  const isNew = !refund;
  const [form, setForm] = useState({
    order_id:       refund?.order_id       || '',
    customer_name:  refund?.customer_name  || '',
    customer_email: refund?.customer_email || '',
    customer_phone: refund?.customer_phone || '',
    product_name:   refund?.product_name   || '',
    amount_ngn:     refund?.amount_ngn     || '',
    amount_usd:     refund?.amount_usd     || '',
    reason:         refund?.reason         || '',
    status:         refund?.status         || 'pending',
    payment_method: refund?.payment_method || 'Bank Transfer',
    bank_name:      refund?.bank_name      || '',
    account_number: refund?.account_number || '',
    account_name:   refund?.account_name   || '',
    notes:          refund?.notes          || '',
  });
  const [lookupMsg, setLookupMsg] = useState('');
  const [bankCode, setBankCode] = useState(
    () => NG_BANKS.find(b => b.name === refund?.bank_name)?.code || ''
  );
  const [acctLookup, setAcctLookup] = useState('idle'); // idle | loading | found | error
  const [acctLookupMsg, setAcctLookupMsg] = useState('');
  const didMount = React.useRef(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    const digits = form.account_number.replace(/\D/g, '');
    if (digits.length !== 10 || !bankCode) return;
    setAcctLookup('loading');
    setAcctLookupMsg('');
    set('account_name', '');
    let cancelled = false;
    const timer = setTimeout(() => {
      authFetch(`/api/refunds/resolve-account?account_number=${encodeURIComponent(digits)}&bank_code=${encodeURIComponent(bankCode)}`)
        .then(r => r.json())
        .then(data => {
          if (cancelled) return;
          if (data.account_name) {
            set('account_name', data.account_name);
            setAcctLookup('found');
          } else {
            setAcctLookup('error');
            setAcctLookupMsg(data.error || 'Could not verify — enter name manually.');
          }
        })
        .catch(() => {
          if (!cancelled) { setAcctLookup('error'); setAcctLookupMsg('Could not verify — enter name manually.'); }
        });
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [form.account_number, bankCode]);

  const lookupOrder = () => {
    const id = form.order_id.trim();
    if (!id) return;
    const order = orders.find(o => o.id === id || o.id?.toLowerCase() === id.toLowerCase());
    if (!order) { setLookupMsg('Order not found in current session.'); return; }
    setForm(f => ({
      ...f,
      customer_name:  order.customer  || f.customer_name,
      customer_email: order.email     || f.customer_email,
      customer_phone: order.phone     || f.customer_phone,
      product_name:   order.product   || f.product_name,
      amount_ngn:     order.ngn       || f.amount_ngn,
      amount_usd:     order.usd       || f.amount_usd,
    }));
    setLookupMsg('✓ Order found — fields pre-filled.');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, amount_ngn: Number(form.amount_ngn)||0, amount_usd: Number(form.amount_usd)||0 }, isNew);
  };

  const lS = { fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 };

  return (
    <Panel title={isNew ? 'New Refund' : `Edit Refund #${refund.id}`} action={
      <button onClick={onCancel} style={miniBtn}>← Back to list</button>
    }>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
        {serverError && <div style={{ padding:'10px 16px', background:'oklch(97% 0.03 25)', border:'1px solid oklch(85% 0.1 25)', borderRadius:10, color:'oklch(50% 0.18 25)', fontSize:13 }}>{serverError}</div>}

        {/* Order lookup */}
        <div>
          <label style={lS}>Order ID <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional — auto-fills customer details)</span></label>
          <div style={{ display:'flex', gap:8 }}>
            <input value={form.order_id} onChange={e=>{set('order_id',e.target.value); setLookupMsg('');}} style={{...inputS,flex:1}} placeholder="e.g. CRT-010224-1234"/>
            <button type="button" onClick={lookupOrder} style={{...miniBtn, padding:'8px 14px', whiteSpace:'nowrap'}}>Lookup Order</button>
          </div>
          {lookupMsg && <div style={{ fontSize:12, color: lookupMsg.startsWith('✓') ? 'oklch(40% 0.14 155)' : 'var(--accent)', marginTop:5 }}>{lookupMsg}</div>}
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>For deleted orders, leave blank and fill in details manually.</div>
        </div>

        {/* Customer */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:14 }}>
          <div>
            <label style={lS}>Customer Name *</label>
            <input value={form.customer_name} onChange={e=>set('customer_name',e.target.value)} required style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="Full name"/>
          </div>
          <div>
            <label style={lS}>Phone</label>
            <input value={form.customer_phone} onChange={e=>set('customer_phone',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="+234…"/>
          </div>
          <div>
            <label style={lS}>Email</label>
            <input type="email" value={form.customer_email} onChange={e=>set('customer_email',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}}/>
          </div>
          <div>
            <label style={lS}>Product</label>
            <input value={form.product_name} onChange={e=>set('product_name',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="iPhone 16 Pro 256GB"/>
          </div>
        </div>

        {/* Amounts + status */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:14 }}>
          <div>
            <label style={lS}>Amount (₦)</label>
            <input type="number" min="0" value={form.amount_ngn} onChange={e=>set('amount_ngn',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="0"/>
          </div>
          <div>
            <label style={lS}>Amount ($)</label>
            <input type="number" min="0" value={form.amount_usd} onChange={e=>set('amount_usd',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="0"/>
          </div>
          <div>
            <label style={lS}>Status</label>
            <select value={form.status} onChange={e=>set('status',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}}>
              {REFUND_STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lS}>Payment Method</label>
            <select value={form.payment_method} onChange={e=>set('payment_method',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}}>
              {REFUND_METHODS.map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Bank details */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr', gap:14 }}>
          <div>
            <label style={lS}>Bank Name</label>
            <select
              value={bankCode}
              onChange={e => {
                const b = NG_BANKS.find(b => b.code === e.target.value);
                setBankCode(e.target.value);
                set('bank_name', b?.name || '');
                setAcctLookup('idle');
                setAcctLookupMsg('');
              }}
              style={{...inputS,width:'100%',boxSizing:'border-box'}}
            >
              <option value="">-- Select bank --</option>
              {NG_BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lS}>Account Number</label>
            <input
              value={form.account_number}
              onChange={e => { set('account_number', e.target.value); setAcctLookup('idle'); setAcctLookupMsg(''); }}
              style={{...inputS,width:'100%',boxSizing:'border-box'}}
              placeholder="0123456789"
              maxLength={10}
            />
          </div>
          <div>
            <label style={lS}>
              Account Name
              {acctLookup === 'loading' && <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, color:'var(--text-muted)', marginLeft:6 }}>Verifying…</span>}
              {acctLookup === 'found'   && <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, color:'oklch(40% 0.14 155)', marginLeft:6 }}>✓ Verified</span>}
            </label>
            <input
              value={form.account_name}
              onChange={e => { set('account_name', e.target.value); setAcctLookup('idle'); }}
              style={{...inputS,width:'100%',boxSizing:'border-box', opacity: acctLookup==='loading' ? 0.5 : 1}}
              placeholder={acctLookup === 'loading' ? 'Verifying…' : 'Auto-filled or enter manually'}
              readOnly={acctLookup === 'loading'}
            />
          </div>
        </div>
        {acctLookupMsg && (
          <div style={{ fontSize:12, color:'oklch(50% 0.18 25)', marginTop:-10 }}>{acctLookupMsg}</div>
        )}

        {/* Reason + notes */}
        <div>
          <label style={lS}>Reason for Refund</label>
          <textarea value={form.reason} onChange={e=>set('reason',e.target.value)} rows={2} style={{...inputS,width:'100%',boxSizing:'border-box',resize:'vertical'}} placeholder="Customer returned item / wrong product ordered…"/>
        </div>
        <div>
          <label style={lS}>Internal Notes</label>
          <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={2} style={{...inputS,width:'100%',boxSizing:'border-box',resize:'vertical'}} placeholder="Admin-only notes…"/>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:8, borderTop:'1px solid var(--border)' }}>
          <button type="button" onClick={onCancel} style={actionBtn}>Cancel</button>
          <button type="submit" disabled={saving} style={{...primaryBtn, opacity:saving?0.7:1}}>
            {saving ? 'Saving…' : isNew ? 'Create Refund' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Panel>
  );
}

export function RefundsTab({ isMobile, orders }) {
  const [refunds,    setRefunds]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [editing,    setEditing]    = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [serverError,setServerError]= useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch('/api/refunds');
      const data = await res.json();
      setRefunds(Array.isArray(data) ? data : []);
    } catch { setServerError('Failed to load refunds'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (payload, isNew) => {
    setSaving(true); setServerError('');
    try {
      const res = await authFetch(
        isNew ? '/api/refunds' : `/api/refunds/${editing.id}`,
        { method: isNew ? 'POST' : 'PATCH', body: JSON.stringify(payload) },
      );
      if (!res.ok) {
        const err = await res.json();
        setServerError(err.error || 'Save failed');
        setSaving(false); return;
      }
      const saved = await res.json();
      if (isNew) setRefunds(prev => [saved, ...prev]);
      else       setRefunds(prev => prev.map(r => r.id===saved.id ? saved : r));
      setEditing(null);
    } catch { setServerError('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await authFetch(`/api/refunds/${id}`, { method:'DELETE' });
      setRefunds(prev => prev.filter(r => r.id !== id));
      setDelConfirm(null);
    } catch { setServerError('Delete failed'); }
  };

  if (editing !== null) {
    return <RefundEditor
      refund={editing === 'new' ? null : editing}
      orders={orders}
      onSave={handleSave} onCancel={() => { setEditing(null); setServerError(''); }}
      saving={saving} serverError={serverError} isMobile={isMobile}
    />;
  }

  const pending    = refunds.filter(r => r.status === 'pending').length;
  const completed  = refunds.filter(r => r.status === 'completed').length;
  const totalNgn   = refunds.filter(r => r.status !== 'rejected').reduce((s, r) => s + Number(r.amount_ngn||0), 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:14 }}>
        <StatCard label="Total Refunds"   value={refunds.length}                                 icon={<Icon name="undo"  size={16}/>}/>
        <StatCard label="Pending"         value={pending}   accent="oklch(48% 0.12 60)"          icon={<Icon name="pulse" size={16}/>}/>
        <StatCard label="Completed"       value={completed} accent="oklch(38% 0.14 155)"         icon={<Icon name="check" size={16}/>}/>
        <StatCard label="Total Refunded"  value={`₦${totalNgn.toLocaleString()}`} accent="oklch(50% 0.18 25)" icon={<Icon name="coins" size={16}/>}/>
      </div>

      {serverError && <div style={{ padding:'10px 16px', background:'oklch(97% 0.03 25)', border:'1px solid oklch(85% 0.1 25)', borderRadius:10, color:'oklch(50% 0.18 25)', fontSize:13 }}>{serverError}</div>}

      <Panel title={`All Refunds (${refunds.length})`} pad={0} action={
        <button onClick={() => { setServerError(''); setEditing('new'); }} style={primaryBtn}>
          <span style={{ display:'flex', alignItems:'center', gap:6 }}><Icon name="plus" size={14} c="white"/> New Refund</span>
        </button>
      }>
        {loading ? (
          <div style={{ padding:'32px 0', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Loading…</div>
        ) : refunds.length === 0 ? (
          <Empty label="No refunds recorded yet."/>
        ) : isMobile ? (
          <div style={{ display:'flex', flexDirection:'column' }}>
            {refunds.map((r, i) => (
              <div key={r.id} style={{ padding:'14px 16px', borderTop:i?'1px solid var(--border)':'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div style={{ flex:1, minWidth:0, marginRight:10 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>{r.customer_name}</div>
                    {r.customer_email && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{r.customer_email}</div>}
                  </div>
                  <span style={{ ...miniBtn, ...refundStatusStyle(r.status), fontWeight:700, cursor:'default', flexShrink:0 }}>{r.status}</span>
                </div>
                <div style={{ fontSize:12.5, color:'var(--text)', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {r.product_name || '—'}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>₦{Number(r.amount_ngn||0).toLocaleString()}</div>
                    {r.amount_usd > 0 && <div style={{ fontSize:11, color:'var(--text-muted)' }}>${Number(r.amount_usd||0).toLocaleString()}</div>}
                  </div>
                  {r.order_id && <div style={{ fontFamily:'var(--font-mono,monospace)', fontSize:11, color:'var(--text-muted)' }}>{r.order_id}</div>}
                </div>
                <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                  <button onClick={() => { setServerError(''); setEditing(r); }} style={miniBtn}>Edit</button>
                  {delConfirm===r.id ? (
                    <>
                      <button onClick={() => handleDelete(r.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(80% 0.12 25)'}}>Confirm</button>
                      <button onClick={() => setDelConfirm(null)} style={miniBtn}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setDelConfirm(r.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)'}}>Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:760 }}>
              <thead>
                <tr style={{ background:'var(--bg-alt)' }}>
                  <th style={thS}>Order ID</th>
                  <th style={thS}>Customer</th>
                  <th style={thS}>Product</th>
                  <th style={thS}>Amount</th>
                  <th style={thS}>Status</th>
                  <th style={thS}>Method</th>
                  <th style={thS}>Date</th>
                  <th style={{...thS, textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((r, i) => (
                  <tr key={r.id} style={{ borderTop:i?'1px solid var(--border)':'none' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg-alt)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{...tdS, fontFamily:'var(--font-mono,monospace)', fontSize:11.5, color:'var(--text-muted)'}}>
                      {r.order_id || <span style={{ color:'var(--border)' }}>—</span>}
                    </td>
                    <td style={tdS}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{r.customer_name}</div>
                      {r.customer_email && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.customer_email}</div>}
                    </td>
                    <td style={{...tdS, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12.5}}>
                      {r.product_name || '—'}
                    </td>
                    <td style={tdS}>
                      <div style={{ fontWeight:600, fontSize:13 }}>₦{Number(r.amount_ngn||0).toLocaleString()}</div>
                      {r.amount_usd > 0 && <div style={{ fontSize:11, color:'var(--text-muted)' }}>${Number(r.amount_usd||0).toLocaleString()}</div>}
                    </td>
                    <td style={tdS}>
                      <span style={{ ...miniBtn, ...refundStatusStyle(r.status), fontWeight:700, cursor:'default' }}>{r.status}</span>
                    </td>
                    <td style={{...tdS, fontSize:12, color:'var(--text-muted)'}}>{r.payment_method||'—'}</td>
                    <td style={{...tdS, fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap'}}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                    </td>
                    <td style={{...tdS, textAlign:'right'}}>
                      <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                        <button onClick={() => { setServerError(''); setEditing(r); }} style={miniBtn}>Edit</button>
                        {delConfirm===r.id ? (
                          <>
                            <button onClick={() => handleDelete(r.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(80% 0.12 25)'}}>Confirm</button>
                            <button onClick={() => setDelConfirm(null)} style={miniBtn}>Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => setDelConfirm(r.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)'}}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
