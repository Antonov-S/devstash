import Link from "next/link";
import { Star } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { iconMap } from "@/lib/icons";
import {
  type MockCollection,
  type MockItemType,
  mockItemTypes,
  mockItems
} from "@/lib/mock-data";

const typeById = new Map<string, MockItemType>(
  mockItemTypes.map((type) => [type.id, type])
);

function dominantTypesForCollection(collectionId: string): MockItemType[] {
  const typeIds = new Set<string>();
  for (const item of mockItems) {
    if (item.collectionIds.includes(collectionId)) {
      typeIds.add(item.itemTypeId);
    }
  }
  return [...typeIds]
    .map((id) => typeById.get(id))
    .filter((t): t is MockItemType => Boolean(t));
}

export function CollectionCard({ collection }: { collection: MockCollection }) {
  const types = dominantTypesForCollection(collection.id);

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group relative block rounded-xl transition-transform hover:-translate-y-0.5"
    >
      <Card className="transition-colors group-hover:bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <span className="truncate">{collection.name}</span>
            {collection.isFavorite && (
              <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </CardTitle>
          <CardDescription className="text-xs">
            {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {collection.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {collection.description}
            </p>
          )}
          {types.length > 0 && (
            <div className="flex items-center gap-1.5">
              {types.map((type) => {
                const Icon = iconMap[type.icon];
                if (!Icon) return null;
                return (
                  <span
                    key={type.id}
                    className="flex size-6 items-center justify-center rounded-md bg-muted/50"
                    title={type.label}
                  >
                    <Icon className="size-3.5" style={{ color: type.color }} />
                  </span>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
