// ─── Certo Express server ────────────────────────────────────────────────────
// Routing strategy (see also vercel.json):
//   • Static files in /dist (built React SPA) — served by Vercel CDN directly.
//   • /api/*       — Express handles via routes in ./routes/*.
//   • /product/:id, /blog/:slug, /guides/:slug, /sitemap.xml — server-rendered
//     for SEO (OG/meta tags). Add a new SSR route by:
//       1. Defining the handler below (app.get('/your-route/:id', …))
//       2. Adding 'your-route' to the regex group in vercel.json rewrites:
//          "/(product|blog|guides|sitemap\\.xml|your-route)(/.*)?"
//   • Everything else falls through to /index.html (the SPA).
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const fs        = require('fs');
const crypto    = require('crypto');
const pool      = require('./db');
const { generateToken, parseAccounts } = require('./adminAuth');

const app  = express();
const PORT = process.env.PORT || 3000;

// CORS — allow the live site, any *.certo.ng subdomain (preview/beta/oma/etc.), and local dev.
//
// IMPORTANT: when the cors middleware rejects an origin via cb(new Error()), Express turns that
// into a generic 500. We intentionally signal rejection by passing a tagged error and catch it
// in a dedicated error handler below (returns a proper 403 with a useful message instead).
const allowedOrigins = [
  'https://certo.ng',
  'https://www.certo.ng',
  'http://localhost:3000',
  'http://localhost:5173',
];
const CORS_REJECTED = 'CORS_ORIGIN_NOT_ALLOWED';

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // server-to-server / curl
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (/^https:\/\/[a-z0-9-]+\.certo\.ng$/.test(origin)) return cb(null, true);
    const err = new Error(`Origin ${origin} is not allowed by CORS policy`);
    err.code = CORS_REJECTED;
    cb(err);
  },
}));

// CORS-aware error handler. Must be registered AFTER app.use(cors()) but BEFORE any route
// handlers that depend on json body parsing — placing it just after cors makes the order obvious.
app.use((err, req, res, next) => {
  if (err && err.code === CORS_REJECTED) {
    return res.status(403).json({
      error: 'CORS: origin not allowed',
      message: err.message,
      hint: 'If this is a legitimate Certo domain, add it to allowedOrigins in server/index.js.',
    });
  }
  next(err);
});

app.use(express.json({ limit: '10mb' }));

// ── Rate limiting ────────────────────────────────────────────────────────────
// Login: 10 attempts per 15 min per IP — brute-force protection
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});
// General public endpoints: 60 req/min per IP
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Slow down.' },
});

// Admin login — validates password against ADMIN_ACCOUNTS (format: "Name:pass,Name2:pass2")
// Returns a signed 30-day token (name embedded) + the admin's display name
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  if (!process.env.ADMIN_SECRET)  return res.status(500).json({ error: 'ADMIN_SECRET not configured' });

  const accounts = parseAccounts();
  if (!accounts.length) return res.status(500).json({ error: 'ADMIN_ACCOUNTS not configured' });

  // Constant-time comparison to prevent timing-based enumeration
  let matchedName = null;
  for (const acct of accounts) {
    try {
      if (acct.password.length === password.length &&
          crypto.timingSafeEqual(Buffer.from(acct.password), Buffer.from(password))) {
        matchedName = acct.name;
        break;
      }
    } catch { /* length mismatch → skip */ }
  }

  if (!matchedName) return res.status(401).json({ error: 'Incorrect password' });

  // Log sign-in before responding so Vercel doesn't kill it
  try {
    const logAdminAction = require('./logAdminAction');
    await logAdminAction(matchedName, 'Signed in', '');
  } catch(_) {}

  res.json({ token: generateToken(matchedName), name: matchedName });
});

// Serve Vite-built frontend
const distPath = path.join(__dirname, '..', 'dist');
const rootPath = path.join(__dirname, '..');
app.use(express.static(distPath));

// Admin panel — serves admin.html + raw src/ so Babel can process DashboardPage client-side
app.get(['/admin', '/admin.html'], (_req, res) => res.sendFile(path.join(rootPath, 'admin.html')));
app.use('/src', express.static(path.join(rootPath, 'src')));

// API routes — public routes get the general rate limiter
app.use('/api/products',      publicLimiter, require('./routes/products'));
app.use('/api/orders',        publicLimiter, require('./routes/orders'));
app.use('/api/coupons',       publicLimiter, require('./routes/coupons'));
app.use('/api/contact',       publicLimiter, require('./routes/contact'));
app.use('/api/certificates',  publicLimiter, require('./routes/certificates'));
app.use('/api/analytics',     publicLimiter, require('./routes/analytics'));
app.use('/api/admin/logs',    require('./routes/adminLog'));
app.use('/api/blog',          publicLimiter, require('./routes/blog'));
app.use('/api/refunds',                    require('./routes/refunds'));
app.use('/api/admin/bank-alerts',          require('./routes/bankAlerts'));
// PUBLIC — Kuda calls this directly. Auth is via HMAC-compared secret in
// header, not our admin cookie. Must NOT go behind adminAuth.
app.use('/api/webhooks/kuda',              require('./routes/kudaWebhook'));

// POST /api/admin/event  — lightweight client-side event logger
// The dashboard calls this for actions that happen entirely on the frontend
// (e.g. opening an order detail, overriding the forex rate)
const { adminAuth: _adminAuth } = require('./adminAuth');
const _logEvent = require('./logAdminAction');
app.post('/api/admin/event', _adminAuth, async (req, res) => {
  const { action, details } = req.body;
  if (!action) return res.status(400).json({ error: 'action required' });
  await _logEvent(req.adminName, action, details || '');
  res.json({ ok: true });
});

// Health check — used by dashboard uptime monitor
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: Date.now() });
});

// Public config — exposes non-secret keys needed by the frontend
app.get('/api/config', (req, res) => {
  res.json({
    flutterwaveKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
    helioPayLink:   process.env.HELIO_PAY_LINK         || '',
    testMode:       process.env.TEST_MODE === 'true',
  });
});

