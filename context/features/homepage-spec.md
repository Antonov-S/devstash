# Homepage (Real App)

## Overview

Convert the static mockup in `prototypes/homepage/` into the real Next.js marketing homepage at `src/app/page.tsx`. The prototype is the visual + behavioral source of truth — match the layout, sections, and interactions. Replace its hand-rolled CSS with Tailwind v4 + shadcn primitives, and split the page into server + client components.

The mockup files at `prototypes/homepage/` stay in the repo for reference; do not delete them.

## Scope

- Replace the `<h1>Devstash</h1>` placeholder at `src/app/page.tsx`.
- 7 sections in order: **Navigation**, **Hero** (text + chaos→arrow→dashboard visual), **Features**, **AI**, **Pricing**, **CTA**, **Footer**.
- Marketing-only — no new server actions, db helpers, or API routes.
- Page renders for both anonymous and authenticated users (see Auth-aware behavior below).

## Component Structure

`src/app/page.tsx` is the **server** component entry. It:

- Calls `auth()` once and passes a boolean `isAuthenticated` (and optional `userImage` / `userName` if useful) to children that need to swap CTAs.
- Renders the section components below in order.
- Wraps the page in a `min-h-screen bg-background` shell consistent with the rest of the app.

Co-locate everything under `src/components/marketing/`:

| File | Type | Notes |
| --- | --- | --- |
| `marketing-nav.tsx` | client | Fixed top nav. Needs scroll listener to add a backdrop/border past 20px scroll. |
| `hero-section.tsx` | server | Composes hero text + visual layout. Takes `isAuthenticated` so the CTA can flip. |
| `chaos-stage.tsx` | client | Animated icon stage (rAF loop + pointer repel). Lazy-load with `dynamic(..., { ssr: false })` from `hero-section.tsx` to avoid SSR + speed up TTI. |
| `dashboard-preview.tsx` | server | Static sidebar + 6 card grid. No state. |
| `features-section.tsx` | server | 6 feature cards in a grid. Pure markup. |
| `ai-section.tsx` | server | Two-column copy + editor mockup. Pure markup. |
| `pricing-section.tsx` | client | Owns the Monthly/Yearly toggle state. Takes `isAuthenticated` for the primary CTA target. |
| `cta-section.tsx` | server | Final CTA band. Takes `isAuthenticated`. |
| `marketing-footer.tsx` | server | Footer + dynamic year via `new Date().getFullYear()`. |
| `reveal.tsx` | client | Reusable `<Reveal>` wrapper that applies the IntersectionObserver `is-visible` toggle. Use it around sections/cards. Default to `<div>`, allow `as="section"` etc. |

Anything purely presentational (icons, headings, lists, badges) stays in server components.

## Styling

