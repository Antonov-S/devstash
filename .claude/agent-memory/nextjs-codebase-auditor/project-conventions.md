---
name: project-conventions
description: Safe/intentional patterns confirmed in the DevStash codebase that must not be re-flagged in future audits
metadata:
  type: project
---

# DevStash — Confirmed Safe Patterns

**Why:** Prevents false positives in future audits by recording known-good decisions.
**How to apply:** Before raising a finding, check this list.

## Environment files
- `.env*` is covered by `.gitignore` line 35 (`\.env*`). Never flag as exposed.

## Tailwind v4
- No `tailwind.config.ts` is intentional. Config lives in `src/app/globals.css` via `@theme`. Do NOT flag its absence.

## Vitest workarounds
- `fileParallelism: false` + `isolate: true` in `vitest.config.ts` is a documented workaround for next-auth/next/server ESM poisoning under Vitest 4. Do not flag.
- `data-slot` removal from `DialogTrigger` is an intentional SSR/CSR hydration fix. Do not flag.

## Architecture
- Server components by default; `'use client'` only on interactive components. This is correct.
- `auth()` + `redirect()` pattern in server components is intentional and correct auth gating.
- `{ success, data, error }` action shape is the project standard.
- `getDemoUser()` / `getDemoUserId()` in `src/lib/db/users.ts` are seeding helpers — they are NOT used in any production code path; no live traffic flows through them.
- Free/Pro tier enforcement is explicitly deferred per project-overview.md: "all users have Pro access during development".
- Module-level caching (`let cached`) in `r2.ts`, `email.ts`, `rate-limit.ts` is intentional for lazy initialization.

## Auth
- Split auth config (`auth.config.ts` for edge + `auth.ts` for Node) is intentional for Next.js middleware compatibility.
- `proxy.ts` (middleware) only gates `/dashboard*`; `/items/*` and `/profile` are gated at the page level via `auth()` + `redirect()`. This is consistent — do not flag as "missing middleware gate."
- Rate limiting fails open on Upstash outage — intentional, documented in code.
- Email verification skip path (`EMAIL_VERIFICATION_ENABLED=false`) is a documented dev toggle.

## DB / Prisma
- Only one migration (`20260427202202_init`) exists — this is fine for an early-stage project.
- `prisma.user.delete` in `deleteAccountAction` relies on cascade deletes declared in the schema. This is correct.
- `updateItemForUser` does `findFirst` ownership check then `$transaction([deleteMany tags, update item])` — the double-check pattern is intentional.

## Upload security
- R2 key prefix check (`uploads/<userId>/`) in `createItemAction` is the cross-user injection guard. It is present and correct.
- File validation runs on both client (`FileUpload`) and server (`/api/upload`).

## Tags
- Tags are global (no `userId`), deduped via `connectOrCreate`. This is by design — shared tag namespace across users.

## Still-open deferred findings

- N+1 risk: `fetchCollectionsWithMeta` fetches ALL `ItemCollection` rows for the collection set (no `take` cap); for users with many large collections, this could be substantial.
- Image `fileUrl` exposed directly in `<img src>` on cards and drawer — the R2 public URL is client-visible. Acceptable while bucket is public, but should be proxied if access is ever restricted.
- `getDemoUser()` and `getDemoUserId()` in `src/lib/db/users.ts` are seeding/dev helpers with no callers in production paths — NOT dead code to delete, but watch for accidental callers.

## Fixed findings (audit-quick-wins-3)

- ~~Open redirect on `callbackUrl`~~ — fixed via `safeRedirectPath()` in `src/lib/safe-redirect.ts`, wired into both sign-in actions.
- ~~`consumeVerificationToken` TOCTOU~~ — fixed by reordering expiry check before `deleteMany` in both `consumeVerificationToken` and `consumePasswordResetToken`.
- ~~`token.id` cast in `auth.config.ts`~~ — fixed by augmenting `@auth/core/jwt` directly (not the re-export); cast removed.
- ~~No security headers~~ — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` added via `headers()` in `next.config.ts`. CSP still deferred (needs Monaco + Markdown allowlist planning).
- ~~`getItemsForUserByTypeId` no `take` cap~~ — fixed with `limit = 200` default param.