// ── Startup migrations ───────────────────────────────────────────────────────
// Idempotent — safe to run on every cold start; uses IF NOT EXISTS / IF NOT EXISTS column
async function runMigrations() {
  try {
    // Migration tracking table — records one-time data migrations so they never re-run
    await pool.queryR(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        key        TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Add status_timeline JSONB column to orders (tracks a timestamped log of every status change)
    await pool.queryR(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_timeline JSONB DEFAULT '[]'`);

    // Variant columns on orders (moved from server/db.js so all migrations live in one place)
    await pool.queryR(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS variant_id        TEXT`);
    await pool.queryR(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS variant_color     TEXT`);
    await pool.queryR(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS variant_storage   TEXT`);
    await pool.queryR(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS variant_color_hex TEXT`);

    // Soft-delete flag on orders (admin "hide" without losing the row)
    await pool.queryR(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_hidden BOOLEAN DEFAULT false`);

    // Variants column on products (JSONB shape: { colors: [...], storages: [...] })
    await pool.queryR(`ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'`);

    // Add sort_order to products for manual drag-to-reorder
    await pool.queryR(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`);

    // Add unique 5-digit marketing code to each product
    await pool.queryR(`ALTER TABLE products ADD COLUMN IF NOT EXISTS code INTEGER UNIQUE`);
    // Assign codes to existing products that don't have one yet
    const { rows: uncodedProds } = await pool.queryR(
      `SELECT id FROM products WHERE code IS NULL ORDER BY created_at ASC`
    );
    if (uncodedProds.length > 0) {
      const { rows: usedCodes } = await pool.queryR(`SELECT code FROM products WHERE code IS NOT NULL`);
      const used = new Set(usedCodes.map(r => Number(r.code)));
      let next = 10000;
      for (const { id } of uncodedProds) {
        while (used.has(next)) next++;
        await pool.queryR(`UPDATE products SET code = $1 WHERE id = $2`, [next, id]);
        used.add(next);
        next++;
      }
      console.log(`[migrations] ✓ assigned 5-digit codes to ${uncodedProds.length} products`);
    }
    // Initialise sort_order from creation order (only for rows still at 0)
    await pool.queryR(`
      UPDATE products SET sort_order = sub.rn
      FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn FROM products WHERE sort_order = 0) sub
      WHERE products.id = sub.id
    `);

    // Certificates table
    await pool.queryR(`
      CREATE TABLE IF NOT EXISTS certificates (
        id                TEXT PRIMARY KEY,
        order_id          TEXT NOT NULL,
        product_index     INTEGER NOT NULL DEFAULT 0,
        product_name      TEXT NOT NULL DEFAULT '',
        product_subtitle  TEXT DEFAULT '',
        variant_color     TEXT,
        variant_storage   TEXT,
        serial_number     TEXT NOT NULL DEFAULT '',
        apple_order_ref   TEXT NOT NULL DEFAULT '',
        chain_of_custody  JSONB NOT NULL DEFAULT '[]',
        status            TEXT NOT NULL DEFAULT 'draft',
        published_at      TIMESTAMPTZ,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        recipient_name    TEXT NOT NULL DEFAULT '',
        recipient_address TEXT NOT NULL DEFAULT '',
        recipient_state   TEXT NOT NULL DEFAULT '',
        usd_price         NUMERIC NOT NULL DEFAULT 0,
        ngn_price         NUMERIC NOT NULL DEFAULT 0,
        forex_rate        NUMERIC NOT NULL DEFAULT 0
      )
    `);

    // Admin activity log table
    await pool.queryR(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id         SERIAL PRIMARY KEY,
        admin_name TEXT        NOT NULL,
        action     TEXT        NOT NULL,
        details    TEXT        NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.queryR(`CREATE INDEX IF NOT EXISTS admin_logs_created_idx ON admin_logs (created_at DESC)`);

    // Analytics events table
    await pool.queryR(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id           BIGSERIAL PRIMARY KEY,
        event_type   VARCHAR(50)  NOT NULL,
        page         VARCHAR(500),
        product_id   VARCHAR(100),
        product_name VARCHAR(255),
        session_id   VARCHAR(100),
        country      VARCHAR(10),
        region       VARCHAR(100),
        city         VARCHAR(150),
        referrer     VARCHAR(500),
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await pool.queryR(`CREATE INDEX IF NOT EXISTS ae_created_idx  ON analytics_events (created_at DESC)`);
    await pool.queryR(`CREATE INDEX IF NOT EXISTS ae_type_idx     ON analytics_events (event_type)`);
    await pool.queryR(`CREATE INDEX IF NOT EXISTS ae_session_idx  ON analytics_events (session_id)`);
    await pool.queryR(`CREATE INDEX IF NOT EXISTS ae_page_idx     ON analytics_events (page)`);

    // One-time: apply 7% selling-price margin to all products
    // Each product's usd_price is multiplied by 1.07 so the 7% markup is baked into what customers pay.
    // Tracked in schema_migrations so it never runs a second time.
    const { rows: pmCheck } = await pool.queryR(
      `SELECT 1 FROM schema_migrations WHERE key = 'price_margin_v1'`
    );
    if (!pmCheck.length) {
      const { rowCount } = await pool.queryR(
        `UPDATE products SET usd_price = ROUND(usd_price * 1.07, 2) WHERE usd_price > 0`
      );
      await pool.queryR(`INSERT INTO schema_migrations (key) VALUES ('price_margin_v1')`);
      console.log(`[migrations] ✓ price_margin_v1: raised usd_price +7% on ${rowCount} products`);
    }

    // Blog posts table
    await pool.queryR(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id                  SERIAL PRIMARY KEY,
        slug                TEXT UNIQUE NOT NULL,
        title               TEXT NOT NULL,
        excerpt             TEXT NOT NULL DEFAULT '',
        category            TEXT NOT NULL DEFAULT 'Buying Guide',
        read_time           TEXT NOT NULL DEFAULT '5 min read',
        post_date           TEXT NOT NULL DEFAULT '',
        featured            BOOLEAN NOT NULL DEFAULT false,
        tags                JSONB NOT NULL DEFAULT '[]',
        related_categories  JSONB NOT NULL DEFAULT '[]',
        emoji               TEXT NOT NULL DEFAULT '📝',
        sections            JSONB NOT NULL DEFAULT '[]',
        published           BOOLEAN NOT NULL DEFAULT true,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Seed blog posts from static data on first run
    const { rows: blogCheck } = await pool.queryR(
      `SELECT 1 FROM schema_migrations WHERE key = 'blog_seed_v1'`
    );
    if (!blogCheck.length) {
      try {
        const { SEED_POSTS } = require('./blogSeed');
        for (const p of SEED_POSTS) {
          await pool.queryR(
            `INSERT INTO blog_posts
               (slug, title, excerpt, category, read_time, post_date, featured,
                tags, related_categories, emoji, sections, published)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             ON CONFLICT (slug) DO NOTHING`,
            [
              p.slug, p.title, p.excerpt || '', p.category || 'Buying Guide',
              p.readTime || '5 min read', p.date || '',
              p.featured || false,
              JSON.stringify(p.tags || []),
              JSON.stringify(p.relatedCategories || []),
              p.emoji || '📝',
              JSON.stringify(p.sections || []),
              true,
            ]
          );
        }
        console.log(`[migrations] ✓ blog_seed_v1: seeded ${SEED_POSTS.length} posts`);
      } catch(e) {
        console.warn('[migrations] blog seed failed:', e.message);
      }
      await pool.queryR(`INSERT INTO schema_migrations (key) VALUES ('blog_seed_v1')`);
    }

    // Seed 6 additional blog posts (blog_seed_v2)
    const { rows: bsv2 } = await pool.queryR(
      `SELECT 1 FROM schema_migrations WHERE key = 'blog_seed_v2'`
    );
    if (!bsv2.length) {
      const NEW_POSTS = [
        { slug:'ipad-buyer-guide-nigeria-2025', title:'Which iPad Should You Buy in Nigeria in 2025?', excerpt:'iPad Air, iPad Pro, or iPad mini? A practical guide to picking the right iPad for your needs and budget in Nigeria.', category:'Buying Guide', readTime:'7 min read', date:'June 2025', featured:false, tags:['iPad','Buying Guide','Nigeria','2025'], relatedCategories:['iPad'], emoji:'🖥️', sections:[{heading:'The iPad Lineup in 2025',body:['Apple sells four iPad lines.','iPad (standard): Entry point, A14/A15 chip, 10.9-inch LCD, starts ~₦350,000–₦550,000.','iPad mini: 8.3-inch, A15, fits in a pocket — ideal for reading and annotation.','iPad Air: M-series chip, 11 or 13-inch, sweet spot for students and professionals.','iPad Pro: M4 chip, ProMotion 120Hz — only for those who need it as a primary computer.']},{heading:'For Students and Everyday Use: iPad Air',body:'The iPad Air M2 or M3 is the best all-around iPad for most Nigerians. Students who use it for note-taking, Zoom, and research get everything they need. It will last 5–7 years with iPadOS updates.'},{heading:'For Readers and Travellers: iPad mini',body:'If portability is the priority — reading books, annotating PDFs, long flights — the iPad mini is unmatched. Main limitation: the keyboard is cramped for sustained typing.'},{heading:'For Professionals: iPad Pro',body:'The iPad Pro exists for people who use it as a primary machine — Procreate professionals, video editors using DaVinci Resolve, architects doing iPad-based drafting. For most others, it is more hardware than needed.'},{heading:'Cellular vs Wi-Fi Only',body:'In Nigeria, iPad cellular connectivity adds ₦100,000–₦150,000 to the price. Most users are better served by a Wi-Fi-only iPad used with their iPhone as a hotspot.'}] },
        { slug:'iphone-16-vs-15-upgrade-nigeria-2025', title:'iPhone 16 vs iPhone 15 in Nigeria — Is It Worth Upgrading?', excerpt:"The iPhone 16 brings Apple Intelligence, a new Camera Control button, and improved battery. But if you have an iPhone 15, should you spend the money?", category:'Buying Guide', readTime:'5 min read', date:'June 2025', featured:false, tags:['iPhone 16','iPhone 15','Upgrade','Nigeria','Comparison'], relatedCategories:['iPhone'], emoji:'📲', sections:[{heading:"What's New in iPhone 16",body:['The iPhone 16 introduces Apple Intelligence — AI features powered by on-device processing. In Nigeria, practical impact is currently lower than in the US.','Camera Control is a physical button dedicated to photography — adjust focus, zoom, and shutter without touching the screen.','The A18 chip is significantly faster. Battery life improved — roughly 1–2 hours longer than the iPhone 15.']},{heading:'What Did Not Change Much',body:'The camera hardware on standard iPhone 16 is incremental over iPhone 15. Same 48MP main camera. Same 6.1-inch Super Retina XDR OLED. Nearly identical design.'},{heading:'Who Should Upgrade from iPhone 15',body:['Upgrade if: You want Camera Control, your iPhone 15 battery has dropped below 80%, or you want Apple Intelligence readiness.','Skip if: You bought your iPhone 15 in the last 12–18 months and your battery is healthy. iPhone 15 receives iOS updates until at least 2028.']},{heading:'Who Should Buy iPhone 16 Fresh',body:'If upgrading from iPhone 12, 13, or older — iPhone 16 is excellent. The jump from 13 to 16 is significant: better camera, USB-C, faster chip, Apple Intelligence.'},{heading:'Price Difference in Nigeria',body:'Through Certo, iPhone 16 costs ~₦50,000–₦80,000 more than the equivalent iPhone 15. For new buyers, the battery improvement often justifies it. For iPhone 15 owners, upgrade only with a specific use case.'}] },
        { slug:'how-to-protect-iphone-nigeria', title:'How to Protect Your iPhone in Nigeria — Cases, Insurance, and Theft Prevention', excerpt:'A high-end iPhone is a significant investment in Nigeria. Practical advice on protecting it from damage, theft, and loss.', category:'Tips & Tricks', readTime:'5 min read', date:'June 2025', featured:false, tags:['iPhone','Protection','Cases','Theft','Nigeria','Tips'], relatedCategories:['iPhone'], emoji:'🔒', sections:[{heading:'Physical Protection: Cases and Screen Protectors',body:'A quality case and tempered glass screen protector are the cheapest insurance available. A ₦5,000–₦15,000 Spigen, OtterBox, or Nomad case protects a ₦1,000,000+ phone from drops that would otherwise cost ₦150,000+ to fix. Avoid generic cases — many leave gaps around corners where impact damage happens.'},{heading:'Enable Find My iPhone',body:['Settings → [Your Name] → Find My → Enable all options.','Find My allows you to track location in real time, remotely lock or erase the phone, and display a message on the locked screen for honest finders.','Thieves in Lagos know that Activation Lock makes a stolen Find My-enabled iPhone essentially worthless.']},{heading:'Anti-Theft Habits in Lagos',body:['Most phone thefts happen at traffic lights and pedestrian crossings.','Keep your phone out of sight at traffic stops. Do not hold it with the window down. Use wrist straps at outdoor events.']},{heading:'iCloud Backup — Always On',body:'Settings → [Your Name] → iCloud → iCloud Backup → turn on. 5GB free storage is not enough — pay ₦299/month for 50GB or ₦999/month for 200GB. Small cost for years of irreplaceable data.'},{heading:'AppleCare+ With Theft and Loss',body:'Covers one device replacement per year if stolen, at $149 through Apple. Find My must have been active at time of theft. Worth serious consideration for Pro model buyers in Lagos.'}] },
        { slug:'apple-id-security-two-factor-nigeria', title:'How to Secure Your Apple ID in Nigeria — Two-Factor Authentication and Account Safety', excerpt:'Your Apple ID controls your iPhone, iCloud data, and Apple Pay. Here is how to lock it down properly against scams and hacks.', category:'Tips & Tricks', readTime:'4 min read', date:'June 2025', featured:false, tags:['Apple ID','Security','Two-Factor','Nigeria','Tips'], relatedCategories:['iPhone','Mac','iPad'], emoji:'🔐', sections:[{heading:'Why Your Apple ID is a High-Value Target',body:"Your Apple ID is the master key to everything Apple: photos, contacts, iMessages, iCloud Drive, App Store purchases, and Apple Pay. In Nigeria, Apple ID scams arrive via SMS ('Your Apple ID has been locked, click here'). These are phishing attempts — Apple will never ask for your password via SMS."},{heading:'Enable Two-Factor Authentication',body:['Settings → [Your Name] → Sign-In & Security → Two-Factor Authentication → Turn On.','Any new device login requires a 6-digit code sent to your phone or displayed on a trusted device. This is one of the most important security settings on any iPhone.']},{heading:'Use a Strong, Unique Password',body:"Your Apple ID password should be 12+ characters, unique (not used elsewhere), and unrelated to your name or birthday. Use the iPhone's built-in password suggestions — Safari generates strong passwords and saves them to iCloud Keychain."},{heading:'Account Recovery Contacts',body:'Settings → [Your Name] → Sign-In & Security → Account Recovery → Add Recovery Contact. Nominate a trusted family member or friend with an Apple device. Invaluable if you are ever locked out.'},{heading:'Before Selling or Repairing Your iPhone',body:['Before handing to a repair shop: sign out of your Apple ID (Settings → [Your Name] → Sign Out).','Before selling: Settings → General → Transfer or Reset iPhone → Erase All Content and Settings. This removes your Apple ID, disables Activation Lock, and wipes personal data.']}] },
        { slug:'macbook-vs-windows-laptop-nigeria-2025', title:'MacBook vs Windows Laptop in Nigeria — An Honest 2025 Comparison', excerpt:'Should you buy a MacBook or a Windows laptop? The honest answer depends on your work, budget, and how you use a laptop in the Nigerian context.', category:'Buying Guide', readTime:'6 min read', date:'June 2025', featured:false, tags:['MacBook','Windows','Laptop','Nigeria','Comparison','2025'], relatedCategories:['Mac'], emoji:'⚖️', sections:[{heading:'What Windows Laptops Get Right',body:'Variety and software compatibility. At ₦300,000–₦600,000, you can get a capable Dell XPS, HP Spectre, or ThinkPad. Better for .NET development, Nigerian enterprise software, payroll/accounting platforms, and government systems that lack Mac versions.'},{heading:'What MacBooks Get Right',body:['Battery life: MacBook Air M3 lasts 15–18 hours in real use. Most Windows laptops last 6–10 hours. Critical for Nigerian conditions — power outages, cafes, long flights.','Performance per watt: M-series chips are the most efficient laptop chips available. MacBook Air handles professional work silently without a fan.','Longevity: Supported with updates for 7+ years. A 2021 MacBook Air still runs the latest macOS in 2025.']},{heading:'The Software Question',body:['Microsoft Office, Google Chrome, Zoom, Slack, Figma, Adobe Creative Cloud — all have excellent Mac versions.','What does NOT run on Mac: Windows games, specific Nigerian enterprise software, Visual Studio (Windows), AutoCAD for Windows.']},{heading:'Price Reality in Nigeria',body:'MacBook Air M2 costs ~₦1,100,000–₦1,400,000 through Certo. Comparable Windows laptops (Dell XPS 13, ThinkPad X1 Carbon) cost ₦850,000–₦1,500,000 from authorised distributors. Premium Windows and MacBook pricing is similar — cheaper Windows options exist, with no comparable MacBook.'},{heading:'Who Should Buy Which',body:['Buy a MacBook if: You are a designer, developer (non-.NET), content creator, or anyone who values battery life and a stable OS.','Buy a Windows laptop if: You need specific Windows software, are on a tight budget, use industry tools like AutoCAD or Revit, or play PC games.']}] },
        { slug:'iphone-water-damage-what-to-do-nigeria', title:'What to Do When Your iPhone Gets Wet — A Step-by-Step Guide', excerpt:'Modern iPhones are water resistant, not waterproof. Here is exactly what to do in the first 30 minutes after your iPhone gets wet — and what not to do.', category:'Tips & Tricks', readTime:'4 min read', date:'June 2025', featured:false, tags:['iPhone','Water Damage','Repairs','Tips','Nigeria'], relatedCategories:['iPhone'], emoji:'💧', sections:[{heading:'Water Resistance Ratings Explained',body:'iPhone 12 and newer have IP68 — tested to 6 metres for 30 minutes in still fresh water. NOT protected against: salt water, pool water (chlorine), soapy water, high-pressure sprays, or impact that cracks the seal. Water resistance degrades over time.'},{heading:'Immediately After Getting Wet',body:['Do not charge it. Wet charging port + electricity = short circuit that permanently damages the logic board.','Do not use a hairdryer or put it in rice. Both are myths — rice does not absorb enough moisture and can push starch dust into ports.','Do: Turn off immediately. Dry outside with soft cloth. Hold the port facing down and gently tap. Leave in a dry, ventilated area at room temperature.']},{heading:'The 24-Hour Rule',body:'Leave the phone off for at least 24 hours before charging. After 24 hours, check the port with a torch — it should look dry and clean. If submerged in salt/pool water, rinse gently with clean fresh water first to remove corrosive chemicals, then dry.'},{heading:'When to See a Repair Shop',body:'If after 24 hours it does not turn on, the screen has patches or discolouration, the speaker sounds muffled, or the port is not recognised — see a technician immediately. Water damage progresses fast in Lagos humidity. Do not wait weeks.'},{heading:'AppleCare+ and Water Damage',body:'Standard Apple Warranty does NOT cover water damage — the Liquid Contact Indicator (red dot inside SIM tray) will void coverage. AppleCare+ covers accidental damage including water damage for $99. Given Lagos rain and humidity, this is one of the strongest arguments for AppleCare+.'}] },
      ];
      try {
        for (const p of NEW_POSTS) {
          await pool.queryR(
            `INSERT INTO blog_posts (slug,title,excerpt,category,read_time,post_date,featured,tags,related_categories,emoji,sections,published)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (slug) DO NOTHING`,
            [p.slug,p.title,p.excerpt||'',p.category||'Buying Guide',p.readTime||'5 min read',p.date||'',p.featured||false,
             JSON.stringify(p.tags||[]),JSON.stringify(p.relatedCategories||[]),p.emoji||'📝',JSON.stringify(p.sections||[]),true]
          );
        }
        console.log(`[migrations] ✓ blog_seed_v2: seeded ${NEW_POSTS.length} additional posts`);
      } catch(e) { console.warn('[migrations] blog_seed_v2 failed:', e.message); }
      await pool.queryR(`INSERT INTO schema_migrations (key) VALUES ('blog_seed_v2')`);
    }

    // Add image_url to blog posts
    await pool.queryR(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT ''`);

    // Refunds table — order_id is plain TEXT (no FK) so records survive order deletion
    await pool.queryR(`
      CREATE TABLE IF NOT EXISTS refunds (
        id              SERIAL PRIMARY KEY,
        order_id        TEXT NOT NULL DEFAULT '',
        customer_name   TEXT NOT NULL DEFAULT '',
        customer_email  TEXT NOT NULL DEFAULT '',
        customer_phone  TEXT NOT NULL DEFAULT '',
        product_name    TEXT NOT NULL DEFAULT '',
        amount_ngn      NUMERIC NOT NULL DEFAULT 0,
        amount_usd      NUMERIC NOT NULL DEFAULT 0,
        reason          TEXT NOT NULL DEFAULT '',
        status          TEXT NOT NULL DEFAULT 'pending',
        payment_method  TEXT NOT NULL DEFAULT 'Bank Transfer',
        bank_name       TEXT NOT NULL DEFAULT '',
        account_number  TEXT NOT NULL DEFAULT '',
        account_name    TEXT NOT NULL DEFAULT '',
        notes           TEXT NOT NULL DEFAULT '',
        issued_by       TEXT NOT NULL DEFAULT '',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.queryR(`CREATE INDEX IF NOT EXISTS refunds_order_idx   ON refunds (order_id)`);
    await pool.queryR(`CREATE INDEX IF NOT EXISTS refunds_status_idx  ON refunds (status)`);
    await pool.queryR(`CREATE INDEX IF NOT EXISTS refunds_created_idx ON refunds (created_at DESC)`);

    // Bank Alerts — cached/synced credit transactions from the Kuda business account.
    // Each row represents one inbound payment alert pulled from Kuda. The
    // transaction_ref column is UNIQUE so re-syncing the same transactions is a no-op.
    await pool.queryR(`
      CREATE TABLE IF NOT EXISTS bank_alerts (
        id              SERIAL PRIMARY KEY,
        transaction_ref TEXT UNIQUE NOT NULL,
        amount_ngn      NUMERIC NOT NULL,
        narration       TEXT NOT NULL DEFAULT '',
        sender_name     TEXT NOT NULL DEFAULT '',
        sender_account  TEXT NOT NULL DEFAULT '',
        sender_bank     TEXT NOT NULL DEFAULT '',
        balance_after   NUMERIC,
        transaction_at  TIMESTAMPTZ NOT NULL,
        matched_order_id TEXT,                                   -- nullable; admin sets this manually
        matched_by      TEXT,                                    -- admin name
        matched_at      TIMESTAMPTZ,
        notes           TEXT NOT NULL DEFAULT '',
        raw             JSONB,                                   -- full original Kuda response, for audit
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.queryR(`CREATE INDEX IF NOT EXISTS bank_alerts_time_idx     ON bank_alerts (transaction_at DESC)`);
    await pool.queryR(`CREATE INDEX IF NOT EXISTS bank_alerts_matched_idx  ON bank_alerts (matched_order_id)`);
    await pool.queryR(`CREATE INDEX IF NOT EXISTS bank_alerts_amount_idx   ON bank_alerts (amount_ngn)`);

    // One-time data fix: early bank_alerts rows were stored in KOBO because
    // we hadn't realised Kuda sends amounts in the smallest currency unit.
    // Divide existing values by 100 so they're in NGN, then mark the
    // migration done so this never runs twice.
    const { rows: koboFixDone } = await pool.queryR(
      `SELECT 1 FROM schema_migrations WHERE key = 'bank_alerts_kobo_fix_v1'`,
    );
    if (!koboFixDone.length) {
      await pool.queryR(`UPDATE bank_alerts SET amount_ngn = amount_ngn / 100`);
      await pool.queryR(`UPDATE bank_alerts SET balance_after = balance_after / 100 WHERE balance_after IS NOT NULL`);
      await pool.queryR(`INSERT INTO schema_migrations (key) VALUES ('bank_alerts_kobo_fix_v1')`);
      console.log('[migrations] ✓ bank_alerts kobo→NGN fix applied');
    }

    console.log('[migrations] ✓ schema up to date');
  } catch (err) {
    console.error('[migrations] error:', err.message);
  }
}
// Fire-and-forget on every cold start — idempotent so safe to run concurrently
runMigrations().catch(() => {});
// ─────────────────────────────────────────────────────────────────────────────

// ── Flutterwave ──────────────────────────────────────────────────────────────

// POST /api/flutterwave/verify — called by the frontend after Flutterwave fires the callback
// Verifies the transaction server-side with Flutterwave's API before promoting the order to confirmed
app.post('/api/flutterwave/verify', async (req, res) => {
  const { transaction_id, orderId } = req.body;
  if (!transaction_id || !orderId) return res.status(400).json({ error: 'Missing transaction_id or orderId' });

  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: 'Flutterwave secret key not configured' });

  try {
    const fRes = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transaction_id)}/verify`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const fData = await fRes.json();

    if (!fRes.ok || fData.status !== 'success' || fData.data?.status !== 'successful') {
      console.warn('[flutterwave] Verification failed for', transaction_id, JSON.stringify(fData?.data?.status));
      return res.status(402).json({ error: 'Payment not confirmed by Flutterwave', detail: fData?.data?.status });
    }

    // Payment verified — promote the order to confirmed + record timestamp in status_timeline
    const { rows } = await pool.queryR(
      `UPDATE orders
       SET status = 'Order Confirmed',
           status_timeline = COALESCE(status_timeline, '[]'::jsonb) ||
             jsonb_build_array(jsonb_build_object('status', 'Order Confirmed', 'timestamp', NOW()::text)),
           updated_at = NOW()
       WHERE id = $1 AND status = 'Payment Pending' RETURNING *`,
      [orderId],
    );

    if (!rows.length) {
      // Already confirmed (double-submit) — safe to treat as success
      return res.json({ ok: true, alreadyConfirmed: true });
    }

    const updated = rows[0];

    // Await the email before responding — on Vercel serverless, fire-and-forget is killed
    // when res.json() closes the response, so the email must complete inside the request lifecycle
    const { sendOrderConfirmation } = require('./email');
    try {
      await sendOrderConfirmation(updated);
      await pool.queryR('UPDATE orders SET email_sent = true WHERE id = $1', [orderId]);
      console.log('[flutterwave] Confirmation email sent for', orderId);
    } catch (err) {
      console.error('[email] confirmation failed for', orderId, ':', err.message);
      // Don't fail the response — payment is confirmed regardless of email
    }

    res.json({ ok: true, order: updated });
  } catch (err) {
    console.error('[flutterwave] verify error:', err.message);
    res.status(500).json({ error: 'Verification request failed' });
  }
});

// POST /api/flutterwave/webhook — Flutterwave server-to-server event notification
// Acts as a redundant confirmation path alongside the frontend verify call
app.post('/api/flutterwave/webhook', express.json(), async (req, res) => {
  // Validate the secret hash sent in the verif-hash header
  const hash       = req.headers['verif-hash'];
  const secretHash = process.env.FLW_SECRET_HASH;
  // Reject if secret is not configured OR hash doesn't match — never accept unsigned webhooks
  if (!secretHash || hash !== secretHash) {
    console.warn('[flutterwave] Webhook rejected — hash missing or mismatch');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = req.body;
  if (event?.event === 'charge.completed' && event?.data?.status === 'successful') {
    // tx_ref format: "CRT-MMDDYY-NNNN-timestamp" — extract the orderId (first 3 segments)
    const txRef  = event?.data?.tx_ref || '';
    const parts  = txRef.split('-');
    const orderId = parts.length >= 3 ? parts.slice(0, 3).join('-') : txRef;

    if (orderId) {
      try {
        // Only promotes if still Payment Pending — idempotent if already confirmed by frontend
        const { rows } = await pool.queryR(
          `UPDATE orders
           SET status = 'Order Confirmed',
               status_timeline = COALESCE(status_timeline, '[]'::jsonb) ||
                 jsonb_build_array(jsonb_build_object('status', 'Order Confirmed', 'timestamp', NOW()::text)),
               updated_at = NOW()
           WHERE id = $1 AND status = 'Payment Pending' RETURNING *`,
          [orderId],
        );
        if (rows.length) {
          const { sendOrderConfirmation } = require('./email');
          try {
            await sendOrderConfirmation(rows[0]);
            await pool.queryR('UPDATE orders SET email_sent = true WHERE id = $1', [orderId]);
            console.log('[flutterwave] Webhook confirmed order + email sent for', orderId);
          } catch (err) {
            console.error('[email] webhook confirmation failed for', orderId, ':', err.message);
          }
        }
      } catch (err) {
        console.error('[flutterwave] Webhook DB error:', err.message);
      }
    }
  }

  res.json({ ok: true }); // always 200 so Flutterwave doesn't retry
});
// ─────────────────────────────────────────────────────────────────────────────

// MoonPay support removed in favour of the manual "DM us on WhatsApp" USD/crypto flow.
// If MoonPay ever returns, restore from git history (commit before this one) — the URL
// signing endpoint, the /moonpay-confirm route, and the env vars (MOONPAY_PUBLIC_KEY /
// MOONPAY_SECRET_KEY / MOONPAY_WALLET / MOONPAY_SANDBOX) are all gone.

// Image proxy — proxies any https:// image URL; adds Apple Referer for Apple CDN URLs
// In-memory cache: avoids re-fetching on every request / server restart
const imgCache = new Map(); // normalizedUrl → { buf, ct, ts }
const IMG_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

app.get('/api/img', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('https://')) {
    return res.status(400).end();
  }

  const isAppleCDN = url.startsWith('https://store.storeimages.cdn-apple.com');

  // For Apple CDN images: strip ALL query params (fmt=webp / traceId cause 404s)
  // and request a clean 800px JPEG — works reliably across all Apple Scene7 URLs
  let fetchUrl;
  if (isAppleCDN) {
    try {
      const u = new URL(url);
      u.search = '';
      u.searchParams.set('wid', '800');
      u.searchParams.set('hei', '800');
      u.searchParams.set('fmt', 'jpeg');
      fetchUrl = u.toString();
    } catch (_) {
      fetchUrl = url;
    }
  } else {
    fetchUrl = url;
  }

  const cached = imgCache.get(fetchUrl);
  if (cached && Date.now() - cached.ts < IMG_CACHE_TTL) {
    res.setHeader('Content-Type', cached.ct);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    return res.end(cached.buf);
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept':     'image/webp,image/apng,image/*,*/*;q=0.8',
    };
    // Apple CDN blocks hotlinks without a Referer from apple.com
    if (isAppleCDN) headers['Referer'] = 'https://www.apple.com/';

    const upstream = await fetch(fetchUrl, { headers, signal: AbortSignal.timeout(10000) });
    if (!upstream.ok) return res.status(upstream.status).end();
    const ct  = upstream.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await upstream.arrayBuffer());
    imgCache.set(fetchUrl, { buf, ct, ts: Date.now() });
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.end(buf);
  } catch (err) {
    res.status(502).end();
  }
});

// Forex proxy — avoid CORS issues from client
// Tries multiple free APIs in order; falls back to a hardcoded rate so it never 500s
const FOREX_APIS = [
  // Open ER-API — free, no key, reliable v6 endpoint
  { url: 'https://open.er-api.com/v6/latest/USD', extract: d => d?.rates?.NGN },
  // ExchangeRate-API v4 — free open access, no key needed
  { url: 'https://api.exchangerate-api.com/v4/latest/USD', extract: d => d?.rates?.NGN },
  // Fawaz Ahmed's free CDN-backed rates
  { url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', extract: d => d?.usd?.ngn },
];
// Hardcoded last-resort — keeps the UI functional even when all live APIs are down.
// Update this periodically to stay approximate.
const FOREX_FALLBACK = 1620;

// Margin added on top of the live USD→NGN buying rate. Covers FX volatility
// between order time and Apple-US settlement, plus card-clearing slippage.
// Was ₦100 originally; reduced to ₦50 (2026-06) to pass the buffer down to
// customers now that supply pipeline is more predictable.
const FOREX_MARKUP_NGN = 50;

app.get('/api/forex', async (req, res) => {
  for (const { url, extract } of FOREX_APIS) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!resp.ok) continue;
      const data = await resp.json();
      const ngn  = extract(data);
      if (ngn && Number(ngn) > 0) {
        const marketRate = Math.round(Number(ngn));
        return res.json({
          rate:       marketRate + FOREX_MARKUP_NGN, // what customers see
          marketRate,                                // raw inter-bank rate
          markup:     FOREX_MARKUP_NGN,              // single source of truth
        });
      }
    } catch (err) {
      console.warn('[forex] API failed:', url, err.message);
    }
  }
  // All live APIs failed — serve the hardcoded fallback rather than a 500
  console.warn('[forex] All APIs failed — serving hardcoded fallback rate', FOREX_FALLBACK);
  res.json({
    rate:       FOREX_FALLBACK,
    marketRate: FOREX_FALLBACK - FOREX_MARKUP_NGN,
    markup:     FOREX_MARKUP_NGN,
    fallback:   true,
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.queryR('SELECT 1');
    res.json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Shared HTML-attribute escaper for OG tag injection
const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// /product/:id — inject OG meta tags into index.html for social link previews
// Crawlers see image/title; browsers load the SPA and React navigates to the product
app.get('/product/:id', async (req, res) => {
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  try {
    const { rows } = await pool.queryR(
      'SELECT id, name, subtitle, image_urls, category, usd_price FROM products WHERE id = $1',
      [req.params.id],
    );
    const p = rows[0];
    if (!p) return res.sendFile(indexPath);

    const rawImg  = (p.image_urls && p.image_urls[0]) || '';
    const cleanImg = rawImg ? rawImg.replace(/[&?]\.v=[^&]*/, '') : '';
    // Route Apple CDN images through our proxy so crawlers can fetch them
    // (Apple CDN blocks direct hotlinks without a Referer from apple.com)
    const image = cleanImg
      ? `https://certo.ng/api/img?url=${encodeURIComponent(cleanImg)}`
      : 'https://certo.ng/logo.png';
    const title    = p.name + (p.subtitle ? ` – ${p.subtitle}` : '');
    const desc     = `Buy genuine ${p.name} from Apple US, delivered to Nigeria. $${Number(p.usd_price).toLocaleString()} USD. Serial verified. Full Apple warranty.`;
    const url      = `https://certo.ng/product/${p.id}`;
    const keywords = `buy ${p.name} Nigeria, ${p.name} price Nigeria, genuine ${p.name} Nigeria, Apple ${p.category} Nigeria, Certo Nigeria, Apple products Nigeria`;

    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: title,
      description: desc,
      url,
      image,
      brand: { '@type': 'Brand', name: 'Apple' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: String(p.usd_price),
        availability: 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: 'Certo', url: 'https://certo.ng' },
      },
    });

    const ogTags = [
      `<title>${esc(title)} | Certo</title>`,
      `<meta name="description"         content="${esc(desc)}"/>`,
      `<meta name="keywords"            content="${esc(keywords)}"/>`,
      `<link rel="canonical"            href="${url}"/>`,
      `<meta property="og:type"         content="product"/>`,
      `<meta property="og:url"          content="${url}"/>`,
      `<meta property="og:title"        content="${esc(title)} | Certo"/>`,
      `<meta property="og:description"  content="${esc(desc)}"/>`,
      `<meta property="og:image"        content="${image}"/>`,
      `<meta property="og:image:width"  content="800"/>`,
      `<meta property="og:image:height" content="800"/>`,
      `<meta name="twitter:card"        content="summary_large_image"/>`,
      `<meta name="twitter:title"       content="${esc(title)} | Certo"/>`,
      `<meta name="twitter:description" content="${esc(desc)}"/>`,
      `<meta name="twitter:image"       content="${image}"/>`,
      `<script type="application/ld+json">${jsonLd}</script>`,
    ].join('\n  ');

    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    const html = fs.readFileSync(indexPath, 'utf8').replace('</head>', `  ${ogTags}\n</head>`);
    res.send(html);
  } catch (err) {
    res.sendFile(indexPath);
  }
});

