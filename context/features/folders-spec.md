# Folders for Files & Images (Page-only) Spec

## Overview

Files and images currently live as a flat list/gallery on `/items/files` and
`/items/images` with no way to group them. This feature adds **folders** — a
new first-class container, scoped to file/image organization — so a user can
group uploads (e.g. "Design Assets", "Invoices", "Screenshots 2026").

This is **Phase 1: page-only**. A folder opens as a **dedicated page** (the same
pattern as `/collections/[id]`), not a drawer. The folder-hub drawer is a
separate, additive Phase 2 (`folder-drawer-hub-spec.md`).

### Why a new model, not Collections

DevStash already has `Collection` (many-to-many, cross-type, tag-like). Folders
are deliberately different:

- **One home per item.** An item belongs to **at most one** folder (true folder
  semantics), unlike collections where an item lives in many.
- **File/image scoped.** Folders organize uploads, not snippets/prompts/links.
- **Distinct mental model.** "Folder = where this file lives" vs. "Collection =
  cross-cutting grouping this item is tagged into." Both can apply to the same
  file.

So folders get their own `Folder` model and an optional `folderId` foreign key
on `Item`.

### Why page-only first

A folder is a **container**, not an item. The types that open in the item
drawer are all *items*; the existing container concept (Collections) opens as a
page. Page-only means "items inside a folder" reuses the exact existing
machinery — `ClickableFileRow` / `ClickableImageCard`, the item `ItemDrawer`
overlaying the page, and `Pagination` — with no new interaction patterns. The
folder page is essentially `/items/files` filtered by `folderId`.

## Goals

- New `Folder` Prisma model (per-user) + optional `Item.folderId`
  (`onDelete: SetNull` — deleting a folder loosens its files back to top level,
  never deletes them).
- Create / rename / delete folders (mirror the Collections action + db-helper
  patterns).
- Show folders **first**, then ungrouped items, on `/items/files` and
  `/items/images`.
- A folder page at `/folders/[id]` listing that folder's items (paginated),
  with items opening in the existing item drawer.
- "Move to folder" from the item drawer so existing files/images can be filed.
- Pro-gated (files/images are already Pro-only).

## Non-Goals (out of scope — deferred)

- **Folder-hub drawer** (quick-peek with metadata + Download-all) — Phase 2,
  see `folder-drawer-hub-spec.md`.
- **Download entire folder as ZIP** — specced in the Phase 2 doc (the
  Download-all button lives in the hub drawer / folder page header). It can be
  pulled forward into this phase if desired, but is not required for page-only
  organization.
- **Nested folders / subfolders** — flat folders only for v1 (no breadcrumb UI,
  no move-loop validation, no recursive operations).
- **Folders for non-file types** (snippets/prompts/etc.) — use Collections.
- **Drag-and-drop filing** — the "Move to folder" select is enough for v1.

## Clarifications & resolved decisions

Numbered to match the pre-implementation review. These are the authoritative
calls; inline sections above were updated to match.

1. **Folder ordering / `updatedAt` staleness.** Moving items in/out does **not**
   touch `Folder.updatedAt`, so ordering by `updatedAt` would drift. **Decision:
   order the folders-first listing by `name asc`** (predictable, matches
   `getUserCollectionsList`, and sidesteps the staleness entirely). `updatedAt`
   stays on the row but is not used for ordering, so no move-time bump is needed.
   If "sort by recent activity" is ever wanted, that's a future change that would
   bump both source and target folders on move.

2. **Folder scope (data vs. UI).** The `folderId` column is **generic** (any
   item type can technically hold a `folderId`; no DB-level type constraint).
   The **feature is file/image-only**: folders are only exposed on
   `/items/files` and `/items/images` and in the item drawer for file/image
   items. Enforced server-side in `moveItemToFolderAction` (rejects non
   file/image items, see above). No migration-level CHECK constraint — the
   action is the single write path.

3. **Duplicate folder names.** **Allowed.** No unique constraint on
   `(userId, name)` — consistent with `Collection` (which also allows
   duplicates). Folders are keyed by `id`; two "Invoices" folders are valid.

4. **Pro downgrade behavior.** Folders follow the **exact same gate as files
   and images today**: `/items/files`, `/items/images`, and `/folders/[id]` all
   `redirect("/upgrade")` when `!isPro`. So a downgraded user temporarily loses
   UI access to folders *and* their files/images alike — **data is retained, not
   deleted**, and access returns on re-upgrade. This is intentional and matches
   existing behavior; no folder-specific special-casing.

