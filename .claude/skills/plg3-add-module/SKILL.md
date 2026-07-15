---
name: plg3-add-module
description: Checklist for adding a new PLG 3.0 module (Courses, Funnels, Website, CRM, etc.) — web UI and MCP tool together, org-scoped. Use whenever building out one of the 17 dashboard modules beyond the placeholder stage, per docs/Milestone.md.
metadata:
  version: "1.0.0"
  project: PLG 3.0
---

# PLG 3.0 — Adding a Module

Read `docs/Milestone.md` first for current milestone status and which module is next — don't build ahead of the plan without checking it's not already scoped differently there. Read `[[plg3-supabase-multi-tenant]]` and `[[plg3-stack-conventions]]` before touching schema or components.

## The core rule: MCP ships with the web UI, not after

Per the platform model in `docs/Milestone.md`: **MCP is the primary interface, web is secondary.** Every module's checklist below builds both together in the same pass — do not ship a module's web UI and defer its MCP tool to "later." If M2 (MCP server skeleton) hasn't landed yet, hold the module until it has, or check with the user whether to proceed web-only as an explicit exception.

## Checklist for a new module

1. **Schema** — new table(s), each with `org_id uuid not null references public.organizations(id) on delete cascade`. Apply via `mcp__supabase__apply_migration`, one focused migration per logical change (not one giant migration per module).
2. **RLS** — scope every policy through `org_id in (select public.get_user_org_ids())` (read) and `public.is_org_admin(org_id)` (write/admin-only actions), matching the existing `organizations`/`memberships` policies. Enable RLS on every new table — never ship a tenant-data table without it.
3. **Advisor + live verify** — run `mcp__supabase__get_advisors({type: "security"})` after the migration, then verify live as both a real org member and `anon`/a different org's member (see `[[plg3-supabase-multi-tenant]]`'s verification steps). Don't trust the advisor alone.
4. **Web UI** — replace the placeholder page in `src/app/(dashboard)/dashboard/<module>/page.tsx`. Fetch data server-side through `src/lib/dal.ts`-style helpers (add module-specific ones there or alongside), not ad-hoc client-side Supabase calls, unless the interaction is genuinely client-only (e.g. live editing).
5. **MCP tool(s)** — once M2 exists, add the corresponding tools (e.g. `create_course`, `publish_course`) following the blueprint's Volume 4 format: input schema, output schema, permission check (respect the same RLS/role rules as the web UI — don't build a parallel authorization path), example prompt, example response.
6. **Cross-check** — confirm an action taken via MCP shows up instantly in the web UI and vice versa (same org-scoped tables, same RLS — this should be automatic, but verify it live once per module rather than assuming).
7. **Update `docs/Milestone.md`** — check off the module's items, note anything discovered during the build (gotchas, bugs found+fixed) the way M1's entry does. Milestone docs in this repo carry verification notes, not just a checklist — keep that convention.

## Nav wiring

Dashboard nav config lives in `src/config/nav.ts` (`NAV_SECTIONS`) — modules are already listed there with icons and routes from M0. Adding a real module shouldn't need nav changes unless adding sub-routes; if you do add sub-routes, keep the section grouping (Build / Engage / Sell / Automate / Insights / AI / Admin) consistent with what's already there rather than inventing a new taxonomy.

## Placeholder pattern

Modules not yet built use `src/components/layout/page-placeholder.tsx`. When starting a module, delete its placeholder usage as the last step (once the real page works end-to-end) rather than leaving both — don't leave dead placeholder code alongside the real implementation.