// /blog/:slug and /guides/:slug — inject OG + JSON-LD for blog post link previews
async function serveBlogPostPage(req, res) {
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  try {
    const { rows } = await pool.queryR(
      `SELECT slug, title, excerpt, category, emoji, post_date, image_url, tags, updated_at
       FROM blog_posts WHERE slug = $1 AND published = true`,
      [req.params.slug],
    );
    const p = rows[0];
    if (!p) return res.sendFile(indexPath);

    const title    = p.title;
    const desc     = p.excerpt || '';
    const url      = `https://certo.ng/blog/${p.slug}`;
    const image    = p.image_url || 'https://certo.ng/logo.png';
    const hasImg   = !!p.image_url;
    const tags     = Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? JSON.parse(p.tags || '[]') : []);
    const keywords = [...tags, p.category, 'Apple Nigeria', 'genuine Apple', 'Certo Nigeria', 'buy Apple Nigeria'].filter(Boolean).join(', ');

    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: desc,
      url,
      image,
      datePublished: p.post_date || '',
      dateModified: p.updated_at ? new Date(p.updated_at).toISOString() : '',
      keywords,
      publisher: {
        '@type': 'Organization',
        name: 'Certo',
        url: 'https://certo.ng',
        logo: { '@type': 'ImageObject', url: 'https://certo.ng/logo.png' },
      },
    });

    const ogTags = [
      `<title>${esc(title)} | Certo Guides</title>`,
      `<meta name="description" content="${esc(desc)}"/>`,
      `<meta name="keywords"    content="${esc(keywords)}"/>`,
      `<link rel="canonical"    href="${url}"/>`,
      `<meta property="og:type"         content="article"/>`,
      `<meta property="og:url"          content="${url}"/>`,
      `<meta property="og:title"        content="${esc(title)} | Certo"/>`,
      `<meta property="og:description"  content="${esc(desc)}"/>`,
      `<meta property="og:image"        content="${image}"/>`,
      hasImg ? `<meta property="og:image:width"  content="1200"/>` : '',
      hasImg ? `<meta property="og:image:height" content="630"/>` : '',
      `<meta name="twitter:card"        content="${hasImg ? 'summary_large_image' : 'summary'}"/>`,
      `<meta name="twitter:title"       content="${esc(title)} | Certo"/>`,
      `<meta name="twitter:description" content="${esc(desc)}"/>`,
      `<meta name="twitter:image"       content="${image}"/>`,
      `<script type="application/ld+json">${jsonLd}</script>`,
    ].filter(Boolean).join('\n  ');

    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    const html = fs.readFileSync(indexPath, 'utf8').replace('</head>', `  ${ogTags}\n</head>`);
    res.send(html);
  } catch (err) {
    res.sendFile(indexPath);
  }
}

