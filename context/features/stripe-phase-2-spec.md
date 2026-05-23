# Stripe Phase 2 — Integration & UI

## Overview

Build on Phase 1's foundation to ship the actual Pro-subscription flow: Stripe Checkout, Customer Portal, webhook reconciliation, free-tier enforcement, and the settings/marketing UI. End state: a Free user can subscribe to `$8/mo` or `$72/yr` from `/settings`, a Pro user can manage their subscription from the same place, and webhook updates flow into existing sessions without forcing sign-out.

**Requires Phase 1** ([context/features/stripe-phase-1-spec.md](./stripe-phase-1-spec.md)) — `src/lib/stripe.ts`, `src/lib/billing.ts`, and `session.user.isPro` must exist.

Source plan: [docs/stripe-integration-plan.md](../../docs/stripe-integration-plan.md). Consult it for rationale, alternative designs considered, and full code samples.

## Prerequisites

### Stripe Dashboard Setup (manual, do once per environment — Test + Live)

1. **Create Product** "DevStash Pro" (Stripe Dashboard → Products).
2. **Add two Prices** to that product: `$8.00 USD recurring monthly` and `$72.00 USD recurring yearly`. Save both `price_…` IDs into `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`.
3. **Activate Customer Portal** (Settings → Billing → Customer portal): enable cancellation **at period end**, plan switching monthly ↔ yearly, payment-method update, and set Default redirect URL to `https://<your-domain>/settings`.
4. **Tax** (optional, prod): enable Stripe Tax + flip `automatic_tax.enabled` to `true` on the Checkout session when ready. Ship v1 with it off.
5. **Webhook endpoint** (Developers → Webhooks → Add endpoint):
   - URL: `https://<your-domain>/api/stripe/webhook`
   - Subscribe to: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, and optionally `invoice.payment_failed`.
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

For local dev, use `stripe listen --forward-to localhost:3000/api/stripe/webhook` — the CLI prints a separate `whsec_…` secret to put in `.env` (do **not** use the production secret locally).

## Scope

In:

- Webhook handler at `POST /api/stripe/webhook`.
- Server actions in `src/actions/billing.ts` for Checkout and Customer Portal.
- Settings UI: new Billing section + `BillingCard` client component.
- Free-tier enforcement in `createItemAction`, `createCollectionAction`, `/api/upload`.
- Cancel-subscription-on-account-delete in `deleteAccountAction`.
- Marketing pricing CTA wired to `/settings#billing` for authenticated users.
- Sidebar Pro-badge gated by `session.user.isPro`.
- Reusable `UpgradePromptDialog` for paywall moments.
- Vitest coverage for the new server actions; manual Stripe-CLI checklist for the webhook.

Out (deferred):

- AI-feature gating (`/api/ai/*` not built yet).
- Export feature (not built yet).
- Custom item types (not built yet).
- Stripe Tax (`automatic_tax`) — ship v1 with `false`.
- Dunning emails / `invoice.payment_failed` user-facing handling — log only.
- Detecting Pro period (Monthly vs Yearly) in the Settings UI — render plain "Pro plan".
- Item-cap proactive UI hints (disabled buttons + tooltips) — toast on submit is acceptable for v1.

## Requirements

### 1. Webhook handler — `src/app/api/stripe/webhook/route.ts`

- `export const runtime = "nodejs"` (Stripe SDK needs Node).
- Read **raw body via `request.text()`** — calling `.json()` first will mutate whitespace and break signature verification.
- Await `headers()` (Next 16 async dynamic API) and read `stripe-signature`.
- Reject with 400 if header missing.
- Call `stripe.webhooks.constructEvent(body, sig, secret)`; reject with 400 on verification failure.
- Switch on `event.type`:
  - `checkout.session.completed`: resolve `userId` from `client_reference_id` (preferred) or `metadata.userId`; resolve `customerId` / `subscriptionId` (handle both string and object forms); `prisma.user.update({ where: { id: userId }, data: { stripeCustomerId, stripeSubscriptionId, isPro: true } })`.
  - `customer.subscription.created` and `customer.subscription.updated`: resolve `customerId`, compute `active = status === "active" || status === "trialing"`, then `prisma.user.updateMany({ where: { stripeCustomerId: customerId }, data: { isPro: active, stripeSubscriptionId: sub.id } })`.
  - `customer.subscription.deleted`: `updateMany({ where: { stripeCustomerId }, data: { isPro: false, stripeSubscriptionId: null } })`.
  - `default`: return 200 so Stripe stops retrying unhandled types.
