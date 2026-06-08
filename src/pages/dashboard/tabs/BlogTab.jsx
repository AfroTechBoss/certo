import React, { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../lib/auth.js';
import { BLOG_CATS, BLOG_REL, slugify } from '../lib/constants.js';
import { inputS, primaryBtn, actionBtn, miniBtn, thS, tdS } from '../lib/styles.js';
import { Icon } from '../components/Icon.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { Panel } from '../components/Panel.jsx';
import { Empty } from '../components/Empty.jsx';

function PostEditor({ post, onSave, onCancel, saving, serverError, isMobile }) {
  const isNew = !post;
  const [form, setForm] = useState({
    title:              post?.title || '',
    slug:               post?.slug  || '',
    excerpt:            post?.excerpt || '',
    category:           post?.category || 'Buying Guide',
    image_url:          post?.image_url || '',
    read_time:          post?.read_time || '5 min read',
    post_date:          post?.post_date || new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'}),
    featured:           post?.featured || false,
    published:          post?.published !== false,
    tags:               Array.isArray(post?.tags) ? post.tags.join(', ') : '',
    related_categories: Array.isArray(post?.related_categories) ? post.related_categories : [],
    sections:           Array.isArray(post?.sections) && post.sections.length
      ? post.sections.map(s => ({ heading: s.heading||'', body: Array.isArray(s.body) ? s.body.join('\n\n') : (s.body||'') }))
      : [{ heading:'', body:'' }],
  });
  const [slugManual, setSlugManual] = useState(!isNew);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onTitle = (v) => {
    set('title', v);
    if (!slugManual) set('slug', slugify(v));
  };

  const addSec    = () => set('sections', [...form.sections, { heading:'', body:'' }]);
  const removeSec = (i) => set('sections', form.sections.filter((_,j) => j!==i));
  const setSec    = (i, k, v) => set('sections', form.sections.map((s,j) => j===i ? {...s,[k]:v} : s));
  const toggleRel = (cat) => {
    const l = form.related_categories;
    set('related_categories', l.includes(cat) ? l.filter(c=>c!==cat) : [...l,cat]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const sections = form.sections
      .filter(s => s.heading.trim() || s.body.trim())
      .map(s => ({
        ...(s.heading.trim() ? { heading: s.heading.trim() } : {}),
        body: s.body.includes('\n\n')
          ? s.body.split('\n\n').map(p=>p.trim()).filter(Boolean)
          : s.body.trim(),
      }));
    onSave({
      title: form.title.trim(), slug: form.slug.trim(),
      excerpt: form.excerpt.trim(), category: form.category,
      image_url: form.image_url, read_time: form.read_time.trim(),
      post_date: form.post_date.trim(), featured: form.featured,
      published: form.published,
      tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean),
      related_categories: form.related_categories, sections,
    }, isNew);
  };

  const lS = { fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 };

  return (
    <Panel title={isNew ? 'New Post' : `Edit: ${post.title}`} action={
      <button onClick={onCancel} style={miniBtn}>← Back to list</button>
    }>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
        {serverError && <div style={{ padding:'10px 16px', background:'oklch(97% 0.03 25)', border:'1px solid oklch(85% 0.1 25)', borderRadius:10, color:'oklch(50% 0.18 25)', fontSize:13 }}>{serverError}</div>}

        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:14 }}>
          <div>
            <label style={lS}>Title *</label>
            <input value={form.title} onChange={e=>onTitle(e.target.value)} required style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="Post title"/>
          </div>
          <div>
            <label style={lS}>Slug * (URL path)</label>
            <input value={form.slug} onChange={e=>{setSlugManual(true);set('slug',e.target.value);}} required style={{...inputS,width:'100%',boxSizing:'border-box',fontFamily:'var(--font-mono,monospace)',fontSize:12}} placeholder="post-url-slug"/>
          </div>
        </div>

        <div>
          <label style={lS}>Excerpt (shown in listing)</label>
          <textarea value={form.excerpt} onChange={e=>set('excerpt',e.target.value)} rows={2} style={{...inputS,width:'100%',boxSizing:'border-box',resize:'vertical'}} placeholder="Brief summary…"/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:14 }}>
          <div>
            <label style={lS}>Category</label>
            <select value={form.category} onChange={e=>set('category',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}}>
              {BLOG_CATS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lS}>Read Time</label>
            <input value={form.read_time} onChange={e=>set('read_time',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="5 min read"/>
          </div>
          <div>
            <label style={lS}>Date</label>
            <input value={form.post_date} onChange={e=>set('post_date',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="June 2025"/>
          </div>
        </div>

        {/* Cover image */}
        <div>
          <label style={lS}>Cover Image <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, color:'var(--text-muted)', fontSize:10 }}>— recommended 1200×630 px · JPEG or WebP · max 1.5 MB</span></label>
          {form.image_url && (
            <div style={{ borderRadius:10, overflow:'hidden', marginBottom:8, background:'var(--bg-alt)', maxHeight:180 }}>
              <img src={form.image_url} alt="Cover preview" style={{ width:'100%', maxHeight:180, objectFit:'cover', display:'block' }}/>
            </div>
          )}
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:8 }}>
            <label style={{ ...miniBtn, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px' }}>
              <Icon name="upload" size={13}/> Upload Image
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 1.5 * 1024 * 1024) { alert('Image must be under 1.5 MB.\nTip: resize to 1200×630 px before uploading.'); e.target.value=''; return; }
                const reader = new FileReader();
                reader.onload = ev => set('image_url', ev.target.result);
                reader.readAsDataURL(file);
              }}/>
            </label>
            {form.image_url && (
              <button type="button" onClick={() => set('image_url', '')} style={{...miniBtn, color:'oklch(50% 0.18 25)'}}>Remove</button>
            )}
          </div>
          <input
            value={form.image_url.startsWith('data:') ? '' : form.image_url}
            onChange={e => set('image_url', e.target.value)}
            style={{...inputS, width:'100%', boxSizing:'border-box', fontSize:12}}
            placeholder={form.image_url.startsWith('data:') ? '— using uploaded image —' : 'Or paste an image URL (https://...)'}
          />
        </div>

        <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
          <label style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer', fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:'var(--text)' }}>
            <input type="checkbox" checked={form.featured} onChange={e=>set('featured',e.target.checked)} style={{ width:16, height:16 }}/>
            Featured post
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer', fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:'var(--text)' }}>
            <input type="checkbox" checked={form.published} onChange={e=>set('published',e.target.checked)} style={{ width:16, height:16 }}/>
            Published (visible on site)
          </label>
        </div>

        <div>
          <label style={lS}>Tags (comma-separated)</label>
          <input value={form.tags} onChange={e=>set('tags',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="iPhone, Buying Guide, Nigeria"/>
        </div>

        <div>
          <label style={lS}>Related Product Categories</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
            {BLOG_REL.map(c => (
              <button key={c} type="button" onClick={()=>toggleRel(c)} style={{
                ...miniBtn,
                color: form.related_categories.includes(c) ? 'var(--accent)' : 'var(--text-muted)',
                background: form.related_categories.includes(c) ? 'var(--accent-tint)' : 'var(--bg)',
                borderColor: form.related_categories.includes(c) ? 'var(--accent)' : 'var(--border)',
                fontWeight: form.related_categories.includes(c) ? 700 : 500,
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <label style={{...lS, marginBottom:0}}>Sections</label>
            <button type="button" onClick={addSec} style={{...miniBtn, color:'var(--accent)', borderColor:'var(--accent)'}}>+ Add Section</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {form.sections.map((s,i) => (
              <div key={i} style={{ border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Section {i+1}</span>
                  {form.sections.length > 1 && (
                    <button type="button" onClick={()=>removeSec(i)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'var(--text-muted)', padding:'0 4px', lineHeight:1 }}>×</button>
                  )}
                </div>
                <input value={s.heading} onChange={e=>setSec(i,'heading',e.target.value)} style={{...inputS,width:'100%',boxSizing:'border-box'}} placeholder="Section heading (optional)"/>
                <textarea value={s.body} onChange={e=>setSec(i,'body',e.target.value)} rows={4} style={{...inputS,width:'100%',boxSizing:'border-box',resize:'vertical'}} placeholder="Body text. Separate paragraphs with a blank line to create a bullet list."/>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:8, borderTop:'1px solid var(--border)' }}>
          <button type="button" onClick={onCancel} style={actionBtn}>Cancel</button>
          <button type="submit" disabled={saving} style={{...primaryBtn, opacity:saving?0.7:1}}>
            {saving ? 'Saving…' : isNew ? 'Create Post' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Panel>
  );
}

export function BlogTab({ isMobile }) {
  const [posts,        setPosts]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [editing,      setEditing]      = useState(null);  // null=list, 'new'=create, object=edit
  const [editorLoading,setEditorLoading]= useState(false); // fetching full post for editor
  const [delConfirm,   setDelConfirm]   = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [serverError,  setServerError]  = useState('');

  // List load: hits the slim /admin endpoint (no sections, no base64 image_url body).
  // The full row is fetched separately when entering the editor.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch('/api/blog/admin');
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch(e) { setServerError('Failed to load posts'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Click Edit → fetch the full post (sections + image_url) before opening the editor.
  // Keeps the list response small + fast while still letting the editor work as expected.
  const openEditor = async (postSlim) => {
    setServerError('');
    setEditorLoading(true);
    try {
      const res  = await authFetch(`/api/blog/admin/${postSlim.id}`);
      const full = res.ok ? await res.json() : postSlim;
      setEditing(full);
    } catch(e) {
      // If the full fetch fails, fall back to the slim row so the editor still opens
      setEditing(postSlim);
      setServerError('Could not load full post; some fields may be missing.');
    }
    setEditorLoading(false);
  };

  const toggleField = async (post, field) => {
    try {
      const res = await authFetch(`/api/blog/${post.id}`, {
        method: 'PATCH', body: JSON.stringify({ [field]: !post[field] }),
      });
      if (res.ok) setPosts(prev => prev.map(p => p.id===post.id ? {...p,[field]:!p[field]} : p));
    } catch(e) { setServerError('Update failed'); }
  };

  const handleDelete = async (id) => {
    try {
      await authFetch(`/api/blog/${id}`, { method:'DELETE' });
      setPosts(prev => prev.filter(p => p.id!==id));
      setDelConfirm(null);
    } catch(e) { setServerError('Delete failed'); }
  };

  const handleSave = async (payload, isNew) => {
    setSaving(true); setServerError('');
    try {
      const res = await authFetch(
        isNew ? '/api/blog' : `/api/blog/${editing.id}`,
        { method: isNew ? 'POST' : 'PATCH', body: JSON.stringify(payload) }
      );
      if (!res.ok) {
        const err = await res.json();
        setServerError(err.error || 'Save failed');
        setSaving(false); return;
      }
      const saved = await res.json();
      if (isNew) setPosts(prev => [saved, ...prev]);
      else       setPosts(prev => prev.map(p => p.id===saved.id ? saved : p));
      setEditing(null);
    } catch(e) { setServerError('Save failed'); }
    setSaving(false);
  };

  if (editing !== null) {
    return <PostEditor
      post={editing === 'new' ? null : editing}
      onSave={handleSave} onCancel={() => { setEditing(null); setServerError(''); }}
      saving={saving} serverError={serverError} isMobile={isMobile}
    />;
  }

  const published = posts.filter(p => p.published).length;
  const drafts    = posts.filter(p => !p.published).length;
  const featured  = posts.filter(p => p.featured).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:14 }}>
        <StatCard label="Published" value={published} icon={<Icon name="book" size={16}/>}/>
        <StatCard label="Drafts"    value={drafts}    accent="oklch(50% 0.08 220)" icon={<Icon name="pen" size={16}/>}/>
        <StatCard label="Featured"  value={featured}  accent="var(--accent)" icon={<Icon name="flag" size={16}/>}/>
      </div>

      {serverError && <div style={{ padding:'10px 16px', background:'oklch(97% 0.03 25)', border:'1px solid oklch(85% 0.1 25)', borderRadius:10, color:'oklch(50% 0.18 25)', fontSize:13 }}>{serverError}</div>}

      <Panel title={`All Posts (${posts.length})`} pad={0} action={
        <button onClick={() => { setServerError(''); setEditing('new'); }} style={primaryBtn}>
          <span style={{ display:'flex', alignItems:'center', gap:6 }}><Icon name="plus" size={14} c="white"/> New Post</span>
        </button>
      }>
        {loading ? (
          <div style={{ padding:'32px 0', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Loading…</div>
        ) : posts.length === 0 ? (
          <Empty label="No blog posts yet. Create your first post."/>
        ) : isMobile ? (
          <div style={{ display:'flex', flexDirection:'column' }}>
            {posts.map((post, i) => (
              <div key={post.id} style={{ padding:'14px 16px', borderTop:i?'1px solid var(--border)':'none' }}>
                <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
                  {post.image_url ? (
                    <img src={post.image_url} alt="" style={{ width:44, height:30, objectFit:'cover', borderRadius:5, flexShrink:0 }}/>
                  ) : post.has_image ? (
                    // Uploaded image (base64) — list omits the body for perf; placeholder until Edit
                    <span title="Has uploaded cover image" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:44, height:30, flexShrink:0, borderRadius:5, background:'var(--bg-alt)', border:'1px solid var(--border)', fontSize:14 }}>🖼️</span>
                  ) : (
                    <span style={{ fontSize:22, flexShrink:0, width:44, textAlign:'center' }}>{post.emoji||'📝'}</span>
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13.5, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.title}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2, fontFamily:'var(--font-mono,monospace)' }}>/{post.slug}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontSize:11.5, background:'var(--accent-tint)', color:'var(--accent)', borderRadius:100, padding:'3px 9px', fontWeight:700, whiteSpace:'nowrap' }}>{post.category}</span>
                  <button onClick={() => toggleField(post,'published')} style={{ ...miniBtn, color:post.published?'oklch(40% 0.14 155)':'oklch(50% 0.04 0)', background:post.published?'oklch(95% 0.06 155)':'var(--bg-alt)', borderColor:post.published?'oklch(80% 0.1 155)':'var(--border)' }}>
                    {post.published ? '● Published' : '○ Draft'}
                  </button>
                  <button onClick={() => toggleField(post,'featured')} style={{ ...miniBtn, color:post.featured?'var(--accent)':'var(--text-muted)', background:post.featured?'var(--accent-tint)':'transparent', borderColor:post.featured?'var(--accent)':'var(--border)' }}>
                    {post.featured ? '★ Featured' : '☆ Normal'}
                  </button>
                </div>
                <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                  <button onClick={() => openEditor(post)} disabled={editorLoading} style={{ ...miniBtn, opacity: editorLoading ? 0.5 : 1 }}>{editorLoading ? 'Loading…' : 'Edit'}</button>
                  {delConfirm===post.id ? (
                    <>
                      <button onClick={() => handleDelete(post.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(80% 0.12 25)'}}>Confirm</button>
                      <button onClick={() => setDelConfirm(null)} style={miniBtn}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setDelConfirm(post.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)'}}>Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
              <thead>
                <tr style={{ background:'var(--bg-alt)' }}>
                  <th style={thS}>Post</th>
                  <th style={thS}>Category</th>
                  <th style={thS}>Status</th>
                  <th style={thS}>Featured</th>
                  <th style={thS}>Date</th>
                  <th style={{...thS, textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post, i) => (
                  <tr key={post.id} style={{ borderTop:i?'1px solid var(--border)':'none' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg-alt)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={tdS}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        {post.image_url ? (
                          <img src={post.image_url} alt="" style={{ width:44, height:30, objectFit:'cover', borderRadius:5, flexShrink:0 }}/>
                        ) : post.has_image ? (
                          <span title="Has uploaded cover image" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:44, height:30, flexShrink:0, borderRadius:5, background:'var(--bg-alt)', border:'1px solid var(--border)', fontSize:14 }}>🖼️</span>
                        ) : (
                          <span style={{ fontSize:22, flexShrink:0, width:44, textAlign:'center' }}>{post.emoji||'📝'}</span>
                        )}
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:13.5, color:'var(--text)', maxWidth:300, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.title}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2, fontFamily:'var(--font-mono,monospace)' }}>/{post.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdS}>
                      <span style={{ fontSize:11.5, background:'var(--accent-tint)', color:'var(--accent)', borderRadius:100, padding:'3px 9px', fontWeight:700, whiteSpace:'nowrap' }}>{post.category}</span>
                    </td>
                    <td style={tdS}>
                      <button onClick={() => toggleField(post,'published')} style={{ ...miniBtn, color:post.published?'oklch(40% 0.14 155)':'oklch(50% 0.04 0)', background:post.published?'oklch(95% 0.06 155)':'var(--bg-alt)', borderColor:post.published?'oklch(80% 0.1 155)':'var(--border)' }}>
                        {post.published ? '● Published' : '○ Draft'}
                      </button>
                    </td>
                    <td style={tdS}>
                      <button onClick={() => toggleField(post,'featured')} style={{ ...miniBtn, color:post.featured?'var(--accent)':'var(--text-muted)', background:post.featured?'var(--accent-tint)':'transparent', borderColor:post.featured?'var(--accent)':'var(--border)' }}>
                        {post.featured ? '★ Featured' : '☆ Normal'}
                      </button>
                    </td>
                    <td style={{...tdS, color:'var(--text-muted)', fontSize:12.5, whiteSpace:'nowrap'}}>{post.post_date||'—'}</td>
                    <td style={{...tdS, textAlign:'right'}}>
                      <div style={{ display:'flex', gap:6, justifyContent:'flex-end', flexWrap:'nowrap' }}>
                        <button onClick={() => openEditor(post)} disabled={editorLoading} style={{ ...miniBtn, opacity: editorLoading ? 0.5 : 1 }}>{editorLoading ? 'Loading…' : 'Edit'}</button>
                        {delConfirm===post.id ? (
                          <>
                            <button onClick={() => handleDelete(post.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)', borderColor:'oklch(80% 0.12 25)'}}>Confirm</button>
                            <button onClick={() => setDelConfirm(null)} style={miniBtn}>Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => setDelConfirm(post.id)} style={{...miniBtn, color:'oklch(50% 0.18 25)'}}>Delete</button>
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
