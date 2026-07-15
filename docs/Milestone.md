# PLG 3.0 — Milestones

Tracks step-by-step build order. One milestone active at a time. Update status as work lands.

Status legend: `done` / `in-progress` / `next` / `blocked` / `todo`

## Platform Model (read before building anything)

- **Multi-tenant.** This platform is not for us — it's for creators (tenants). Each creator runs their own business (courses, funnels, students) inside their own org. We never hard-code "our" data.
- **MCP is the primary interface, web is secondary.** Every module ships an MCP tool *at the same time* as its web UI, not after. A creator should be able to do everything by talking to Claude/Gemini/Cursor/Codex/CLI; the dashboard is for reviewing/refining.
- **Stripe is per-creator, via Stripe Connect — not raw API keys in env.** Each org connects their own Stripe account (OAuth onboarding, Connect Standard/Express). We store `stripe_account_id` (+ minimal metadata) per org in the DB. The only Stripe key in `.env` is the *platform's own* key, used to drive the Connect flow (create account links, process on-behalf-of charges) — never a creator's secret key. Same pattern applies later to any other creator-owned integration (their own Resend/domain, etc.) if needed.

---

## M0 — Project Scaffold
**Status: done**

- [x] Next.js 16 (App Router) + TypeScript + Tailwind v4
- [x] shadcn/ui (base-ui variant) installed
- [x] Route groups: `(marketing)`, `(auth)`, `(dashboard)`
- [x] Dashboard shell: sidebar (all PRD modules), topbar, command palette (⌘K, stub)
- [x] Placeholder pages for all 17 dashboard modules
- [x] Git initialized, first commit

---

## M1 — Supabase Foundation
**Status: done**

