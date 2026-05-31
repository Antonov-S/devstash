# Folder Drawer Hub + Download-all (Phase 2) Spec

## Overview

Phase 1 (`folders-spec.md`) ships folders as **page-only** — a folder card/row
navigates straight to `/folders/[id]`. This phase adds a **thin drawer hub**: a
quick-peek panel that shows folder metadata + actions + a small preview, with a
prominent **"Open folder →"** that goes to the full page for real browsing.

The design is deliberately a *thin layer*: the drawer hub **does not** try to
host the items' own detail drawer. Clicking an item preview inside the hub
**navigates to the folder page** (where the existing `ItemDrawer` works
normally) — it never opens a drawer-over-a-drawer. This avoids the
drawer-stack/back-nav complexity that ruled out "folder opens in a drawer with
full item interaction."

It also adds **Download entire folder as a streamed ZIP**, surfaced both in the
drawer hub and on the folder page header.

## Prerequisite

`folders-spec.md` must be implemented first. This phase modifies the folder
card/row interaction added there and reuses its `Folder` model, db helpers, and
`/folders/[id]` page.

### Notes carried over from the Phase 1 implementation (read before starting)

These reflect what Phase 1 **actually shipped** — a few of them conflict with
assumptions baked into the sections below, so reconcile them up front:

1. **`FolderWithMeta` is lean — no `totalSize`, no `createdAt`.** Phase 1's
   `getFoldersForUser` selects only `id, name, updatedAt, _count.items` (→
   `itemCount`) plus the image preview, and the type is
   `{ id, name, updatedAt, itemCount, previewImageUrls }`. So the hub header's
   **"N items · X.X MB"** needs a new `totalSize` (add `_sum: { fileSize }` to
   the `getFoldersForUser` aggregate — note this sums **all** items in the
   folder, a different query than the image-only preview), and the hub footer's
   **"Created <date>"** needs either `createdAt` added to the select/type **or**
   should just reuse the already-present `updatedAt`. **Finalized in Resolved
   decision #2** (add both `createdAt` + a batched `totalSize` aggregate).
2. **`previewImageUrls` is capped at 4** (a `PREVIEW_IMAGE_COUNT = 4` const in
   `getFoldersForUser`). The hub body section below says "thumbnail grid (cap
   ~6–8)" — that's **not achievable from `previewImageUrls` as built**. Either
   bump the Phase 1 const, or have the hub do its own slightly larger preview
   fetch. A ≤4 mosaic in the hub is also a fine, zero-extra-query option.
3. **`FolderCard` / `FolderRow` are currently server components** that wrap a
   bare `<Link href="/folders/[id]">`. Phase 2's "make them stateful clients
   that open the hub" conversion starts from that shape. **Shared-model caveat:**
   per Phase 1 the full folder list renders on **both** `/items/files` **and**
   `/items/images` (a files-only folder shows on the images page with the icon
   fallback, and vice-versa). So the hub can be opened for a folder from the
   "other" type's page — the hub must render correctly regardless (don't assume
   the opening page's type matches the folder's contents).
