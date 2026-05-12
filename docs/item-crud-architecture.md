# Item CRUD Architecture

A unified CRUD system for all 7 item types. Mutations live in **one** server-actions file, queries live in **one** `lib/db` module, and a **single dynamic route** (`/items/[type]`) plus shared components adapt their rendering by `itemType.name` / `contentType`.

The motivating insight is from [docs/item-types.md](item-types.md): the seven types are structurally three shapes (`TEXT` / `FILE` / `URL`), all sharing the same `Item` row. There is no reason to have seven of anything in the CRUD layer.

---

## Sources

- [context/project-overview.md](../context/project-overview.md) — product spec, API route list
- [context/coding-standards.md](../context/coding-standards.md) — server-actions vs API-routes decision rule, file organization, validation
- [docs/item-types.md](item-types.md) — per-type structural reference (referenced by the research brief as `content-types.md`; the file produced is `item-types.md`)
- [prisma/schema.prisma](../prisma/schema.prisma) — `Item`, `ItemType`, `ContentType` enum
- [src/lib/icons.ts](../src/lib/icons.ts) — Lucide icon map (the brief mentions `src/lib/constants.tsx`; that file does not exist — icons are the only "constants" today, and they live here)
- [src/lib/db/items.ts](../src/lib/db/items.ts), [src/lib/db/collections.ts](../src/lib/db/collections.ts) — existing query patterns
- [src/actions/account.ts](../src/actions/account.ts), [src/actions/auth.ts](../src/actions/auth.ts) — existing action patterns (`"use server"`, `{ error: string }` result, `auth()` guard)
- [src/components/dashboard/sidebar.tsx](../src/components/dashboard/sidebar.tsx), [src/components/dashboard/top-bar.tsx](../src/components/dashboard/top-bar.tsx) — sidebar pluralization + the disabled "New Item" button waiting to be wired up
- [src/components/ui/sheet.tsx](../src/components/ui/sheet.tsx) — the right-side drawer primitive already in place

---

## Directory layout

```
src/
├── actions/
│   └── items.ts                    ◄── ALL item mutations (single file)
├── lib/
│   └── db/
│       └── items.ts                ◄── ALL item queries (extends existing)
├── types/
│   └── items.ts                    ◄── Shared types + slug↔name map + Zod schemas
├── app/
│   └── (dashboard)/
│       └── items/
│           └── [type]/
│               └── page.tsx        ◄── Single dynamic route for all 7 lists
└── components/
    └── items/
        ├── item-card.tsx           (shared — moved from components/dashboard)
        ├── item-list.tsx           (shared list/grid + empty state)
        ├── item-drawer.tsx         (right-side Sheet: view | edit | create)
        ├── item-form.tsx           (form router by contentType)
        ├── new-item-button.tsx     (TopBar trigger — opens drawer in "create")
        ├── forms/
        │   ├── text-item-form.tsx  (snippet / prompt / command / note)
        │   ├── file-item-form.tsx  (file / image — wires to /api/upload)
        │   └── link-item-form.tsx  (link)
        └── viewers/
            ├── text-item-viewer.tsx  (markdown for note, syntax highlight for snippet)
            ├── file-item-viewer.tsx  (image preview / file download chip)
            └── link-item-viewer.tsx  (URL card + external link)
```

**Why this shape**

- **One actions file.** Every mutation does the same work — auth, ownership check, validation, write, revalidate. The only thing that varies between types is *which payload column gets filled* — `content` vs `fileUrl` vs `url`. That branching is a 5-line `resolveContentColumns()` helper inside the file, not seven duplicated actions.
- **One queries module.** [src/lib/db/items.ts](../src/lib/db/items.ts) already exposes `getPinnedItemsForUser` / `getRecentItemsForUser` / `getSystemItemTypesWithCountsForUser` / `getItemStatsForUser`. New listing/detail queries land in the same file and share the `itemSelect` shape.
- **One route.** `/items/[type]` matches the sidebar links the codebase already generates (`/items/snippets`, `/items/prompts`, etc.). The slug is the only thing that varies; the page itself is type-agnostic.
- **Type-specific logic = leaf components.** Forms and viewers branch on `itemType.name` / `contentType`. Everything *above* the form — the drawer, the page, the action, the query — stays generic.

