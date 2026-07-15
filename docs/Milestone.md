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
**Status: todo**

- [ ] MCP server scaffold (Next.js route handler, HTTP transport — see decision #2 below)
- [ ] Auth: per-org API key (creator generates it in dashboard, used by their AI client)
- [ ] `whoami` / `list_organizations` tools to prove the auth + org-scoping loop end to end
- [ ] Tool response format standardized (per blueprint Volume 4: input schema, output schema, permission check, example prompt/response)

**Exit criteria:** a creator can point Claude Desktop at their own API key and get back their own org data — nothing else.

---

## M3 — First Vertical Slice: Courses (web + MCP together)
**Status: todo**

- [ ] `courses`, `lessons`, `categories` tables + RLS (org-scoped)
- [ ] Courses list + create/edit form (real data, replaces placeholder)
- [ ] Lesson builder (basic: title, content, video URL)
- [ ] Storage bucket wiring for media (Supabase Storage, org-scoped paths)
- [ ] MCP tools: `create_course`, `update_course`, `publish_course`, `list_courses`
- [ ] Verify: same course created via MCP shows up instantly in the dashboard, and vice versa

**Exit criteria:** "Create a course called X" from an MCP client creates a real row, visible live in that creator's dashboard.

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
| 2 | MCP transport: hosted HTTP endpoint (works for any AI client, needs per-org API keys) vs local stdio (Claude Desktop only, simpler auth)? | M2 |
| 3 | Auth method: email/password only, or +OAuth (Google) from the start? | M1 |
| 4 | Stripe Connect type: Standard (creator has full own Stripe dashboard) vs Express (more embedded, less setup for them)? | M5 |
| 5 | Git remote (GitHub org/repo) to push to? | ongoing |
