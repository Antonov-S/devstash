# Current Feature

## Status

Not Started

## Goals

<!-- Bullet points of what success looks like -->

## Notes

<!-- Additional context, constraints, or details from spec -->

## History

<!-- Keep thsis updated. Earliest to latest -->

- Initial Next.js and Tailwind setup
- Mock data added for dashboard UI (`src/lib/mock-data.ts`)
- Dashboard UI Phase 1 — Completed
- Dashboard UI Phase 2 — Completed
- Dashboard UI Phase 3 — Completed
- Prisma + Neon PostgreSQL setup — Completed
- Database seed (demo user + system types + 5 collections / 18 items) — Completed
- Dashboard collections wired to Neon DB + sidebar polish (uppercase TYPES/COLLECTIONS, chevrons, separator) — Completed
- Dashboard items (pinned + recent) wired to Neon DB with empty-state for pinned — Completed
- Sidebar wired to Neon DB (item types with counts, collections favorites/recent with dominant-type circles, View all link) + COLLECTIONS group collapse toggle — Completed
- PRO badge added to `file` and `image` types in sidebar (subtle outline shadcn Badge, centered between label and count, hidden in collapsed mode) — Completed
- Code audit quick wins — N+1 fix in `fetchCollectionsWithMeta` (Prisma `_count` + bounded `itemCollection` findMany), deleted dead `mock-data.ts`, irregular-plurals lookup in sidebar `pluralize`, batched seed with `createManyAndReturn`, dropped password-hash select from `test-db.ts` — Completed
- Auth Phase 1 — NextAuth v5 + GitHub OAuth with split config (edge-compatible `auth.config.ts` + full `auth.ts` with Prisma adapter), JWT session, and `src/proxy.ts` gating `/dashboard` — Completed
- Auth Phase 2 — Credentials provider (email/password) added via split-config override in `auth.ts` with bcryptjs validation, plus `POST /api/auth/register` (Node runtime) for new-user signup — Completed
