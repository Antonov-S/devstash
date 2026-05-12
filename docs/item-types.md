# Item Types

DevStash has **7 system item types**. Each type is seeded once on first deploy as a row in the `ItemType` table with `isSystem = true` and `userId = null`, and is rendered everywhere via a shared icon map + the per-row `color` value.

Sources used for this doc:

- [context/project-overview.md](../context/project-overview.md) — product spec
- [prisma/schema.prisma](../prisma/schema.prisma) — `ItemType`, `Item`, `ContentType` enum
- [src/lib/icons.ts](../src/lib/icons.ts) — Lucide icon map (no separate `constants.tsx` exists — icons live here)
- [scripts/seed.ts](../scripts/seed.ts) — actual seed data (the canonical `prisma/seed.ts` mentioned in the overview lives here)
- [src/components/dashboard/sidebar.tsx](../src/components/dashboard/sidebar.tsx) — PRO badge gating, pluralization, route building
- [src/components/dashboard/item-card.tsx](../src/components/dashboard/item-card.tsx) — display use of `color` / `icon`

---

## Per-type reference

| Name      | Lucide icon  | Color (hex) | `ContentType` | Tier      | Sidebar route     |
| --------- | ------------ | ----------- | ------------- | --------- | ----------------- |
| `snippet` | `Code`       | `#3b82f6`   | `TEXT`        | Free      | `/items/snippets` |
| `prompt`  | `Sparkles`   | `#8b5cf6`   | `TEXT`        | Free      | `/items/prompts`  |
| `command` | `Terminal`   | `#f97316`   | `TEXT`        | Free      | `/items/commands` |
| `note`    | `StickyNote` | `#fde047`   | `TEXT`        | Free      | `/items/notes`    |
| `file`    | `File`       | `#6b7280`   | `FILE`        | **Pro** 🔒 | `/items/files`    |
| `image`   | `Image`      | `#ec4899`   | `FILE`        | **Pro** 🔒 | `/items/images`   |
| `link`    | `Link`       | `#10b981`   | `URL`         | Free      | `/items/links`    |

