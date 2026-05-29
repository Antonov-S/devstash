import { Plus } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import type { CreateItemType } from "@/actions/items";
import { ClickableFileRow } from "@/components/items/clickable-file-row";
import { ClickableImageCard } from "@/components/items/clickable-image-card";
import { ClickableItemCard } from "@/components/items/clickable-item-card";
import { NewItemDialog } from "@/components/items/new-item-dialog";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { PRO_ONLY_ITEM_TYPES } from "@/lib/constants";
import {
  getItemsForUserByTypeId,
  getSystemItemTypeByName
} from "@/lib/db/items";
import { iconMap } from "@/lib/icons";
import {
  ITEMS_PER_PAGE,
  paginate,
  parsePageParam
} from "@/lib/pagination";
import {
  type SystemTypeName,
  systemTypeNameFromSlug
} from "@/lib/system-types";
import { capitalize } from "@/lib/utils";

const CREATABLE_TYPES: ReadonlySet<SystemTypeName> = new Set([
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
  "file",
  "image"
]);

function isCreatable(name: SystemTypeName): name is CreateItemType {
  return CREATABLE_TYPES.has(name);
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const name = systemTypeNameFromSlug(type);
  if (!name) return { title: "DevStash" };
  return { title: `${capitalize(type)} · DevStash` };
}

export default async function ItemsByTypePage({
  params,
  searchParams
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { type: slug } = await params;
  const typeName = systemTypeNameFromSlug(slug);
  if (!typeName) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect(`/sign-in?callbackUrl=/items/${slug}`);
  const userId = session.user.id;

  if (PRO_ONLY_ITEM_TYPES.has(typeName) && !session.user.isPro) {
    redirect("/upgrade");
  }

  const itemType = await getSystemItemTypeByName(typeName);
  if (!itemType) notFound();

  const { page: rawPage } = await searchParams;
  const requestedPage = parsePageParam(rawPage);

  const { items, totalCount } = await getItemsForUserByTypeId(
    userId,
    itemType.id,
    {
      skip: (requestedPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE
    }
  );
  const { currentPage, totalPages } = paginate({
    page: requestedPage,
    perPage: ITEMS_PER_PAGE,
    totalCount
  });

  const Icon = iconMap[itemType.icon] ?? null;
  const label = capitalize(slug);

  const singularLabel = capitalize(typeName);
  const creatable = isCreatable(typeName);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <span
              className="flex size-10 items-center justify-center rounded-lg bg-muted/50"
              aria-hidden
            >
              <Icon className="size-5" style={{ color: itemType.color }} />
            </span>
          )}
          <div>
            <h1 className="text-2xl font-semibold">{label}</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
        {creatable && (
          <NewItemDialog
            initialType={typeName}
            trigger={
              <Button
                size="sm"
                aria-label={`New ${singularLabel}`}
                title={`New ${singularLabel}`}
              >
                <Plus className="size-4" />
                <span className="hidden md:inline">New {singularLabel}</span>
              </Button>
            }
          />
        )}
      </div>

      {items.length > 0 ? (
        <>
          {typeName === "image" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((item) => (
                <ClickableImageCard key={item.id} item={item} />
              ))}
            </div>
          ) : typeName === "file" ? (
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <ClickableFileRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <ClickableItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseHref={`/items/${slug}`}
            className="mt-2"
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-card p-12 text-center">
          {Icon && (
            <span
              className="flex size-10 items-center justify-center rounded-md bg-muted/50"
              aria-hidden
            >
              <Icon className="size-5 text-muted-foreground" />
            </span>
          )}
          <p className="mt-1 text-sm font-medium">
            No {label.toLowerCase()} yet
          </p>
          <p className="text-sm text-muted-foreground">
            Create your first {typeName} to get started.
          </p>
        </div>
      )}
    </div>
  );
}
