# Current Feature: Forgot Password

## Status

In Progress

## Goals

- Add a "Forgot password?" link on the `/sign-in` page that routes to a new `/forgot-password` page
- `/forgot-password` page: email input + submit; leak-resistant (always shows the same "if an account exists, we sent a link" success state)
- `POST /api/auth/forgot-password` issues a single-use, time-limited password-reset token (SHA-256 hashed before storage) using the existing `VerificationToken` model
- Send the reset email via the existing Resend integration in `src/lib/email.ts`, mirroring the verification-email pattern
- `/reset-password?token=...` page validates the token and lets the user set a new password (with confirm field, basic strength check)
- `POST /api/auth/reset-password` consumes the token, hashes the new password with bcryptjs, updates `User.password`, and deletes the token
- Distinguish password-reset tokens from email-verification tokens (e.g. via an identifier prefix like `password-reset:<email>`) so they cannot be cross-used
- OAuth-only users (no `password` set): treat as nonexistent for leak-resistance; do not send a reset link
- Surface clear page states for sent / invalid / expired / success, consistent with the existing `/verify-email` page

## Notes

- Reuse `VerificationToken` (no new Prisma model / migration). Encode purpose in the `identifier` field.
- Token format and lifetime should match existing verification flow style: random token, SHA-256-hashed at rest, ~1h expiry for resets (shorter than 24h verify since resets are higher-risk)
- All endpoints must be Node runtime (bcryptjs + Prisma), like the existing register / verify routes
- Keep behavior leak-resistant: same response and timing whether or not the email exists, similar to `/api/auth/resend-verification`
- Follow the split-auth-config pattern already in place; do not import Node-only deps into edge-compatible files
- Respect repo standards: server actions or API routes per `coding-standards.md`, Zod input validation, `{ success, data, error }` shape where applicable, toast feedback on the client
- Do NOT gate behind `EMAIL_VERIFICATION_ENABLED` — password reset must work independently of the email-verification toggle

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
