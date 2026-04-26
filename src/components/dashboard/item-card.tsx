import { Pin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { iconMap } from "@/lib/icons";
import {
  type MockItem,
  type MockItemType,
  mockItemTypes
} from "@/lib/mock-data";

const typeById = new Map<string, MockItemType>(
  mockItemTypes.map((type) => [type.id, type])
);

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});

export function ItemCard({ item }: { item: MockItem }) {
  const type = typeById.get(item.itemTypeId);
  const Icon = type ? iconMap[type.icon] : null;
  const date = item.lastUsedAt ?? item.updatedAt;

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-card/80"
      style={{ borderLeftWidth: "3px", borderLeftColor: type?.color ?? "var(--border)" }}
    >
      {Icon && (
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/50"
          aria-hidden
        >
          <Icon className="size-4" style={{ color: type?.color }} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-sm font-medium">{item.title}</h3>
          {item.isPinned && <Pin className="size-3 shrink-0 text-muted-foreground" />}
          {item.isFavorite && (
            <Star className="size-3 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
        </div>
        {item.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {item.description}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <span className="shrink-0 text-xs text-muted-foreground">
        {dateFormatter.format(date)}
      </span>
    </div>
  );
}
