# Current Feature: Update Login/Register UI

## Status

In Progress

## Goals

- Transform `/sign-in` and `/register` pages into a centered auth card layout matching `@context/screenshots/logIn-screen-dev-stash.jpg`
- Centered card container: `max-w-md`, `rounded-xl`/`rounded-2xl`, subtle border, dark elevated background, soft shadow
- Reorder content: Title → Subtitle → Email → Password → Primary CTA → Divider → GitHub OAuth → Register/Sign-in link
- Apply consistent 8pt spacing system (`gap-2`, `gap-4`, `gap-6`, `gap-8`); reduce excessive whitespace
- Strong typographic hierarchy: bold compact heading, muted subtitle, improved label readability
- Inputs: dark background, subtle border, smooth radius, proper focus ring, consistent height
- Place "Forgot password?" right-aligned inside the password row
- Primary button: full-width, high-contrast light bg with dark text, medium-large height, hover transition
- GitHub button: secondary variant, bordered dark with icon, visually less dominant than primary CTA
- Divider: horizontal line — centered "OR CONTINUE WITH" — horizontal line
- Mobile-first responsive, centered on all breakpoints

## Notes

- **UI/UX only** — do NOT touch any functionality (form validation, auth logic, GitHub OAuth, navigation links, accessibility must all be preserved)
- Reference screenshot: `@context/screenshots/logIn-screen-dev-stash.jpg`
- Apply consistent treatment to both sign-in and register pages
- Spec source: `@context/features/update-UI-login-registrer.md`

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
