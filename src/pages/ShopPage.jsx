
// Certo — Shop Page + Product Detail Page

// Strip the .v= cache-buster from Apple CDN URLs (it causes proxy encoding issues and isn't needed)
const cleanAppleImg = (url) => url ? url.replace(/[&?]\.v=[^&]*/, '') : null;
// Route Apple CDN image URLs through our server proxy (Apple blocks direct hotlinking)
const proxyImg = (url) => url ? `/api/img?url=${encodeURIComponent(cleanAppleImg(url))}` : null;

// Normalise API shape (snake_case, string prices) → UI shape (camelCase, numeric prices)
const normaliseProduct = (p) => ({
  id: p.id,
  name: p.name,
  subtitle: p.subtitle || '',
  type: p.category,
  condition: p.condition,
  conditionNote: p.condition_note || '',
  usdPrice: parseFloat(p.usd_price) || 0,
  images: (p.image_urls || []).map(proxyImg),
  badge: p.badge || '',
  deliveryDays: p.delivery_days || '10–18 business days',
  inStock: p.in_stock,
  featured: p.featured,
  overview: p.overview || [],
  specs: p.specs || [],
  includes: p.includes || [],
  features: p.features || [],
  techSpecs: p.tech_specs || [],
  apple_url: p.apple_url,
});

const ConditionBadge = ({ condition }) => (
  <span style={{
    padding: '3px 10px', borderRadius: 6,
    background: condition === 'New' ? 'var(--accent-tint)' : 'oklch(95% 0.02 145)',
    color: condition === 'New' ? 'var(--accent)' : 'oklch(40% 0.12 145)',
    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.04em', textTransform: 'uppercase',
  }}>{condition}</span>
);

