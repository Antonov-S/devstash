import { Folder as FolderIcon } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { FolderActions } from "@/components/folders/folder-actions";
import { ClickableFileRow } from "@/components/items/clickable-file-row";
import { ClickableImageCard } from "@/components/items/clickable-image-card";
import { ClickableItemCard } from "@/components/items/clickable-item-card";
import { Pagination } from "@/components/ui/pagination";
import { SYSTEM_TYPE_COLORS } from "@/lib/constants";
import {
  getFolderNameForUser,
  getFolderWithItemsForUser
} from "@/lib/db/folders";
import type { ItemWithMeta } from "@/lib/db/items";
import { ITEMS_PER_PAGE, paginate, parsePageParam } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Folder · DevStash" };

  // Slim name-only query so rendering the page doesn't run the item list twice.
  const folder = await getFolderNameForUser(session.user.id, id);
  if (!folder) return { title: "Folder · DevStash" };
  return { title: `${folder.name} · DevStash` };
}

function ItemsGrid({ items }: { items: ItemWithMeta[] }) {
  const images = items.filter((item) => item.itemType.name === "image");
  const files = items.filter((item) => item.itemType.name === "file");
  const others = items.filter(
    (item) => item.itemType.name !== "image" && item.itemType.name !== "file"
  );

  return (
    <div className="flex flex-col gap-8">
      {others.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {others.map((item) => (
            <ClickableItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
      {images.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {images.map((item) => (
            <ClickableImageCard key={item.id} item={item} />
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((item) => (
            <ClickableFileRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function FolderDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect(`/sign-in?callbackUrl=/folders/${id}`);
  const userId = session.user.id;

  // Folders are a Pro (file/image) feature — display-only gate; write paths
  // keep their own getUserIsPro checks.
  if (!session.user.isPro) redirect("/upgrade");

  const { page: rawPage } = await searchParams;
  const requestedPage = parsePageParam(rawPage);

  const folder = await getFolderWithItemsForUser(userId, id, {
    skip: (requestedPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE
  });
  if (!folder) notFound();

  const { currentPage, totalPages } = paginate({
    page: requestedPage,
    perPage: ITEMS_PER_PAGE,
    totalCount: folder.totalItemCount
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-lg bg-muted/50"
            aria-hidden
          >
            <FolderIcon
              className="size-5"
              style={{ color: SYSTEM_TYPE_COLORS.file }}
            />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">
              <span className="truncate">{folder.name}</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {folder.totalItemCount}{" "}
              {folder.totalItemCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
        <FolderActions folder={{ id: folder.id, name: folder.name }} />
      </div>

      {folder.items.length > 0 ? (
        <>
          <ItemsGrid items={folder.items} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseHref={`/folders/${id}`}
            className="mt-2"
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <span
            className="flex size-10 items-center justify-center rounded-md bg-muted/50"
            aria-hidden
          >
            <FolderIcon
              className="size-5"
              style={{ color: SYSTEM_TYPE_COLORS.file }}
            />
          </span>
          <p className="mt-1 text-sm font-medium">No items yet</p>
          <p className="text-sm text-muted-foreground">
            Move a file or image into this folder from the item drawer.
          </p>
        </div>
      )}
    </div>
  );
}
