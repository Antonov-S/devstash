import { FolderOpen } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CollectionCard } from "@/components/dashboard/collection-card";
import { NewCollectionDialog } from "@/components/collections/new-collection-dialog";
import { Pagination } from "@/components/ui/pagination";
import { getCollectionsPagedForUser } from "@/lib/db/collections";
import {
  COLLECTIONS_PER_PAGE,
  paginate,
  parsePageParam
} from "@/lib/pagination";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Collections · DevStash"
};

export default async function CollectionsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/collections");
  const userId = session.user.id;

  const { page: rawPage } = await searchParams;
  const requestedPage = parsePageParam(rawPage);

  const { collections, totalCount } = await getCollectionsPagedForUser(userId, {
    skip: (requestedPage - 1) * COLLECTIONS_PER_PAGE,
    take: COLLECTIONS_PER_PAGE
  });

  const { currentPage, totalPages } = paginate({
    page: requestedPage,
    perPage: COLLECTIONS_PER_PAGE,
    totalCount
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-lg bg-muted/50"
            aria-hidden
          >
            <FolderOpen className="size-5 text-muted-foreground" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Collections</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount}{" "}
              {totalCount === 1 ? "collection" : "collections"}
            </p>
          </div>
        </div>
      </div>

      {collections.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseHref="/collections"
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
          <p className="mt-1 text-sm font-medium">No collections yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first collection to group related items.
          </p>
          <div className="mt-3">
            <NewCollectionDialog />
          </div>
        </div>
      )}
    </div>
  );
}
