import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { authFetch, getName } from '../lib/auth.js';
import { useIsMobile } from '../lib/useIsMobile.js';
import { mapOrder, mapProduct, mapCert, mapMessage, mapCoupon, mapLog, buildRevenueSeries } from '../lib/mappers.js';
import { fmtN, fmtU } from '../lib/format.js';
import { inputS, thS, tdS, primaryBtn, actionBtn, miniBtn, linkBtn } from '../lib/styles.js';
import { Icon } from '../components/Icon.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { Empty } from '../components/Empty.jsx';
import { Panel } from '../components/Panel.jsx';
import { Segmented } from '../components/Segmented.jsx';
import { Modal } from '../components/Modal.jsx';
import { AreaChart } from '../components/AreaChart.jsx';
import { DonutChart } from '../components/DonutChart.jsx';
import { BarList } from '../components/BarList.jsx';
import { ProductCreateModal } from '../modals/ProductCreateModal.jsx';
import { ProductEditModal }   from '../modals/ProductEditModal.jsx';

export function CondBadge({ condition }) {
  const s = condition==='Refurb'||condition==='refurb'
    ? { bg:'oklch(94% 0.06 250)', fg:'oklch(40% 0.15 250)', label:'Refurb' }
    : { bg:'oklch(93% 0.06 155)', fg:'oklch(35% 0.15 155)', label:'New' };
  return <span style={{ padding:'3px 9px', borderRadius:6, background:s.bg, color:s.fg, fontSize:11, fontWeight:700 }}>{s.label}</span>;
}

