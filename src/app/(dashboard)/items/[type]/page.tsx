import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { ItemCard } from "@/components/dashboard/item-card";
import {
  getItemsForUserByTypeId,
  getSystemItemTypeByName
} from "@/lib/db/items";
import { iconMap } from "@/lib/icons";
import { systemTypeNameFromSlug } from "@/lib/system-types";

export const dynamic = "force-dynamic";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
  params
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: slug } = await params;
  const typeName = systemTypeNameFromSlug(slug);
  if (!typeName) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect(`/sign-in?callbackUrl=/items/${slug}`);
  const userId = session.user.id;

  const itemType = await getSystemItemTypeByName(typeName);
  if (!itemType) notFound();

  const items = await getItemsForUserByTypeId(userId, itemType.id);
  const Icon = iconMap[itemType.icon] ?? null;
  const label = capitalize(slug);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
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
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
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
          <p className="text-xs text-muted-foreground">
            Create your first {typeName} to get started.
          </p>
        </div>
      )}
    </div>
  );
}
