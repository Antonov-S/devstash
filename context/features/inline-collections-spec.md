# Inline Collections Picker (Item Drawer) Spec

## Overview

Make assigning an item to collections an **instant inline action in the item
drawer's read view**, instead of something only reachable through the **Edit**
form. This brings collections in line with the other item-organization controls
(favorite, pin, and the folders "Move to folder" select) that already update
optimistically without entering edit mode.

This is a small, self-contained item-drawer UX change. It does **not** touch
folders, collections pages, or any data model — it only adds a write path that
already exists in spirit (the same `collectionIds` the create/edit flows
persist) and swaps a read-only badge list for an editable control.

## Motivation

The item drawer's read view already exposes several organization controls as
live, optimistic actions:

- **Favorite** — star toggle in the action bar.
- **Pin** — pin toggle in the action bar.
- **Move to folder** — a `Select` in the body (for file/image items).

**Collections** is the odd one out: the read view shows them as **read-only
badges**, and the only way to change them is to click **Edit** and use the
multi-select `CollectionsPicker` bundled in the form alongside
title/description/content/tags.

Guiding principle: *a control belongs inline + instant when it's a quick,
reversible organizational action; it belongs behind Edit only when it's part of
authoring the item's content.* Collections is organizational, so it should be
inline. The desired end state is a clean split:

- **Read view = organize:** favorite, pin, folder, **collections** — all live,
  optimistic, no edit mode.
- **Edit mode = author content:** title, description, content, tags.

## Non-Goals

- Creating collections from the picker (use the existing New Collection dialog).
- Changing the collections pages, sidebar, or the `Collection` model.
- Any folder behavior (separate feature).

## Server action — `src/actions/items.ts`

Add `setItemCollectionsAction(itemId, collectionIds: string[])` →
`{ success: true } | { success: false; error }`, mirroring the existing
`setItemFavoriteAction` / `setItemPinnedAction` shape:

- `requireUserId()` guard.
- Validate `itemId` is a non-empty string; coerce/dedupe `collectionIds` (reuse
  `collectionIdsField` from `src/lib/zod-fields.ts`).
- Re-verify ownership of every supplied collection via the existing
  `verifyCollectionsOwnedByUser(userId, collectionIds)` → `"Invalid collection"`
  on a cross-user id (the same guard `updateItemAction` already uses — blocks the
  cross-user attach attack).
- Delegate to a new `setItemCollectionsForUser(userId, itemId, collectionIds)` in
  `src/lib/db/items.ts` that, inside a `$transaction`, ownership-checks the item
  (`findFirst { id, userId }` → return `false` on miss, so wrong-owner / missing
  collapses to not-found), then `itemCollection.deleteMany({ where: { itemId } })`
  + recreates the rows via `itemCollection.create` (mirrors the collection-link
  rewrite already inside `updateItemForUser`). Returns `boolean`.
- **No Pro gate** — collections are a free-tier feature (Free users get 3
  collections), unlike folders. Do **not** call `getUserIsPro` here.

## Component — read-view inline picker

- In `src/components/items/item-drawer-body.tsx`, replace the read-only
  Collections **badge list** with an editable inline control (a new client
  `InlineCollectionsPicker` that reuses the existing `CollectionsPicker` chip UI
  + `useUserCollections()` context).
- On change it calls `setItemCollectionsAction` with the optimistic-update +
  previous-value rollback + `router.refresh()` pattern. The value is a
  `string[]`, not a boolean, so a small local `useState<string[]>` +
  `useTransition` is the natural fit (rather than `useOptimisticToggle`, which is
  boolean-shaped).
- Seed the picker's selected ids from `detail.collections.map((c) => c.id)` (the
  drawer's `detail.collections` already carries `{ id, name }[]`) and re-sync via
  `useEffect` on `detail` change (matches the folder select).
- Disable the picker while its transition is pending to block double-fires
  (matches the folder select).
- Empty-state ("no collections yet") is already handled by `CollectionsPicker`.

### Single source of truth for the edit form

Once the inline control exists, **drop the `CollectionsPicker` from the edit
form** (`src/components/items/item-form-fields.tsx`) so collections live in
exactly one place and the edit form is purely content
(title/description/content/tags) — matching the "edit = author content" split.

- `ItemFormFields` is shared by the edit form **and** the New Item dialog. The
  New Item dialog still needs a collections picker (you assign collections at
  create time). So gate the picker with a prop (e.g. `showCollections`,
  default `true`) and pass `showCollections={false}` from the **edit** path only
  — the create path keeps it. Do **not** remove `collectionIds` from
  `ItemFormValue` / `updateItemAction` (the create path and existing tests still
  use it); only stop *rendering* the picker in edit mode.
- If that prop threading feels heavier than the benefit, an acceptable
  alternative is keeping the picker in both places — they both persist the same
  `collectionIds`, so they won't corrupt each other. Decide during
  implementation; the prop-gated single-source version is preferred.

## Edge cases

- **Ownership.** `setItemCollectionsForUser` only mutates rows where
  `item.userId === userId`; `verifyCollectionsOwnedByUser` blocks attaching a
  collection the user doesn't own.
- **Dedupe.** Dedupe `collectionIds` before writing (same `Array.from(new Set)`
  the create/update paths use).
- **Concurrent edits.** Disable the picker while the transition is pending.
- **Refresh sync.** `router.refresh()` after success re-renders the underlying
  card lists / collection pages so counts stay correct.

## Testing

Per `coding-standards.md`: test server actions + db helpers; components are out
of scope.

- `src/actions/__tests__/items.test.ts` — `setItemCollectionsAction`: no
  session, empty id, cross-user collection rejected (`"Invalid collection"`,
  `verifyCollectionsOwnedByUser` called with the ids), not-found item,
  dedupe-and-forward, success.
- `src/lib/db/__tests__/items.test.ts` — `setItemCollectionsForUser`: ownership
  scoping (`findFirst { id, userId }` → `false` on miss), the
  `itemCollection.deleteMany` + recreate link-write shape inside the
  `$transaction`, deduped ids.

Run `npm run test:run` + `npm run build`; both must pass. Live-verify: open a
file (and a non-file) item drawer, toggle a collection chip in the read view →
toasts + the collection page / card counts update without entering edit mode;
the New Item dialog still offers the collections picker; the edit form no longer
shows it.

## Files touched

- `src/actions/items.ts` — `setItemCollectionsAction`.
- `src/lib/db/items.ts` — `setItemCollectionsForUser`.
- `src/components/items/item-drawer-body.tsx` — replace the read-only collection
  badges with the inline editable `InlineCollectionsPicker`.
- `src/components/items/inline-collections-picker.tsx` — new (or inline it in
  the drawer body if small).
- `src/components/items/item-form-fields.tsx` — gate the edit form's
  `CollectionsPicker` behind a `showCollections` prop (create keeps it, edit
  drops it).
- Tests: `src/actions/__tests__/items.test.ts` +
  `src/lib/db/__tests__/items.test.ts` additions.
