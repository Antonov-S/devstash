import { FolderOpen, Star } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { CollectionActions } from "@/components/collections/collection-actions";
import { ClickableFileRow } from "@/components/items/clickable-file-row";
import { ClickableImageCard } from "@/components/items/clickable-image-card";
import { ClickableItemCard } from "@/components/items/clickable-item-card";
import { Pagination } from "@/components/ui/pagination";
import { getCollectionWithItemsForUser } from "@/lib/db/collections";
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
  if (!session?.user?.id) return { title: "Collection · DevStash" };

  const collection = await getCollectionWithItemsForUser(session.user.id, id);
  if (!collection) return { title: "Collection · DevStash" };
  return { title: `${collection.name} · DevStash` };
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

export default async function CollectionDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect(`/sign-in?callbackUrl=/collections/${id}`);
  const userId = session.user.id;

  const { page: rawPage } = await searchParams;
  const requestedPage = parsePageParam(rawPage);

  const collection = await getCollectionWithItemsForUser(userId, id, {
    skip: (requestedPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE
  });
  if (!collection) notFound();

  const { currentPage, totalPages } = paginate({
    page: requestedPage,
    perPage: ITEMS_PER_PAGE,
    totalCount: collection.totalItemCount
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-lg bg-muted/50"
            aria-hidden
          >
            <FolderOpen className="size-5 text-muted-foreground" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <span className="truncate">{collection.name}</span>
              {collection.isFavorite && (
                <Star
                  className="size-5 shrink-0 fill-yellow-400 text-yellow-400"
                  aria-label="Favorite"
                />
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              {collection.totalItemCount}{" "}
              {collection.totalItemCount === 1 ? "item" : "items"}
            </p>
            {collection.description && (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {collection.description}
              </p>
            )}
          </div>
        </div>
        <CollectionActions
          collection={{
            id: collection.id,
            name: collection.name,
            description: collection.description,
            isFavorite: collection.isFavorite
          }}
        />
      </div>

      {collection.items.length > 0 ? (
        <>
          <ItemsGrid items={collection.items} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseHref={`/collections/${id}`}
            className="mt-2"
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <span
            className="flex size-10 items-center justify-center rounded-md bg-muted/50"
            aria-hidden
          >
            <FolderOpen className="size-5 text-muted-foreground" />
          </span>
          <p className="mt-1 text-sm font-medium">No items yet</p>
          <p className="text-sm text-muted-foreground">
            Add items to this collection from the item drawer.
          </p>
        </div>
      )}
    </div>
  );
}