- Use `updateMany` (not `update`) so a retry that arrives before the customer is linked doesn't throw a Prisma 404 — zero matches is a non-error.
- On handler exception (after signature verified), log + return 500 so Stripe retries.
- Return `{ received: true }` 200 on success.
- **Do NOT add rate limiting** — Stripe's webhook IPs are documented and the signature already authenticates the request. No new entry in `LimiterName`.

### 2. Billing server actions — `src/actions/billing.ts`

`createCheckoutSessionAction(period: BillingPeriod)`:

- `auth()` gate; reject if no session or no email.
- Validate `period` is `"monthly"` or `"yearly"` (defense-in-depth even though the type narrows).
- Load `user` with `select: { stripeCustomerId, email, isPro }`; reject if already Pro.
- `getStripe().checkout.sessions.create({ mode: "subscription", customer: user.stripeCustomerId ?? undefined, customer_email: user.stripeCustomerId ? undefined : user.email, client_reference_id: session.user.id, line_items: [{ price: STRIPE_PRICE_IDS[period](), quantity: 1 }], allow_promotion_codes: true, billing_address_collection: "auto", automatic_tax: { enabled: false }, success_url: ${base}/settings?checkout=success, cancel_url: ${base}/settings?checkout=cancelled, subscription_data: { metadata: { userId: session.user.id } } })`.
- Don't pre-create a Stripe Customer ourselves — let Checkout do it and pick it up via the webhook.
- On success `redirect(checkout.url!)` — server-action `redirect()` is the documented Next 16 pattern. Return `{ error }` on validation/Stripe failure (the form's `useTransition` toasts it).

`createPortalSessionAction()`:

- `auth()` gate; reject if no session.
- Load `user.stripeCustomerId`; reject if missing.
- `getStripe().billingPortal.sessions.create({ customer, return_url: ${base}/settings })`; `redirect(portal.url)`.

Both actions read base URL via the existing `getBaseUrl()` helper.

### 3. Settings UI — Billing section + `BillingCard`

- Add a new `<section id="billing">` to `src/app/(dashboard)/settings/page.tsx`, slotted between Account and Editor preferences (or below Editor preferences — UI choice). Pattern + classes match the existing card sections.
- New `src/components/settings/billing-card.tsx` (client, `"use client"`):
  - Renders two states based on `isPro` prop (passed from `session.user.isPro`):
    - **Free**: headline "Free plan", subtitle with current limits, two `PendingButton`s — "Upgrade — $8/mo" and "Upgrade — $72/yr". Both are `<form action={() => startTransition(...)}>` posting to `createCheckoutSessionAction("monthly" | "yearly")`. Toast `result.error` on the discriminated-union return.
    - **Pro**: headline "Pro plan" (plain, no period detection), subtitle "Manage your subscription, payment method, and invoices in the Stripe portal.", single `PendingButton` "Manage subscription" → `createPortalSessionAction()`.
  - Pattern mirrors `ChangePasswordDialog`: `useTransition` + `PendingButton` + `toast.error()` on `{ error }`.
  - Since both actions `redirect()` on success, no client-side `router.push` needed — the browser follows the 303.
- After this lands, **update the marketing pricing CTA** ([src/components/marketing/pricing-section.tsx](../../src/components/marketing/pricing-section.tsx)): `const proHref = isAuthenticated ? "/settings#billing" : "/register"` (drop the existing `// TODO: point Pro CTA at /settings#billing once billing is wired up.` comment).

### 4. Reusable upgrade prompt — `src/components/billing/upgrade-prompt-dialog.tsx`

- New client component, reusable base-ui `Dialog`.
- Shown when a Free user hits a Pro-gated action.
- Content: headline like "You've hit the Free plan limit." + brief feature list + two buttons — "Upgrade to Pro" (navigates to `/settings#billing`) and "Cancel".
- Triggered from places like `NewItemDialog` (when picking `file`/`image` as Free) — actual wiring of those triggers is optional for v1; the toast-on-submit path is acceptable. Build the component and at least one consumer (e.g. the 51st-item toast can `toast.error(reason, { action: { label: "Upgrade", onClick: () => router.push("/settings#billing") } })`).

### 5. Free-tier enforcement in actions

Use `getUserIsPro(session.user.id)` (DB read) in **every write path** — never `session.user.isPro` (could be stale across a downgrade).

**`createItemAction`** ([src/actions/items.ts](../../src/actions/items.ts)) — after `parsed.success`, before the collection-ownership check:

```ts
const isPro = await getUserIsPro(session.user.id);
if (PRO_ONLY_ITEM_TYPES.has(type) && !isPro) {
  return { success: false, error: "File and image items require Pro." };
}
const capacity = await checkItemCapacity(session.user.id, isPro);
if (!capacity.ok) return { success: false, error: capacity.reason };
```

**`createCollectionAction`** ([src/actions/collections.ts](../../src/actions/collections.ts)) — equivalent pattern with `checkCollectionCapacity`.

**`/api/upload`** ([src/app/api/upload/route.ts](../../src/app/api/upload/route.ts)) — right after the existing `session?.user?.id` check, fetch `getUserIsPro` and return `403 { error: "File uploads require Pro." }` if false. This stops a Free user from uploading even if they manipulate the client.

### 6. Cancel-on-delete — `deleteAccountAction`

In `src/actions/account.ts`, before the existing `prisma.user.delete`:

- Load `user.stripeSubscriptionId`.
- If present, call `getStripe().subscriptions.cancel(subId)` inside a `try/catch` — **swallow errors and log only** so a Stripe outage can't block account deletion (worst case: one orphan subscription to clean up).
- **Do NOT delete the Stripe Customer** — keep it for audit/refund history per Stripe's recommendation. Cancelling the subscription is enough to stop billing.

### 7. Sidebar Pro badge gating

In [src/components/dashboard/sidebar.tsx](../../src/components/dashboard/sidebar.tsx), change the always-on Pro badge:

```diff
- const isPro = type.name === "file" || type.name === "image";
+ const isProType = type.name === "file" || type.name === "image";
+ const showProBadge = isProType && !session.user.isPro;
```

Sidebar is a server component; either pass `session.user.isPro` down via the existing layout prefetch or call `auth()` inside the sidebar — match existing pattern.

## Webhook → Session Sync

This is the load-bearing UX guarantee: after a user subscribes via Checkout, they come back to `/settings?checkout=success` and the Billing card **immediately flips to "Pro plan"** without re-signing-in.

It works because Phase 1's `jwt` callback **re-reads `isPro` from the DB on every invocation**. The callback runs on every server-side session validation; one extra `SELECT isPro` per call. By the time `/settings` server-renders, the webhook has already updated the DB row (in practice tens of milliseconds before the user's browser follows the success redirect) and `auth()` → `jwt` → fresh `SELECT isPro: true` → `session.user.isPro: true` → BillingCard shows the Pro state.

