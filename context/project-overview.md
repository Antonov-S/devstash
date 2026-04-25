# DevStash — Project Overview

> **One fast, searchable, AI-enhanced hub for all dev knowledge & resources.**
> Modern, minimal, developer-focused — think Notion meets Raycast for developers.

---

## Table of Contents

- [Problem](#problem)
- [Target Users](#target-users)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Data Models](#data-models)
- [Features](#features)
- [Item Types](#item-types)
- [UI/UX Guidelines](#uiux-guidelines)
- [Monetization](#monetization)
- [AI Features](#ai-features)
- [Routes](#routes)

---

## Problem

Developers keep their essentials scattered across too many places:

| Where it lives | What's stored |
|---|---|
| VS Code / Notion | Code snippets |
| Chat history | AI prompts |
| Buried project folders | Context files |
| Browser bookmarks | Useful links |
| Random folders | Docs |
| `.txt` files | Commands |
| GitHub Gists | Project templates |
| Bash history | Terminal commands |

This creates context switching, lost knowledge, and inconsistent workflows. DevStash solves this with a single hub.

---

## Target Users

| User | Need |
|---|---|
| **Everyday Developer** | Fast access to snippets, prompts, commands, links |
| **AI-first Developer** | Saves prompts, context files, system messages, workflows |
| **Content Creator / Educator** | Code blocks, explanations, course notes |
| **Full-stack Builder** | Patterns, boilerplates, API examples |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) / React 19 |
| **Language** | TypeScript |
| **Database** | [Neon](https://neon.tech/) (PostgreSQL) |
| **ORM** | [Prisma 7](https://www.prisma.io/) |
| **Auth** | [NextAuth v5](https://authjs.dev/) — Email/password + GitHub OAuth |
| **File Storage** | [Cloudflare R2](https://developers.cloudflare.com/r2/) |
| **Caching** | Redis (TBD) |
| **AI** | OpenAI `gpt-4o-mini` |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Payments** | Stripe |

> **Database rule:** Never use `db push` or directly modify the database structure. Always create migrations to run in dev, then prod.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Next.js App                       │
│                                                     │
│  ┌──────────────┐  ┌───────────────────────────┐   │
│  │   SSR Pages  │  │   API Routes              │   │
│  │  /items/*    │  │  /api/items               │   │
│  │  /collections│  │  /api/collections         │   │
│  │  /settings   │  │  /api/upload (R2)         │   │
│  └──────────────┘  │  /api/ai/*                │   │
│                    └───────────────────────────┘   │
└─────────────────────────────────────────────────────┘
          │                    │
          ▼                    ▼
   ┌─────────────┐     ┌──────────────┐
   │  Neon (PG)  │     │ Cloudflare   │
   │  via Prisma │     │     R2       │
   └─────────────┘     └──────────────┘
          │
          ▼
   ┌─────────────┐
   │  OpenAI API │
   │ (Pro users) │
   └─────────────┘
```

---

## Data Models

### Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── User ───────────────────────────────────────────

model User {
  id                    String    @id @default(cuid())
  name                  String?
  email                 String    @unique
  emailVerified         DateTime?
  image                 String?
  password              String?   // hashed, null for OAuth users
  isPro                 Boolean   @default(false)
  stripeCustomerId      String?   @unique
  stripeSubscriptionId  String?   @unique
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  accounts    Account[]
  sessions    Session[]
  items       Item[]
  collections Collection[]
  itemTypes   ItemType[]
}

// ─── NextAuth Models ─────────────────────────────────

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── ItemType ────────────────────────────────────────

model ItemType {
  id       String  @id @default(cuid())
  name     String  // snippet | prompt | command | note | file | image | link
  icon     String  // Lucide icon name
  color    String  // hex color
  isSystem Boolean @default(false)
  userId   String? // null for system types

  user  User?  @relation(fields: [userId], references: [id], onDelete: Cascade)
  items Item[]

  @@unique([name, userId])
}

// ─── Item ────────────────────────────────────────────

enum ContentType {
  TEXT
  FILE
  URL
}

model Item {
  id          String      @id @default(cuid())
  title       String
  contentType ContentType
  content     String?     // text content; null if FILE or URL
  fileUrl     String?     // Cloudflare R2 URL; null if TEXT or URL
  fileName    String?     // original filename
  fileSize    Int?        // bytes
  url         String?     // for link type items
  description String?
  language    String?     // e.g. "typescript", "python" — for code items
  isFavorite  Boolean     @default(false)
  isPinned    Boolean     @default(false)
  lastUsedAt  DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  userId     String
  itemTypeId String

  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  itemType    ItemType         @relation(fields: [itemTypeId], references: [id])
  tags        TagsOnItems[]
  collections ItemCollection[]
}

// ─── Collection ──────────────────────────────────────

model Collection {
  id            String   @id @default(cuid())
  name          String
  description   String?
  isFavorite    Boolean  @default(false)
  defaultTypeId String?  // suggested type for new items
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  userId String

  user  User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  items ItemCollection[]
}

// ─── ItemCollection (join) ───────────────────────────

model ItemCollection {
  itemId       String
  collectionId String
  addedAt      DateTime @default(now())

  item       Item       @relation(fields: [itemId], references: [id], onDelete: Cascade)
  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  @@id([itemId, collectionId])
}

// ─── Tag ─────────────────────────────────────────────

model Tag {
  id    String        @id @default(cuid())
  name  String        @unique
  items TagsOnItems[]
}

model TagsOnItems {
  itemId String
  tagId  String

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([itemId, tagId])
}
```

---

## Features

### A. Items

Items are the core unit in DevStash. Each has a **type**, **content**, optional **tags**, and can belong to multiple **collections**.

- Quick create & access via a **slide-in drawer**
- Markdown editor for text types
- Syntax highlighting for code types
- File upload for `file` / `image` types (Pro)
- Import content from a local file
- Pin items to the top
- Mark as favorite
- Track recently used (`lastUsedAt`)
- View all collections an item belongs to

### B. Collections

Logical groups of items. An item can belong to **multiple collections** simultaneously.

Examples:
- `React Patterns` → snippets + notes
- `Context Files` → files
- `Python Snippets` → snippets
- `Interview Prep` → snippets + notes + links

Features:
- Favorite collections
- `defaultTypeId` to suggest a type for new items
- Color-coded cards based on the dominant item type

### C. Search

Full-text search across:
- Item title
- Item content
- Tags
- Item type

### D. Authentication

- Email / password (with hashed passwords)
- GitHub OAuth via NextAuth v5

### E. Other Features

- Export data as JSON or ZIP (Pro)
- Dark mode by default, light mode toggle
- Add / remove items from multiple collections
- Toast notifications for all actions
- Loading skeleton states

---

## Item Types

System types are read-only. Users will be able to add **custom types** in a future release (Pro only).

| Type | Icon | Color | Content Kind | URL |
|---|---|---|---|---|
| `snippet` | `Code` | `#3b82f6` blue | TEXT | `/items/snippets` |
| `prompt` | `Sparkles` | `#8b5cf6` purple | TEXT | `/items/prompts` |
| `command` | `Terminal` | `#f97316` orange | TEXT | `/items/commands` |
| `note` | `StickyNote` | `#fde047` yellow | TEXT | `/items/notes` |
| `file` | `File` | `#6b7280` gray | FILE 🔒 | `/items/files` |
| `image` | `Image` | `#ec4899` pink | FILE 🔒 | `/items/images` |
| `link` | `Link` | `#10b981` emerald | URL | `/items/links` |

> 🔒 Pro only

Seed these system types on first deploy:

```ts
// prisma/seed.ts
const systemTypes = [
  { name: 'snippet', icon: 'Code',       color: '#3b82f6', isSystem: true },
  { name: 'prompt',  icon: 'Sparkles',   color: '#8b5cf6', isSystem: true },
  { name: 'command', icon: 'Terminal',   color: '#f97316', isSystem: true },
  { name: 'note',    icon: 'StickyNote', color: '#fde047', isSystem: true },
  { name: 'file',    icon: 'File',       color: '#6b7280', isSystem: true },
  { name: 'image',   icon: 'Image',      color: '#ec4899', isSystem: true },
  { name: 'link',    icon: 'Link',       color: '#10b981', isSystem: true },
]
```

---

## UI/UX Guidelines

### Layout

```
┌────────────────────────────────────────────────────────┐
│  Sidebar (collapsible)      │  Main Content             │
│                             │                           │
│  ▸ Snippets                 │  ┌──────┐ ┌──────┐       │
│  ▸ Prompts                  │  │Coll. │ │Coll. │       │
│  ▸ Commands                 │  │card  │ │card  │       │
│  ▸ Notes                    │  └──────┘ └──────┘       │
│  ▸ Links                    │                           │
│  ─────────────────          │  ┌────┐ ┌────┐ ┌────┐   │
│  Collections                │  │item│ │item│ │item│   │
│  ▸ React Patterns           │  └────┘ └────┘ └────┘   │
│  ▸ Context Files            │                           │
│  ▸ Python Snippets          │                           │
└─────────────────────────────┴───────────────────────────┘
```

- Sidebar collapses to icon-only on desktop; becomes a **drawer on mobile**
- Collection cards are color-coded by the dominant item type in that collection
- Item cards are color-coded by their type (border color)
- Items open in a **right-side drawer** (not a new page)

### Design Principles

- Dark mode default, light mode optional
- Reference aesthetics: [Notion](https://notion.so), [Linear](https://linear.app), [Raycast](https://raycast.com)
- Clean typography, generous whitespace
- Subtle borders and shadows
- Syntax highlighting for all code blocks

### Micro-interactions

- Smooth transitions on drawer open/close
- Hover states on all cards
- Toast notifications for create, update, delete, copy
- Loading skeletons during data fetches

---

## Monetization

### Free Tier

| Limit | Value |
|---|---|
| Items | 50 total |
| Collections | 3 |
| Item types | All system types except `file` and `image` |
| File uploads | ✗ |
| AI features | ✗ |
| Search | Basic |
| Export | ✗ |

### Pro — $8/month or $72/year

| Feature | Included |
|---|---|
| Items | Unlimited |
| Collections | Unlimited |
| File & image uploads | ✓ |
| Custom types | ✓ (future) |
| AI auto-tagging | ✓ |
| AI code explanation | ✓ |
| AI prompt optimizer | ✓ |
| AI summaries | ✓ |
| Export (JSON / ZIP) | ✓ |
| Priority support | ✓ |

> **Development note:** During development, all users have access to all Pro features. The `isPro` flag is the gate — flip it when ready to enforce limits.

---

## AI Features

All AI features are **Pro only** and powered by OpenAI `gpt-4o-mini`.

| Feature | Description |
|---|---|
| **Auto-tag suggestions** | Suggest relevant tags based on item content |
| **AI Summary** | One-sentence summary of an item |
| **Explain This Code** | Plain-English explanation of a code snippet |
| **Prompt Optimizer** | Rewrite and improve AI prompts for clarity and effectiveness |

AI calls go through dedicated API routes (e.g. `/api/ai/explain`, `/api/ai/tags`) to keep keys server-side.

---

## Routes

### Pages

| Route | Description |
|---|---|
| `/` | Landing / marketing page |
| `/dashboard` | Main app view (collections grid) |
| `/items/[type]` | Filtered view by item type |
| `/collections/[id]` | Single collection with its items |
| `/settings` | User settings, export, billing |

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/items` | GET, POST | List / create items |
| `/api/items/[id]` | GET, PATCH, DELETE | Single item operations |
| `/api/collections` | GET, POST | List / create collections |
| `/api/collections/[id]` | GET, PATCH, DELETE | Single collection operations |
| `/api/collections/[id]/items` | POST, DELETE | Add / remove item from collection |
| `/api/upload` | POST | Upload file to Cloudflare R2 |
| `/api/ai/tags` | POST | Suggest tags for an item |
| `/api/ai/explain` | POST | Explain a code snippet |
| `/api/ai/summarize` | POST | Summarize an item |
| `/api/ai/optimize-prompt` | POST | Optimize a prompt |
| `/api/stripe/webhook` | POST | Handle Stripe billing events |

---

## Environment Variables

```bash
# Database
DATABASE_URL=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# OpenAI
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_YEARLY_PRICE_ID=
```

---

*Last updated: 2025*
