# Certo Admin Guide

## How the Admin System Works

Certo uses a **stateless, token-based** auth system. There is no admin database table.  
Admins are defined entirely in environment variables — adding or removing an admin is a one-line env change followed by a redeploy.

When a correct password is submitted at `/dashboard`, the server generates a signed 30-day JWT-style token that embeds the admin's display name. That name appears in every activity log entry they create.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `ADMIN_ACCOUNTS` | Comma-separated list of `Name:password` pairs |
| `ADMIN_SECRET` | Secret key used to sign and verify tokens — never share this |

---

## Adding a New Admin

### Step 1 — Choose a name and password

Pick a **display name** (shown in the activity log) and a **strong password**.  
The name must not contain a colon (`:`).

Example:
```
Name:     Emmanuella
Password: correcthorse-battery-staple
```

### Step 2 — Update `ADMIN_ACCOUNTS` in your environment

Open your hosting provider's environment variable settings (Vercel → Project → Settings → Environment Variables).

The format is:

```
Name1:password1,Name2:password2,Name3:password3
```

**Before:**
```
ADMIN_ACCOUNTS=Chidile:mypassword123
```

**After (new admin added):**
```
ADMIN_ACCOUNTS=Chidile:mypassword123,Emmanuella:correcthorse-battery-staple
```

> There are **no spaces** around the comma. Spaces inside a name or password are allowed.

### Step 3 — Redeploy

The env change takes effect on the next deployment. On Vercel, trigger a redeploy from the dashboard or push a commit.

### Step 4 — Send the new admin their credentials

Share with them:
- The dashboard URL: `https://certo.ng/dashboard`
- Their password (use a secure channel — WhatsApp, Signal, etc.)
- Let them know their display name so they can recognise their entries in the activity log.

---

## Removing an Admin

Remove their `Name:password` entry from `ADMIN_ACCOUNTS` and redeploy.  
Any tokens they previously received will be rejected immediately because the password no longer exists in the accounts list — **no token revocation step needed**.

---

## Changing an Admin's Password

Update their entry in `ADMIN_ACCOUNTS` (same name, new password) and redeploy.  
Their old token will stop working on the next login attempt — they will need to log in again with the new password.

---

## Changing the `ADMIN_SECRET`

`ADMIN_SECRET` is used to sign all tokens. If you rotate it:

1. Update `ADMIN_SECRET` in your environment variables.
2. Redeploy.
3. **All existing sessions are immediately invalidated** — every admin will be logged out and must sign in again.

Do this if you suspect the secret has been compromised.

---

## Current Admin Accounts

To see who has access, check the `ADMIN_ACCOUNTS` environment variable in your Vercel project settings. Do not commit this value to git.

---

## Activity Log

Every admin action (order status changes, product edits, log clears, sign-ins) is recorded in the **Activity Log** tab of the dashboard under the admin's display name. If you see an action attributed to an unfamiliar name, check `ADMIN_ACCOUNTS` immediately.