**No client-side polling, no `useSession.update()`, no reload.** Verify this in §Testing 10.2 with two browser windows.

## Testing

### Vitest (per `coding-standards.md`)

**`src/actions/__tests__/billing.test.ts`** — mock `@/auth`, `@/lib/prisma`, and `getStripe`. Cover:

- `createCheckoutSessionAction`: no session, no email, invalid period, already-Pro, missing customer (Checkout creates one), reused `stripeCustomerId`, happy path (assert payload shape — `client_reference_id`, `line_items[0].price`, `success_url`, `cancel_url`, `subscription_data.metadata.userId`).
- `createPortalSessionAction`: no session, no `stripeCustomerId`, happy path.

**`src/actions/__tests__/items.test.ts`** (extend existing) — add:

- Free user at 50 items can't create item 51 (capacity error string).
- Free user can't create `type: "file"` or `type: "image"` (Pro-only error string).
- Pro user can create item 51 and `type: "file"`.

**`src/actions/__tests__/collections.test.ts`** (extend existing) — Free at 3 collections rejects 4th.

**`src/actions/__tests__/account.test.ts`** (extend existing) — `deleteAccountAction` with subscription calls `stripe.subscriptions.cancel`; without subscription skips cleanly; Stripe throw still deletes the user.

**Webhook route is NOT unit-tested** — importing `/api/stripe/webhook/route.ts` pulls `next-auth`'s `next/server` resolution into Vitest and poisons the worker (same problem as `/api/items/[id]/route.ts`; documented in the [item-drawer-spec history](../../context/current-feature.md)). Webhook is covered by manual Stripe-CLI checks below.

