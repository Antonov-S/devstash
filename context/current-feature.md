# Current Feature: Auth UI - Sign In, Register & Sign Out

## Status

In Progress

## Goals

- Custom `/sign-in` page with email/password fields, "Sign in with GitHub" button, link to register, and form validation/error display
- Custom `/register` page with name, email, password, confirm password fields, validation (passwords match, email format), submit to `/api/auth/register`, redirect to sign-in on success
- Replace NextAuth default pages with these custom UIs
- Bottom of sidebar shows user avatar (GitHub image or initials fallback), user name, and a dropdown/up menu on click with "Sign out" link
- Clicking the avatar/icon navigates to `/profile`
- Reusable Avatar component handling both GitHub image and generated initials (e.g., "Brad Traversy" → "BT")

## Notes

- Avatar logic: if user has `image` (GitHub), use that; otherwise generate initials from name
- Build a reusable initials/avatar component for both cases
- Testing checklist:
  1. `/sign-in` renders custom page
  2. GitHub sign-in flow works
  3. Email/password sign-in flow works
  4. Avatar shows in sidebar (GitHub image or initials)
  5. Clicking avatar opens dropdown
  6. "Sign out" logs out and redirects
  7. `/register` creates account and redirects to `/sign-in`

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
