// ─── Blog seed loader (CommonJS) ─────────────────────────────────────────────
//
// Reads the same JSON file the client uses (src/data/blogPosts.json), so the
// server-side seed and the client-side fallback never go out of sync.
//
// Used by runMigrations() in server/index.js on first deploy to populate the
// blog_posts table.
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');

// Resolve the JSON from the project root regardless of where the server is
// started from. require() of .json is native in Node and safe across cold
// starts (cached after first read).
const blogJsonPath = path.join(__dirname, '..', 'src', 'data', 'blogPosts.json');
const data = require(blogJsonPath);

// Backwards-compatible export. The shape matches what blog_seed_v1 in
// runMigrations() expects: an array of POST objects.
const SEED_POSTS = data.posts || [];

module.exports = { SEED_POSTS };
