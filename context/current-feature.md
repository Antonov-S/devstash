# Current Feature

## Status

In Progress — Vitest setup for server actions and utilities

## Goals

- Install and configure Vitest for unit testing
- Scope: server actions (`src/actions/**`) and utilities (`src/lib/**`) — NOT components
- Mock Prisma via `vi.mock` so tests stay pure/fast and don't touch the database
- Provide a small set of sample tests to validate the setup and demonstrate patterns
- Add `npm test` / `npm run test:run` scripts
- Update `context/ai-interaction.md` workflow so the "test later" caveat is removed and unit tests are part of the standard flow
- Update `context/coding-standards.md` with a brief Testing section

## Notes

- TypeScript path alias `@/* → ./src/*` must resolve in tests (use `vite-tsconfig-paths`)
- Test environment: `node` (no jsdom — we are not testing components)
- Sample tests cover: `system-types.ts`, `rate-limit.ts` pure helpers, `utils.cn`, and one server action (`deleteAccountAction`) demonstrating the `vi.mock` pattern for `@/auth` and `@/lib/prisma`
- Vitest must coexist with the existing Next.js / Prisma / NextAuth setup without breaking `npm run build`

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
- Auth Phase 3 — Custom `/sign-in` and `/register` pages replacing NextAuth defaults, reusable `UserAvatar` (image-or-initials), sidebar footer dropdown (Profile + Sign out), `/profile` placeholder, sonner toast on post-registration redirect, dashboard wired to authenticated session instead of demo user — Completed
- Email verification on register — Resend SDK integration sending single-use 24h SHA-256-hashed tokens via existing `VerificationToken` model, `GET /api/auth/verify` + `POST /api/auth/resend-verification` (leak-resistant), `/verify-email` page with sent/verified/expired/invalid states, unverified credentials sign-in blocked via `EmailNotVerifiedError` with inline resend button, GitHub OAuth users auto-verified via `events.linkAccount`, plus `scripts/reset-users.ts` testing helper — Completed
- Email verification toggle — `EMAIL_VERIFICATION_ENABLED` env var (default on) centralized in `src/lib/email.ts`; when set to `"false"`, register auto-sets `emailVerified` and skips Resend, credentials sign-in stops throwing `EmailNotVerifiedError`, and `/api/auth/resend-verification` short-circuits to the existing leak-resistant no-op — Completed
- Forgot password — `/forgot-password` and `/reset-password` pages with sent/invalid/expired/success states, `POST /api/auth/forgot-password` (leak-resistant, skips OAuth-only users) + `POST /api/auth/reset-password` issuing single-use 1h SHA-256-hashed tokens via `VerificationToken` with `password-reset:<email>` identifier prefix, `consumeVerificationToken` hardened to reject cross-purpose tokens, `sendPasswordResetEmail()` mirroring the verification-email template, "Forgot password?" link added to `/sign-in`, independent of `EMAIL_VERIFICATION_ENABLED` — Completed
- Sign-in/register UI redesign — centered `max-w-md` rounded-2xl auth card with subtle border, dark elevated bg, and ambient radial-gradient backdrop; reordered sign-in flow (Email → Password w/ inline "Forgot password?" → primary CTA → "OR CONTINUE WITH" divider → GitHub → Register link); new reusable `EmailField`/`PasswordField`/`IconField` with leading Mail/Lock/User icons + Eye/EyeOff visibility toggle; `LoaderCircle` spinner inside CTAs replaces label-swap; reserved-height field error slots on register prevent layout jump; card entrance fade/slide animation — Completed
- Profile page — moved `/dashboard` and `/profile` into a shared `(dashboard)` route group so profile renders inside the sidebar/topbar shell; rebuilt `/profile` with two cards (Account Information: avatar + name/email/member-since + Change Password / Delete Account actions; Usage Statistics: total items + collections + per-system-type breakdown grid); `getUserProfileById` helper exposes `hasPassword` without leaking the hash; `POST /api/account/change-password` bcrypt-validates current password and rejects identical reuse; `deleteAccountAction` server action cascades the user delete via Prisma and signs out to `/`; reusable base-ui `Dialog` primitive (matches existing Sheet pattern) backs the confirmation dialogs (`KeyRound` / `Trash2` triggers, type-`DELETE`-to-confirm gate) — Completed
- Rate limiting for auth — reusable `src/lib/rate-limit.ts` on Upstash Redis + `@upstash/ratelimit` sliding-window (lazy-initialized client, per-name limiter cache, fail-open on missing env or thrown errors); wired into `/api/auth/register` (3/1h, IP), `/api/auth/forgot-password` (3/1h, IP), `/api/auth/reset-password` (5/15m, IP), `/api/auth/resend-verification` (3/15m, IP+email, applied after email validation), and login via `credentialsSignInAction` (5/15m, IP+email, using `await headers()` instead of intercepting NextAuth's callback route); 429 responses include JSON error + `Retry-After`; IP extracted from `x-forwarded-for` with `x-real-ip` fallback; sign-in/register/forgot/reset forms now toast on 429 alongside their existing inline error (resend-verification button already toasts) — Completed
- Items list view — dynamic `/items/[type]` route inside `(dashboard)` shell rendering type-filtered items in a `grid-cols-1 md:grid-cols-2` grid of `ItemCard`s with left border colored by `itemType.color`; `src/lib/system-types.ts` maps plural slugs ↔ singular `ItemType.name` for the 7 system types (snippets/prompts/commands/notes/files/images/links); `getSystemItemTypeByName` + `getItemsForUserByTypeId` added to `src/lib/db/items.ts`; page is `auth()`-gated with redirect-to-sign-in, `notFound()` on unknown slugs, header (type icon + capitalized label + item count), empty state on zero items, and `generateMetadata` for per-type page titles — Completed
