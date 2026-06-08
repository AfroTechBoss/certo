// ─── Certo Blog / Guide Posts ─────────────────────────────────────────────────
//
// The post data lives in ./blogPosts.json. This file just re-exports it +
// supplies helper functions for the client.
//
// SINGLE SOURCE OF TRUTH — when adding/editing posts:
//   1. Edit blogPosts.json
//   2. The seed script (server/blogSeed.js) reads the same JSON file, so the
//      server and the client stay in sync automatically.
//
// Post shape: { slug, title, excerpt, category, readTime, date, tags,
//               relatedCategories, featured, emoji, sections[] }
// Sections:   { heading?, body: string | string[] }
// ─────────────────────────────────────────────────────────────────────────────

import blogData from './blogPosts.json';

export const BLOG_CATEGORIES = blogData.categories;
export const BLOG_POSTS      = blogData.posts;

// Get all posts in a given category
export const getPostsByCategory = (category) =>
  BLOG_POSTS.filter(p => p.category === category);

// Get related posts for a product category (random shuffle, falls back to
// featured if nothing matches)
export const getRelatedPosts = (productCategory, count = 3) => {
  const matching = BLOG_POSTS.filter(p =>
    (p.relatedCategories || []).includes(productCategory)
  );
  const shuffled = [...matching].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).length
    ? shuffled.slice(0, count)
    : BLOG_POSTS.filter(p => p.featured).slice(0, count);
};

// Get the first N featured/homepage posts (falls back to non-featured to pad)
export const getFeaturedPosts = (count = 3) => {
  const featured = BLOG_POSTS.filter(p => p.featured);
  const rest     = BLOG_POSTS.filter(p => !p.featured);
  return [...featured, ...rest].slice(0, count);
};
