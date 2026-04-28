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
import type { CollectionWithMeta } from "@/lib/db/collections";

export function CollectionCard({
  collection
}: {
  collection: CollectionWithMeta;
}) {
  const borderColor = collection.dominantType?.color ?? "var(--border)";

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group relative block rounded-xl transition-transform hover:-translate-y-0.5"
    >
      <Card
        className="gap-5 py-6 transition-colors group-hover:bg-card/80"
        style={{ borderLeftWidth: "3px", borderLeftColor: borderColor }}
      >
        <CardHeader className="gap-2 px-6">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="truncate">{collection.name}</span>
            {collection.isFavorite && (
              <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </CardTitle>
          <CardDescription className="text-sm">
            {collection.itemCount}{" "}
            {collection.itemCount === 1 ? "item" : "items"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 px-6">
          {collection.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {collection.description}
            </p>
          )}
          {collection.types.length > 0 && (
            <div className="flex items-center gap-2">
              {collection.types.map((type) => {
                const Icon = iconMap[type.icon];
                if (!Icon) return null;
                return (
                  <span
                    key={type.id}
                    className="flex size-8 items-center justify-center rounded-md bg-muted/50"
                    title={type.name}
                  >
                    <Icon className="size-4" style={{ color: type.color }} />
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