4. **`FolderActions` is Rename + Delete only** (no favorite/pin — deliberately
   omitted so folders don't blur the Collections/Favorites distinction). Adding
   **Download all** to it is a clean addition; just don't expect a favorite
   control to already be there.
5. **Item-drawer width.** The existing `ItemDrawer` `SheetContent` is
   `sm:max-w-[max(36rem,40vw)]`. Match that on the `FolderHubDrawer` for visual
   consistency.
6. **`moveItemToFolder` returns a discriminated result** (`{ ok }` with
   `invalid-folder` / `wrong-type` / `not-found` reasons), not a bare boolean —
   irrelevant to the hub, but noted so the helper signature isn't a surprise.

## Goals

- A `FolderHubDrawer` (right-side `Sheet`, like `ItemDrawer`) showing:
  - Header: folder icon + name + item count + total size.
  - Actions: **Download all (.zip)**, **Rename**, **Delete**.
  - Body: a bounded preview (thumbnail grid for images / a few rows for files).
  - Footer: **"Open folder →"** to `/folders/[id]` + created date.
- Folder card/row click opens the hub drawer (instead of navigating directly).
- Item previews inside the hub **navigate to the folder page** on click (no
  nested drawer).
- **Download entire folder** as a streamed ZIP via a new server route.

## Non-Goals

- Hosting the item-detail drawer inside the folder hub (explicitly avoided).
- Inline editing of items from the hub (use the folder page).
- Multi-select / bulk move from the hub (future).
- Recursive ZIP of nested folders (folders are flat per Phase 1).

## Resolved decisions (pre-implementation review)

A pre-implementation review flagged scope and consistency gaps. These are the
authoritative calls; the sections below were updated to match.

1. **Scope / slicing — this doc covers two *independent* slices.** The folder
   **hub drawer** and the **Download-all ZIP** are separable and should ship as
   **separate branches**, not one big "Phase 2" merge:
   - **(A) Folder hub drawer** — the actual "thin layer" this phase is named
     for. Depends only on Phase 1.
   - **(B) Download-all ZIP** — reusable later for full-account export; depends
     on Phase 1 (not on the hub — the button lives in both the hub *and* the
     folder header, so it can land first or alongside).

   (A third idea raised during review — an **inline collections picker** in the
   item drawer — was deliberately **split out** into its own spec,
   `inline-collections-spec.md`, since it's an item-drawer UX fix unrelated to
   folders. Do not implement it as part of this phase.)

2. **Folder metadata shape (resolves the Phase 1 drift).** Extend
   `getFoldersForUser` + `FolderWithMeta` with the fields the hub needs, in the
   **same** call, so the hub opens with no extra fetch:
   - `createdAt` — add `createdAt: true` to the existing `folder.findMany`
     select (free, same row).
   - `totalSize` — **not** expressible as `_sum` inside a `findMany`. Add a
     **third batched query** alongside the existing preview query:
     `prisma.item.groupBy({ by: ["folderId"], where: { userId, folderId: { in } }, _sum: { fileSize } })`,
     joined client-side by `folderId` (mirrors the preview map). This is bounded
     by the Phase 1 `@@index([folderId])`, so cost is one indexed aggregate over
     the user's folders — acceptable, and it only runs on the file/image pages
     that already call `getFoldersForUser`.
   - Hub header shows `itemCount · formatBytes(totalSize)`; hub footer shows
     `Created <formatDateLong(createdAt)>`.

3. **Preview cap.** Keep Phase 1's `PREVIEW_IMAGE_COUNT = 4`. The hub reuses
   `previewImageUrls` (≤4) — **no second preview query**. The earlier "6–8"
   target is dropped; a ≤4 mosaic is the spec.

4. **Navigation rule (resolves dup entry points).** `/folders/[id]` is the
   **canonical, deep-linkable** browsing surface and the single source of truth
   for a folder's contents; it must always work directly (bookmarks, the
   item-drawer-over-page flow, pagination). The **hub drawer is a non-canonical
   quick-peek** opened by a card/row click; it never hosts item interaction and
   always offers **"Open folder →"** to the page. Rule: *card/row click → hub;
   anything substantive → the page.* Direct navigation to the page must never
   require going through the hub.

5. **Card/row client conversion — justification.** `FolderCard`/`FolderRow`
   become clients **only** to own the hub's `open` state — the exact pattern
   `ClickableImageCard` / `ClickableFileRow` already use for the item drawer.
   No data fetching moves to the client; the server still renders the
   `FolderWithMeta` props. This is a state-ownership change, not a
   rendering-strategy change.

6. **Download route edge cases (finalized).**
   - **Empty folder → `404`** (not `409`); never stream an empty archive. One
     message: `"This folder has no files to download."`.
   - **Per-file R2 failure → skip + log, never abort** the archive; a missing
     object must not kill an otherwise-valid download.
   - **Guard rails:** set an explicit generous `maxDuration` on the route. Add a
     soft cap (e.g. refuse with `409` when the folder's `totalSize` exceeds a
     `MAX_ZIP_BYTES` constant in `src/lib/constants.ts`, suggested ~500 MB) so a
     pathological folder can't hold a function open indefinitely. A true
     background-job + signed-URL flow for huge folders is explicitly deferred.
   - **Entry-name collisions → suffix** `name (2).ext`; null filename →
     `item-<id>`.

7. **Error-handling conventions (intentional, per layer — not a defect).** The
   three layers use different, layer-idiomatic error shapes, and this is
   deliberate:
   - **Server actions** return `{ success: false, error }` (UI toasts it).
   - **HTTP route handlers** (upload, files, the new ZIP route) return **status
     codes** + a JSON `{ error }` body — they're consumed by `fetch`/anchors,
     not action callers.
   - **Best-effort cleanup / streaming** (R2 per-file failures) **log and
     continue** — a non-fatal side effect must not fail the user-facing
     operation (same pattern as Phase 1's R2-delete-on-item-delete and the
     Stripe-cancel-on-account-delete).
   Consistency is *within* each layer; do not try to unify across them.

## Interaction model (the important part)

