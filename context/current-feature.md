# Current Feature: Email Verification Toggle

## Status

In Progress

## Goals

- Add an `EMAIL_VERIFICATION_ENABLED` env var (default `true`) that gates the entire email verification flow.
- When disabled:
  - `POST /api/auth/register` skips sending the Resend email and auto-sets `emailVerified = new Date()` on the new user (mirroring how GitHub OAuth handles it).
  - Credentials sign-in does not throw `EmailNotVerifiedError`; unverified existing users are treated as verified and allowed in.
  - `POST /api/auth/resend-verification` returns a no-op success (or a clear "verification disabled" response) so the UI doesn't break.
  - `/verify-email` page still renders sensibly if hit directly (e.g. an old link), but no new tokens are issued.
- When enabled (default): existing behavior is unchanged.
- Document the new env var in `.env.example` with a one-line comment explaining its purpose.

## Notes

- Motivation: no custom domain is currently linked to Resend, so only the Resend account email can actually receive verification mail. Need a fast switch to disable verification for local dev and other test accounts without removing the system.
- Centralize the flag read in one place (e.g. `src/lib/email.ts` or a small `src/lib/auth-config.ts` helper) — `process.env.EMAIL_VERIFICATION_ENABLED !== "false"` so the default is "on" if the var is unset.
- Do **not** delete the verification code or DB model — the flag must be flippable back on with a single env change.
- Server-side only; no UI surface for this toggle.
- Don't expose the flag value to the client. The UI flows (sign-in error inline resend button, /verify-email page) will simply not be reached when disabled.

## History

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