export function ProductsTab({ isMobile, products, onProductUpdate }) {
  const [q,            setQ]           = useState('');
  const [editId,       setEditId]      = useState(null);
  const [showCreate,   setShowCreate]  = useState(false);
  const [deleteTarget, setDeleteTarget]= useState(null);
  const [deleting,     setDeleting]    = useState(false);
  const [localProds,   setLocalProds]  = useState(products);
  const [savingOrder,  setSavingOrder] = useState(false);
  const [dragIdx,      setDragIdx]     = useState(null);
  const [dragOverIdx,  setDragOverIdx] = useState(null);

  useEffect(() => { setLocalProds(products); }, [products]);

  const filtered = localProds.filter(p => !q.trim() || (p.name+p.subtitle+p.type).toLowerCase().includes(q.toLowerCase()));
  const STATUS_MAP = {
    live:        { label:'Live',         bg:'oklch(93% 0.06 155)', fg:'oklch(35% 0.15 155)' },
    out_of_stock:{ label:'Out of stock', bg:'oklch(94% 0.02 0)',   fg:'oklch(48% 0.05 0)'   },
    coming_soon: { label:'Coming soon',  bg:'oklch(95% 0.07 70)',  fg:'oklch(45% 0.16 55)'  },
    hidden:      { label:'Hidden',       bg:'oklch(94% 0.02 0)',   fg:'oklch(48% 0.05 0)'   },
  };

  const handleEditDone = (raw) => {
    const mapped = mapProduct(raw);
    setLocalProds(prev => prev.map(p => p.id===mapped.id ? mapped : p));
    onProductUpdate && onProductUpdate(mapped);
  };

  const handleCreateDone = (raw) => {
    const mapped = mapProduct(raw);
    setLocalProds(prev => [mapped, ...prev]);
    onProductUpdate && onProductUpdate(mapped);
  };

  // ── Drag-to-reorder ──────────────────────────────────────────────────────────
  const onDragStart = (i) => setDragIdx(i);
  const onDragOver  = (e, i) => { e.preventDefault(); setDragOverIdx(i); };
  const onDrop = (i) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...localProds];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setLocalProds(next);
    setDragIdx(null);
    setDragOverIdx(null);
    // Auto-save immediately after drop
    setSavingOrder(true);
    const payload = next.map((p, idx) => ({ id: p.id, sort_order: idx + 1 }));
    authFetch('/api/products/reorder', { method:'PATCH', body: JSON.stringify({ order: payload }) })
      .catch(e => console.error('Reorder failed:', e))
      .finally(() => setSavingOrder(false));
  };
  const onDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await authFetch(`/api/products/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { setLocalProds(prev => prev.filter(x => x.id !== deleteTarget.id)); setDeleteTarget(null); }
    } catch(e) { console.error(e); }
    setDeleting(false);
  };

  return (
    <>
      {editId && <ProductEditModal productId={editId} onClose={() => setEditId(null)} onDone={handleEditDone}/>}
      {showCreate && <ProductCreateModal onClose={() => setShowCreate(false)} onDone={handleCreateDone}/>}
      {deleteTarget && (
        <Modal title="Delete product" onClose={() => setDeleteTarget(null)} width={380}>
          <p style={{ fontSize:14, color:'var(--text)', lineHeight:1.65, marginBottom:6 }}>
            Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
          </p>
          <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, marginBottom:24 }}>
            This cannot be undone. Any existing orders for this product will not be affected.
          </p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={confirmDelete} disabled={deleting} style={{ ...primaryBtn, background:'oklch(48% 0.2 25)', flex:1, opacity:deleting?0.7:1 }}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button onClick={() => setDeleteTarget(null)} style={{ ...actionBtn, flex:1, justifyContent:'center' }}>Cancel</button>
          </div>
        </Modal>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:'1 1 220px' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', display:'flex' }}><Icon name="search" size={15}/></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…" style={{ ...inputS, paddingLeft:34, width:'100%', boxSizing:'border-box' }}/>
          </div>
          <span style={{ fontSize:12.5, color:'var(--text-muted)' }}>{filtered.length} of {localProds.length}</span>
          {savingOrder && <span style={{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic' }}>Saving…</span>}
          <button onClick={() => setShowCreate(true)} style={{ ...primaryBtn, display:'flex', alignItems:'center', gap:7 }}><Icon name="plus" size={16} c="white"/> Add product</button>
        </div>

        {isMobile ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map((p, i) => {
              const st = STATUS_MAP[p.listingStatus]||STATUS_MAP.live;
              const isDragOver = dragOverIdx === i;
              return (
                <div key={p.id}
                  draggable={!q.trim()}
                  onDragStart={() => onDragStart(i)}
                  onDragOver={e => onDragOver(e, i)}
                  onDrop={() => onDrop(i)}
                  onDragEnd={onDragEnd}
                  style={{ opacity: dragIdx===i ? 0.4 : 1, borderTop: isDragOver ? '2px solid var(--accent)' : '2px solid transparent', transition:'border-color 0.15s' }}
                >
                  <Panel pad={16}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
                      {!q.trim() && <div title="Drag to reorder" style={{ cursor:'grab', color:'var(--text-muted)', fontSize:16, alignSelf:'center', flexShrink:0 }}>⠿</div>}
                      <div style={{ minWidth:0, flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, color:'var(--text)' }}>{p.name}{p.featured&&<span style={{ color:'var(--accent)', marginLeft:4 }}>★</span>}</div>
                          {p.code && <span style={{ fontFamily:'var(--font-mono,monospace)', fontWeight:700, fontSize:11, color:'var(--accent)', background:'var(--accent-tint)', padding:'2px 7px', borderRadius:6, letterSpacing:'0.05em', flexShrink:0 }}>#{p.code}</span>}
                        </div>
                        <div style={{ fontSize:12.5, color:'var(--text-muted)', marginBottom:8 }}>{p.subtitle}</div>
                        <span style={{ padding:'3px 9px', borderRadius:6, background:st.bg, color:st.fg, fontSize:11, fontWeight:700 }}>{st.label}</span>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontFamily:'var(--font-num)', fontWeight:800, fontSize:16, color:'var(--text)' }}>{fmtU(p.usdPrice)}</div>
                        <div style={{ fontSize:12, color:p.stock===0?'oklch(55% 0.18 25)':'var(--text-muted)', marginTop:4 }}>{p.stock} in stock</div>
                        <div style={{ display:'flex', gap:6, marginTop:8, justifyContent:'flex-end' }}>
                          {p.listingStatus==='live' && <a href={`/shop/${p.id}`} target="_blank" rel="noreferrer" style={{ ...miniBtn, textDecoration:'none' }}>View ↗</a>}
                          <button onClick={() => setEditId(p.id)} style={miniBtn}>Edit</button>
                          <button onClick={() => setDeleteTarget(p)} style={{ ...miniBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(88% 0.08 25)' }}>Delete</button>
                        </div>
                      </div>
                    </div>
                  </Panel>
                </div>
              );
            })}
          </div>
        ) : (
          <Panel pad={0}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:720 }}>
                <thead><tr style={{ background:'var(--bg-alt)' }}>{[!q.trim()?'⠿':'','Product','Type','Condition','USD','Stock','Status',''].map((h,i)=><th key={i} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const st = STATUS_MAP[p.listingStatus]||STATUS_MAP.live;
                    const isDragOver = dragOverIdx === i;
                    return (
                      <tr key={p.id}
                        draggable={!q.trim()}
                        onDragStart={() => onDragStart(i)}
                        onDragOver={e => onDragOver(e, i)}
                        onDrop={() => onDrop(i)}
                        onDragEnd={onDragEnd}
                        style={{ borderTop: isDragOver ? '2px solid var(--accent)' : '1px solid var(--border)', opacity: dragIdx===i ? 0.4 : 1, cursor: q.trim() ? 'default' : 'grab' }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--bg-alt)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={{ ...tdS, color:'var(--text-muted)', fontSize:18, width:32, textAlign:'center' }}>{!q.trim() ? '⠿' : ''}</td>
                        <td style={tdS}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ fontWeight:700, color:'var(--text)' }}>{p.name}{p.featured&&<span title="Featured" style={{ color:'var(--accent)' }}>★</span>}</div>
                            {p.code && <span style={{ fontFamily:'var(--font-mono,monospace)', fontWeight:700, fontSize:11, color:'var(--accent)', background:'var(--accent-tint)', padding:'2px 7px', borderRadius:6, letterSpacing:'0.05em', flexShrink:0 }}>#{p.code}</span>}
                          </div>
                          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{p.subtitle}</div>
                        </td>
                        <td style={{ ...tdS, color:'var(--text-muted)', fontSize:12.5 }}>{p.type}</td>
                        <td style={tdS}><CondBadge condition={p.condition}/></td>
                        <td style={{ ...tdS, fontSize:13 }}>{fmtU(p.usdPrice)}</td>
                        <td style={{ ...tdS, color:p.stock===0?'oklch(55% 0.18 25)':'var(--text)', fontWeight:600 }}>{p.stock}</td>
                        <td style={tdS}><span style={{ padding:'3px 9px', borderRadius:6, background:st.bg, color:st.fg, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>{st.label}</span></td>
                        <td style={{ ...tdS, whiteSpace:'nowrap' }}>
                          <div style={{ display:'flex', gap:6 }}>
                            {p.listingStatus==='live' && <a href={`/shop/${p.id}`} target="_blank" rel="noreferrer" style={{ ...miniBtn, textDecoration:'none' }}>View ↗</a>}
                            <button onClick={() => setEditId(p.id)} style={miniBtn}>Edit</button>
                            <button onClick={() => setDeleteTarget(p)} style={{ ...miniBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(88% 0.08 25)' }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!filtered.length&&<Empty label="No products found"/>}
          </Panel>
        )}
      </div>
    </>
  );
}