---

## Routing: how `/items/[type]` works

The sidebar already constructs `/items/${pluralize(type.name)}` ([src/components/dashboard/sidebar.tsx:100](../src/components/dashboard/sidebar.tsx#L100)). Pluralization is currently the trivial `name + "s"` rule, so the slugs are `snippets`, `prompts`, `commands`, `notes`, `files`, `images`, `links`.

A single map in `src/types/items.ts` is the source of truth:

```ts
// src/types/items.ts
export const TYPE_SLUG_TO_NAME = {
  snippets: "snippet",
  prompts:  "prompt",
  commands: "command",
  notes:    "note",
  files:    "file",
  images:   "image",
  links:    "link"
} as const;

export type ItemTypeSlug = keyof typeof TYPE_SLUG_TO_NAME;
export type ItemTypeName = (typeof TYPE_SLUG_TO_NAME)[ItemTypeSlug];

export const ITEM_TYPE_SLUGS = Object.keys(TYPE_SLUG_TO_NAME) as ItemTypeSlug[];
```

The dynamic page:

```ts
// src/app/(dashboard)/items/[type]/page.tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ItemList } from "@/components/items/item-list";
import { getItemsByTypeForUser } from "@/lib/db/items";
import { TYPE_SLUG_TO_NAME, type ItemTypeSlug } from "@/types/items";

export const dynamic = "force-dynamic";

export default async function ItemsByTypePage({
  params
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: slug } = await params;
  if (!(slug in TYPE_SLUG_TO_NAME)) notFound();
  const typeName = TYPE_SLUG_TO_NAME[slug as ItemTypeSlug];

  const session = await auth();
  if (!session?.user?.id) redirect(`/sign-in?callbackUrl=/items/${slug}`);

  const items = await getItemsByTypeForUser(session.user.id, typeName);
  return <ItemList items={items} typeName={typeName} />;
}
```

That's the whole route. There is no per-type `page.tsx`, no per-type loader, no per-type layout.

`generateStaticParams` is not used because pages are `force-dynamic` (per-user data).

---

## Queries: `src/lib/db/items.ts`

Already-present functions stay. Add the listing / detail / collection-membership helpers. All return DTOs with the existing `ItemWithMeta` shape so cards and lists never need to know which query produced them.

```ts
// New additions to src/lib/db/items.ts — same itemSelect & toItemWithMeta as the existing file.
import type { ItemTypeName } from "@/types/items";

export async function getItemsByTypeForUser(
  userId: string,
  typeName: ItemTypeName,
  opts: { sort?: "recent" | "title" | "favorite"; take?: number; skip?: number } = {}
): Promise<ItemWithMeta[]> { /* findMany where itemType.name = typeName */ }

export async function getItemById(
  userId: string,
  id: string
): Promise<ItemDetail | null> { /* includes content / fileUrl / url + collectionIds */ }

export async function getItemsForCollection(
  userId: string,
  collectionId: string
): Promise<ItemWithMeta[]> { /* via ItemCollection join */ }

export async function searchItemsForUser(
  userId: string,
  query: string
): Promise<ItemWithMeta[]> { /* title / content / tag / type-name OR */ }
```

`ItemDetail` adds the payload columns to `ItemWithMeta` (the listing DTO deliberately omits them — cards don't render content).

The query layer **never branches on type**. It just filters and selects. Type-specific rendering of the returned data is the component layer's job.

---

## Mutations: `src/actions/items.ts`

One file. Every mutation:

1. `await auth()` and bail if no `session.user.id`.
2. Zod-validates the input (discriminated union on `contentType`).
3. For update/delete, fetches the row and verifies `userId` matches.
4. Performs the write inside a single transaction when relations are involved (tags + `ItemCollection`).
5. `revalidatePath` for `/dashboard`, `/items/<slug>`, and any touched `/collections/<id>`.
6. Returns the existing `{ success, data, error }` convention from coding-standards.

```ts
// src/actions/items.ts (shape — not the full body)
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createItemSchema, updateItemSchema, type ActionResult } from "@/types/items";

export async function createItemAction(
  raw: unknown
): Promise<ActionResult<{ id: string }>> { /* ... */ }

export async function updateItemAction(
  id: string,
  raw: unknown
): Promise<ActionResult<{ id: string }>> { /* ... */ }

export async function deleteItemAction(
  id: string
): Promise<ActionResult<null>> { /* ... */ }

// Small, frequent flag flips — separate so they don't pay the full-form validation cost.
export async function toggleFavoriteAction(id: string): Promise<ActionResult<null>> { /* ... */ }
export async function togglePinAction(id: string):       Promise<ActionResult<null>> { /* ... */ }
export async function touchLastUsedAction(id: string):   Promise<ActionResult<null>> { /* ... */ }
```

### Validation (Zod discriminated union)

Per coding-standards: *"Validate all inputs with Zod."* The discriminator is `contentType` — the same column that determines which payload field is meaningful.

```ts
// src/types/items.ts
const base = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  itemTypeId: z.string().cuid(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  collectionIds: z.array(z.string().cuid()).max(20).optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional()
});

const textInput = base.extend({
  contentType: z.literal("TEXT"),
  content: z.string().min(1).max(50_000),
  language: z.string().max(40).optional().nullable()
});

const fileInput = base.extend({
  contentType: z.literal("FILE"),
  fileUrl: z.string().url(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().nonnegative()
});

const urlInput = base.extend({
  contentType: z.literal("URL"),
  url: z.string().url()
});

export const createItemSchema = z.discriminatedUnion("contentType", [
  textInput, fileInput, urlInput
]);
```

This is the **only** place type-shape rules live in the server layer. The action calls `createItemSchema.parse(raw)` and is then completely shape-agnostic.

### Why a single actions file is correct here (and not premature)

Per coding-standards: keep functions under 50 lines, prefer minimal changes, match existing patterns. The existing `src/actions/auth.ts` is one file for three sign-in mutations; `src/actions/account.ts` is one file for delete. Items follow the same convention. The mutations themselves stay small because the discriminated-union validator absorbs all the per-shape rules.

If `items.ts` ever exceeds ~250 lines or grows distinct subsystems (e.g. AI-assisted operations), the natural split is by *operation family* (`items.ts`, `item-ai.ts`), not by type.

---

## API routes (only `/api/upload`)

The coding standard's rule: API routes are for webhooks, file uploads with progress, long-running ops, specific HTTP semantics, mobile/CLI clients, third-party integrations. Everything else is a server action.

Result for items:

| Operation                            | Mechanism      | Reason                                |
| ------------------------------------ | -------------- | ------------------------------------- |
| Create/update/delete item            | Server action  | Form mutation, no progress to stream  |
| Toggle favorite / pin / touch        | Server action  | Tiny flag flips                       |
| Upload file/image bytes              | **`POST /api/upload`** | Multipart + R2, may want progress |
| Fetch items for SSR page             | Direct Prisma in server component | Per coding-standards |
| AI tag / explain / summarize         | API route (`/api/ai/*`) | Already enumerated in overview  |

File flow for `file` / `image` types:

```
<FileItemForm>
  ├─ user picks file
  ├─ POST multipart → /api/upload  (progress events streamed to the client)
  ├─ response: { url, fileName, fileSize }
  └─ POST to createItemAction({
       contentType: "FILE",
       fileUrl: url, fileName, fileSize, ...
     })
```

This split means R2 ownership is decoupled from Postgres: a failed insert leaves a dangling R2 object (cleaned up on retry or by a future GC pass), but never an inconsistent DB row.

---

## Components: where type-specific logic lives

**Strict rule:** type-specific logic only exists at the form and viewer layer. The drawer, list, card, page, action, query, and validator are all type-agnostic — they branch on data, not on type at compile time.

### Responsibilities

| Component                          | Type-aware? | Notes |
| ---------------------------------- | ----------- | ----- |
| `<ItemCard>`                       | No          | Already type-agnostic — icon + color stripe from `itemType` ([src/components/dashboard/item-card.tsx](../src/components/dashboard/item-card.tsx)). Move to `components/items/`. |
| `<ItemList>`                       | No          | Grid/list, empty state, sort menu. Receives `ItemWithMeta[]` + `typeName` (for the "New <Type>" button label). |
| `<ItemDrawer mode>`                | No          | Wraps `<Sheet side="right">`. Modes: `"view"` (renders `<...Viewer>`), `"edit"` (renders `<ItemForm>` with `initial`), `"create"` (renders `<ItemForm>` empty). |
| `<ItemForm>`                       | Router      | Picks `<TextItemForm>` / `<FileItemForm>` / `<LinkItemForm>` from `itemType.name`. Owns the shared fields (title, description, tags, collections) so each child form only renders its payload fields. |
| `<TextItemForm>`                   | Partial     | Shows `language` field **only** when `itemTypeName === "snippet"`. Otherwise just `content` + a markdown helper for `note`. |
| `<FileItemForm>`                   | Yes         | Picks file → calls `/api/upload` with `XMLHttpRequest` (progress) or `fetch` (no progress) → passes returned `{url, fileName, fileSize}` to action. |
| `<LinkItemForm>`                   | Yes         | One `url` input, URL validation, optional favicon preview. |
| `<TextItemViewer>`                 | Partial     | Plain `<pre>` for command, syntax-highlighted code block for snippet (uses `language`), markdown render for note, formatted text for prompt. |
| `<FileItemViewer>`                 | Yes         | `<img>` for `image`, download chip for `file`. |
| `<LinkItemViewer>`                 | Yes         | External-link card. |
| `<NewItemButton>`                  | No          | Already in the disabled TopBar at [src/components/dashboard/top-bar.tsx:38](../src/components/dashboard/top-bar.tsx#L38). Wire it to open `<ItemDrawer mode="create">`. If the user is on `/items/<slug>` the slug pre-selects the type; otherwise the drawer shows a type picker. |

### The "form router" pattern in code

```tsx
// src/components/items/item-form.tsx — schematic
export function ItemForm({ initial, itemType, onDone }: ItemFormProps) {
  // Shared fields (title / description / tags / collections / favorite / pin)
  // live here. Child forms render only payload fields.
  switch (itemType.name) {
    case "snippet":
    case "prompt":
    case "command":
    case "note":
      return <TextItemForm ... />;
    case "file":
    case "image":
      return <FileItemForm ... />;
    case "link":
      return <LinkItemForm ... />;
  }
}
```

Adding a custom (Pro) user-created type later means a new entry in `TYPE_SLUG_TO_NAME` plus a decision about which body to use — almost certainly TEXT, since user-created types will be Markdown-shaped. No action, no query, no page changes.

---

## End-to-end create flow

```
TopBar / NewItemButton
        │  click
        ▼
ItemDrawer (mode="create")  ─ Sheet side="right"
        │
        ▼
ItemForm  ─ resolves child by itemType.name
        │
        ▼
TextItemForm | FileItemForm | LinkItemForm
        │  onSubmit → startTransition(...)
        ▼
createItemAction(input)        (src/actions/items.ts)
        │  Zod parse via createItemSchema  (discriminated union)
        │  auth()  →  session.user.id
        │  prisma.$transaction([
        │     item.create,
        │     tag upserts + TagsOnItems.createMany,
        │     ItemCollection.createMany
        │  ])
        │  revalidatePath("/dashboard")
        │  revalidatePath(`/items/${slug}`)
        │  revalidatePath each touched `/collections/<id>`
        ▼
{ success: true, data: { id } }
        │
        ▼
client toasts success, closes drawer, the SSR list re-fetches on next nav
```

Update / delete share the same shape — the action is the join point, not the form.

---

## What this design buys

- **Adding a new item operation** = one function in `actions/items.ts` + one query in `lib/db/items.ts`. Never seven copies.
- **Changing the type list** (e.g. enabling custom Pro types) = one entry in `TYPE_SLUG_TO_NAME` and one branch in the `<ItemForm>` router.
- **Changing payload validation** = one Zod schema edit. The action body doesn't move.
- **Changing how cards / lists look** = one component. Type-specific styling already comes from `itemType.color` + `itemType.icon` on the row, not from per-type components.
- **Routing scales to zero pages per type.** The current `app/(dashboard)/items/` tree stays as just `[type]/page.tsx`.
- **API surface stays minimal.** Only `/api/upload` (and the future `/api/ai/*`) exist as routes; everything else is server actions invoked from forms.
