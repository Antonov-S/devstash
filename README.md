<div align="center">

# DevStash

**One fast, searchable, AI-enhanced hub for all your dev knowledge.**

Snippets, prompts, commands, notes, files, images, and links — organized, searchable, and supercharged with AI. Think Notion meets Raycast, built for developers.

<br />

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-336791?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Billing-635BFF?logo=stripe&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-AI%20Features-412991?logo=openai&logoColor=white)

</div>

---

## Table of Contents

- [DevStash](#devstash)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
    - [Items \& Content](#items--content)
    - [Organization](#organization)
    - [Authentication](#authentication)
    - [AI (Pro)](#ai-pro)
    - [Billing](#billing)
    - [Polish](#polish)
  - [Tech Stack](#tech-stack)
  - [Architecture](#architecture)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
  - [Environment Variables](#environment-variables)
  - [Available Scripts](#available-scripts)
  - [Project Structure](#project-structure)
    - [Conventions](#conventions)
  - [Testing](#testing)
  - [Development Journey](#development-journey)
  - [License](#license)

---

## Overview

Developers keep their essentials scattered everywhere — snippets in VS Code, prompts in chat history, commands in `.txt` files, links in browser bookmarks, templates in GitHub Gists. The result is constant context switching and lost knowledge.

**DevStash** brings it all into a single, fast, searchable hub. Every piece of knowledge is an **item** with a type, content, tags, and optional collection membership. Code gets syntax highlighting, notes and prompts get a Markdown editor, files and images get cloud storage, and AI helps tag, describe, explain, and optimize everything you save.

---

## Features

### Items & Content

- **Seven system types** — `snippet`, `prompt`, `command`, `note`, `file`, `image`, `link`
- **Monaco code editor** with per-language syntax highlighting and a language picker (27 languages)
- **Markdown editor** with live preview (GFM) for notes and prompts
- **File & image uploads** to Cloudflare R2 with drag-and-drop, progress, and secure download proxy
- **Image gallery** view with thumbnails + quick-download, and a Drive-style **file list** view
- Quick-copy and quick-favorite actions on every card
- Pin items to the top, mark favorites, track recently used

### Organization

- **Collections** — group items freely; an item can live in multiple collections
- **Folders** — file uploads into a single home folder; each folder opens as its own page
- **Favorites** page with independent client-side sorting per section
- **Global command palette** (`Cmd/Ctrl + K`) with fuzzy, acronym-style search across items and collections
- URL-based **pagination** on item, collection, and listing pages

### Authentication

- Email / password sign-in with **bcrypt** hashing
- **GitHub OAuth** via NextAuth v5
- **Email verification** + **password reset** with single-use, hashed, expiring tokens (Resend)
- **Rate limiting** on all auth endpoints (Upstash Redis, fail-open)
- Account management: change password, delete account (with cascade + Stripe cleanup)

### AI (Pro)

Powered by OpenAI through dedicated, rate-limited server actions:

- **Auto-tagging** — suggest relevant tags from item content
- **Description generator** — one-to-two sentence summaries
- **Explain code** — plain-English explanation of a snippet/command, rendered inline
- **Optimize prompt** — rewrite a prompt with an Original/Refined compare-and-apply flow

### Billing

- **Stripe** subscriptions — Pro at **$8/mo or $72/yr**
- **Free-tier limits** (50 items, 3 collections, no file/image/AI) enforced server-side via capacity helpers

### Polish

- Dark mode first, responsive across breakpoints
- Per-user **editor preferences** (font size, tab size, theme, word wrap, minimap)
- Toast notifications, loading skeletons, smooth drawer transitions

> **Dev note:** During development every user has access to all Pro features — the `isPro` flag is the gate, flipped via Stripe when limits are enforced.

---

## Tech Stack

| Layer             | Technology                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------- |
| **Framework**     | [Next.js 16](https://nextjs.org/) (App Router) / React 19                                   |
| **Language**      | TypeScript (strict)                                                                         |
| **Database**      | [Neon](https://neon.tech/) (PostgreSQL, dev/prod branches)                                  |
| **ORM**           | [Prisma 7](https://www.prisma.io/)                                                          |
| **Auth**          | [NextAuth v5](https://authjs.dev/) — credentials + GitHub OAuth                             |
| **File Storage**  | [Cloudflare R2](https://developers.cloudflare.com/r2/) (S3-compatible)                      |
| **Rate Limiting** | [Upstash Redis](https://upstash.com/) + `@upstash/ratelimit`                                |
| **Email**         | [Resend](https://resend.com/)                                                               |
| **AI**            | [OpenAI](https://openai.com/) (Responses API)                                               |
| **Payments**      | [Stripe](https://stripe.com/)                                                               |
| **Styling**       | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (base-ui) |
| **Editors**       | [Monaco](https://github.com/suren-atoyan/monaco-react) + `react-markdown` / `remark-gfm`    |
| **Testing**       | [Vitest](https://vitest.dev/) (Node environment)                                            |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       Next.js App                        │
│                                                          │
│   Server Components & Actions   │   API Routes           │
│   /dashboard  /items/[type]     │   /api/auth/*          │
│   /collections  /favorites      │   /api/upload (R2)     │
│   /settings  /upgrade           │   /api/files/[id]      │
│   marketing homepage            │   /api/stripe/webhook  │
└─────────────────────────────────────────────────────────┘
        │              │              │            │
        ▼              ▼              ▼            ▼
  ┌──────────┐  ┌────────────┐  ┌─────────┐  ┌─────────┐
  │ Neon PG  │  │ Cloudflare │  │ OpenAI  │  │ Stripe  │
  │ (Prisma) │  │     R2     │  │   API   │  │ Billing │
  └──────────┘  └────────────┘  └─────────┘  └─────────┘
```

- **Server components fetch data directly with Prisma**; client components mutate through **server actions** that return a `{ success, data | error }` shape.
- **API routes** are reserved for webhooks, file uploads/downloads, and NextAuth — the cases that need raw requests, streaming, or specific status codes.
- All inputs are validated with **Zod**; all write paths re-check `isPro` against the database (never the JWT) to avoid stale-plan bugs.

---

## Getting Started

### Prerequisites

- **Node.js 20+** and npm
- A **Neon** (or any PostgreSQL) database
- Accounts/keys for the services you want to exercise locally: GitHub OAuth, Cloudflare R2, Upstash Redis, Resend, OpenAI, and Stripe (all optional for a basic run, but auth/uploads/AI/billing need theirs)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/Antonov-S/devstash.git
cd devstash
npm install

# 2. Configure environment
cp .env.example .env
# fill in the values — see "Environment Variables" below

# 3. Set up the database (runs migrations + generates the Prisma client)
npm run db:migrate

# 4. Seed demo data (demo user + system types + sample collections/items)
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

> **Database rule:** never use `prisma db push` — schema changes always go through migrations (`npm run db:migrate` in dev, `npm run db:deploy` in prod).

---

## Environment Variables

Copy `.env.example` to `.env` and fill in what you need.

| Variable                                                      | Purpose                                            |
| ------------------------------------------------------------- | -------------------------------------------------- |
| `DATABASE_URL`                                                | Neon / PostgreSQL connection string                |
| `AUTH_SECRET`                                                 | NextAuth session/JWT secret                        |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`                       | GitHub OAuth app credentials                       |
| `RESEND_API_KEY`                                              | Transactional email (verification, password reset) |
| `EMAIL_VERIFICATION_ENABLED`                                  | `"false"` to skip email verification in dev        |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`         | Rate limiting (fails open if unset)                |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Cloudflare R2 credentials                          |
| `R2_BUCKET_NAME` / `R2_PUBLIC_URL`                            | R2 bucket + public base URL                        |
| `OPENAI_API_KEY`                                              | AI features                                        |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`                 | Stripe API + webhook verification                  |
| `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`          | Pro plan price IDs                                 |

---

## Available Scripts

| Script                 | Description                                               |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Start the Next.js dev server                              |
| `npm run build`        | Generate Prisma client + production build                 |
| `npm start`            | Run the production build                                  |
| `npm run lint`         | Run ESLint                                                |
| `npm test`             | Run Vitest in watch mode                                  |
| `npm run test:run`     | Run the test suite once (CI mode)                         |
| `npm run db:migrate`   | Create/apply migrations in dev                            |
| `npm run db:deploy`    | Apply migrations in production                            |
| `npm run db:generate`  | Regenerate the Prisma client                              |
| `npm run db:studio`    | Open Prisma Studio                                        |
| `npm run db:seed`      | Seed the demo user + sample data                          |
| `npm run db:wipe-demo` | Reset the demo user (cancels Stripe sub, cascades delete) |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/             # sign-in, register, verify, reset flows
│   ├── (dashboard)/        # dashboard, items, collections, favorites,
│   │                       #   settings, profile, upgrade, checkout
│   ├── api/                # auth, upload, files, items, stripe, account
│   ├── page.tsx            # marketing homepage
│   └── globals.css         # Tailwind v4 theme (@theme directive)
├── actions/                # server actions (items, collections, auth, ai-*, billing)
├── components/             # feature-grouped UI (items, collections, ui, marketing, …)
├── lib/                    # prisma, auth helpers, db queries, ai runner,
│                           #   rate-limit, r2, stripe, constants, utils
├── hooks/                  # reusable client hooks
├── auth.ts / auth.config.ts# NextAuth split config (edge + full)
└── proxy.ts                # route gating middleware
prisma/                     # schema + migrations
scripts/                    # seed, wipe-demo, reset-users, test-db
context/                    # project specs, standards, and feature history
```

### Conventions

- **TypeScript strict**, no `any` — define interfaces for props, responses, and models.
- **Server components by default**; `'use client'` only when interactivity is needed.
- **Tailwind v4** is CSS-configured via `@theme` in `globals.css` — there is no `tailwind.config.*`.
- **Centralized constants** live in `src/lib/constants.ts`; no inline magic numbers in feature files.
- Components: PascalCase files; functions camelCase; constants SCREAMING_SNAKE_CASE.

---

## Testing

- **Framework:** Vitest (Node environment, no jsdom).
- **Scope:** server actions (`src/actions/**`) and utilities (`src/lib/**`) only — React components are intentionally out of scope.
- **Isolation:** the database, NextAuth, Stripe, OpenAI, Resend, and Upstash are all mocked at the module boundary, so tests are pure and fast.

```bash
npm run test:run   # single CI-style run
npm test           # watch mode
```

Both the test suite and `npm run build` must pass before any commit.

---

## Development Journey

DevStash was built feature-by-feature on a documented branch-per-feature workflow. The short version of how it came together:

1. **Foundation** — Next.js 16 + Tailwind v4 + shadcn/ui scaffold; dashboard UI built against mock data across three phases.
2. **Database** — Prisma + Neon PostgreSQL; schema for users, items, collections, item types, and tags; seed script for demo data.
3. **Data wiring** — dashboard, sidebar, and item lists wired to live Neon queries (with an early N+1 fix and other audit quick wins).
4. **Authentication** — NextAuth v5 with a split edge/full config, GitHub OAuth, credentials + bcrypt, email verification and password reset (Resend, hashed single-use tokens), and Upstash rate limiting across every auth route.
5. **Account & profile** — profile/settings pages, change password, delete account.
6. **Items CRUD** — type-filtered list pages, an item detail drawer, and create / edit / delete flows backed by validated server actions.
7. **Editors & uploads** — Monaco code editor with a language picker, a Markdown editor with live preview, and Cloudflare R2 file/image uploads with a secure download proxy, image gallery, and file-list views.
8. **Organization** — collections (create/edit/delete, add items), folders for filing files and images, favorites, pinning, quick-copy/quick-favorite card actions, a `Cmd/Ctrl + K` fuzzy command palette, and URL-based pagination.
9. **Settings** — a dedicated settings area plus per-user editor preferences (theme, font size, tab size, word wrap, minimap).
10. **Marketing site** — an animated homepage prototype ported to the real app (hero, features, pricing toggle, CTA), with shared branding.
11. **Billing** — Stripe integration in phases: SDK foundation, webhooks + checkout/portal actions, free-tier enforcement, upgrade prompts, and a celebratory post-checkout page.
12. **AI features** — built on the OpenAI Responses API: auto-tagging, description generation, explain-code, and prompt optimization — each Pro-gated and rate-limited.
13. **Refactors & polish** — recurring code-scanner audits, shared-helper extractions across actions and components, readability and accessibility fixes, and the consolidation of tunable values into a single constants module.

A full, granular per-feature changelog lives in [`context/current-feature.md`](context/current-feature.md).

---

## License

Private project. All rights reserved.

<div align="center">
<sub>Built with Next.js, Prisma, and a lot of incremental commits.</sub>
</div>