```
/items/images  ──click folder card──▶  FolderHubDrawer (Sheet)
                                          │
                                          ├─ Download all (.zip)
                                          ├─ Rename / Delete
                                          ├─ preview thumbnails ──click──▶ /folders/[id]  (navigate, drawer closes)
                                          └─ "Open folder →"   ──click──▶ /folders/[id]

/folders/[id]  ──click item──▶  ItemDrawer (existing, overlays the page)
```

The hub is a **container summary**, not an item host. Anything that needs the
item-detail drawer happens on `/folders/[id]`, where it already works.

## Components

### `src/components/folders/folder-hub-drawer.tsx` (new, client)

Built on the same `Sheet` primitive as `ItemDrawer`. Props:

```ts
{
  folder: FolderWithMeta;       // id, name, itemCount, previewImageUrls, updatedAt
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

- **Header** (reuse `ItemDrawer`'s header spacing `px-6 py-5`): `Folder` icon
  (tinted with the `file` system color), folder name (`SheetTitle`), and a
  meta line `N items · X.X MB`.
  - **Total size:** display `formatBytes(totalSize)` where `totalSize` comes
    from the batched `groupBy` aggregate added to `getFoldersForUser` (Resolved
    decision #2) — no extra fetch on open.
- **Action bar** (reuse the `ItemDrawer` action-bar layout): a primary
  **Download all** button (anchor to the download route, see below), a
  **Rename** button (opens the same rename dialog `FolderActions` uses), and a
  right-aligned **Delete** (`Trash2`) opening the shared `ConfirmDeleteDialog`
  with the "items won't be deleted" copy from Phase 1.
- **Body** — a bounded preview, NOT the full paginated list:
  - Images: a small thumbnail grid from `previewImageUrls` (≤4 per Resolved
    decision #3); each thumbnail is a `<Link href="/folders/[id]">` (navigates,
    closes drawer).
  - Files: a few `ClickableFileRow`-styled rows — but rendered as `<Link>` to
    the folder page rather than opening the item drawer (the hub never opens the
    item drawer). For simplicity the preview can be **read-only rows** (icon +
    filename + size) linking to the page.
  - Empty folder → a small empty hint.
- **Footer**: a full-width **"Open folder →"** `<Link href="/folders/[id]">`
  and a `Created <date>` line (`formatDateLong`).
- Close-on-navigate: wrap the inner `<Link>`s so they call `onOpenChange(false)`
  (or rely on route change unmounting the drawer).

### Wire-up: folder card/row opens the hub

Modify the Phase 1 `FolderCard` / `FolderRow` so they are **clients that own a
hub `open` state** (mirror `ClickableImageCard` / `ClickableFileRow`):

- The card/row body becomes a `<button>` that sets `open = true` and renders
  `<FolderHubDrawer ... />` as a sibling — instead of a bare `<Link>`.
- Keep keyboard a11y (`role="button"`/`<button>` + focus ring) consistent with
  the item cards.

The folder page header keeps a **Download all** button too (so the action is
reachable without the drawer) — add it to `FolderActions` from Phase 1.

## Download entire folder — streamed ZIP

### Route: `src/app/api/folders/[id]/download/route.ts` (new)

`export const runtime = "nodejs";` Model on
`src/app/api/files/[id]/route.ts`:

1. `auth()` → 401 when unauthenticated.
2. **Pro gate** — `getUserIsPro(session.user.id)` → 403 when not Pro (download
   is a file/image feature). Use the DB read, not `session.user.isPro`.
3. Load the folder ownership-scoped + its file/image items' `fileUrl` +
   `fileName` (new helper `getFolderFilesForDownload(userId, folderId)` in
   `src/lib/db/folders.ts` returning `{ name; files: { fileUrl; fileName }[] }`
   or `null`). `404` when the folder isn't found/owned.
4. Empty folder → return `404` with `"This folder has no files to download."`
   (finalized in Resolved decision #6) — never stream an empty archive. Also
   refuse with `409` when `totalSize` exceeds `MAX_ZIP_BYTES` (Resolved
   decision #6 guard rail).
5. **Stream a ZIP** (do NOT buffer the whole archive in memory):
   - Add the `archiver` dependency (`npm i archiver` + `@types/archiver`).
   - Create `const archive = archiver("zip", { zlib: { level: 9 } })`.
   - For each file: derive the R2 key via `keyFromPublicUrl(fileUrl)`, fetch the
     **Node `Readable`** body, and `archive.append(nodeStream, { name })`.
     - **R2 body shape:** the existing `getObjectFromR2` returns a **Web**
       `ReadableStream` (it calls `Readable.toWeb`). `archiver` wants a Node
       `Readable`. Add a sibling helper `getObjectNodeStreamFromR2(key)` in
       `src/lib/r2.ts` / `r2-core.ts` that returns the SDK's Node `Readable`
       **before** the `toWeb` conversion (the SDK already returns a Node
       `Readable` in the Node runtime). Use that for archiver.
   - Convert the archive (a Node `Readable`) to a Web stream for the `Response`
     body (`Readable.toWeb(archive)`), then `archive.finalize()`.
   - Headers: `Content-Type: application/zip`,
     `Content-Disposition: attachment; filename*=UTF-8''<folder>.zip`
     (reuse the `encodeContentDisposition` helper pattern from the file route),
     `Cache-Control: private, no-store`. Omit `Content-Length` (streamed, length
     unknown).
6. **Filename collisions inside the zip:** dedupe entry names — track seen names
   and suffix `name (2).ext`, `name (3).ext`. (Two `screenshot.png`s otherwise
   collide.) Fall back to `item-<id>` when `fileName` is null.
7. Wrap in try/catch → log + `500` on setup failure (same as the file route).

### Download button (client)

- In the hub drawer + folder header: an anchor
  `<a href="/api/folders/[id]/download">Download all (.zip)</a>` with
  `download`. No client zipping.
- Consider a lightweight pending affordance is unnecessary — it's a normal
  browser download (the anchor navigates to the streamed response).

### Gotchas to call out in implementation

- **Serverless duration limits.** Streaming keeps memory flat, but a folder with
  many large files can exceed the function's `maxDuration`. Set a generous
  `maxDuration` on the route if the host enforces a low default; note that a
  truly huge-folder background-job + signed-URL flow is a future enhancement,
  not part of this slice.
- **R2 egress.** Every object streams through the function — acceptable, just
  documented.
- **Per-file fetch failure.** If one R2 object 404s mid-stream, log and skip it
  (don't abort the whole archive) — `archive.append` errors should be caught so
  one missing object doesn't kill the download.
- This dovetails with the spec's existing "Export as ZIP (Pro)" goal — the
  `archiver` setup here is reusable for a future full-account export.

## Testing

Per `coding-standards.md`: components + route handlers that import next-auth's
`next/server` are **not** unit-tested (the documented Vitest/next-auth poison
gotcha — same reason `/api/files/[id]` and `/api/items/[id]` aren't). Cover the
testable units:

- `src/lib/db/__tests__/folders.test.ts` — `getFolderFilesForDownload`:
  ownership scoping (`where` includes `userId`), null on miss, maps
  `fileUrl`/`fileName`, includes the folder `name`; `totalSize` aggregate added
  to `getFoldersForUser` (if implemented via `_sum`).
- If a **pure** zip-entry-name dedupe helper is extracted (e.g.
  `uniqueZipName(name, seen)` in a non-`server-only` util), unit-test it
  (empty/null name fallback, collision suffixing, extension preservation).
  Keeping the dedupe inline in the route is fine too, in which case it's covered
  by the manual checklist.
- The download route + `getObjectNodeStreamFromR2` are SDK/route I/O — **not**
  unit-tested (consistent with the existing R2 + route-handler precedent);
  verify via the manual checklist below.

### Manual checklist

- Free user → download route returns 403; hub Download-all hidden/disabled.
- Pro user → ZIP downloads, opens, contains all folder files with correct names;
  two same-named files are de-duped (`x.png`, `x (2).png`).
- Empty folder → 404 (no empty archive).
- Folder with one missing R2 object → ZIP still downloads with the rest.
- Hub drawer: clicking a preview thumbnail navigates to `/folders/[id]` and the
  drawer closes; "Open folder →" navigates; Rename/Delete work; no
  drawer-over-drawer ever appears.

Run `npm run test:run` + `npm run build`; both must pass.

## Files touched

- `src/components/folders/folder-hub-drawer.tsx` — new drawer.
- `src/components/folders/folder-card.tsx` / `folder-row.tsx` — open the hub
  instead of navigating (now stateful clients).
- `src/components/folders/folder-actions.tsx` — add Download-all to the page
  header.
- `src/app/api/folders/[id]/download/route.ts` — new streamed-ZIP route.
- `src/lib/r2.ts` / `src/lib/r2-core.ts` — `getObjectNodeStreamFromR2`.
- `src/lib/db/folders.ts` — `getFolderFilesForDownload`; `totalSize` aggregate +
  `createdAt` on `getFoldersForUser`/`FolderWithMeta` (Resolved decision #2).
- `src/lib/constants.ts` — `MAX_ZIP_BYTES` guard rail (Resolved decision #6).
- `package.json` — `archiver` + `@types/archiver`.
- Tests: `src/lib/db/__tests__/folders.test.ts` additions; optional
  `uniqueZipName` util + test.