- **Tailwind v4 utilities only** — no separate `homepage.css` or scoped `.module.css`. Inline `style={{}}` is fine for per-card accent colors (item-type hex) since they're data-driven.
- Reuse existing tokens from `globals.css` (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, etc.) — do **not** introduce a parallel `--bg-1` / `--fg-dim` palette. Where the mockup used `--bg-1` / `--bg-2` / `--bg-3`, map to `bg-card` / `bg-muted` / `bg-secondary` (or `bg-zinc-900/50` etc.) — pick the closest existing token.
- **shadcn primitives**: `Button` (variants `default`/`outline`/`ghost`), `Badge` (for "Pro Feature", "Most Popular", "Save 25%"), `Separator` if needed.
- For per-card accent colors (features, dashboard preview cards), use Tailwind arbitrary properties: `style={{ borderTopColor: color }}` or `style={{ ['--accent' as string]: color }}` + `border-t-[3px]`-style classes.
- Gradient text ("Developer Knowledge"): keep the same `linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #f59e0b 100%)` via inline `style` + `bg-clip-text text-transparent`.
- Animations (`arrow-pulse`, `tag-in`) belong in `globals.css` under `@layer utilities` as keyframes + small classes, **not** as Tailwind config (we're on v4 CSS-only config).

## Item-type Color Palette

The mockup's CSS uses spec colors. The live app uses different values for `prompt` and `command`. **Use the live app values** so cards visually match what users see after they sign up:

| Type | Use this hex |
| --- | --- |
| snippet | `#3b82f6` |
| prompt | `#8b5cf6` (purple — not the mockup's amber) |
| command | `#f97316` (orange — not the mockup's cyan) |
| note | `#fde047` (yellow — not the mockup's green) |
| file | `#6b7280` |
| image | `#ec4899` |
| link | `#10b981` |

Single source of truth: import the values from `prisma/seed.ts`'s system-type list (or extract them into a small `src/lib/system-type-colors.ts` if it doesn't already exist — check before creating).

## Sections & Link Destinations

All anchor links are hash links to in-page sections (`#features`, `#ai`, `#pricing`).

### Navigation (`marketing-nav.tsx`)

- Logo → `/` (`<Link>`)
- Nav links: Features → `#features`, AI → `#ai`, Pricing → `#pricing`
- **Anonymous**: "Sign In" (ghost) → `/sign-in`, "Get Started" (primary) → `/register`
- **Authenticated**: replace both with a single "Go to dashboard" (primary) → `/dashboard`
- Scroll-past-20px: add `bg-background/90 backdrop-blur border-b border-border`. Below: `bg-background/60 backdrop-blur`.

### Hero

- Headline + sub + two CTAs:
  - **Anonymous**: "Start for Free" → `/register`, "See Features →" → `#features`
  - **Authenticated**: "Open dashboard" → `/dashboard`, "See Features →" → `#features`
- Visual: chaos stage | arrow | dashboard preview (3-col grid at ≥lg, stacked < lg with arrow rotated 90°).

### Features

6 cards (snippet/prompt/note/command/file/collections-style note). Border + icon tint via per-card `--accent`. Hover: lift -3px + accent-tinted radial glow (translate to Tailwind: `hover:-translate-y-0.5 transition-transform` + a `::before` accent gradient overlay handled via a small utility class or an absolutely-positioned `<span>` inside the card).

### AI Section

- Left: `Badge variant="secondary"` styled as the gold/pink "Pro Feature" badge, lead copy, 4-item checklist with green check circles.
- Right: editor mockup — keep the inline-`<pre>` markup with token-colored `<span>`s. Wrap in a card-shaped `<div>` with macOS dots + lang label + AI-tags footer. Reuse the existing `tag-in` keyframe (move to `globals.css`).

### Pricing (`pricing-section.tsx` — client)

- Toggle is a 2-button pill (`role="tab"` + `aria-selected`). Use `useState<"monthly" | "yearly">`. **No JSX-conditional swap** — render both prices via mapped strings driven by the state, keep the same structure as today's working toggle.
- Free card: primary CTA "Start free" → `/register` (anonymous) or "Open dashboard" → `/dashboard` (authenticated). Use `<Button variant="outline">` to match the ghost styling.
- Pro card: "Most Popular" badge absolute-positioned at top. CTA "Upgrade to Pro" → `/register` (anonymous, since billing isn't wired yet) or `/settings#billing` placeholder (authenticated). If `/settings#billing` doesn't exist yet, point both to `/register` — leave a TODO comment.

### CTA

- "Get DevStash Free" → `/register` (anonymous) or `/dashboard` (authenticated).

### Footer

- Logo, product/resources/company columns, copyright with current year (server-rendered).
- Product: Features (`#features`), Pricing (`#pricing`), AI (`#ai`), Changelog (`#`).
- Resources + Company columns: all `#` placeholders for now. Add a `// TODO: real links when these routes exist` comment.

## Interactivity (client only)

1. **Chaos animation** (`chaos-stage.tsx`): port the `ChaosIcon` class + rAF loop verbatim. Use `useEffect` for setup/teardown, `useRef` for the stage element. Respect `prefers-reduced-motion` (render icons in static spawn positions and skip the rAF loop). Pause loop on `visibilitychange`. Recompute bounds on `ResizeObserver`. Define the 8 `CHAOS_ICONS` (inline SVG strings + color + name) in a module-level const at the top of the file.
2. **Scroll reveal** (`reveal.tsx`): single shared `IntersectionObserver` instance via `useRef` would be ideal but a per-component observer is fine for 16 elements. Add `is-visible` class. Keyframes for the transition live in `globals.css`. Respect reduced-motion.
3. **Nav scroll state** (`marketing-nav.tsx`): `useEffect` + passive `scroll` listener, toggle a `data-scrolled` attribute and use `data-[scrolled=true]:` Tailwind variants.
4. **Pricing toggle** (`pricing-section.tsx`): `useState` driven, two `aria-selected` buttons.

## Auth-aware behavior

`page.tsx` does `const session = await auth(); const isAuthenticated = !!session?.user;` once, then threads `isAuthenticated` down to nav, hero, pricing, and CTA. Everywhere "Get Started" / "Start for free" / "Start free" / "Get DevStash Free" appears, swap copy + href when authenticated. Sign-in button hides for authenticated users. This avoids the awkward "Sign In" link for a logged-in user landing on `/`.

## SEO / Metadata

Export `metadata` from `src/app/page.tsx`:

- `title: "DevStash — One hub for all your dev knowledge"`
- `description`: same as the prototype's `<meta name="description">`.
- Add OG image later (out of scope).

## Responsive

Match the prototype's breakpoints, expressed in Tailwind defaults:

- `lg:` (≥1024px) — full 3-col features, 2-col AI section, 3-col hero visual.
- `md:` and below — features 2 cols, AI section single column, hero visual stacks vertically with the arrow rotated 90° (`md:rotate-0`). Nav links hide below `md:`.
- `sm:` (<640px) — features and pricing single column, footer becomes 2-col with brand spanning full width.

## Animations

Move these keyframes from `prototypes/homepage/styles.css` into `src/app/globals.css` under `@layer utilities`:

- `@keyframes arrow-pulse` → `.animate-arrow-pulse`
- `@keyframes tag-in` → `.animate-tag-in` (with staggered `animation-delay`s applied via inline `style` on each `<span>` based on index)
- The reveal transition — opacity + translateY — lives on a single `.reveal` / `.reveal.is-visible` pair.

All three should be wrapped in a `@media (prefers-reduced-motion: reduce)` no-op fallback.

## Out of Scope

- Real billing/upgrade flow (the Pro CTA points at `/register` for now).
- Changelog/Docs/Blog/Roadmap/Support/About/Privacy/Terms/Contact pages — footer links stay as `#`.
- Newsletter signup, social proof, testimonials.
- Light mode visual polish — the page is dark-first like the rest of the app.

## Testing

Per `coding-standards.md`'s Testing section, components are out of scope for Vitest. No new tests required. Verify in-browser at desktop + mobile widths, confirm:

- Anchor scrolling lands correctly under the fixed nav (add `scroll-mt-20` on each section heading).
- Chaos icons animate, repel cursor, and pause when the tab is hidden.
- Nav backdrop intensifies past 20px scroll.
- Pricing toggle swaps the Pro price between `$8` and `$6` and the billed-note.
- Authenticated session swaps Sign In + Get Started → Go to dashboard, and every "Start for free"-style CTA → "Open dashboard" (`/dashboard`).
- `npm run test:run` + `npm run build` still pass.
