---
name: plg3-stack-conventions
description: Stack-specific conventions and gotchas for the PLG 3.0 codebase (Next.js 16, shadcn/base-ui, Supabase). Use before writing any App Router route file, proxy/middleware logic, or shadcn-generated component in this repo.
metadata:
  version: "1.0.0"
  project: PLG 3.0
---

# PLG 3.0 Stack Conventions

This repo runs newer/renamed APIs than training data usually assumes. Read `AGENTS.md` at the repo root first — it points at `node_modules/next/dist/docs/` as the source of truth for this Next.js version. Below are the gotchas already discovered the hard way; don't re-derive them.

## Next.js 16: `middleware.ts` → `proxy.ts`

- File is `proxy.ts` (or `src/proxy.ts` when using `src/`), **not** `middleware.ts`.
- Exported function is named `proxy` (or default export), **not** `middleware`.
- Behavior/matcher config is otherwise unchanged from what you know as "middleware."
- `cookies()` from `next/headers` is **async** — always `await cookies()`.
- Session-refresh logic (e.g. Supabase) that used to live in `middleware.ts` goes in `proxy.ts` calling a helper (see `src/lib/supabase/proxy.ts` → `updateSession`).

Verify against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` if anything here looks stale — that's the authoritative source, not this file.

## shadcn/ui here uses `@base-ui/react`, not Radix

This project's shadcn install resolved to the **base-ui** variant. The polymorphism API is different from the Radix-based shadcn you may know:

- **No `asChild` prop.** Use `render={<Link href="..." />}` instead.
- Put the visible content as **children of the outer component**, not inside the `render` element:
  ```tsx
  // Wrong (Radix pattern, will fail to typecheck here):
  <Button asChild><Link href="/login">Sign in</Link></Button>

  // Right (base-ui pattern):
  <Button render={<Link href="/login" />}>Sign in</Button>
  ```
- This applies to every primitive built on `useRenderElement`: `Button`, `SidebarMenuButton`, `DropdownMenuTrigger`, etc. Check `src/components/ui/*.tsx` for whether a given component takes `render` before assuming Radix conventions.
- If unsure, grep the component file for `render` vs `asChild` — `grep -n "asChild\|render" src/components/ui/<component>.tsx`.

## Supabase Auth keys: publishable, not anon

Use the newer naming everywhere in this repo:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (format `sb_publishable_...`) — **not** `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` stays secret-only, server-side, never fetched via MCP (by design — MCP tools that read keys deliberately only expose publishable/anon-tier keys).

See `[[plg3-supabase-multi-tenant]]` for the client/server/proxy setup pattern and RLS conventions.

## Verifying before you build

Before writing code against a Next.js API you're not 100% sure about in this version, check `node_modules/next/dist/docs/` for the relevant guide rather than assuming training-data behavior. This has already caught: the proxy rename, async `cookies()`, and the base-ui render-prop change. Assume there are more surprises in this stack and verify rather than guess.
