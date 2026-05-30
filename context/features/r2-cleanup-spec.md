# Cloudflare R2 Cleanup on Account & Data Deletion

## Overview

Uploaded files/images are stored in Cloudflare R2 under per-user keys
(`uploads/<userId>/<uuid><ext>`). Today they are only removed from R2 on the
**single-item** delete path (`deleteItemForUser` → `deleteObjectFromR2`). Two
other deletion paths leave the objects behind as orphans:

1. **Account deletion** — `deleteAccountAction` calls `prisma.user.delete`, and
   the `onDelete: Cascade` rules remove the `Item` rows **at the Postgres
   level**. That cascade never runs the application-level `deleteItemForUser`
   logic, so the R2 objects are never deleted.
2. **DB reset / maintenance scripts** — `scripts/wipe-demo.ts` and
   `scripts/reset-users.ts` delete users (and cascade their data) directly via
   Prisma. None of the scripts reference R2, so every uploaded object survives.

Orphans are a **storage-cost / hygiene** problem, not a security leak: keys are
namespaced per user, the bucket is not publicly listable, and the only read
path (`/api/files/[id]`) is ownership-gated through the DB — once the row is
gone nothing can resolve the object. This feature closes the cost/hygiene gap.

## Goals

- Add a reusable **prefix-delete** R2 helper that removes every object under a
  given key prefix (handles pagination + batched deletes).
- Wire it into `deleteAccountAction` so deleting an account also clears that
  user's R2 objects.
- Wire it into the maintenance scripts (`wipe-demo.ts`, `reset-users.ts`) so
  resetting users also clears their R2 objects.
- Keep all cleanup **best-effort / fail-open** — an R2 outage or missing R2
  config must never block the DB deletion the user (or operator) asked for.

## Non-Goals (out of scope)

- A periodic reconciliation job that sweeps R2 for keys with no matching
  `Item.fileUrl` (a reasonable future safety net, not part of this slice).
- Changing the working single-item delete path (`deleteItemForUser`) — it
  already cleans up correctly.
- `scripts/seed.ts` — seeded demo items are text-only (no `fileUrl`), so the
  seeder's wipe-and-recreate cannot orphan R2 objects. Leave it untouched.
- Deleting Stripe Customer records (already intentionally retained).

## New R2 helper — `deleteR2ObjectsByPrefix`

Add to `src/lib/r2.ts`:

```ts
export async function deleteR2ObjectsByPrefix(
  prefix: string
): Promise<{ deleted: number }>
```

Behavior:

- No-op short-circuit: if `!isR2Configured()` return `{ deleted: 0 }` (so local
  dev / CI without R2 env vars doesn't throw).
- Use `ListObjectsV2Command` (Bucket + `Prefix`) in a loop, following
  `IsTruncated` / `NextContinuationToken` so it handles >1000 objects.
- Delete in batches with `DeleteObjectsCommand` (`Delete: { Objects: [{ Key }] }`,
  max 1000 keys per call). Accumulate and return the total deleted count.
- Reuse the cached client + bucket from the existing private `getR2()`.
- Requires two new imports from `@aws-sdk/client-s3`: `ListObjectsV2Command`,
  `DeleteObjectsCommand` (alongside the existing `DeleteObjectCommand` etc.).

Guard rails:

- The `prefix` MUST be the caller-supplied per-user prefix `uploads/<userId>/`.
  Never call this with an empty string or a bare `uploads/` — that would wipe
  the whole bucket. Consider an internal assertion that `prefix` is non-empty
  and contains a trailing `/`.

## Account deletion — `src/actions/account.ts`

Before `prisma.user.delete(...)`, add a best-effort R2 sweep mirroring the
existing Stripe-cancel pattern (try/catch, log only, never throw):

```ts
if (isR2Configured()) {
  try {
    await deleteR2ObjectsByPrefix(`uploads/${userId}/`);
  } catch (error) {
    console.error("[deleteAccountAction] failed to delete R2 objects", {
      userId,
      error
    });
  }
}
```

Notes:

- Order: run it before `prisma.user.delete` (consistent with Stripe-first
  best-effort cleanup). It only needs `userId`, which is already in scope.
- Keep it independent of the Stripe block — both are best-effort and one
  failing must not skip the other or the DB delete.

## Script cleanup

Both scripts already delete users via Prisma; add the same prefix sweep for
each user they remove.

- `scripts/wipe-demo.ts` — after resolving the demo user's id (and before/after
  the user delete), call `deleteR2ObjectsByPrefix(`uploads/${demoUserId}/`)`.
- `scripts/reset-users.ts` — for each non-demo user it deletes, call the sweep
  with that user's id. Collect the ids first if the script currently deletes in
  a single `deleteMany`.

