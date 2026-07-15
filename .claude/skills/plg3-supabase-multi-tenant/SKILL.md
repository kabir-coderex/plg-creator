---
name: plg3-supabase-multi-tenant
description: Multi-tenant Supabase conventions for PLG 3.0 — RLS patterns, SECURITY DEFINER function grants, org-scoping rules, and the auth client/proxy setup. Use before writing any migration, RLS policy, or Postgres function in this repo.
metadata:
  version: "1.0.0"
  project: PLG 3.0
---

# PLG 3.0 — Supabase Multi-Tenant Conventions

This platform is multi-tenant: **creators are tenants** (`organizations`), not us. Every table holding tenant data must be RLS-scoped to org membership, no exceptions — see `[[plg3-add-module]]` for the full per-module checklist this feeds into.

## Core schema (already applied, M1)

- `organizations` — one per creator business.
- `profiles` — 1:1 extension of `auth.users`, auto-created via the `on_auth_user_created` trigger on signup. Never insert into this manually from app code.
- `memberships` — org ↔ user, with `role` (`owner` | `admin` | `instructor` | `assistant` | `support`). Unique on `(org_id, user_id)`.

Every new tenant-data table (courses, funnels, pages, orders, ...) gets an `org_id uuid not null references public.organizations(id) on delete cascade` column and RLS scoped through it.

## RLS helper functions — the pattern, and the bug to not repeat

Two `SECURITY DEFINER` helpers exist so RLS policies avoid recursive self-joins on `memberships`:

```sql
public.get_user_org_ids() returns setof uuid   -- org ids the caller belongs to
public.is_org_admin(check_org_id uuid) returns boolean  -- caller is owner/admin of that org
```

Policies use them like: `using (org_id in (select public.get_user_org_ids()))`.

**Critical gotcha, found live during M1 verification:** RLS policies invoke these helper functions *as the querying role* (`authenticated` or `anon`), not as the function owner. If you `REVOKE EXECUTE` on a helper function from `authenticated` to "lock it down" (e.g. in response to a Supabase security advisor warning), you silently break **every RLS policy that calls it** — even the legitimate data owner gets `permission denied for function ...` instead of their own rows.

The fix that was applied: grant `EXECUTE` on `get_user_org_ids()` / `is_org_admin(uuid)` to **both** `authenticated` and `anon`. This is safe because both functions are keyed off `auth.uid()` — for `anon` that's `null`, so they return empty/false regardless, giving a clean empty result instead of a permission error. Only *mutating* `SECURITY DEFINER` functions (like `create_organization_with_owner`) should have `anon` fully revoked.

**Rule of thumb:**
- Read-only helper functions used inside RLS policies → grant `EXECUTE` to `authenticated` (and usually `anon`, for clean empty results rather than errors).
- Mutating `SECURITY DEFINER` functions (RPCs that write data) → grant `EXECUTE` only to the roles that should be able to call them (usually `authenticated` only, never `anon`), and make them check `auth.uid() is null` internally regardless.
- After any privilege change, re-run `mcp__supabase__get_advisors({type: "security"})` **and** re-verify with a live query as both an authenticated test user and `anon` — the advisor alone won't catch "I broke RLS for legitimate users," only "this function is publicly callable."

## Org creation is RPC-only, never direct insert

`organizations` and `memberships` both have `insert` policies of `with check (false)` — direct client inserts are blocked entirely. Org creation goes through `create_organization_with_owner(org_name text, org_slug text)`, a `SECURITY DEFINER` RPC that atomically inserts the org + owner membership in one transaction. Follow this pattern for any future "create X and immediately grant access to the creator" flow — don't allow a bare insert that could leave an orphaned row if the second insert fails.

## Auth client setup (already built, don't re-derive)

- `src/lib/supabase/client.ts` — browser client (`createBrowserClient`).
- `src/lib/supabase/server.ts` — Server Component/Action client (`createServerClient`, `getAll`/`setAll` cookies, `await cookies()`).
- `src/lib/supabase/proxy.ts` — `updateSession()`, called from root `src/proxy.ts`. Redirects unauthenticated users away from `/dashboard` and `/onboard`, and authenticated-but-orgless users toward `/onboard`. Uses `supabase.auth.getClaims()`, not `getSession()` (per Supabase's own guidance — `getSession()` isn't guaranteed to revalidate the token).
- `src/lib/dal.ts` — the Data Access Layer: `getAuthedUser()` (redirects to `/login` if unauthenticated) and `getUserMemberships()` (real org list for the current user). Use this from Server Components instead of calling Supabase directly — keeps the auth check in one place.

## Verifying RLS changes — do it live, not just via advisor

`mcp__supabase__get_advisors({type: "security"})` catches "is this exposed publicly" but not "did I just break access for legitimate users." When you change RLS policies or function grants, verify against the real project:

1. Sign up a test user via the Auth REST API directly (`POST {project_url}/auth/v1/signup` with the publishable key) — don't use `example.com`/`test.com` style domains, this project's validator rejects them; use a plus-alias on a real domain you control instead.
2. If email confirmation is on, you'll get a user with no session — either have it turned off for dev, or get the service-role key to admin-confirm.
3. Call the relevant RPC/query as that user (`Authorization: Bearer <access_token>`) and separately as `anon` (`Authorization: Bearer <publishable_key>`), and confirm: the owner sees exactly their own data, `anon` sees an empty result (not a permission error), and direct inserts anon shouldn't be able to make are rejected.
4. Clean up test rows from `public` schema tables afterward via `mcp__supabase__execute_sql`. Test rows in `auth.users` need the service-role key or the dashboard to remove — leaving a couple of harmless test accounts is fine, don't chase it without that key.

## Stripe is per-creator, not us

Not Supabase-specific, but the same tenant-isolation principle applies to Stripe (M5): each org connects its own Stripe account via Connect (OAuth). We store `stripe_account_id` per org, never a creator's secret key. The only Stripe key in `.env` is the platform's own, used to drive the Connect flow. See `docs/Milestone.md` for the full model.