> Seed order in [scripts/seed.ts:13-21](../scripts/seed.ts#L13-L21): snippet → prompt → command → note → file → image → link. That's the order they appear in the sidebar "Types" group.

> Pro gating today is **display-only**: [src/components/dashboard/sidebar.tsx:95](../src/components/dashboard/sidebar.tsx#L95) marks a type Pro purely by checking `type.name === "file" || type.name === "image"`. There is no DB column. The project overview confirms `isPro` enforcement is deferred — all users currently have full access.

### `snippet` — code snippets

- **Purpose**: reusable code blocks (hooks, utilities, components, full templates).
- **Key fields**: `title`, `content`, `language`, `description`, `tags`.
- **Notable**: `language` is the only field meaningfully used by `snippet` and not by the other TEXT types — drives syntax highlighting.
- **Seed examples**: `useDebounce hook`, `Theme context provider`, `cn() className utility`, `Multi-stage Dockerfile for Next.js`.

### `prompt` — AI prompts

- **Purpose**: store reusable AI/LLM prompts, often with `{{placeholder}}` slots.
- **Key fields**: `title`, `content`, `description`, `tags`.
- **Notable**: `language` is unused — prompts are plain Markdown/text. Hooks into the Pro "Prompt Optimizer" AI feature.
- **Seed examples**: `Code review prompt`, `Documentation generator`, `Refactor assistant`.

### `command` — shell commands

- **Purpose**: one-line (occasionally piped) terminal commands meant to be copy-pasted into a shell.
- **Key fields**: `title`, `content`, `description`, `tags`.
- **Notable**: Content is typically single-line; UI treats it the same as `snippet`/`prompt` (TEXT), but conceptually it's the "click to copy → paste into terminal" path.
- **Seed examples**: `git reset --soft HEAD~1`, `docker stop $(docker ps -aq) && docker rm $(docker ps -aq)`, `lsof -ti:3000 | xargs kill -9`.

### `note` — free-form notes

- **Purpose**: Markdown notes — explanations, course notes, scratch thoughts, decisions.
- **Key fields**: `title`, `content`, `description`, `tags`.
- **Notable**: no `language`; rendered as Markdown (per project-overview).

### `file` — file attachments 🔒 Pro

- **Purpose**: arbitrary file uploads — context files for AI, config samples, ZIPs, PDFs, etc.
- **Key fields**: `title`, `fileUrl`, `fileName`, `fileSize`, `description`, `tags`.
- **Notable**:
  - Uploaded to Cloudflare R2 via `/api/upload`; `fileUrl` is the public R2 URL.
  - `content` is null; `url` is null. The actual bytes live in R2, not Postgres.
  - Pro-gated in the sidebar via the hardcoded `name === "file"` check.

### `image` — image uploads 🔒 Pro

- **Purpose**: screenshots, design refs, diagrams.
- **Key fields**: same as `file` — `title`, `fileUrl`, `fileName`, `fileSize`, `description`, `tags`.
- **Notable**: structurally identical to `file` (both are `ContentType.FILE`). The split exists only so users can route screenshots into a dedicated `/items/images` view and so the UI can show an image preview instead of a generic file chip.

### `link` — URL bookmarks

- **Purpose**: external URLs — docs, tools, references.
- **Key fields**: `title`, `url`, `description`, `tags`.
- **Notable**:
  - The only type with `ContentType.URL`.
  - `content` and `fileUrl` are null; the resource lives at `url`.
  - Seed examples (`Tailwind CSS docs`, `shadcn/ui`, `Radix UI Primitives`, `Lucide icons`) all set `url` and leave `content` null.

---

## Classification by `ContentType`

The `ContentType` enum in [prisma/schema.prisma:96-100](../prisma/schema.prisma#L96-L100) is the structural axis — it determines which of `content` / `fileUrl` / `url` is populated.

| `ContentType` | Types                       | Source-of-truth column | Other content columns           |
| ------------- | --------------------------- | ---------------------- | ------------------------------- |
| `TEXT`        | snippet, prompt, command, note | `content`              | `fileUrl`, `fileName`, `fileSize`, `url` are null |
| `FILE`        | file, image                 | `fileUrl` (+ `fileName`, `fileSize`) | `content`, `url` are null      |
| `URL`         | link                        | `url`                  | `content`, `fileUrl` are null   |

The seed enforces this mapping explicitly at [scripts/seed.ts:378-386](../scripts/seed.ts#L378-L386): `link` → `URL`, `file`/`image` → `FILE`, everything else → `TEXT`.

`Item` is a single wide row holding all three possible payload columns, and `contentType` tells you which one to read. No subtype tables, no polymorphism.

---

## Shared properties (apply to every type)

Every item, regardless of type, has the full set of `Item` columns:

- **Identity / ownership**: `id` (cuid), `userId`, `itemTypeId`
- **Display**: `title` (required), `description` (optional, all types use it), `language` (only meaningful for `snippet`)
- **State flags**: `isFavorite`, `isPinned`
- **Activity tracking**: `lastUsedAt`, `createdAt`, `updatedAt`
- **Relations**: `tags` (many-to-many via `TagsOnItems`), `collections` (many-to-many via `ItemCollection`)

So features like favorite/pin, tagging, multi-collection membership, "recently used" sorting, and full-text search across `title` + `content` + `tags` + type are universal — they don't branch on type.

---

## Display differences

The UI is intentionally uniform across types. The only per-type variation is **color + icon**, both pulled from the `ItemType` row.

- **Item card** ([src/components/dashboard/item-card.tsx](../src/components/dashboard/item-card.tsx)):
  - Left border color = `item.itemType.color` (3px accent stripe).
  - Icon (resolved via [src/lib/icons.ts](../src/lib/icons.ts) `iconMap[item.itemType.icon]`) is rendered tinted with the same color.
  - Type badge uses `borderColor` + `color` from the type record; label is `capitalize`d.
  - No type-specific rendering — every type uses the same card.

- **Sidebar "Types" group** ([src/components/dashboard/sidebar.tsx:91-126](../src/components/dashboard/sidebar.tsx#L91-L126)):
  - Each system type becomes a nav link to `/items/{pluralize(name)}` (`pluralize` is just `name + "s"` — there are no irregulars today; the `IRREGULAR_PLURALS` lookup is empty).
  - Icon tinted with `type.color`.
  - Trailing item count badge.
  - `file` and `image` get an inline outline `PRO` badge (hidden when the sidebar is collapsed).

- **Collection cards**: per `context/project-overview.md`, collection cards are color-coded by the **dominant item type** in that collection — the sidebar already passes `dominantType.color` through to `SidebarCollections`.

Everything else (drawers, search, tag list, favorites/pinned filtering) is type-agnostic at the component level. Where behavior eventually diverges (Markdown rendering for `note`, syntax highlighting via `language` for `snippet`, image preview for `image`, link card for `link`, file size/download for `file`) it does so by branching on `contentType` or `itemType.name`, not via separate components per type.

---

## Custom types (future)

`ItemType.userId` is nullable so user-created custom types can coexist with the seven system rows. The `@@unique([name, userId])` constraint means each user can have one type named e.g. `"regex"` and it won't collide with system types or other users. Per the project overview, custom types are Pro-only and not yet shipped.