Keep script cleanup best-effort too (log failures, continue) so a transient R2
error doesn't abort an operator's reset.

### ⚠️ `server-only` import caveat for scripts

`src/lib/r2.ts` starts with `import "server-only"`, which **throws at import
time** in any runtime that doesn't resolve the `react-server` export condition
— including the plain `tsx`/Node runner the scripts use. Importing `r2.ts`
directly from a script may therefore crash before the cleanup runs.

Before implementing the script wiring, **verify how the scripts currently
import `@/lib/prisma`** (do they already pull in a `server-only` module
successfully?). Then pick the lighter resolution:

- **Preferred:** extract the S3 client construction + `deleteR2ObjectsByPrefix`
  into a small internal module **without** the `server-only` guard (e.g.
  `src/lib/r2-core.ts`), and have `r2.ts` re-export from it. Scripts import the
  core module; app code keeps importing `r2.ts` (which retains `server-only`).
- **Alternative:** if the script runner already tolerates `server-only`
  (confirmed via the existing prisma import), import `r2.ts` directly and skip
  the extraction.

Do not silently drop `import "server-only"` from `r2.ts` — it exists to keep R2
credentials/logic out of any client bundle.

## Behavior / edge cases

- **Fail-open everywhere:** missing R2 config → `{ deleted: 0 }`; R2 throws →
  logged, deletion proceeds. The user-facing/operator-facing delete always
  completes.
- **Idempotent:** running against an already-empty prefix returns
  `{ deleted: 0 }` with no error.
- **Catches prior orphans:** because it deletes by prefix (not by reading each
  `Item.fileUrl`), it also cleans up objects orphaned by earlier failed
  per-item deletes.
- **No cross-user blast radius:** the per-user prefix isolates the sweep to one
  user's objects.

## Testing

Per `coding-standards.md` (Testing): test server actions + utilities, mock I/O
at the module boundary, never hit real R2.

- `src/actions/__tests__/account.test.ts` — add cases (mirroring the existing
  Stripe-throw case):
  - With R2 configured: `deleteR2ObjectsByPrefix` is called with
    `uploads/<userId>/`, then `user.delete` + `signOut` run.
  - `deleteR2ObjectsByPrefix` throwing is swallowed — `user.delete` + `signOut`
    still run (assert call order; `errSpy.mockRestore()` for the logged error).
  - R2 not configured: cleanup skipped, deletion still completes.
  - Mock `@/lib/r2` via `vi.mock` (hoisted), exposing `isR2Configured` +
    `deleteR2ObjectsByPrefix`.
- `src/lib/r2.ts` — follow the existing precedent: the SDK I/O helpers
  (`uploadObjectToR2`, `deleteObjectFromR2`, `getObjectFromR2`) are **not**
  unit-tested, only the pure helpers (`keyFromPublicUrl`, etc.) are.
  `deleteR2ObjectsByPrefix` is SDK I/O, so no direct unit test — it's covered
  indirectly through the mocked action tests. (If `r2-core.ts` is extracted,
  the same rule applies.)
- Scripts are out of Vitest scope.

Run `npm run test:run` + `npm run build`; both must pass.

## Files touched

- `src/lib/r2.ts` — new `deleteR2ObjectsByPrefix` + AWS SDK imports
  (`ListObjectsV2Command`, `DeleteObjectsCommand`); possibly an extracted
  `src/lib/r2-core.ts` per the server-only caveat.
- `src/actions/account.ts` — best-effort R2 sweep before `user.delete`.
- `scripts/wipe-demo.ts` — sweep the demo user's prefix.
- `scripts/reset-users.ts` — sweep each deleted user's prefix.
- `src/actions/__tests__/account.test.ts` — new cases + `@/lib/r2` mock.

---

## TODO (separate, implement next)

These are unrelated to R2 cleanup but captured here so they aren't lost; split
into their own slice when implementing.

### Loosen the register rate limit

`register` is currently `{ tokens: 3, window: "1 h" }` (IP-keyed) in
`src/lib/rate-limit.ts`. This is too tight — a legitimate user who mistypes
their email a couple of times then hits a real error gets locked out for an hour
("Too many attempts. Please try again in 44 minutes."). It also counts attempts
that *succeeded* at creating the account but failed at the email-send step.

- Bump to something friendlier but still abuse-resistant, e.g.
  `{ tokens: 5, window: "1 h" }` or `{ tokens: 5, window: "15 m" }` (login is
  already `5/15m` for comparison).
- One-line change to the `LIMITS` table in `src/lib/rate-limit.ts`.

### Clean up test accounts created during debugging

Registration testing (while debugging the Resend key issue) created real `User`
rows whose email was never deliverable. Remove the leftover non-demo test
accounts — `scripts/reset-users.ts` already exists for this, or a scoped Prisma
delete by email.
