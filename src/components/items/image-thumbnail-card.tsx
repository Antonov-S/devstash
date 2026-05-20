import { Image as ImageIcon, Pin } from "lucide-react";

import type { ItemWithMeta } from "@/lib/db/items";

export function ImageThumbnailCard({ item }: { item: ItemWithMeta }) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card transition-colors hover:bg-card/80">
      <div className="relative aspect-video w-full overflow-hidden bg-muted/40">
        {item.fileUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.fileUrl}
            alt={item.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon
              className="size-8 text-muted-foreground/60"
              aria-hidden
            />
          </div>
        )}

        {item.isPinned && (
          <div className="absolute left-2 top-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur">
              <Pin className="size-3.5" aria-hidden />
            </span>
          </div>
        )}
      </div>

      <div className="px-3 py-2.5">
        <h3 className="truncate text-sm font-medium leading-snug">
          {item.title}
        </h3>
      </div>
    </div>
  );
}