5. **Folder creation UX.** Mirror `NewCollectionDialog`: on success → toast
   (`"Folder created"`) + close dialog + `router.refresh()` and **stay on the
   current page** (the new folder appears in the folders-first section). **Do
   NOT redirect** into the new (empty) folder page — matches collection-create,
   which stays put.

6. **Preview mosaic selection.** Up to 4 **image-type** items in the folder,
   `createdAt desc`, using their `fileUrl` (defined in `getFoldersForUser`
   above). Files never contribute to the mosaic.

7. **Folders shown on both pages / folders with no images.** The **full folder
   list shows on both** `/items/files` and `/items/images` — folders are a
   shared organizational layer across uploads, not type-scoped. So a folder
   holding only files still appears on the images page (as a card with the
   **`Folder` icon fallback**, no mosaic), and a folder holding only images
   still appears on the files page (as a row). Newly created empty folders
   appear on both. (Alternative — filtering folders by the page's item type —
   was rejected: it would hide just-created empty folders and split the mental
   model.)

8. **Folder item counts.** `_count.items` counts **all items with that
   `folderId`**. Because only file/image items can be filed (Clarification #2),
   this is effectively the file+image count. The count is **not** split per page
   — a folder shows the same total on both `/items/files` and `/items/images`.

9. **Move-to-folder optimistic update + rollback.** Mirror the favorite/pin
   pattern (`useOptimisticToggle`-style): on change, optimistically set the
   select to the new folder, call `moveItemToFolderAction`; **on failure**, toast
   `result.error` and **revert the select to the previous value**; **on
   success**, toast (`"Moved to <folder>"` / `"Removed from folder"`) and
   `router.refresh()` so the source/target listings re-fetch. Disable the select
   while the transition is pending to block double-fires.

10. **Pagination after folder deletion.** Deleting a folder from `/folders/[id]`
    redirects to **`/items/files`** (the folder page no longer exists; files is
    the canonical uploads home). The newly-ungrouped items reappear there — and
    because pagination is **recomputed server-side on every request**, page
    counts self-correct; the user simply lands on page 1. No client-side
    pagination reconciliation needed. (`deleteFolderAction` returns success; the
    `FolderActions` client does the `router.push("/items/files")`.)

11. **Avoid redundant fetching in `generateMetadata`.** `generateMetadata` uses
    the slim `getFolderNameForUser` (name only), **not**
    `getFolderWithItemsForUser`, so rendering the page doesn't run the item
    query twice. (The existing collection page double-fetches; folders should
    not copy that.) Optionally wrap the page's data fetch in React `cache()` if
    further dedupe is wanted, but the slim-title helper alone resolves the waste.

12. **Rename / name validation.** `create` and `update` share one Zod schema:
    `name` is **trimmed, required (non-empty after trim), and
    `.max(FOLDER_NAME_MAX_LENGTH)`**. Errors: `"Name is required"` (empty /
    whitespace-only) and `"Name is too long"` (over the cap). Add
    `FOLDER_NAME_MAX_LENGTH` (suggest `100`) to `src/lib/constants.ts` per the
    centralize-constants rule. The rename dialog disables Save while the name is
    empty (matches `NewCollectionDialog`'s `submitDisabled`).

## Data model

`prisma/schema.prisma` — new model + two lines on `Item` + one relation on
`User`:

```prisma
model Folder {
  id        String   @id @default(cuid())
  name      String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  items Item[]

  @@index([userId])
}
```

On `Item`:

```prisma
  folderId String?
  folder   Folder? @relation(fields: [folderId], references: [id], onDelete: SetNull)
  // ...
  @@index([folderId])
```

On `User`:

```prisma
  folders Folder[]
```

Migration via `prisma migrate dev --name add_folders` (NOT `db push` — per
`coding-standards.md`). Use the Neon `development` branch only.

**Flat only — no nesting.** `Folder` has **no `parentId` / self-relation** and
items reference a folder via a single `folderId`. A folder contains files/images
only; it never contains other folders. This is a deliberate v1 constraint (see
Non-Goals) — it keeps out breadcrumbs, move-loop validation, and recursive
delete/download. If nesting is ever wanted, it's a separate future model change,
not something to leave hooks for now.

**Note on folder ↔ item-type scope:** a `Folder` is not itself typed; it simply
contains whatever items have that `folderId`. In practice only file/image items
will ever be filed (that's the only UI that exposes folders), but the model
doesn't enforce it. The folder page renders images as a gallery and files as
rows, exactly like the type pages and `/collections/[id]`.

## DB helpers — `src/lib/db/folders.ts`

New file mirroring `src/lib/db/collections.ts`. All helpers `import
"server-only"` and are ownership-scoped by `userId`.

```ts
export type FolderWithMeta = {
  id: string;
  name: string;
  updatedAt: Date;
  itemCount: number;
  // first few image fileUrls for a mosaic thumbnail on the folder card (≤4)
  previewImageUrls: string[];
};

export type FolderWithItems = {
  id: string;
  name: string;
  updatedAt: Date;
  items: ItemWithMeta[];
  totalItemCount: number;
};
```

- `getFoldersForUser(userId)` → `FolderWithMeta[]` — `findMany` ordered by
  **`name asc`** (see Clarification #1 — this sidesteps `updatedAt` staleness on
  move), `_count: { items: true }`, plus a bounded follow-up query for the
  preview mosaic. Follow the existing N+1-safe two-query pattern in
  `fetchCollectionsWithMeta` (one `findMany` for folders, one batched `findMany`
  over `folderId in [...]` for previews). **Preview selection (Clarification
  #6):** the batched query selects **image-type items only** (`itemType.name ===
  "image"`), ordered `createdAt desc`, `take: 4` per folder, returning their
  `fileUrl`. Folders with no image items get `previewImageUrls: []` and render
  the icon fallback.
- `getFolderNameForUser(userId, folderId)` → `{ name: string } | null` — slim
  `findFirst` selecting only `name`, for `generateMetadata` (Clarification #11)
  so the title query doesn't also pull the item list.
- `getFolderWithItemsForUser(userId, folderId, { skip, take })` →
  `FolderWithItems | null` — `findFirst({ where: { id, userId } })`, then reuse
  a new `getItemsForUserByFolderId` (below).
- `createFolderForUser(userId, { name })` → `FolderWithMeta`
  (`itemCount: 0`, `previewImageUrls: []`).
- `updateFolderForUser(userId, folderId, { name })` → `boolean`
  (`updateMany({ where: { id, folderId, userId } })`).
- `deleteFolderForUser(userId, folderId)` → `boolean`
  (`deleteMany({ where: { id, userId } })`; `onDelete: SetNull` loosens items).
- `getUserFoldersList(userId)` → `{ id; name }[]` (for the "Move to folder"
  picker; mirrors `getUserCollectionsList`).
- `moveItemToFolder(userId, itemId, folderId | null)` → `boolean`
  (`updateMany({ where: { id: itemId, userId }, data: { folderId } })`;
  when `folderId` is non-null, verify the folder is owned first).

`src/lib/db/items.ts` — add:

- `getItemsForUserByFolderId(userId, folderId, { skip, take })` →
  `{ items: ItemWithMeta[]; totalCount: number }` — copy
  `getItemsForUserByCollectionId`, `where: { userId, folderId }`, same
  `orderBy` (`isPinned desc`, `lastUsedAt desc`, `updatedAt desc`), same
  `itemSelect`. Returns `{ items, totalCount }` via `Promise.all`.
- For the type pages to split "in a folder" vs "loose", `getItemsForUserByTypeId`
  gains an option to filter ungrouped items: `{ ..., folderId?: null }`. When
  `folderId: null` is passed, add `folderId: null` to the `where`. (Default
  behavior — option omitted — is unchanged: returns ALL items of that type.)

## Server actions — `src/actions/folders.ts`

New file mirroring `src/actions/collections.ts` exactly:
`requireUserId()` guard → Zod parse via `firstIssue` → `getUserIsPro` re-read
(NOT `session.user.isPro`) → delegate → `ActionResult` return.

- `createFolderAction({ name })` → `ActionResult<FolderWithMeta>` — gate behind
  Pro (folders are a file/image feature; reuse `getUserIsPro`, return
  `"Folders require Pro."` when `!isPro`). Zod: trimmed required `name`,
  `.max(FOLDER_NAME_MAX_LENGTH)` (Clarification #12). The **same schema** is
  reused by `updateFolderAction` (rename) so validation can't drift.
- `updateFolderAction(folderId, { name })` →
  `{ success: true } | { success: false; error }`.
- `deleteFolderAction(folderId)` →
  `{ success: true } | { success: false; error }`.
- `moveItemToFolderAction(itemId, folderId | null)` →
  `{ success: true } | { success: false; error }` — Pro-gated;
  validates the target folder ownership when `folderId` is non-null (the
  `moveItemToFolder` helper does this), returns `"Invalid folder"` on a
  cross-user folder id (mirrors `verifyCollectionsOwnedByUser` pattern).
  **Type guard (Clarification #2):** also reject when the item's type is not
  `file`/`image` (return `"Only files and images can go in folders."`) — the
  column is generic but the feature is file/image-only, so enforce it
  server-side as defense-in-depth against a tampered client.

Reuse `optionalTrimmedString` / the trimmed-required-name schema shape from
`collections.ts`. Each action calls `router.refresh()`-driving mutations on the
client (the action itself just returns the result).

## Routes & pages

### `/folders/[id]` — folder detail page (new)

`src/app/(dashboard)/folders/[id]/page.tsx`, modeled on
`src/app/(dashboard)/collections/[id]/page.tsx`:

- `export const dynamic = "force-dynamic"`.
- `auth()` gate → `redirect("/sign-in?callbackUrl=/folders/<id>")`.
- **Pro gate** → `redirect("/upgrade")` when `!session.user.isPro` (display-only
  gate; the write paths keep their own `getUserIsPro` checks).
- `parsePageParam` + `getFolderWithItemsForUser(userId, id, { skip, take })`
  with `ITEMS_PER_PAGE`; `notFound()` when null.
- Header: folder icon (`Folder` lucide, gray `#6b7280` to match the `file`
  system color) + name + item count + a `FolderActions` control (Rename /
  Delete, mirroring `CollectionActions`).
- Body: reuse the `ItemsGrid`-style split from `collections/[id]` — images →
  gallery grid, files → `ClickableFileRow` list (folders realistically hold
  only files/images, but handle "others" defensively with `ClickableItemCard`).
- `Pagination` with `baseHref={/folders/${id}}`.
- Empty state mirroring the collection page's.
- `generateMetadata` → `"<name> · DevStash"` via the slim
  `getFolderNameForUser` (NOT `getFolderWithItemsForUser`) to avoid a redundant
  item fetch — see Clarification #11.

### `/items/files` and `/items/images` — folders-first (modified)

`src/app/(dashboard)/items/[type]/page.tsx`:

- For `typeName === "file" | "image"` only, fetch
  `getFoldersForUser(userId)` and render a **Folders** section above the items:
  - **Files page:** folder rows (Drive-style) — a new `FolderRow` client
    component styled like `ClickableFileRow` (folder icon + name + item count),
    the whole row a `<Link href="/folders/[id]">`.
  - **Images page:** folder cards — a new `FolderCard` showing a 2×2 mosaic
    from `previewImageUrls` (fallback to a `Folder` icon when empty) + name +
    count, wrapping a `<Link href="/folders/[id]">`.
- Pass `{ folderId: null }` to `getItemsForUserByTypeId` so the items section
  below shows only **ungrouped** files/images (filed items appear inside their
  folder). The `totalCount` for pagination should also reflect ungrouped only.
- Add a **"New Folder"** button next to the existing "New File"/"New Image"
  button in the header (only on file/image type pages).
- Non-file/image type pages are completely unchanged (no folders fetch, no
  `folderId` filter).

> Pagination interaction: pagination on the type page applies to the **ungrouped
> items** list. Folders render as a non-paginated section at the top (folder
> counts are expected to be small; if a user has hundreds of folders, a future
> slice can paginate them — out of scope here).

## Components

All new components are client where they hold state, server otherwise. Per
`coding-standards.md`, components are out of Vitest scope.

- `src/components/folders/new-folder-dialog.tsx` — mirror
  `NewCollectionDialog`: `Dialog` + a Name field (reuse the
  `CollectionFormFields` approach or a minimal inline field), `useTransition`,
  sonner toasts, `createFolderAction`, `router.refresh()` on success, controlled
  `open`/`onOpenChange` props so it can also be driven from a `+` menu later.
- `src/components/folders/folder-card.tsx` — image-page folder card (mosaic +
  name + count, `<Link>`).
- `src/components/folders/folder-row.tsx` — file-page folder row (`<Link>`).
- `src/components/folders/folder-actions.tsx` — Rename + Delete on the folder
  page header (mirror `CollectionActions`: edit dialog + `ConfirmDeleteDialog`).
  On successful delete, `router.push("/items/files")` (Clarification #10);
  rename does `router.refresh()` and stays.
- **Move to folder** — extend the item drawer:
  - Add a "Move to folder" control to the item drawer (a base-ui `Select` of the
    user's folders + a "No folder" option) shown only for `file`/`image` items.
    The list comes from a new `getUserFoldersList` prefetched into a context
    (mirror `UserCollectionsProvider` / `collections-context.tsx`) added to
    `(dashboard)/layout.tsx`, OR fetched on drawer open — prefer the context to
    avoid a per-open fetch.
  - On change, call `moveItemToFolderAction`, optimistic update + rollback +
    `router.refresh()` (reuse `useOptimisticToggle`-style pattern or a small
    `useTransition`).

## Constants

Per the centralize-constants rule (`src/lib/constants.ts`):

- If a folder cap is wanted, add `FOLDERS_LIMIT` there (Pro = unlimited, so a
  cap is optional — recommend **no cap** for v1, matching unlimited Pro
  collections). Decide during implementation; if added, gate in
  `createFolderAction` like `checkCollectionCapacity`.
- Reuse the existing `file`/`image` colors from `SYSTEM_TYPE_COLORS` for the
  folder icon tint rather than hardcoding `#6b7280`.
- Add `FOLDER_NAME_MAX_LENGTH` (suggest `100`) — used by the shared create/
  rename Zod schema (Clarification #12).

## Behavior / edge cases

- **Delete a folder ⇒ files survive.** `onDelete: SetNull` clears `folderId` on
  contained items; they reappear in the ungrouped section of `/items/files` |
  `/items/images`. Confirm dialog copy must say this explicitly ("Items in this
  folder won't be deleted — they'll move back to the top level.").
- **Move ownership safety.** `moveItemToFolderAction` must reject a `folderId`
  the user doesn't own (collapse to `count === 0` / "Invalid folder"), and
  `moveItemToFolder` only updates rows where `item.userId === userId`.
- **Pro downgrade.** Write paths re-read `getUserIsPro` (never trust
  `session.user.isPro`); the page-level Pro gate is display-only and may briefly
  lag a downgrade until the JWT refreshes (acceptable, matches existing pages).
- **Empty folder** renders the empty state; its card shows the `Folder` icon
  fallback (no mosaic).

## Testing

Per `coding-standards.md` (Testing): test server actions + db utilities, mock
`@/lib/prisma` + `@/auth` at the module boundary, never hit a real DB.
Components are out of scope.

- `src/actions/__tests__/folders.test.ts`:
  - `createFolderAction`: no session, empty/whitespace name, free user rejected
    (`"Folders require Pro."`, `getUserIsPro` called with the userId), success
    shape, generic db error.
  - `updateFolderAction`: no session, empty id, not-found, success.
  - `deleteFolderAction`: no session, empty id, not-found, success.
  - `moveItemToFolderAction`: no session, free user rejected, cross-user folder
    rejected (`"Invalid folder"`), move to a folder success, move to `null`
    (unfile) success, not-found item.
- `src/lib/db/__tests__/folders.test.ts`:
  - `createFolderForUser`: create shape incl. `userId` scoping + exact `select`
    + `FolderWithMeta` defaults.
  - `updateFolderForUser` / `deleteFolderForUser` / `moveItemToFolder`: scoping
    shape (`where` includes `userId`), no-match returns false, success.
  - `getFoldersForUser`: ordering + `_count` + the batched preview query shape.
- `src/lib/db/__tests__/items.test.ts`:
  - `getItemsForUserByFolderId`: `where: { userId, folderId }`, orderBy tuple,
    `{ items, totalCount }` return.
  - `getItemsForUserByTypeId` with `folderId: null`: `where` includes
    `folderId: null`; without the option: `where` unchanged (regression guard).

Run `npm run test:run` + `npm run build`; both must pass. Live-verify via
Playwright (create folder, file an item into it via the drawer, folder appears
folders-first on `/items/files`, opening it shows the item, item drawer opens
over the folder page, deleting the folder returns the item to ungrouped).

## Files touched

- `prisma/schema.prisma` — `Folder` model, `Item.folderId` + relation + index,
  `User.folders` + migration.
- `src/lib/db/folders.ts` — new helpers.
- `src/lib/db/items.ts` — `getItemsForUserByFolderId`, `folderId?: null` option
  on `getItemsForUserByTypeId`.
- `src/actions/folders.ts` — new actions.
- `src/app/(dashboard)/folders/[id]/page.tsx` — new folder page.
- `src/app/(dashboard)/items/[type]/page.tsx` — folders-first + ungrouped
  filter + New Folder button (file/image only).
- `src/components/folders/*` — `new-folder-dialog`, `folder-card`,
  `folder-row`, `folder-actions`.
- Item drawer + a folders context (`(dashboard)/layout.tsx`) — "Move to folder".
- `src/lib/constants.ts` — optional `FOLDERS_LIMIT`; folder icon color reuse.
- Tests: `src/actions/__tests__/folders.test.ts`,
  `src/lib/db/__tests__/folders.test.ts`, additions to
  `src/lib/db/__tests__/items.test.ts`.
- `scripts/seed.ts` — optionally seed 1–2 folders with a couple filed items so
  the feature has content out of the box (optional, like the favorites seed).
