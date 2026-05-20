import { Pin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ItemWithMeta } from "@/lib/db/items";
import { formatDateShort } from "@/lib/format-date";
import { iconMap } from "@/lib/icons";

export function ItemCard({ item }: { item: ItemWithMeta }) {
  const Icon = iconMap[item.itemType.icon] ?? null;
  const date = item.lastUsedAt ?? item.updatedAt;

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-card/80"
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: item.itemType.color
      }}
    >
      {Icon && (
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/50"
          aria-hidden
        >
          <Icon className="size-4" style={{ color: item.itemType.color }} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-[15px] font-medium leading-snug">
            {item.title}
          </h3>
          {item.isPinned && (
            <Pin className="size-3.5 shrink-0 text-muted-foreground" />
          )}
        </div>
        {item.description && (
          <p className="mt-1 line-clamp-1 text-sm leading-snug text-muted-foreground">
            {item.description}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[11px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <span className="shrink-0 text-sm text-muted-foreground">
        {formatDateShort(date)}
      </span>
    </div>
  );
}
