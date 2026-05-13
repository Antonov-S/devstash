# Current Feature: Dashboard UI Typography & Spacing Refresh

## Status

In Progress

## Goals

- Improve readability on large displays by normalizing the typography scale across the dashboard
- Unify typography rhythm (size, weight, line-height) between sidebar, dashboard, drawer, dialog, forms, and cards — use sidebar as the visual baseline
- Bump dashboard section titles (h2) from `text-base` to `text-lg font-semibold` with slightly improved vertical spacing
- Increase `ItemCard` typography (title/metadata/description/tags) from `text-xs` baseline toward `text-sm` for body, with improved line-height for multi-line content; bump internal padding only if needed
- Make the item detail drawer (title, labels, content, metadata) feel less dense — better spacing between blocks, comfortable reading width and line-height
- Make the New Item dialog more readable on desktop — labels `text-sm font-medium`, inputs `text-sm`, form group spacing `space-y-4` or equivalent
- Make the dashboard search bar align with sidebar input styling — larger input text (`text-sm` or `text-base`), slightly larger horizontal padding, readable placeholder
- Keep dashboard title (h1, `text-2xl`) and status bar (`text-sm`) sizes as-is — use the status bar as readable-body-text reference
- Eliminate small unreadable text sizes, keep dark/light theme + responsive behavior intact, no functional/behavioral regressions

## Notes

Spec: `context/features/ui-typography-update-spec.md`

Scope:

- Purely visual / UI polish. Prefer Tailwind utility tweaks over structural rewrites; reuse existing tokens/classes.
- Use the sidebar's typography and spacing as the primary design reference for the rest of the dashboard.

Constraints (do not change):

- No functionality, state, API, server action, or routing changes
- No component behavior changes
- No new design language — keep current visual style and component architecture
- Preserve dark/light theme compatibility and responsive behavior

Suggested surfaces to audit/adjust:

- Dashboard top bar (status bar baseline + search input)
- Section headings (`h2`) across the dashboard
- `ItemCard` (titles, descriptions, metadata, tags) + empty states
- Item detail drawer (header, action bar, body content blocks, dl metadata grid, tags/collections sections, edit-mode form)
- `NewItemDialog` form (labels, inputs, placeholders, helper text, type selector, group spacing)
- Shared form controls / labels used across the dashboard

Implementation notes:

- Compare typography scale usage across components and normalize inconsistencies before bumping individual sizes
- Avoid overly large typography that adds visual noise — the goal is comfortable reading, not big text
- Reference screenshots: `context/screenshots/dashboard-ui-main.png`, `context/screenshots/dashboard-ui-drawer.png`

Acceptance:

- Dashboard typography feels visually consistent and unified with the sidebar
- Cards, drawers, dialogs, and forms are easier to scan on large displays
- No functionality regressions, no layout breaking changes

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
- Vitest setup — Vitest 4 with Node env, native tsconfig paths (`@/* → src/*`), and a `vitest.setup.ts` that stubs `"server-only"`; scope limited to server actions (`src/actions/**`) and utilities (`src/lib/**`) — components excluded; Prisma + NextAuth mocked via `vi.mock` so tests are pure and fast; sample tests cover `system-types`, `utils.cn`, pure `rate-limit` helpers (`extractIp`/`formatRetryAfter`/`rateLimitMessage`), and `deleteAccountAction` (demonstrating the mocking pattern for `@/auth` + `@/lib/prisma`); `npm test` (watch) + `npm run test:run` (one-shot) added; `ai-interaction.md` workflow updated to require tests in step 4 alongside the build, and `coding-standards.md` gained a Testing section — Completed
- Items list 3-column grid — `/items/[type]` page grid bumped from `grid-cols-1 md:grid-cols-2` to `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` so wider viewports see more items per row (mobile 1 col / tablet 2 col unchanged); bundled fix to `vitest.config.ts` adding `fileParallelism: false` to work around Vitest 4 cross-worker module-resolution cache poisoning caused by `next-auth/lib/env.js` failing to resolve `next/server` under Node ESM, which broke the whole suite even though every test file passed in isolation — Completed
- Item detail drawer — right-side shadcn Sheet drawer opens on `ItemCard` click across `/dashboard` and `/items/[type]`; new `ClickableItemCard` client wrapper turns the existing `ItemCard` into a `<button>` and owns drawer state so pages stay server components; card data continues to come from server components while the full detail (content, file/url, language, collections, createdAt) is fetched on click via new `auth()`-gated `GET /api/items/[id]` returning the new `ItemDetail` from `getItemDetailForUser` in `src/lib/db/items.ts` (scoped by `userId`, flattens tags + collections); drawer header shows type icon + title + Type/language badges, action bar has Favorite (yellow star when active), Pin, Copy (wired to `navigator.clipboard`), Edit, Delete (right-aligned trash) — Favorite/Pin/Edit/Delete stubbed per spec; body renders Description, Content (`<pre>` for TEXT, external link for URL, file row with `formatBytes` for FILE), Tags, Collections, and Created/Updated/Last used in a dl grid; skeleton + error states while the fetch is in flight; AbortController cancels in-flight requests on close; `formatDate` coerces ISO strings since the API serializes Dates to JSON; new unit tests in `src/lib/db/__tests__/items.test.ts` cover `getItemDetailForUser` (null on miss, full field mapping, user scoping) — route handler not unit-tested because importing it pulls next-auth's `next/server` resolution into Vitest and poisons the suite (the same issue the existing fileParallelism workaround can't fully escape) — Completed
- Item drawer edit mode — pencil Edit toggles the open drawer into inline edit mode, swapping the action bar to Save (primary, left) + Cancel and the body to a controlled form with Title (required), Description, Tags (comma-separated), and type-aware Content (snippet/prompt/command/note), Language (snippet/command), URL (link); new `updateItemAction` in `src/actions/items.ts` returns `{ success, data | error }`, validates with Zod 4 (trimmed required `title`, optional trimmed string fields, `new URL()`-checked optional `url`, deduped trimmed `tags`), checks `auth()` session, and delegates to new `updateItemForUser` in `src/lib/db/items.ts` which verifies ownership and runs `tagsOnItems.deleteMany` + `item.update` (with `tags.create` + `connectOrCreate`) inside a `$transaction`, returning the refreshed `ItemDetail` so the drawer skips a second fetch; client uses `useTransition` for pending state, toasts on success/error, calls `router.refresh()` to sync the underlying card lists, and disables Save when title is empty; manual `useCallback`/`useMemo` dropped throughout the drawer since `reactCompiler: true` is on in `next.config.ts`; `zod` added as a direct dependency; new Vitest tests in `src/actions/__tests__/items.test.ts` (7 cases: no session, empty id, empty title, invalid URL, not-found, normalization, generic-error) and three more in `src/lib/db/__tests__/items.test.ts` covering `updateItemForUser` (ownership miss, tag dedup + connect-or-create shape, refreshed-detail return) — Completed
- Item delete — trash icon in the drawer action bar now opens a base-ui `Dialog` confirmation ("Delete \"<title>\"?" + "cannot be undone" warning, dismiss locked while pending) that calls new `deleteItemAction` in `src/actions/items.ts`; action validates `auth()` session + non-empty id, delegates to new `deleteItemForUser` in `src/lib/db/items.ts` which uses ownership-scoped `prisma.item.deleteMany({ where: { id, userId } })` so wrong-owner and missing-id collapse to `count === 0` (no enumeration oracle) and Prisma's `onDelete: Cascade` cleans up `TagsOnItems` + `ItemCollection`; on success the drawer closes via `onOpenChange(false)`, toasts `"Item deleted"`, and calls `router.refresh()` so dashboard pinned/recent + items-by-type grids re-fetch; new Vitest cases in `src/actions/__tests__/items.test.ts` (no session, empty id, not-found, success, generic-error) and `src/lib/db/__tests__/items.test.ts` (scoping shape, deleted, no-match) — Completed
- Item create — new `NewItemDialog` client component wired to the top-bar "New Item" button: shadcn `Dialog` with a radio-style 5-type selector (snippet/prompt/command/note/link, colored Lucide icons) and type-aware fields (title required for all, content for snippet/prompt/command/note, language for snippet/command, URL required for link, comma-separated tags for all); new `createItemAction` in `src/actions/items.ts` returns `{ success, data | error }`, validates with Zod 4 (trimmed required title, optional trimmed strings, `new URL()`-checked URL, `superRefine` requiring URL for link, deduped trimmed tags), checks `auth()` session, then strips fields irrelevant to the chosen type before delegating to new `createItemForUser` in `src/lib/db/items.ts`; the db helper looks up the system `ItemType` by name (returns null when missing so the action surfaces "Item type not found"), derives `contentType` (`TEXT` for snippet/prompt/command/note, `URL` for link) from a per-type lookup table, dedupes tags inside the helper via `Array.from(new Set(...))` (matches the `updateItemForUser` pattern), runs `prisma.item.create` with `tags.connectOrCreate`, then re-reads via `getItemDetailForUser` so the action returns the refreshed `ItemDetail`; client uses `useTransition`, toasts on success/error, resets all state on close (locked while pending), and calls `router.refresh()` so sidebar counts + dashboard lists pick up the new row; new Vitest tests in `src/actions/__tests__/items.test.ts` (8 cases: no session, empty title, missing URL for link, invalid URL, normalization with type-irrelevant field stripping, link keeps URL drops content/language, snippet keeps language, type-not-found, generic-error) and `src/lib/db/__tests__/items.test.ts` (4 cases: type not found, snippet creates TEXT with deduped connect-or-create tags, link creates URL contentType, refreshed-detail return) — Completed