### Manual integration (Stripe CLI required)

Run in two terminals:

```
stripe listen --forward-to localhost:3000/api/stripe/webhook
npm run dev
```

Checklist:

- [ ] **Subscribe (monthly)** — Settings → "Upgrade — $8/mo" → Checkout → card `4242 4242 4242 4242` → back at `/settings?checkout=success` → Billing card now shows "Pro plan" + Manage button. DB row: `isPro=true`, `stripeCustomerId` + `stripeSubscriptionId` set.
- [ ] **Subscribe (yearly)** — same with the yearly button.
- [ ] **Manage subscription** — "Manage subscription" → Portal → "Return to DevStash" → back at `/settings`.
- [ ] **Switch plan in Portal** monthly → yearly — `customer.subscription.updated` fires; DB stays `isPro=true`; subscription ID updates if Stripe issues a new one.
- [ ] **Cancel in Portal (at period end)** — `customer.subscription.updated` with `cancel_at_period_end=true`; user **stays Pro** until period ends. Then `stripe trigger customer.subscription.deleted` flips `isPro=false`.
- [ ] **Webhook signature failure** — forged curl → 400, no DB change.
- [ ] **Unknown event** — `stripe trigger payment_intent.created` → 200, no DB change.
- [ ] **Capacity (Free)** — flip `isPro=false` via SQL on dev branch, create 50 items, attempt 51st → toast with capacity error.
- [ ] **Capacity (Pro)** — subscribe, then create 51+ items, all succeed.
- [ ] **File upload (Free)** — `isPro=false`, attempt upload → 403 + toast.
- [ ] **File upload (Pro)** — same flow succeeds.
- [ ] **Account delete** — Pro user deletes account → subscription cancelled in Stripe Dashboard within ~5s.
- [ ] **Session sync** — open `/settings` in window A and any dashboard page in window B. In window A, subscribe. In window B, navigate to any new server-rendered page (no reload of B's current page needed — must be navigation) → Billing card shows "Pro plan". Proves the JWT-resync (no re-signin).

### Build + types

- `npm run test:run` passes (baseline 280 + Phase 1 billing tests + the ~10–15 new ones from this phase).
- `npm run build` passes.

### Stripe Test Cards

| Scenario | Card |
| --- | --- |
| Success | `4242 4242 4242 4242` |
| Requires 3DS | `4000 0027 6000 3184` |
| Declined | `4000 0000 0000 9995` |
| Fails on subscription renewal | `4000 0000 0000 0341` |

Any future expiry, any 3-digit CVC.

## Implementation Order

Each step is mergeable behind the existing "all users are Pro" dev state — the gating doesn't bite until step 4 lands.

1. **Webhook handler** (§1) — test with `stripe trigger checkout.session.completed` and `stripe trigger customer.subscription.deleted`. Verify `isPro` flips in the DB.
2. **Billing server actions** (§2) — end-to-end Checkout with `stripe listen` running.
3. **Settings Billing UI** (§3) — real users can subscribe + manage. Update marketing CTA in the same commit.
4. **Free-tier enforcement** (§5) — capacity checks now bite. Add the `UpgradePromptDialog` (§4) for at least one consumer.
5. **Cancel-on-delete** (§6) — close the billing leak when users delete accounts.
6. **Sidebar Pro-badge gating** (§7) — subscribed users stop seeing the badge.

## Notes

- The downgrade UX is intentional: an expired Pro user keeps **read access** to all existing data (items past the 50-cap, files in R2). Only the next *create* hits the Free-tier limit.
- `stripeSubscriptionId` is cleared on `subscription.deleted` — confirm with stakeholders whether to keep the last value for audit instead. Plan defaults to clearing.
- Currency is USD-only at v1; multi-currency would need updates to `pricing-section.tsx` and Stripe price setup.
- Promo codes are enabled (`allow_promotion_codes: true`); flip if undesired.
- No free trial in v1; add `subscription_data: { trial_period_days: 7 }` to opt in later.