app.get('/blog/:slug',   serveBlogPostPage);
app.get('/guides/:slug', serveBlogPostPage);

// /sitemap.xml — dynamic sitemap for all indexable pages
app.get('/sitemap.xml', async (req, res) => {
  try {
    const base = 'https://certo.ng';
    const toDate = (d) => d ? new Date(d).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const [posts, products] = await Promise.all([
      pool.queryR(`SELECT slug, updated_at FROM blog_posts WHERE published = true ORDER BY updated_at DESC`),
      pool.queryR(`SELECT id, updated_at FROM products ORDER BY updated_at DESC`),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const staticPages = [
      { path: '/',                        priority: '1.0', freq: 'weekly',  lastmod: today },
      { path: '/shop',                    priority: '0.9', freq: 'daily',   lastmod: today },
      { path: '/shop/iPhone',             priority: '0.9', freq: 'daily',   lastmod: today },
      { path: '/shop/MacBook',            priority: '0.9', freq: 'daily',   lastmod: today },
      { path: '/shop/iMac',               priority: '0.8', freq: 'weekly',  lastmod: today },
      { path: '/shop/iPad',               priority: '0.8', freq: 'weekly',  lastmod: today },
      { path: '/shop/AirPods',            priority: '0.7', freq: 'weekly',  lastmod: today },
      { path: '/shop/Watch',              priority: '0.7', freq: 'weekly',  lastmod: today },
      { path: '/shop/Apple%20TV',         priority: '0.6', freq: 'monthly', lastmod: today },
      { path: '/shop/HomePod',            priority: '0.6', freq: 'monthly', lastmod: today },
      { path: '/shop/Accessories',        priority: '0.6', freq: 'monthly', lastmod: today },
      { path: '/guides',                  priority: '0.8', freq: 'weekly',  lastmod: today },
      { path: '/how-it-works',            priority: '0.7', freq: 'monthly' },
      { path: '/about',                   priority: '0.6', freq: 'monthly' },
      { path: '/faq',                     priority: '0.6', freq: 'monthly' },
      { path: '/contact',                 priority: '0.5', freq: 'monthly' },
      { path: '/track',                   priority: '0.5', freq: 'monthly' },
      { path: '/verify',                  priority: '0.5', freq: 'monthly' },
      { path: '/privacy',                 priority: '0.3', freq: 'yearly'  },
      { path: '/terms',                   priority: '0.3', freq: 'yearly'  },
      { path: '/refund',                  priority: '0.4', freq: 'monthly' },
      { path: '/aml',                     priority: '0.3', freq: 'yearly'  },
    ];

    const urlXml = (loc, lastmod, freq, priority) => [
      '  <url>',
      `    <loc>${loc}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
      `    <changefreq>${freq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].filter(Boolean).join('\n');

    const urls = [
      ...staticPages.map(p => urlXml(`${base}${p.path}`, p.lastmod || '', p.freq, p.priority)),
      ...products.rows.map(r => urlXml(`${base}/product/${r.id}`, toDate(r.updated_at), 'weekly', '0.8')),
      ...posts.rows.map(r => urlXml(`${base}/blog/${r.slug}`, toDate(r.updated_at), 'monthly', '0.7')),
    ];

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`);
  } catch (err) {
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// On Vercel: export the app for serverless invocation (no persistent process)
// Locally: start the HTTP server and keep the DB warm with periodic pings
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`Certo server running on http://localhost:${PORT}`);
    setInterval(() => {
      pool.queryR('SELECT 1').catch(() => {});
    }, 4 * 60 * 1000);
  });
}
