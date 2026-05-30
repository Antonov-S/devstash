# Footer Links — Spec

## Status

Not Started

## Goal

Turn the marketing footer's dead placeholder links into real destinations where
real destinations exist, and remove the ones that point nowhere. Adds three new
public pages (`/privacy`, `/terms`, `/changelog`), wires `Docs` to the GitHub
README, and keeps `Support` / `Contact` as placeholders until a `devstash.xyz`
inbox is ready.

The footer (`src/components/marketing/marketing-footer.tsx`) currently renders
**only on the homepage** (`src/app/page.tsx`). This feature's new
`(marketing)/layout.tsx` also renders `MarketingFooter`, so the footer will now
appear on `/privacy`, `/terms`, and `/changelog` as well. Because of that, the
section anchors **must switch from bare `#features` to absolute `/#features`**
(see §6) — the same pattern `MarketingNav` already uses — otherwise they'd
resolve against the current path (e.g. `/privacy#features`) and break.

## Decisions (locked)

| Link | Column | Decision |
| --- | --- | --- |
| Features | Product | Anchor → **`/#features`** (was `#features`) |
| Pricing | Product | Anchor → **`/#pricing`** (was `#pricing`) |
| AI | Product | Anchor → **`/#ai`** (was `#ai`) |
| **Changelog** | Product | **New `/changelog` page** — curated, release-note style |
| **Docs** | Resources | **External link** → GitHub README (new tab) |
| ~~Blog~~ | Resources | **Remove** |
| ~~Roadmap~~ | Resources | **Remove** |
| Support | Resources | **Keep as disabled placeholder** (until `devstash.xyz` inbox exists) |
| ~~About~~ | Company | **Remove** |
| **Privacy** | Company | **New `/privacy` page** |
| **Terms** | Company | **New `/terms` page** |
| Contact | Company | **Keep as disabled placeholder** (until `devstash.xyz` inbox exists) |

Resulting columns:

- **Product:** Features · Pricing · AI · Changelog
- **Resources:** Docs · Support *(placeholder)*
- **Company:** Privacy · Terms · Contact *(placeholder)*

## ⚠️ Legal caveat

The `/privacy` and `/terms` pages are **honest, project-accurate starting
templates — not legal advice**. They should describe what DevStash actually does
(see "Disclosures" below), but before relying on them in production the user
should have them reviewed by a qualified professional and confirm they meet the
requirements of the jurisdictions DevStash operates in (and Stripe's / GDPR's
expectations for a paid SaaS collecting personal data).

## Implementation

### 1. New `(marketing)` route group + shared layout

Create `src/app/(marketing)/layout.tsx` so the three content pages share one
shell (mirrors how `src/app/(auth)/layout.tsx` composes `MarketingNav`):

- `async` component; `const session = await auth();` →
  `isAuthenticated = Boolean(session?.user)`.
- Renders `<MarketingNav isAuthenticated={isAuthenticated} />` at top.
- A `<main>` wrapper with top padding to clear the fixed nav (match the auth
  layout: `pt-24 pb-10 sm:pt-28`) and a centered readable container
  (`mx-auto w-full max-w-3xl px-6`).
- Renders `<MarketingFooter />` at the bottom so these pages match the homepage
  chrome.
- Same page background treatment as the homepage is optional; keep it simple
  (plain `bg-background text-foreground`).

The homepage stays at `src/app/page.tsx` (root, **not** moved into the group) and
keeps composing its own sections + nav + footer exactly as today.

### 2. Shared prose styling

Long-form text on all three pages should use one consistent, lightweight prose
treatment. **Do not** pull in `@tailwindcss/typography` (we're on Tailwind v4
CSS config) and **do not** reuse the editor-tuned `.markdown-preview` styles.

Hand-write semantic JSX (`<h1>`/`<h2>`/`<p>`/`<ul>`). Create **one** shared
wrapper component — `MarketingProse` under `src/components/marketing/` — used by
all three pages (privacy, terms, changelog). It applies spacing + heading +
body + list styling to its children via child-element selector classes on a
single root, e.g.:

```
[&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground
[&_p]:my-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground
[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:text-sm [&_li]:text-muted-foreground
[&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2
```

