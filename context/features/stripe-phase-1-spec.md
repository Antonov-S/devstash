# Stripe Phase 1 — Core Infrastructure

## Overview

Lay the foundation for Stripe-backed Pro subscriptions ($8/mo, $72/yr) without touching any user-facing surface yet. This phase ships the Stripe SDK singleton, a usage-limits/billing helper module, the env-var fix-ups, and the NextAuth changes that thread `isPro` through the JWT and session. **No webhooks, no checkout, no UI** — that's Phase 2.

Source plan: [docs/stripe-integration-plan.md](../../docs/stripe-integration-plan.md). This spec is the implementation slice; consult the plan for rationale, alternatives, and the cross-references it cites.

## Scope

In:

- Add `stripe` SDK dependency.
- New `src/lib/stripe.ts` singleton.
- New `src/lib/billing.ts` usage-limits module (limits, Pro-only type set, `getUserIsPro`, capacity checks).
- Fix `.env.example` typos.
- Augment NextAuth JWT + session with `isPro`, sourced from DB on every callback.
- Update `src/types/next-auth.d.ts` so `session.user.isPro` and `JWT.isPro` type-check.
- Vitest coverage for `src/lib/billing.ts`.

Out (deferred to Phase 2):

- Webhook handler, checkout/portal server actions, settings UI.
- Feature gating in `createItemAction` / `createCollectionAction` / `/api/upload`.
- Cancel-on-delete in `deleteAccountAction`.
- Sidebar Pro-badge gating, marketing CTA, upgrade dialog.
- Stripe Dashboard product/price/webhook setup (those go in Phase 2's prerequisites).

## Prerequisites

No schema migration needed — `User.isPro`, `User.stripeCustomerId`, `User.stripeSubscriptionId` already exist (verify with `prisma migrate status`).

## Requirements

### 1. Install Stripe SDK

- Add `"stripe": "^17.5.0"` to `package.json` `dependencies`.
- Run `npm install` and commit the lockfile change.

### 2. `src/lib/stripe.ts` — SDK singleton

- Pattern mirrors `src/lib/r2.ts`: lazy singleton, throws on first use if env missing, never on import.
- Top-level `import "server-only"` so this never bundles into a client component.
- Export `getStripe(): Stripe` that caches a single instance keyed by `STRIPE_SECRET_KEY`.
- Pin `apiVersion` to the latest stable as of integration date — record the chosen value in a comment.
- Export `STRIPE_PRICE_IDS = { monthly: () => requireEnv(...), yearly: () => requireEnv(...) }` and a `BillingPeriod = keyof typeof STRIPE_PRICE_IDS` type so Phase 2 actions are type-safe.
- Local `requireEnv(name)` helper that throws a descriptive error.

### 3. `src/lib/billing.ts` — Usage-limits helpers

- `import "server-only"`.
- Export `FREE_TIER_LIMITS = { items: 50, collections: 3 } as const`.
- Export `PRO_ONLY_ITEM_TYPES = new Set<string>(["file", "image"])`.
- Export `async function getUserIsPro(userId: string): Promise<boolean>` — fresh DB read via dynamic `await import("@/lib/prisma")` to avoid an edge-runtime bundling hazard, returns `false` if user missing. **Always use this in write paths** instead of `session.user.isPro` (the JWT can carry a stale value across a downgrade).
- Export discriminated `CapacityCheck = { ok: true } | { ok: false; reason: string }`.
- Export `async function checkItemCapacity(userId: string, isPro: boolean): Promise<CapacityCheck>` — `{ ok: true }` for Pro; otherwise reads `getItemStatsForUser(userId).total` and compares to the items limit.
- Export `async function checkCollectionCapacity(userId: string, isPro: boolean): Promise<CapacityCheck>` — same shape for collections.
- Capacity-failure `reason` strings are user-facing — wording per the plan (e.g. `"Free plan is limited to 50 items. Upgrade to Pro for unlimited."`).

### 4. `.env.example` cleanup

Three corrections inside the `# ─── Stripe ───` block:

- Remove `STRIPE_PUBLISHABLE_KEY` (server-only, useless without `NEXT_PUBLIC_` prefix; we don't ship Stripe.js in the browser).
- Fix the `STRIPE_PRICE__ID_YEARLY` double-underscore typo → `STRIPE_PRICE_ID_YEARLY`.
- Add a commented-out `# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=` line with a comment explaining it's only needed if/when we ever embed Stripe Elements.

Final block should be exactly: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY` + the commented-out publishable line.

### 5. NextAuth: thread `isPro` through JWT + session

In `src/auth.config.ts`:

- Make the `jwt` callback `async` and accept `{ token, user, trigger }`.
- Keep the existing `token.id = user.id` assignment when `user?.id` is truthy.
- After that, if `token.id` is set, dynamically `await import("@/lib/prisma")` and `SELECT isPro` for that user, then write `token.isPro = dbUser?.isPro ?? false`. **Dynamic import is required** because `auth.config.ts` is consumed by edge middleware and the Prisma client can't load in the edge runtime; the dynamic import resolves only when the callback actually runs (Node-only paths). If Next bundles the dynamic import eagerly and breaks middleware, fallback is to move the `jwt` callback into `src/auth.ts` (the Node-only override).
- In the `session` callback, copy `token.isPro` (defaulting to `false`) onto `session.user.isPro`.
- **Cost**: one extra `SELECT isPro` per server-side session validation (every `auth()` call, server component render, server action). Acceptable per the plan; revisit with a short-TTL cache only if it becomes hot.

In `src/types/next-auth.d.ts`:

- Augment `Session.user` with `isPro: boolean`.
- Augment `@auth/core/jwt`'s `JWT` interface with `isPro: boolean`. **Augment `@auth/core/jwt` directly, not `next-auth/jwt`** — the latter only re-exports and TS augmentations don't flow through re-exports (this is the same issue we already hit when adding `id`).

## Testing

### Vitest (per `coding-standards.md`)

New file `src/lib/__tests__/billing.test.ts` covering `src/lib/billing.ts`. Mock `@/lib/prisma` and the two `getXxxStatsForUser` helpers at the module boundary. Cases:

- `getUserIsPro`: returns DB value when user exists, returns `false` when user missing.
- `checkItemCapacity`: Pro user (`ok: true`), Free under limit (`ok: true`), Free at limit (`ok: false` with the spec'd reason string), Free over limit (`ok: false`).
- `checkCollectionCapacity`: same matrix.

`src/lib/stripe.ts` is **not** unit-tested — it's a thin SDK wrapper whose behavior is "construct + cache + read env." Phase 2's billing server actions will exercise it via mocked `getStripe()`.

### Build + types

- `npm run test:run` must pass with the new tests on top of the existing 280-test baseline.
- `npm run build` must pass — verifies that the `next-auth` type augmentations land correctly and `session.user.isPro` resolves where consumed (Phase 2).

### Manual smoke

- Run the app locally; confirm sign-in/registration still work and `auth()` calls don't throw. The new DB read in the `jwt` callback runs on every session validation, so any breakage shows up immediately.
- `session.user.isPro` doesn't have a consumer yet — its correctness will be verified in Phase 2 when the Billing UI renders against it.

## Implementation Order

1. Install SDK + fix `.env.example`.
2. Create `src/lib/stripe.ts`.
3. Augment `src/types/next-auth.d.ts`, then update `src/auth.config.ts` JWT + session callbacks.
4. Create `src/lib/billing.ts`.
5. Add Vitest coverage; run `npm run test:run` and `npm run build`.

Steps 3 and 4 are independent; the build will not fail without each other.

## Notes

- This phase is intentionally an "invisible commit" — nothing user-facing changes. Behavior is unchanged for both Free and Pro users; capacity checks aren't wired into any action yet.
- Land before Phase 2 so the type system + session shape are settled before webhooks start mutating `isPro`.