- [x] Supabase project created (`jyjwkarxefvsdfmavdbp`), MCP connected
- [x] `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` pulled via MCP into `.env.local`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — **needs to be pasted in by user** (secret, MCP won't expose it; not required for M1, only for future admin-side operations)
- [x] `@supabase/supabase-js` + `@supabase/ssr` client setup (`src/lib/supabase/client.ts`, `server.ts`, `proxy.ts`)
- [x] Core multi-tenant schema applied (via `mcp__supabase__apply_migration`):
  - `organizations` (a tenant — one per creator business)
  - `profiles` (extends `auth.users`, auto-created via `on_auth_user_created` trigger)
  - `memberships` (org ↔ user, role: owner/admin/instructor/assistant/support)
- [x] Row Level Security on all three tables
- [x] `create_organization_with_owner(name, slug)` RPC — atomic org + owner membership, `SECURITY DEFINER`, locked to `authenticated` role only
- [x] Auth: real Supabase Auth wired into login/signup (Server Actions, `useActionState`)
- [x] `/onboard` page: collects business name, calls the RPC, redirects to `/dashboard`
- [x] `proxy.ts` (Next 16's renamed `middleware.ts`): refreshes session, redirects unauthenticated → `/login`, redirects authenticated-but-orgless → `/onboard`
- [x] Dashboard layout (`(dashboard)/layout.tsx`): server-side fetch of real memberships, redirects to `/onboard` if none
- [x] Org switcher (topbar): real membership data, shows org name + role, sign-out wired

**Verified (live, against the real project):**
- `tsc --noEmit` clean, `eslint` clean (pre-existing shadcn boilerplate warning aside)
- Unauthenticated `curl /dashboard` → 307 to `/login` (`proxy.ts` working)
- Signup → `on_auth_user_created` trigger fires → `profiles` row created correctly
- `create_organization_with_owner` RPC → org + owner membership created atomically
- RLS: the owner sees exactly their own org via the membership join; `anon` sees an empty result on the same query; `anon` insert into `organizations` is rejected
- Test data (2 test signups, 1 org, memberships, profiles) cleaned from `public` schema after verification. Two leftover `auth.users` rows (your own `+m1verify`/`+m1verify2` aliases on linno.io) remain — harmless, delete from the dashboard's Authentication → Users list if you want them gone.

**Bug found + fixed during verification:** the advisor-driven lockdown migration revoked `EXECUTE` on `get_user_org_ids`/`is_org_admin` from `authenticated` too, which broke every RLS policy using them (RLS evaluates helper functions as the querying role). Fixed by re-granting `authenticated` (and `anon`, so the policy check evaluates to an empty result instead of erroring). Both functions only ever return data scoped to the caller's own `auth.uid()`, so this is safe — `get_advisors` still flags them as technically callable via RPC, which is an accepted, verified-safe tradeoff.

**Also surfaced, not yet acted on:** `get_advisors` flags "Leaked Password Protection Disabled" (HaveIBeenPwned check) on this project — a pre-existing default, unrelated to this work, worth enabling later (Auth settings in the dashboard).

**Exit criteria met:** a creator can sign up, gets their own org, and all dashboard reads/writes are RLS-scoped to it.

---

## M2 — MCP Server Skeleton (moved up — MCP is primary, not an afterthought)
**Status: done**

- [x] MCP server scaffold — `src/app/api/mcp/route.ts`, hosted HTTP (Streamable HTTP transport, `@modelcontextprotocol/sdk`), stateless (fresh `McpServer` + `WebStandardStreamableHTTPServerTransport` per request — see decision #2 resolved below)
- [x] Auth: per-org API key. `api_keys` table (org-scoped, RLS: members read, owner/admin create/revoke), keys stored only as a `sha256` hash + short prefix (`src/lib/api-keys.ts`); creator generates one in `/dashboard/admin/api-keys` (plaintext shown once, in a dismissable dialog)
- [x] `whoami` / `list_organizations` tools (`src/lib/mcp/server.ts`) — prove the auth + org-scoping loop end to end
- [x] Tool response format standardized: zod `inputSchema`/`outputSchema` per tool, permission-checked via `requireAuth()` against the resolved API-key org context, example prompt/response documented as comments above each tool registration (per blueprint Volume 4)

**Key architecture decision:** MCP callers aren't Supabase-authenticated users (no session/JWT), so the normal `get_user_org_ids()`/RLS-as-`authenticated` path doesn't apply. Added `public.authenticate_api_key(p_key_hash text)`, a `SECURITY DEFINER` RPC granted to `anon` — it looks up the key by hash, stamps `last_used_at`, and returns the org context only on an exact non-revoked hash match (same trust model as any bearer-token check). `src/lib/mcp/auth.ts` calls this via an unauthenticated `@supabase/supabase-js` client (publishable key only). This sidesteps needing `SUPABASE_SERVICE_ROLE_KEY` (still unset — see decision #1) for M2's scope; **future modules' MCP tools (M3+) will need a real decision** on whether every org-scoped mutation gets its own `SECURITY DEFINER` RPC (consistent with this pattern) or whether to introduce a service-role-backed path once that key is available.

**Verified (live, against the real project):**
- Migration + `authenticate_api_key` applied via `mcp__supabase__apply_migration`; `get_advisors({type:"security"})` shows only the same pre-existing accepted warnings from M1, nothing new
- Live as a real signed-up owner: insert own org's API key succeeds (RLS `is_org_admin`), select shows exactly that org's keys; as `anon`: insert rejected (401), select empty
- `authenticate_api_key` as `anon`: correct hash → org context + `last_used_at` stamped; wrong hash → empty; after revoking (`revoked_at` set) → empty again
- Local dev server, real HTTP calls to `/api/mcp`: no `Authorization` header → 401; wrong key → 401; valid key → `initialize` handshake succeeds, `tools/list` returns both tools with schemas, `tools/call` for `whoami` and `list_organizations` both return correct org-scoped `structuredContent`; revoked key → 401 on the next call
- `tsc --noEmit` clean, `eslint` clean (same pre-existing shadcn boilerplate warning as M1 aside)
- All test orgs/keys/rows cleaned from `public` schema after verification (test `auth.users` rows left, same as M1 — harmless `+m2verify`/`+m2mcp` aliases on linno.io)

**Exit criteria met:** a creator can point Claude Desktop (or any MCP-speaking AI client) at their own API key and get back their own org data — nothing else.

**Prototype-only addendum — `signup` tool (added 2026-07-15, not in the original checklist):** added a `signup` MCP tool that is callable with **no API key at all** — the sole exception to "every tool requires org context." It creates a Supabase Auth user + org (via the existing `create_organization_with_owner` RPC) + a fresh API key in one call, so an AI client can bootstrap a brand new creator end-to-end without a human touching the dashboard first. `organization_name` is required; `email`/`password` are optional — if omitted, a placeholder email (`@creators.plg3.invalid`, not a real inbox) and a strong random password are generated and returned in the response, once.

This is an explicit, discussed security tradeoff for a no-bots/no-adversary prototype, not a default to keep long-term:
- The route handler (`src/app/api/mcp/route.ts`) no longer hard-401s on a *missing* Bearer header — only on a *present-but-invalid* one. Every other tool still self-rejects via `requireAuth()` if called without org context; `signup` is the only one that doesn't call it.
- Real product path (pre-money, pre-scale) should retire this: require human-driven web signup (real email, real password or OAuth per decision #3) and have the AI hand the user a link instead of inventing credentials — see conversation context for the full reasoning (identity/KYC for Stripe Connect in M5, credentials-in-chat-logs risk, abuse/rate-limiting with no auth gate).
- **Verified live:** unauthenticated `initialize` succeeds; unauthenticated `whoami` self-rejects with a tool error (not a transport 401); unauthenticated `signup` with no email/password creates a real org + auto-confirmed Supabase user + API key, and the returned key immediately works for `whoami`; explicit email/password path also verified; a wrong/revoked key still hard-401s at the transport level. Test rows cleaned from `public` schema after verification.
- Note: empirically, this Supabase project's `auth.signup` does **not** reject placeholder/example domains (`example.com`, `gmail.com` used in an unrelated probe both succeeded identically, auto-confirmed, no MX check) — contradicts the "must use a real domain" note in `plg3-supabase-multi-tenant`'s verification section, which was written from a stricter assumption. Worth a quick look if verification steps for anything else in that skill start behaving unexpectedly.

**Follow-up — self-reconfigure + `signin` (added 2026-07-15):**
- `signup`'s response no longer just hands back the raw API key — it also returns `reconnect.command`, a ready-to-run `claude mcp remove/add ... --header "Authorization: Bearer <key>"` string, and the tool's own text explicitly tells the calling agent to run it (if it has shell access) instead of showing the key to the user. `mcpUrl` is now threaded through every MCP request via `extra` (even unauthenticated ones), derived from the actual request's `Host`/`X-Forwarded-Proto` — same helper (`resolvePublicOrigin`, `src/lib/request-origin.ts`) the landing page uses, so the two can't drift.
- Added a `signin` tool (`src/lib/mcp/signin.ts`) — same no-auth-required permission model as `signup`, but for an account that already exists: email+password → `auth.signInWithPassword` → issues a **brand new** API key for that account's (first) org, same `reconnect` block. Keys are write-once/shown-once by design, so sign-in always mints a fresh one rather than trying to look up an old one.
- **Verified live:** ran the exact `reconnect.command` myself against the real `~/.claude.json` (user scope) — entry written correctly, `claude mcp list` showed it connected, `whoami` over curl with that key resolved the right org. Real finding, not just theoretical: the *already-running* Claude Code session that added the server couldn't call its tools without a restart — config writes correctly, but a live session doesn't hot-reload a newly-registered MCP server. `signin` verified separately: correct password → new key that authenticates via `whoami`; wrong password → clean tool-level error (`isError: true`), not a crash. All test orgs/keys and the throwaway `~/.claude.json` entry cleaned up after.
- `tsc --noEmit` / `eslint` clean throughout (same pre-existing shadcn warning as M1/M2 aside).

---

## M3 — First Vertical Slice: Courses (web + MCP together)
**Status: done**

- [x] `courses`, `lessons`, `categories` tables + RLS (org-scoped) — plus a new `is_org_content_manager` helper (owner/admin/instructor can write; any member can read), same shape as `is_org_admin` from M1
- [x] Courses list + create/edit form (real data, replaces placeholder) — `/dashboard/courses`, `/dashboard/courses/new`, `/dashboard/courses/[id]`
- [x] Lesson builder (basic: title, content, video URL) — dialog-based add/edit, inline delete, nested in the course detail page
- [x] Storage bucket wiring for media (Supabase Storage, org-scoped paths) — `course-media` bucket, public read, write RLS scoped to `{org_id}/...` path via `is_org_content_manager`; used for course thumbnails only (lesson `video_url` stays a plain external link, not a file upload — deliberately simple)
- [x] MCP tools — went beyond the original 4, per this round's "all options" request: `create_course`, `update_course`, `publish_course`, `unpublish_course`, `delete_course`, `list_courses`, `create_lesson`, `update_lesson`, `delete_lesson`, `list_lessons`, `create_category`, `list_categories`, `delete_category` (13 tools; no `get_course`/`get_lesson` — `list_*` with filters covers that read path, kept the surface smaller on purpose)
- [x] Verify: same course created via MCP shows up instantly in the dashboard, and vice versa

**Key architecture decision — resolves the M2 "what happens at M3+" open question:** MCP tools have no Supabase user session (no `auth.uid()`), so the normal `is_org_content_manager`-gated RLS path (used for the web dashboard) doesn't apply to them. Went with **one `SECURITY DEFINER` RPC per MCP mutation** (`mcp_create_course`, `mcp_update_course`, ... — 13 total), each taking `p_key_hash text` as its first argument and re-deriving `org_id` from a fresh, non-revoked `api_keys` lookup via an internal `mcp_authenticated_org(p_key_hash)` helper — never trusting a client-supplied `org_id`, since the publishable key used to reach these via PostgREST directly is not a secret. `mcp_authenticated_org` itself is revoked from `anon`/`authenticated` entirely (only reachable from inside another `SECURITY DEFINER` function); every outer `mcp_*` wrapper is intentionally anon-callable (that's the point) and shows up as such in the security advisor.

Simplification made deliberately: **possessing a valid API key = full read/write on that org's courses/lessons/categories**, no finer-grained role check at the MCP layer (unlike the web dashboard, which still restricts writes to owner/admin/instructor via RLS). Justification: only owner/admin can create a key in the first place (M2's `api_keys` insert RLS), so issuing a key already *is* the authorization decision — the key is a scoped service credential, not a mirror of the granting user's exact role.

**Verified live (against the real project), in order:**
1. DB: owner can create categories/courses (RLS `is_org_content_manager`); `support`-role member can read but not write (courses insert + storage upload both correctly rejected); `anon` sees nothing; `anon` cannot call `mcp_authenticated_org` directly (`42501 permission denied`, confirms the internal helper is truly unreachable)
2. Storage: owner can upload to `course-media/{org_id}/...`, `support` cannot; public read works on the uploaded object without auth
3. Every `mcp_*` RPC exercised directly over PostgREST: create/list/update/publish/delete for courses, lessons, categories; wrong key hash → clean exception, no data leaked; deleted rows actually gone from subsequent `mcp_list_*` calls
4. End-to-end MCP tool calls over `/api/mcp`: `create_course` → `list_courses` → `update_course` → `publish_course` → `create_lesson` → `update_lesson` → `delete_lesson` → `delete_course` → `create_category` → `list_categories` → `delete_category`, all via real HTTP calls with a real signed-up org's key
5. Cross-check (the actual exit criterion): created a course via MCP, logged into the web dashboard as that same org's owner (real browser, Playwright), confirmed it listed with correct title/status/description and detail page matched; separately created a second course through the web UI form and confirmed `list_courses` over MCP returned both — bidirectional, confirmed both directions live, not assumed
6. `tsc --noEmit` / `eslint` clean throughout

**Bug found + fixed during verification:** the "Add lesson" / "Edit lesson" dialog triggers used `<DialogTrigger render={<Button .../>}>` — nesting two Base UI primitives that each independently manage native-`<button>` semantics (`useButton`'s `nativeButton` check), which threw a console warning ("expected a native `<button>`...") because the two primitives' render-prop chains stepped on each other. Fixed by styling `DialogTrigger` directly via `buttonVariants()` className instead of nesting a `Button` component — matches the existing `DropdownMenuTrigger` pattern already used in `org-switcher.tsx`. Verified fixed live (console-clean on both dialogs).

**Also surfaced, not fixed (pre-existing, out of scope):** the same warning class also fires from `<Button render={<Link .../>}>` — but that's the officially documented convention in this repo's own `plg3-stack-conventions` skill, used everywhere since M0 (site header, landing page, login/signup, sidebar, this very milestone's own "New course" button). Not a regression from this round; fixing it would mean relitigating/replacing a documented, codebase-wide convention, not a targeted M3 fix. Flagging for whoever owns that convention decision.

**Also surfaced:** a leftover Storage-API quirk — deleting a `course-media` object via the bulk-remove endpoint (both raw REST and the JS SDK's `.remove()`) silently no-ops (`200`, empty array) for a role that has RLS DELETE permission, while the single-object `DELETE /object/{bucket}/{path}` endpoint correctly 403s for an unauthorized role but ALSO 403s for an authorized one when tested here — inconsistent with the RLS policy itself (confirmed correct via direct SQL + `is_org_content_manager` RPC check). Not chased further since it only affects a manual test-cleanup path, not a real feature (no delete-thumbnail flow exists yet); left one harmless orphaned test object in `course-media` under a deleted test org's now-nonexistent folder. Worth a look if a real "delete thumbnail" feature gets built later.

**Test data:** all test orgs/courses/lessons/categories/api_keys cleaned from `public` schema after verification. Test `auth.users` rows left (harmless `+m3verify`/`+m3owner`/`+m3support`/`+m3cross` aliases on linno.io), same pattern as M1/M2.

**Exit criteria met:** "Create a course called X" from an MCP client creates a real row, visible live in that creator's dashboard — verified in both directions, live, with a real browser.

---

## M4 — Website Builder (Module 1)
**Status: todo**

- [ ] `pages` table (slug, blocks JSON, status draft/published) — org-scoped
- [ ] Public route resolves per-org (`[org]/[slug]` or custom domain stub)
- [ ] Basic block renderer (hero, text, image, CTA)
- [ ] Publish/preview toggle
- [ ] MCP tools: `create_page`, `publish_page`

---

## M5 — Funnels + Checkout + Stripe Connect (Phase 2 start)
**Status: todo**

- [ ] `funnels`, `offers`, `orders` tables — org-scoped
- [ ] Stripe Connect onboarding flow (creator connects their own Stripe account, we store `stripe_account_id`)
- [ ] Checkout session creation on-behalf-of the connected account (destination charges)
- [ ] Webhook handler (platform-level endpoint, routes events by connected account)
- [ ] Order confirmation + thank-you page
- [ ] MCP tools: `create_funnel`, `create_offer`, `refund_order`

**Exit criteria:** a real payment on a creator's funnel lands in *their* Stripe account, order row recorded in our DB.

---

## M6 — Email + CRM (Phase 2 continued)
**Status: todo**

- [ ] `contacts`, `tags` tables — org-scoped
- [ ] Resend integration (platform-level sending key to start; per-creator domain later)
- [ ] Broadcast send (single email to segment)
- [ ] Contact list/detail pages
- [ ] MCP tools: `send_email`, `search_contacts`

---

## Later Phases (per PRD Roadmap, not yet broken into milestones)

- Community, Coaching, Events, Podcast, Certificates (PRD Phase 3)
- Automation builder, Analytics, Affiliate, public API/SDK (PRD Phase 4)
- Full AI-native coverage across all modules, multi-client MCP (Claude/Gemini/Cursor/Codex/CLI) (PRD Phase 5)

---

## Decisions Needed From User

| # | Decision | Blocks |
|---|----------|--------|
| 1 | `SUPABASE_SERVICE_ROLE_KEY` — paste into `.env.local` (Settings → API → service_role) | M1 |
| ~~2~~ | ~~MCP transport: hosted HTTP endpoint vs local stdio?~~ → **hosted HTTP**, decided 2026-07-15 | M2 (resolved) |
| 3 | Auth method: email/password only, or +OAuth (Google) from the start? | M1 |
| 4 | Stripe Connect type: Standard (creator has full own Stripe dashboard) vs Express (more embedded, less setup for them)? | M5 |
| 5 | Git remote (GitHub org/repo) to push to? | ongoing |