(Exact class list is illustrative — tune for readability.) Each page renders its
own `<h1>` (page title) + a "Last updated" line above `<MarketingProse>`, so the
`h1` styling can live on the page, not the wrapper. Body text uses the existing
`foreground` / `muted-foreground` tokens so it reads correctly on both dark
(default) and light themes.

### 3. `/privacy` page — `src/app/(marketing)/privacy/page.tsx`

- `export const metadata` → title `"Privacy Policy · DevStash"` + a short
  `description`.
- "Last updated: May 31, 2026" — a hardcoded date string (**not** `new Date()` —
  a legal doc's effective date must not silently change on every deploy; bump it
  by hand when the policy actually changes). Use this same date on `/terms`.
- Content sections (project-accurate disclosures):
  - **What we collect** — name, email, hashed password (credentials users),
    GitHub profile basics (OAuth users), the items/collections/files you create,
    and uploaded files stored in object storage.
  - **How we use it** — to operate the app, authenticate you, send
    transactional email (verification, password reset), process payments, and
    power optional AI features.
  - **Third-party sub-processors** — disclose the real stack: Neon (database),
    Cloudflare R2 (file storage), Stripe (payments), Resend (email), Upstash
    (rate limiting), OpenAI (AI features, Pro only), and the hosting provider.
  - **Cookies / sessions** — auth session cookie via NextAuth (JWT).
  - **Data retention & deletion** — account deletion removes user data and
    associated uploaded files (references the existing R2 cleanup behavior).
  - **Your rights** — access/correction/deletion; how to request (via the
    forthcoming support address — see note).
  - **Contact** — placeholder note that a `support@devstash.xyz` address is
    coming; do **not** print a personal email.

### 4. `/terms` page — `src/app/(marketing)/terms/page.tsx`

- `export const metadata` → title `"Terms of Service · DevStash"` + a short
  `description`.
- "Last updated: May 31, 2026" — same hardcoded date as `/privacy`.
- Content sections:
  - **Acceptance** of terms.
  - **Accounts** — accurate info, you're responsible for your credentials.
  - **Acceptable use** — no illegal/abusive content; no attempts to break the
    service or other users' data.
  - **Subscriptions & billing** — Pro is $8/mo or $72/yr via Stripe; renews
    until cancelled; manage/cancel via the billing portal; no specific refund
    promise beyond what the law requires (keep honest and minimal).
  - **Free tier limits** — reference current limits (50 items / 3 collections,
    no file/image uploads, no AI) without hardcoding numbers that drift; keep
    wording general or link to the pricing section.
  - **Your content** — you own your content; you grant us the limited rights
    needed to store and display it back to you.
  - **Termination** — either party may terminate; effect of termination.
  - **Disclaimers & limitation of liability** — provided "as is", standard.
  - **Changes to terms** — we may update; continued use = acceptance.
  - **Contact** — same placeholder note as Privacy.

### 5. `/changelog` page — `src/app/(marketing)/changelog/page.tsx`

- `export const metadata` → title `"Changelog · DevStash"` + a short
  `description`.
- **Source:** the README's "Development Journey" (13 phases). Rewrite into
  user-facing, release-note style — feature names users recognize. **Never** dump
  the raw `context/current-feature.md` History log (it contains file paths,
  function names, test counts, infra IDs, and email addresses).
- **No sensitive data:** no emails, no Neon project/branch IDs, no internal file
  paths, no personal info, no GitHub repo internals.
- **Structure:** an `<h1>` "Changelog" + intro line, then one section per group
  below (newest first), each an `<h2>` heading with a short bulleted list of
  user-facing capabilities. Group the 13 README phases into these
  user-facing buckets (collapse the refactor/polish phases — users don't care
  about internal refactors):

  1. **AI features** — auto-tagging, description generation, code explanation,
     prompt optimization (Pro).
  2. **Pro plans & billing** — Stripe subscriptions ($8/mo, $72/yr), upgrade
     flow, billing management.
  3. **Files & images** — uploads, image gallery, file list, quick download.
  4. **Search & organization** — global command palette (⌘K), collections,
     favorites, pinned items, pagination.
  5. **Editors** — code editor with syntax highlighting + language picker,
     markdown editor, editor preferences.
  6. **Items** — create / edit / delete snippets, prompts, commands, notes,
     links; quick copy; item drawer.
  7. **Accounts & security** — email/password + GitHub sign-in, email
     verification, password reset, rate limiting, account/settings management.
  8. **Foundation** — dashboard, marketing site, dark/light theming.

