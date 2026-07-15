# Skillguy — Milestones
_(branded "Skillguy" as of 2026-07-15; internal planning docs/skill files still reference the earlier "PLG 3.0" working name — not renamed everywhere)_

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

**Follow-up — YouTube playlist import, student view (added 2026-07-15, not in the original checklist):**

- New MCP tool `create_course_from_youtube_playlist` (`src/lib/youtube.ts` + `src/lib/mcp/server.ts`) — takes a playlist URL (or raw ID), creates a course (title defaults to the playlist's own title if omitted) with one lesson per video in playlist order, `video_url` pointing at the video and `content` set from the video's own description. Composes the *existing* `create_course`/`create_lesson` machinery rather than new RPCs — no new permission model needed. Requires a platform-level `YOUTUBE_API_KEY` (public playlists still need a key — that's how the Google API works regardless of the data's visibility; not per-creator OAuth). Private/deleted videos in a playlist are silently skipped.
- New student-facing public course view at `/[org]/courses/[course]` (outside any dashboard/auth route group — no login required). Added public-read RLS policies (courses/lessons/categories/organizations, all scoped to `status = 'published'` — draft stays invisible to non-members) rather than a service-role bypass, keeping the same RLS-first pattern as everything else in this project. `src/lib/public-courses.ts` is a dedicated DAL for this — deliberately separate from the dashboard's org-scoped `dal.ts`, different security/audience model. `src/lib/video-embed.ts` + `LessonVideo` component turn a YouTube URL into an inline iframe embed (falls back to a plain link for non-YouTube URLs). Dashboard course detail page gets a "View student page ↗" link once published.
- **Verified live, with a real `YOUTUBE_API_KEY`:** imported a real 105-video public playlist end-to-end (proved pagination past the 50-item API page size actually works, not just theorized); draft course's public page → 404; published → 200 with correct title/lessons and working `youtube.com/embed/...` URLs for real video IDs; wrong org slug → 404; wrong course slug within a real org → 404 (confirms org-scoping, not just existence-checking). Missing-`YOUTUBE_API_KEY` error path also verified as a clean tool error, not a crash, before the real key was available.
- `tsc --noEmit` / `eslint` clean. Test org/course/lessons/key cleaned from `public` schema after verification.

---

## M4 — Funnels for Courses (one template, demo checkout)
**Status: done**
**Reordered 2026-07-15 — moved ahead of the original M4 (Website Builder) per user priority: funnels next, automation after that, real Stripe/Website Builder/Email+CRM later.**

- [x] `funnels` table — org-scoped, tied to a `course_id`: name/slug, `template_key` (only one template exists — column is forward-compatible for more later), headline/copy fields, status draft/published
- [x] One built-in template covering all three pages (landing → checkout → thank-you) — this is *not* the drag-drop block builder (that's M6 territory); the AI/creator fills in copy fields, the template does the layout
- [x] Public routes for the three pages, org-scoped (mirrors the M3 student-view pattern): landing page (`/[org]/funnels/[funnel]`), checkout page (`.../checkout`), thank-you page (`.../thank-you`)
- [x] Checkout is a **demo only**, explicitly no real money: no Stripe, no real charge. Submitting the form creates an `orders` row marked paid and redirects to the thank-you page. Real payment is M7, not this milestone.
- [x] MCP tools: `create_funnel` (course + copy, template implied since there's only one), `list_funnels`, `publish_funnel`, `unpublish_funnel`, `delete_funnel`
- [x] Verify: funnel created via MCP renders all 3 pages correctly; demo checkout completes end-to-end; resulting order shows up in the dashboard

**Key architecture decision — same `mcp_*` RPC pattern as M3, plus one new shape for the public write path:** `funnels` writes (web dashboard) go through `is_org_content_manager(org_id)` RLS, same as courses/lessons/categories; MCP mutations go through five new `SECURITY DEFINER` RPCs (`mcp_create_funnel`, `mcp_list_funnels`, `mcp_set_funnel_status`, `mcp_delete_funnel`) keyed off `mcp_authenticated_org(p_key_hash)`, identical shape to M3. The new piece: the demo checkout itself is a **public, unauthenticated write** (no API key, no session — a real visitor filling out a form), so it doesn't fit either existing pattern (RLS-as-authenticated, or RPC-keyed-off-an-api-key). Added `public.create_demo_order(p_org_slug, p_funnel_slug, p_customer_name, p_customer_email)`, a `SECURITY DEFINER` RPC granted directly to `anon`/`authenticated`, which re-validates the funnel is actually `published` by joining on the org+funnel slugs (never a client-supplied `org_id`/`funnel_id`) before inserting. `orders` itself has no insert/update/delete RLS policy at all for either role — the RPC is the only write path, matching the "SECURITY DEFINER RPC as the sole write path" principle from M3, just anon-callable by design instead of key-gated.

**Simplification made deliberately:** `orders.status` has no `check` constraint — every row this milestone creates is `'paid'` (there is no other path to create one), so a constraint would be pure ceremony; M7 (real Stripe) is the natural point to revisit if `refunded`/`failed` states get added. Also, the public funnel/thank-you pages never read the `orders` table at all (no public RPC exposes it) — the thank-you page just renders the funnel's own static `thank_you_message` copy, avoiding any need to expose customer PII (name/email) on a publicly reachable URL.

**Verified live (against the real project), in order:**
1. Migration applied (`create_funnels_and_orders_schema`, `create_funnels_mcp_rpcs`); `get_advisors({type:"security"})` shows only the same accepted warning class as M1–M3 (anon-callable `SECURITY DEFINER` functions, by design) plus the pre-existing leaked-password warning — nothing new or unexpected.
2. MCP end-to-end over `/api/mcp` with a real signed-up org's key: `create_course` → `publish_course` → `create_funnel` (published) → `tools/list` confirms all 5 funnel tools registered and callable.
3. All 3 public pages, real HTTP: landing page 200 with correct headline/price/CTA; checkout page 200 with the form; thank-you page 200 with the funnel's message; wrong funnel slug → 404; wrong org slug → 404 (confirms org-scoping, not just existence-checking) — same cross-check shape as M3's course pages.
4. Demo checkout exercised as a real visitor would hit it: replayed Next.js's no-JS progressive-enhancement Server Action POST (the hidden `$ACTION_*` fields Next emits for exactly this no-JS fallback case) against the real checkout page → 303 redirect to the thank-you page, proving the actual `submitDemoCheckout` Server Action (not just the underlying RPC) works end-to-end.
5. `create_demo_order` exercised directly as `anon` over PostgREST: valid published funnel → order row created `status: 'paid'`; unpublished/nonexistent funnel slug → clean exception, no data leaked; missing `customer_name` → clean exception.
6. RLS cross-check as the real signed-up owner (`Authorization: Bearer <access_token>`, the same path the dashboard uses): sees the funnel and both recorded orders. As `anon`: `orders` select returns empty (not an error); direct `anon` insert into `orders` (bypassing the RPC) → `42501` rejected, confirming the RPC really is the only write path.
7. `tsc --noEmit` / `eslint` clean throughout.

**Not independently re-verified:** owner-vs-`support`-role write restriction on `funnels` — reuses `is_org_content_manager`, the exact same helper already verified live for this exact scenario in M3 against courses/lessons/categories. Setting up a second `support`-role membership for this milestone would have required a raw SQL privilege grant outside any app flow, which this session's own auto-mode safety classifier correctly declined as out-of-scope for a live grant; skipped rather than worked around, since the underlying function is unchanged.

**Test data:** all test org/course/funnel/orders/api_keys cleaned from `public` schema after verification. Test `auth.users` rows left (harmless `+m4verify`/`+m4support` aliases on linno.io), same pattern as M1–M3.

**Exit criteria met:** "Create a funnel for [course]" from an MCP client produces a working 3-page funnel using the one template; a demo checkout completes without touching real payment rails — verified live, end-to-end, in both directions.

---

## M5 — Automation (basic)
**Status: done**
**Added 2026-07-15 per user priority — next after Funnels, ahead of Website Builder/real Stripe/Email+CRM.**

**Decision #6 resolved:** pulled a thin `contacts` table forward from M8 rather than scoping M5's actions away from CRM entirely — a real "tag the buyer" flow is far more useful as a first automation than something that avoids contacts altogether (e.g. "publish a course"). `contacts` here is deliberately minimal (`email`, `name`, `tags text[]`) — M8 extends it later with Resend/broadcast sending, not a schema rewrite.

- [x] `contacts` table — org-scoped, `unique (org_id, email)`, `tags text[]`. Same RLS shape as courses/funnels: members read, `is_org_content_manager` (owner/admin/instructor) writes.
- [x] `automations` table — org-scoped: `name`, `trigger_type` (only `'funnel_purchased'` exists), `trigger_config jsonb` (optional `{funnel_id}` to scope to one funnel; omitted = any funnel in the org), `action_type` (only `'tag_contact'` exists), `action_config jsonb` (`{tag}`), `status` draft/active. Both `_type` columns are plain `text` with a `check` constraint, not enums — adding `course_completed` or `send_email` later (M8, once lesson-progress tracking exists) is a constraint change, not a migration rewrite. **Deliberately did not build a `course_completed` trigger this milestone** — no lesson/student progress-tracking table exists yet (M3 never built one), so there's no real signal to fire on; scoping to `funnel_purchased` only avoids inventing a fake trigger with nothing behind it.
- [x] `automation_runs` table — execution log (`automation_id`, `order_id`, `contact_id`, `created_at`), member-read only, no insert/update/delete policy for authenticated/anon at all. Exists so a creator can see an automation actually fired rather than trusting an opaque status flag — the automation detail page's "Recent runs" panel reads from it.
- [x] Web UI: `/dashboard/automation` (list, create, activate/deactivate, delete, per-automation run log) and `/dashboard/crm` (read-only contact list with tags) — both replace their M0 placeholders.
- [x] MCP tools: `create_automation`, `list_automations`, `activate_automation`, `deactivate_automation`, `delete_automation`, `list_contacts` (6 tools; no create/update/delete for contacts — they're only ever created by an automation firing, direct contact management is M8's scope, not M5's).
- [x] Verify: automation created via MCP tags a contact on demo checkout, in both directions.

**Key architecture decision:** unlike M3/M4's mutations (which all go through per-tool `mcp_*` RPCs called explicitly by an MCP tool or a dashboard action), the actual *firing* of an automation is a Postgres trigger (`handle_order_automation`, `SECURITY DEFINER`, execute revoked from `public`/`anon`/`authenticated` — not directly callable) on `orders` `AFTER INSERT`. This was the only design that doesn't require either duplicating trigger-matching logic into two places (the dashboard's direct-insert path *and* every current/future MCP mutation that can create an order) or picking one write path to privilege over the other. Since M4 established "SECURITY DEFINER RPC is the only write path into `orders`," attaching to the table itself means every current and future order-creating path fires automations automatically, with no call-site changes anywhere else. The trigger loops over that org's `active` automations matching `trigger_type = 'funnel_purchased'` and an optional `funnel_id` filter, and for `action_type = 'tag_contact'` upserts `contacts` on `(org_id, email)` — merging tags via `array(select distinct unnest(...))` rather than overwriting, so a contact tagged by two different automations (or the same automation twice) ends up with the union, not a duplicate row or a clobbered array.

**Verified live (against the real project), in order:**
1. Migrations applied (`create_automation_schema`, `create_automations_mcp_rpcs`); `get_advisors({type:"security"})` shows only the same accepted warning classes as M1–M4 (anon-callable `mcp_*` `SECURITY DEFINER` functions, by design, plus the pre-existing leaked-password default) — nothing new or unexpected, and specifically no RLS-disabled warning on any of the three new tables.
2. `mcp_create_automation` exercised directly over PostgREST with a real key hash: valid funnel-scoped automation succeeds; `trigger_type: 'course_completed'` → clean exception (unsupported); a `funnel_id` belonging to a different/nonexistent org → clean exception, no data leaked.
3. Trigger logic, exercised via the real anon-callable `create_demo_order` RPC (not a simulated insert): a published funnel with an *active*, funnel-scoped automation → contact created with the correct tag; the same customer buying again through a second *active*, unscoped automation → tags merge to `["buyer","vip"]` on the **same** contact row (no duplicate), confirmed via `automation_runs` showing both firings against the same `contact_id`; a third, brand-new customer with only a **draft** automation present → draft correctly did not fire (contact still got the two active automations' tags, never `should_not_appear`).
4. RLS cross-check as the real signed-up owner (`Authorization: Bearer <access_token>`): sees own org's `contacts`, `automations`, and `automation_runs` (the latter joined to `contacts.email`, same query shape `getAutomationRuns` uses). As `anon`: all three return empty (not an error); direct `anon` insert into `contacts` → `42501` rejected; direct `anon` insert into `automation_runs` → `42501` rejected (no policy at all, trigger is the sole writer). Cross-org: a second real signed-up user's org sees zero rows from the first org's `contacts`/`automations`.
5. Full MCP end-to-end over a live `/api/mcp` (dev server, real HTTP, no session — confirmed the server really is stateless per M2's design: `tools/call` works with no prior `initialize` on the same connection): `signup` → `create_course` → `create_funnel` (published) → `create_automation` (active, scoped to that funnel) → real anon `create_demo_order` against that funnel → `list_contacts` shows the tagged contact → `list_automations` shows the rule → `tools/list` confirms all 6 new tools registered alongside the existing 23.
6. Cross-check (the actual exit criterion): the same MCP-created org's data verified via the identical RLS-scoped queries `dal.ts`'s `getContacts`/`getAutomations`/`getAutomationRuns` issue (signed in as that org's real owner) — correct contact, correct automation, correct joined run. **Not independently re-verified via an actual browser**: no browser-automation tool was available in this session (unlike M3/M4's Playwright cross-checks), so the literal rendered HTML wasn't screenshotted — the dashboard pages here follow the exact same Server Component + `dal.ts` pattern already proven to render correctly for courses/funnels in M3/M4, and the underlying query was verified directly instead.
7. `tsc --noEmit` / `eslint` clean throughout (one `react/no-unescaped-entities` catch on the automation empty-state copy, fixed immediately).

**Test data:** all test orgs/courses/funnels/automations/contacts/automation_runs/api_keys cleaned from `public` schema after verification (two rounds — one manually-constructed test org, one created live through the actual `signup` MCP tool). Test `auth.users` rows left (harmless `+m5owner`/`+m5cross` aliases on linno.io, plus one `@creators.skillguy.invalid` placeholder from the MCP signup), same pattern as M1–M4.

**Exit criteria met:** "Tag anyone who buys [funnel] as 'buyer'" from an MCP client creates a working automation; a real demo-checkout purchase fires it and tags the contact — verified live, end-to-end, in both directions, including tag-merge and draft-non-firing edge cases.

---

## M6 — Website Builder (Module 1)
**Status: todo**

- [ ] `pages` table (slug, blocks JSON, status draft/published) — org-scoped
- [ ] Public route resolves per-org (`[org]/[slug]` or custom domain stub)
- [ ] Basic block renderer (hero, text, image, CTA)
- [ ] Publish/preview toggle
- [ ] MCP tools: `create_page`, `publish_page`

---

## M7 — Real Checkout + Stripe Connect (Phase 2)
**Status: todo**

- [ ] Stripe Connect onboarding flow (creator connects their own Stripe account, we store `stripe_account_id`)
- [ ] Checkout session creation on-behalf-of the connected account (destination charges) — replaces M4's demo checkout on funnels that opt in
- [ ] Webhook handler (platform-level endpoint, routes events by connected account)
- [ ] `offers` table — real pricing (M4's demo funnels skip real pricing/offers entirely)
- [ ] MCP tools: `create_offer`, `refund_order`

**Exit criteria:** a real payment on a creator's funnel lands in *their* Stripe account, order row recorded in our DB.

---

## M8 — Email + CRM (Phase 2 continued)
**Status: todo**

- [ ] `contacts`, `tags` tables — org-scoped
- [ ] Resend integration (platform-level sending key to start; per-creator domain later)
- [ ] Broadcast send (single email to segment)
- [ ] Contact list/detail pages
- [ ] MCP tools: `send_email`, `search_contacts`

---

## Later Phases (per PRD Roadmap, not yet broken into milestones)

- Community, Coaching, Events, Podcast, Certificates (PRD Phase 3)
- Analytics, Affiliate, public API/SDK (PRD Phase 4 — Automation builder promoted to M5, 2026-07-15)
- Full AI-native coverage across all modules, multi-client MCP (Claude/Gemini/Cursor/Codex/CLI) (PRD Phase 5)

---

## Decisions Needed From User

| # | Decision | Blocks |
|---|----------|--------|
| 1 | `SUPABASE_SERVICE_ROLE_KEY` — paste into `.env.local` (Settings → API → service_role) | M1 |
| ~~2~~ | ~~MCP transport: hosted HTTP endpoint vs local stdio?~~ → **hosted HTTP**, decided 2026-07-15 | M2 (resolved) |
| 3 | Auth method: email/password only, or +OAuth (Google) from the start? | M1 |
| 4 | Stripe Connect type: Standard (creator has full own Stripe dashboard) vs Express (more embedded, less setup for them)? | M7 |
| 5 | Git remote (GitHub org/repo) to push to? | ongoing |
| ~~6~~ | ~~M5 Automation's dependency on M8 Email/CRM~~ → **pulled a thin `contacts` table forward**, decided 2026-07-15 | M5 (resolved) |
