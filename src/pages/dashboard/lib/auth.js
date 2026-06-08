// ─── Admin auth helpers ──────────────────────────────────────────────────────
// Token + name live in sessionStorage so they're cleared when the tab closes.

export const TOKEN_KEY = 'certo_admin_token';
export const NAME_KEY  = 'certo_admin_name';

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const getName  = () => sessionStorage.getItem(NAME_KEY) || 'Admin';

// Fetch wrapper that attaches the bearer token and auto-logs-out on 401.
export async function authFetch(url, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...opts, headers });
  if (res.status === 401) {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(NAME_KEY);
    window.location.reload();
    throw new Error('Session expired');
  }
  return res;
}
