---
name: DevStash Project Conventions
description: Confirmed-safe patterns and known intentional choices in the DevStash codebase to avoid false positives in future audits
type: project
---

## Confirmed Safe Patterns

- `.env` is in `.gitignore` under `.env*` — never flag as exposed
- `/src/generated` (Prisma client) is in `.gitignore` — not committed
- No `tailwind.config.ts` is intentional — project uses Tailwind v4 CSS-based config in `src/app/globals.css`
- `globalThis as unknown as { prisma }` in `src/lib/prisma.ts` is standard Next.js Prisma singleton pattern, not a real `any` violation
- `reactCompiler: true` in `next.config.ts` — React Compiler is enabled, meaning many memoization concerns are handled automatically
- All server-only DB modules use `import "server-only"` guard correctly

## Known Development Stubs / Scaffolds

- Authentication (NextAuth) is NOT yet implemented — all pages use `getDemoUser()`/`getDemoUserId()` hardcoded to `demo@devstash.io`. This is intentional scaffolding, not a bypass.
- No API routes exist yet (`src/app/api/` is empty) — do not flag missing auth on non-existent routes
- No Server Actions exist yet (`src/actions/` is empty)
- `src/app/page.tsx` is a stub (`<h1>Devstash</h1>`) — not a bug
- TopBar search input and "New Collection" button are `disabled` — UI stubs, not bugs
- No Zod validation yet because there are no Server Actions or API routes accepting user input
- Pro gating not enforced during development per explicit project note

## Architecture Decisions

- Server components fetch directly from Prisma (no API layer for reads)
- `getDemoUser()` is called independently in both `sidebar.tsx` and `dashboard/page.tsx` — two separate DB calls per page render
- `fetchCollectionsWithMeta` uses `include` (not `select`) for the join tables — necessary because it needs the nested `item.itemType` shape
- Tag model is global (no `userId`) — tags are shared across all users currently
- `src/lib/mock-data.ts` is dead code (no longer imported anywhere) but intentionally kept per project history

## Recurring False-Positive Traps

- The `generated/` Prisma files appear in filesystem glob results but are gitignored — don't flag them
- `bcryptjs` is a runtime dependency (not dev-only) because it's used in scripts/seed.ts which runs via tsx, and potentially future auth
- `dotenv` dependency comes transitively through prisma packages
