import React, { useState } from 'react';
import { BLOG_POSTS, BLOG_CATEGORIES, getPostsByCategory } from '../data/blogPosts.js';

function useIsMobile() {
  const mq = typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)') : null;
  const [m, setM] = useState(() => mq ? mq.matches : false);
  React.useEffect(() => {
    if (!mq) return;
    const h = (e) => setM(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return m;
}

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({ post, navigate, large }) {
  const isMobile = useIsMobile();
  return (
    <div
      onClick={() => navigate('blog', post.slug)}
      style={{
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: large ? 20 : 16, overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.2s', display: 'flex',
        flexDirection: large && !isMobile ? 'row' : 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(26,23,20,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
    >
      {/* Emoji hero */}
      <div style={{
        background: 'var(--accent-tint)',
        width: large && !isMobile ? 220 : '100%',
        minHeight: large && !isMobile ? 'auto' : 120,
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: large ? 52 : 38,
      }}>
        {post.emoji}
      </div>

      <div style={{ padding: large ? '28px 32px' : '20px 22px', flex: 1 }}>
        {/* Category + read time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{
            background: 'var(--accent-tint)', color: 'var(--accent)',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', padding: '3px 9px', borderRadius: 100,
          }}>{post.category}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{post.readTime}</span>
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-head)', fontWeight: 800,
          fontSize: large ? (isMobile ? 20 : 26) : 17,
          color: 'var(--text)', lineHeight: 1.2,
          letterSpacing: '-0.02em', margin: '0 0 10px',
        }}>{post.title}</h3>

        {/* Excerpt */}
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 13.5,
          color: 'var(--text-muted)', lineHeight: 1.65,
          margin: '0 0 16px', display: '-webkit-box',
          WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{post.excerpt}</p>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{post.date}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>Read →</span>
        </div>
      </div>
    </div>
  );
}

// ─── Blog listing ─────────────────────────────────────────────────────────────
function BlogListing({ navigate }) {
  const isMobile = useIsMobile();
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All' ? BLOG_POSTS
    : BLOG_POSTS.filter(p => p.category === activeCategory);

  const featured = filtered.find(p => p.featured) || filtered[0];
  const rest = filtered.filter(p => p !== featured);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: isMobile ? '80px 20px 40px' : '100px 48px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}>
            Guides & Resources
          </div>
          <h1 style={{
            fontFamily: 'var(--font-head)', fontWeight: 800,
            fontSize: isMobile ? 36 : 56, letterSpacing: '-0.04em',
            color: 'var(--text)', margin: '0 0 16px', lineHeight: 1.0,
          }}>
            The Certo Guide
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-muted)', maxWidth: 520, lineHeight: 1.7, margin: 0 }}>
            Everything you need to know about buying Apple products in Nigeria — from sourcing and pricing to repairs and authenticity.
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: isMobile ? '0 16px' : '0 48px', overflowX: 'auto' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0 }}>
          {['All', ...BLOG_CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: activeCategory === cat ? 700 : 500,
              color: activeCategory === cat ? 'var(--accent)' : 'var(--text-muted)',
              padding: '16px 20px', whiteSpace: 'nowrap',
              borderBottom: activeCategory === cat ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '32px 16px' : '48px 48px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>No posts in this category yet.</div>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <div style={{ marginBottom: 36 }}>
                <PostCard post={featured} navigate={navigate} large />
              </div>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
                {rest.map(post => <PostCard key={post.slug} post={post} navigate={navigate} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Single post ──────────────────────────────────────────────────────────────
function BlogPost({ slug, navigate }) {
  const isMobile = useIsMobile();
  const post = BLOG_POSTS.find(p => p.slug === slug);

  if (!post) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 48 }}>📭</div>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700 }}>Guide not found</div>
      <button onClick={() => navigate('blog')} style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontWeight: 600 }}>Back to guides</button>
    </div>
  );

  // Related posts (same category, excluding current)
  const related = BLOG_POSTS.filter(p => p.slug !== slug && (p.category === post.category || p.relatedCategories.some(c => post.relatedCategories.includes(c)))).slice(0, 3);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav breadcrumb */}
      <div style={{ padding: isMobile ? '80px 20px 0' : '100px 48px 0' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <button onClick={() => navigate('blog')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--accent)', fontWeight: 600, padding: 0, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to guides
          </button>
        </div>
      </div>

      {/* Article header */}
      <div style={{ padding: isMobile ? '0 20px 40px' : '0 48px 48px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ background: 'var(--accent-tint)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 100 }}>{post.category}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{post.readTime}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>·</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{post.date}</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-head)', fontWeight: 800,
            fontSize: isMobile ? 28 : 44, letterSpacing: '-0.035em',
            color: 'var(--text)', margin: '0 0 20px', lineHeight: 1.1,
          }}>{post.title}</h1>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.75, margin: '0 0 36px', borderBottom: '1px solid var(--border)', paddingBottom: 36 }}>
            {post.excerpt}
          </p>

          {/* Hero emoji */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: isMobile ? 140 : 180, background: 'var(--accent-tint)', borderRadius: 20, marginBottom: 48, fontSize: isMobile ? 64 : 80 }}>
            {post.emoji}
          </div>

          {/* Article body */}
          <div style={{ fontFamily: 'var(--font-body)' }}>
            {post.sections.map((section, i) => (
              <div key={i} style={{ marginBottom: 36 }}>
                {section.heading && (
                  <h2 style={{
                    fontFamily: 'var(--font-head)', fontWeight: 800,
                    fontSize: isMobile ? 20 : 24, letterSpacing: '-0.02em',
                    color: 'var(--text)', margin: '0 0 14px', lineHeight: 1.2,
                  }}>{section.heading}</h2>
                )}
                {Array.isArray(section.body)
                  ? section.body.map((para, j) => (
                    <p key={j} style={{ fontSize: 15.5, color: para.match(/^(iPhone|Note:|Get it|Skip it|Tier|Low-end|Mid-range|RAM|Storage|Apple does|Dial|Check|Look|Before|Go to|These|iPhone \d|With Apple|DIY|Add|For most|The|If you|Fully)/) ? 'var(--text-muted)' : 'var(--text)', lineHeight: 1.8, margin: '0 0 12px' }}>
                      {para}
                    </p>
                  ))
                  : <p style={{ fontSize: 15.5, color: 'var(--text)', lineHeight: 1.8, margin: 0 }}>{section.body}</p>
                }
              </div>
            ))}
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
            {post.tags.map(tag => (
              <span key={tag} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 100, padding: '4px 12px' }}>
                #{tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 48, padding: 32, background: 'var(--accent-tint)', borderRadius: 20, border: '1px solid var(--accent-tint2,#f5d9cc)' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 8 }}>
              Ready to buy genuine Apple?
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.65 }}>
              Every Certo device ships directly from Apple US, with a verified serial number and Certo Certificate of Authenticity.
            </p>
            <button onClick={() => navigate('shop')} style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 12, padding: '13px 28px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700 }}>
              Shop Apple →
            </button>
          </div>
        </div>
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <div style={{ padding: isMobile ? '40px 16px 60px' : '48px 48px 72px', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 24 }}>
              More guides
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
              {related.map(p => <PostCard key={p.slug} post={p} navigate={navigate} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function BlogPage({ navigate, postSlug }) {
  if (postSlug) return <BlogPost slug={postSlug} navigate={navigate} />;
  return <BlogListing navigate={navigate} />;
}

// ─── Mini guides strip (used in homepage + product pages) ─────────────────────
export function GuidesStrip({ posts, navigate, title = 'Recommended Guides', isMobile }) {
  return (
    <div style={{ padding: isMobile ? '48px 20px' : '64px 48px', background: 'var(--bg-alt)', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: isMobile ? 20 : 26, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
            {title}
          </h2>
          <button onClick={() => navigate('blog')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-body)' }}>
            View all guides →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
          {posts.map(post => (
            <div key={post.slug} onClick={() => navigate('blog', post.slug)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(26,23,20,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
            >
              <div style={{ fontSize: 28, flexShrink: 0, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-tint)', borderRadius: 10 }}>{post.emoji}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>{post.category}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: 'var(--text)', lineHeight: 1.3, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{post.readTime}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
