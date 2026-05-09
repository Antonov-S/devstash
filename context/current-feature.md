# Current Feature: Profile Page

## Status

In Progress

## Goals

- Build authenticated `/profile` page replacing the existing placeholder
- Display user info: email, name, avatar (GitHub image or initials), account creation date
- Display usage stats: total items, total collections, and a per-item-type breakdown (snippets, prompts, notes, commands, links, files, images)
- Provide a "Change password" action for credentials users only (hidden for GitHub-OAuth-only accounts)
- Provide a "Delete account" action gated by a confirmation dialog
- Match existing codebase patterns (server-component data fetching with Prisma, shadcn/ui, server actions / API routes per coding standards)

## Notes

- Avatar logic mirrors existing `UserAvatar` component: GitHub OAuth image when present, otherwise initials derived from name/email
- "Change password" visibility: show only if the user has a `password` set (i.e. not OAuth-only). Likely flow: current password + new password, validated via bcryptjs like sign-in
- "Delete account" must use a confirmation dialog (e.g. shadcn AlertDialog) before issuing the destructive request; cascades via Prisma `onDelete: Cascade` should clean up sessions, items, collections, etc.
- Item-type breakdown should cover all 7 system types and use efficient queries (e.g. `groupBy` on `itemTypeId` with `_count`) — avoid N+1
- Route is protected: redirect unauthenticated users to `/sign-in` (consistent with `/dashboard` gating in `src/proxy.ts`)
- Spec source: `context/features/profile-spec.md`

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