const ProductCard = ({ product, navigate, compact }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onClick={() => navigate('product', product.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: compact ? 14 : 20, overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.25s',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.03)',
        opacity: product.inStock ? 1 : 0.55,
      }}
    >
      <div style={{
        height: compact ? 120 : 200, background: 'var(--bg-alt)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden',
      }}>
        {product.images && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: compact ? 8 : 16 }}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div style={{ display: product.images && product.images[0] ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: 0 }}>
          <ProductIcon type={product.type.toLowerCase()} size={compact ? 70 : 130} color="var(--accent)" />
        </div>
        {!product.inStock && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(250,249,247,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: compact ? 10 : 14, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>OUT OF STOCK</span>
          </div>
        )}
        {product.featured && product.inStock && (
          <div style={{ position: 'absolute', top: compact ? 6 : 12, left: compact ? 6 : 12 }}>
            <span style={{ background: 'var(--accent)', color: 'white', padding: compact ? '2px 6px' : '3px 10px', borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-body)' }}>Popular</span>
          </div>
        )}
      </div>

      <div style={{ padding: compact ? 12 : 20 }}>
        {!compact && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <ConditionBadge condition={product.condition} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', background: 'var(--bg-alt)', padding: '3px 8px', borderRadius: 5 }}>{product.badge}</span>
          </div>
        )}
        {compact && (
          <div style={{ marginBottom: 4 }}>
            <ConditionBadge condition={product.condition} />
          </div>
        )}

        <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: compact ? 13 : 18, color: 'var(--text)', marginBottom: 4, marginTop: compact ? 6 : 12,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{product.name}</h3>

        {!compact && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{product.subtitle}</p>}
        <p style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--border)', marginBottom: compact ? 8 : 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={product.id}>#{product.id}</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: compact ? 15 : 22, color: 'var(--text)' }}>
              {fmt(product.usdPrice)}
            </div>
            {!compact && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>US: ${product.usdPrice.toLocaleString()}</div>}
          </div>
          <div style={{
            width: compact ? 28 : 36, height: compact ? 28 : 36, borderRadius: compact ? 8 : 10,
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M8 3l5 5-5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

const PER_PAGE = 18;

const ShopPage = ({ navigate, addToCart, initialType }) => {
  const { isMobile } = useResponsive();
  const [products, setProducts]     = React.useState([]);
  const [loading, setLoading]       = React.useState(true);
  const [page, setPage]             = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [typeFilter, setTypeFilter] = React.useState(initialType || 'All');
  const [condFilter, setCondFilter] = React.useState('All');
  const [sort, setSort]             = React.useState('featured');
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch]         = React.useState('');
  const [filterOpen, setFilterOpen] = React.useState(false);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const activeFilters = (typeFilter !== 'All' ? 1 : 0) + (condFilter !== 'All' ? 1 : 0);

  // Sync initialType prop
  React.useEffect(() => { setTypeFilter(initialType || 'All'); setPage(1); }, [initialType]);

  // Debounce search input → search state
  React.useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Close filter panel on outside click
  React.useEffect(() => {
    if (!filterOpen) return;
    const close = () => setFilterOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [filterOpen]);

  // Fetch whenever page, filters, search, or sort changes
  React.useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: PER_PAGE, page });
    if (typeFilter !== 'All') params.set('category', typeFilter === 'MacBook' ? 'Mac' : typeFilter);
    if (condFilter !== 'All') params.set('condition', condFilter.toLowerCase());
    if (search)               params.set('search', search);
    if (sort !== 'featured')  params.set('sort', sort === 'price-asc' ? 'price_asc' : 'price_desc');
    fetch(`/api/products?${params}`)
      .then(r => { setTotalCount(parseInt(r.headers.get('X-Total-Count') || '0', 10)); return r.json(); })
      .then(data => { setProducts((Array.isArray(data) ? data : []).map(normaliseProduct)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [typeFilter, condFilter, search, sort, page]);

  const types = ['All', 'iPhone', 'MacBook', 'iPad', 'AirPods', 'Watch', 'Apple TV', 'HomePod', 'Accessories'];
  const conds = ['All', 'New', 'Refurbished'];

  const OptionPill = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 8, border: '1.5px solid',
      borderColor: active ? 'var(--accent)' : 'var(--border)',
      background: active ? 'var(--accent-tint)' : 'var(--bg)',
      color: active ? 'var(--accent)' : 'var(--text-muted)',
      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: active ? 600 : 400,
      cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>{label}</button>
  );

  const goTo = (p) => { setPage(Math.max(1, Math.min(p, totalPages))); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>

      {/* ── Header ── */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: isMobile ? '24px 20px 20px' : '40px 24px 28px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 28 : 42, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 6 }}>Shop Apple</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: isMobile ? 14 : 16, color: 'var(--text-muted)', marginBottom: 20 }}>
            Every product sourced directly from Apple US.{totalCount > 0 ? ` ${totalCount} products available.` : ''}
          </p>

          {/* Search + Filter + Sort row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>

            {/* Search bar */}
            <div style={{ position: 'relative', flex: isMobile ? '1 1 100%' : '1 1 280px', maxWidth: 420 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <circle cx="6.5" cy="6.5" r="5" stroke="var(--text-muted)" strokeWidth="1.5"/>
                <path d="M10.5 10.5L14 14" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder="Search products…"
                style={{
                  width: '100%', paddingLeft: 38, paddingRight: searchInput ? 36 : 14, paddingTop: 10, paddingBottom: 10,
                  borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg)',
                  fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: 2,
                }}>×</button>
              )}
            </div>

            {/* Filter dropdown */}
            <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setFilterOpen(o => !o)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10,
                border: `1.5px solid ${activeFilters > 0 ? 'var(--accent)' : 'var(--border)'}`,
                background: activeFilters > 0 ? 'var(--accent-tint)' : 'var(--bg)',
                color: activeFilters > 0 ? 'var(--accent)' : 'var(--text)',
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M1 3h13M3 7.5h9M5.5 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                Filters
                {activeFilters > 0 && (
                  <span style={{ background: 'var(--accent)', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{activeFilters}</span>
                )}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: filterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                  <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {filterOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 200,
                  background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 14,
                  padding: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.10)', minWidth: 320,
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Category</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {types.map(t => <OptionPill key={t} label={t} active={typeFilter === t} onClick={() => { setTypeFilter(t); setPage(1); }} />)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Condition</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {conds.map(c => <OptionPill key={c} label={c} active={condFilter === c} onClick={() => { setCondFilter(c); setPage(1); }} />)}
                    </div>
                  </div>
                  {activeFilters > 0 && (
                    <button onClick={() => { setTypeFilter('All'); setCondFilter('All'); setPage(1); }} style={{
                      marginTop: 14, width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)',
                      background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer',
                    }}>Clear filters</button>
                  )}
                </div>
              )}
            </div>

            {/* Sort */}
            <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} style={{
              padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)',
              background: 'var(--bg)', fontFamily: 'var(--font-body)', fontSize: 14,
              color: 'var(--text)', cursor: 'pointer', outline: 'none',
            }}>
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Product grid ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 20px' : '40px 24px' }}>

        {/* Results summary */}
        {!loading && totalCount > 0 && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, totalCount)} of {totalCount} products
            {search ? ` for "${search}"` : ''}
          </p>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 16 }}>
            Loading products…
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-muted)', marginBottom: 12 }}>No products found.</p>
            {(search || activeFilters > 0) && (
              <button onClick={() => { setSearchInput(''); setSearch(''); setTypeFilter('All'); setCondFilter('All'); setPage(1); }} style={{
                padding: '10px 24px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent',
                fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', cursor: 'pointer',
              }}>Clear search & filters</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: isMobile ? 12 : 24 }}>
            {products.map(p => <ProductCard key={p.id} product={p} navigate={navigate} compact={isMobile} />)}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 48 }}>
            <button onClick={() => goTo(page - 1)} disabled={page <= 1} style={{
              padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--border)',
              background: 'var(--bg)', color: page <= 1 ? 'var(--border)' : 'var(--text)',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
            }}>← Prev</button>

            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p;
                if (totalPages <= 7) {
                  p = i + 1;
                } else if (page <= 4) {
                  p = i < 6 ? i + 1 : totalPages;
                } else if (page >= totalPages - 3) {
                  p = i === 0 ? 1 : totalPages - 5 + i;
                } else {
                  p = [1, page - 2, page - 1, page, page + 1, page + 2, totalPages][i];
                }
                const isEllipsis = i > 0 && p - ([1, page <= 4 ? i : 1][0] || 1) > 2 && false;
                return (
                  <button key={i} onClick={() => goTo(p)} style={{
                    width: 38, height: 38, borderRadius: 9, border: '1.5px solid',
                    borderColor: p === page ? 'var(--accent)' : 'var(--border)',
                    background: p === page ? 'var(--accent)' : 'var(--bg)',
                    color: p === page ? 'white' : 'var(--text)',
                    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: p === page ? 700 : 400,
                    cursor: 'pointer',
                  }}>{p}</button>
                );
              })}
            </div>

            <button onClick={() => goTo(page + 1)} disabled={page >= totalPages} style={{
              padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--border)',
              background: 'var(--bg)', color: page >= totalPages ? 'var(--border)' : 'var(--text)',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            }}>Next →</button>
          </div>
        )}

        <div style={{
          marginTop: 60, padding: '20px 24px', borderRadius: 14,
          background: 'var(--bg-alt)', border: '1px solid var(--border)',
          display: 'flex', gap: 16, alignItems: 'flex-start',
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="10" cy="10" r="9" stroke="var(--accent)" strokeWidth="1.5"/>
            <path d="M10 6v5M10 13.5v.5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Naira prices update with the exchange rate</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Prices shown are calculated at today's buying rate of ₦{CERTO_RATE.toLocaleString()}/USD. If you pay in naira, the rate at the time of payment applies. We explain this fully at checkout and you confirm it before paying.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Product Detail ────────────────────────────────────────────────────────────

const ProductDetailPage = ({ productId, navigate, addToCart }) => {
  const { isMobile } = useResponsive();
  const [product, setProduct] = React.useState(null);
  const [related, setRelated] = React.useState([]);
  const [loadErr, setLoadErr] = React.useState(false);
  const [selectedCare, setSelectedCare] = React.useState('plus');
  const [careBilling, setCareBilling] = React.useState('annual');
  const [added, setAdded] = React.useState(false);
  const [openSections, setOpenSections] = React.useState(new Set());
  const [selectedImg, setSelectedImg] = React.useState(0);

  React.useEffect(() => {
    setProduct(null); setLoadErr(false); setSelectedImg(0);
    fetch(`/api/products/${encodeURIComponent(productId)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const p = normaliseProduct(data);
        setProduct(p);
        // Fetch a few related products from the same category
        fetch(`/api/products?category=${encodeURIComponent(p.type)}&limit=6`)
          .then(r => r.json())
          .then(rows => {
            const rel = (Array.isArray(rows) ? rows : [])
              .map(normaliseProduct)
              .filter(r => r.id !== p.id && r.inStock)
              .slice(0, isMobile ? 2 : 3);
            setRelated(rel);
          })
          .catch(() => {});
      })
      .catch(() => setLoadErr(true));
  }, [productId]);

  if (loadErr) return (
    <div style={{ minHeight: '100vh', paddingTop: 120, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
      Product not found. <button onClick={() => navigate('shop')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15 }}>← Back to Shop</button>
    </div>
  );

  if (!product) return (
    <div style={{ minHeight: '100vh', paddingTop: 120, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
      Loading…
    </div>
  );

  const realImages = (product.images || []).filter(img => img && (img.startsWith('http') || img.startsWith('/')));

  const toggleSection = (key) => setOpenSections(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const care = APPLECARE_OPTIONS.find(o => o.id === selectedCare);
  const careUsd = selectedCare === 'none' ? 0
    : careBilling === 'monthly' ? (care.monthlyUsd || 0)
    : (care.annualUsd || 0);
  const totalUsd = product.usdPrice + careUsd;

  const handleAdd = () => {
    addToCart({ product, applecare: care, billing: selectedCare === 'none' ? null : careBilling });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const AccordionRow = ({ sectionKey, title, children }) => {
    const isOpen = openSections.has(sectionKey);
    return (
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={() => toggleSection(sectionKey)} style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: isMobile ? '18px 0' : '22px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 16 : 18, color: 'var(--text)', textAlign: 'left' }}>{title}</span>
          <span style={{ fontSize: 22, color: 'var(--accent)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(45deg)' : 'none', flexShrink: 0 }}>+</span>
        </button>
        {isOpen && <div style={{ paddingBottom: 32 }}>{children}</div>}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ padding: '24px 24px 0', maxWidth: 1200, margin: '0 auto' }}>
        <button onClick={() => navigate('shop')} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ← Back to Shop
        </button>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 20px 80px' : '32px 24px 80px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80 }}>
        {/* Left: product display */}
        <div>
          <div style={{
            height: isMobile ? 260 : 440, background: 'var(--bg-alt)', borderRadius: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border)', marginBottom: realImages.length > 1 ? 12 : 20,
            overflow: 'hidden',
          }}>
            {realImages.length > 0 ? (
              <img
                src={realImages[selectedImg] || realImages[0]}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 20 }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : (
              <ProductIcon type={product.type.toLowerCase()} size={260} color="var(--accent)" />
            )}
          </div>

          {/* Thumbnail strip — only when multiple images */}
          {realImages.length > 1 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
              {realImages.map((url, i) => (
                <button key={i} onClick={() => setSelectedImg(i)} style={{
                  width: 72, height: 72, flexShrink: 0, borderRadius: 12,
                  border: `2px solid ${selectedImg === i ? 'var(--accent)' : 'var(--border)'}`,
                  background: 'var(--bg-alt)', overflow: 'hidden', cursor: 'pointer', padding: 4,
                }}>
                  <img src={url} alt={`View ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}


          {!isMobile && (
            <div style={{ background: 'var(--bg-alt)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Specs</div>
              {product.specs.map(s => (
                <div key={s} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--accent)', fontSize: 14 }}>·</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: purchase panel */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <ConditionBadge condition={product.condition} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', padding: '3px 10px', background: 'var(--bg-alt)', borderRadius: 6 }}>{product.badge}</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 26 : 36, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 6 }}>{product.name}</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-muted)', marginBottom: 20 }}>{product.subtitle}</p>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', lineHeight: 1.7, padding: '16px 20px', background: 'var(--bg-alt)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 24 }}>
            {product.conditionNote}
          </p>

          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end', marginBottom: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Certo price</div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 30 : 38, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {fmt(product.usdPrice)}
              </div>
            </div>
            <div style={{ paddingBottom: 8 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>US retail</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-muted)', textDecoration: 'line-through' }}>${product.usdPrice.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 28 }}>
            Rate: ₦{CERTO_RATE.toLocaleString()}/USD · <button onClick={() => navigate('faq')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, padding: 0, fontFamily: 'var(--font-body)' }}>Forex clause explained →</button>
          </div>

          {/* AppleCare */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 12 }}>Coverage with this device</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {APPLECARE_OPTIONS.map(opt => {
                const isSelected = selectedCare === opt.id;
                const hasAnnual  = opt.id === 'plus';
                const priceLabel = opt.id === 'none' ? 'Included'
                  : isSelected
                    ? (careBilling === 'monthly' ? `+$${opt.monthlyUsd}/mo` : `+$${opt.annualUsd}/yr`)
                    : hasAnnual ? `from $${opt.monthlyUsd}/mo` : `+$${opt.monthlyUsd}/mo`;

                return (
                <div key={opt.id} onClick={() => {
                  setSelectedCare(opt.id);
                  if (opt.id === 'one') setCareBilling('monthly');
                }} style={{
                  border: `2px solid ${isSelected ? opt.color : 'var(--border)'}`,
                  borderRadius: 14, padding: 16, cursor: 'pointer',
                  background: isSelected ? `${opt.color}08` : 'var(--bg)',
                  transition: 'all 0.15s', position: 'relative',
                }}>
                  {opt.recommended && (
                    <span style={{
                      position: 'absolute', top: -10, right: 14,
                      background: opt.color, color: 'white', fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-body)',
                    }}>RECOMMENDED</span>
                  )}

                  {/* Row: radio + name + price */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? opt.color : 'var(--border)'}`,
                        background: isSelected ? opt.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                      </div>
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{opt.name}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{opt.tagline}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: opt.id !== 'none' ? opt.color : 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>
                      {priceLabel}
                    </span>
                  </div>

                  {isSelected && (
                    <div>
                      {/* Billing toggle — only for AppleCare+ */}
                      {opt.id === 'plus' && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12, marginTop: 4 }} onClick={e => e.stopPropagation()}>
                          {[{ key: 'monthly', label: `Monthly — $${opt.monthlyUsd}/mo` }, { key: 'annual', label: `Annual — $${opt.annualUsd}/yr` }].map(b => (
                            <button key={b.key} onClick={() => setCareBilling(b.key)} style={{
                              flex: 1, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                              border: `1.5px solid ${careBilling === b.key ? opt.color : 'var(--border)'}`,
                              background: careBilling === b.key ? `${opt.color}12` : 'var(--bg)',
                              fontFamily: 'var(--font-body)', fontSize: isMobile ? 11 : 12, fontWeight: careBilling === b.key ? 700 : 400,
                              color: careBilling === b.key ? opt.color : 'var(--text-muted)',
                            }}>{b.label}</button>
                          ))}
                        </div>
                      )}
                      {/* Monthly-only label for AppleCare One */}
                      {opt.id === 'one' && (
                        <div style={{ marginBottom: 10, marginTop: 2 }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: opt.color, background: `${opt.color}12`, padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>Monthly subscription · cancel anytime</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {opt.benefits.map(b => (
                          <span key={b} style={{ fontFamily: 'var(--font-body)', fontSize: 11, padding: '3px 8px', borderRadius: 4, background: `${opt.color}15`, color: opt.color }}>✓ {b}</span>
                        ))}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                        <strong style={{ color: 'var(--text)' }}>How to activate:</strong> {opt.activation}
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>

          {/* What's included */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 10 }}>What's included</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {product.includes.map(item => (
                <span key={item} style={{ fontFamily: 'var(--font-body)', fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Delivery */}
          <div style={{ padding: '14px 18px', background: 'var(--bg-alt)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)' }}>
              📦 <strong>Estimated delivery:</strong> {product.deliveryDays} from payment
            </div>
          </div>

          {/* Total + CTA */}
          <div style={{ padding: '20px 0', borderTop: '1px solid var(--border)', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>Device</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>{fmt(product.usdPrice)}</span>
            </div>
            {careUsd > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>{care.name} ({careBilling === 'monthly' ? 'monthly' : 'annual'})</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>{fmt(careUsd)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 24, color: 'var(--text)' }}>{fmt(totalUsd)}</span>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            style={{
              width: '100%', padding: '18px 0', borderRadius: 14, border: 'none',
              background: added ? 'oklch(50% 0.18 145)' : product.inStock ? 'var(--accent)' : 'var(--border)',
              color: product.inStock ? 'white' : 'var(--text-muted)',
              cursor: product.inStock ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 700,
              transition: 'all 0.2s',
            }}
          >
            {!product.inStock ? 'Out of Stock' : added ? '✓ Added to Order' : 'Add to Order →'}
          </button>
        </div>
      </div>

      {/* ── Accordion sections ─────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 20px' : '0 24px' }}>
        <div style={{ borderBottom: '1px solid var(--border)' }}>

          {/* Product Information */}
          <AccordionRow sectionKey="info" title="Product Information">
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 0 : 48 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Overview</div>
                {(product.overview || []).map((line, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border-light)', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 1 }}>·</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{line}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: isMobile ? 28 : 0 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>What's in the Box</div>
                {(product.includes || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}>
                    <span style={{ color: 'oklch(50% 0.18 145)', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>✓</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </AccordionRow>

          {/* Features */}
          {(product.features || []).length > 0 && (
            <AccordionRow sectionKey="features" title="Features">
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? 16 : 24 }}>
                {(product.features || []).map((f, i) => (
                  <div key={i} style={{ padding: '20px 24px', background: 'var(--bg-alt)', borderRadius: 16, border: '1px solid var(--border)' }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>{f.title}</div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{f.body}</p>
                  </div>
                ))}
              </div>
            </AccordionRow>
          )}

          {/* Tech Specs */}
          {(product.techSpecs || []).length > 0 && (
            <AccordionRow sectionKey="techspecs" title="Tech Specs">
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? 20 : 32 }}>
                {(product.techSpecs || []).map((sec, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{sec.section}</div>
                    {(sec.items || []).map((item, j) => (
                      <div key={j} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: j < sec.items.length - 1 ? '1px solid var(--border-light)' : 'none', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 13, flexShrink: 0, marginTop: 2 }}>—</span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </AccordionRow>
          )}

        </div>
      </div>

      {/* ── You may also like ───────────────────────────────────────── */}
      {related.length > 0 && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '48px 20px 80px' : '64px 24px 100px' }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: isMobile ? 22 : 28, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 24 }}>You may also like</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 20 }}>
            {related.map(p => <ProductCard key={p.id} product={p} navigate={navigate} />)}
          </div>
        </div>
      )}

    </div>
  );
};

Object.assign(window, { ShopPage, ProductDetailPage, ConditionBadge });