- Dates are optional; phase/group ordering is enough (no precise per-item dates).
- Keep it a **static, hand-maintained** page — no DB, no generation pipeline.
  Add a brief comment at the top of the file noting it's updated by hand when
  notable features ship.

### 6. Rewrite the footer link rendering

`marketing-footer.tsx` currently `.map`s plain `string[]` arrays, which no longer
fits now that links differ by kind (internal page / external / same-page anchor /
disabled placeholder). Introduce a small typed descriptor + renderer:

```ts
type FooterLink =
  | { label: string; href: string; kind: "anchor" }      // absolute /#hash to a homepage section
  | { label: string; href: string; kind: "internal" }    // next/link to a real route
  | { label: string; href: string; kind: "external" }    // new tab, rel="noopener noreferrer"
  | { label: string; kind: "placeholder" };              // disabled (current placeholder styling)
```

Column definitions:

- **Product:** Features (`anchor` `/#features`), Pricing (`anchor` `/#pricing`),
  AI (`anchor` `/#ai`), Changelog (`internal` `/changelog`). Note the absolute
  `/#…` form so anchors work from `/privacy` etc. (see Goal + §1).
- **Resources:** Docs (`external` → GitHub README), Support (`placeholder`).
- **Company:** Privacy (`internal` `/privacy`), Terms (`internal` `/terms`),
  Contact (`placeholder`).

A `FooterLinkItem` sub-component renders by `kind`:

- `anchor` / `external` → `<a>`; external adds `target="_blank"
  rel="noopener noreferrer"`.
- `internal` → `next/link` `<Link>`.
- `placeholder` → keep the existing disabled treatment exactly
  (`aria-disabled="true"` + `tabIndex={-1}` + `cursor-not-allowed opacity-50
  pointer-events-none`).

All link kinds keep the existing
`text-sm text-muted-foreground transition-colors hover:text-foreground` base
styling (placeholder omits hover, as today).

### 7. GitHub repo URL → `constants.ts`

Per the project convention (all shared/tunable values live in
`src/lib/constants.ts`), add:

```ts
export const GITHUB_REPO_URL = "https://github.com/Antonov-S/devstash";
```

The footer's `Docs` external link uses `${GITHUB_REPO_URL}#readme`. (A future
`SUPPORT_EMAIL` constant can be added here when the `devstash.xyz` inbox exists
and the Support/Contact placeholders are wired up.)

## Files

**New:**

- `src/app/(marketing)/layout.tsx` — shared nav + container + footer shell.
- `src/app/(marketing)/privacy/page.tsx`
- `src/app/(marketing)/terms/page.tsx`
- `src/app/(marketing)/changelog/page.tsx`
- `src/components/marketing/marketing-prose.tsx` — `MarketingProse` wrapper.

**Changed:**

- `src/components/marketing/marketing-footer.tsx` — typed `FooterLink` model +
  `FooterLinkItem` renderer; new column link sets; absolute `/#…` anchors;
  Blog/Roadmap/About removed.
- `src/lib/constants.ts` — add `GITHUB_REPO_URL`.

## Out of scope / deferred

- Wiring `Support` / `Contact` to real `mailto:` links — deferred until a
  `devstash.xyz` address + Cloudflare Email Routing forwarding is set up. They
  stay disabled placeholders for now.
- `Blog`, `Roadmap`, `About` — removed, not rebuilt.
- Auto-generating the changelog from the history log or git — explicitly not
  done; the page is hand-maintained.
- A `/docs` site — `Docs` points at the GitHub README instead.

## Testing

- Per `coding-standards.md`, pages/components are **out of Vitest scope** and
  this feature adds no new server actions or `src/lib/**` utilities beyond the
  `GITHUB_REPO_URL` constant — so **no new Vitest tests**.
- `npm run test:run` (existing suite) and `npm run build` must both pass.
- Manual/Playwright verification:
  - Footer renders the three columns with the new link set; removed links gone.
  - `Docs` opens the GitHub README in a new tab.
  - `Changelog` / `Privacy` / `Terms` navigate to the new pages, which render
    with nav + footer + readable prose.
  - `Support` / `Contact` remain visibly disabled and non-interactive.
  - New pages render correctly on mobile and desktop.
```
