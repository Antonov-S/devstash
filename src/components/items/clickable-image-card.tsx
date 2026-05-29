"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { ImageThumbnailCard } from "@/components/items/image-thumbnail-card";
import { ItemDrawer } from "@/components/items/item-drawer";
import { quickActionButtonClass } from "@/components/items/quick-action-button";
import { QuickFavoriteButton } from "@/components/items/quick-favorite-button";
import type { ItemWithMeta } from "@/lib/db/items";
import { cn } from "@/lib/utils";

// Hover/focus/touch reveal shared by the overlay controls.
const REVEAL =
  "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100";

export function ClickableImageCard({ item }: { item: ItemWithMeta }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="group relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Open ${item.title}`}
        >
          <ImageThumbnailCard item={item} />
        </button>
        <QuickFavoriteButton
          itemId={item.id}
          initialFavorite={item.isFavorite}
          label={item.title}
          className={
            item.isFavorite ? "absolute top-2 right-2" : cn("absolute top-2 right-2", REVEAL)
          }
        />
        {item.fileUrl && (
          // Box mirrors the thumbnail (aspect-video, from the card top) so the
          // download anchors to the thumbnail's bottom-right, not the card's
          // (which would sit over the title strip). pointer-events-none lets
          // thumbnail clicks fall through to the open-drawer button beneath.
          <div className="pointer-events-none absolute inset-x-0 top-0 aspect-video">
            <a
              href={`/api/files/${item.id}`}
              download={item.fileName ?? undefined}
              onClick={(event) => event.stopPropagation()}
              aria-label={`Download ${item.fileName ?? item.title}`}
              title="Download"
              className={cn(
                quickActionButtonClass,
                "pointer-events-auto absolute bottom-2 right-2",
                REVEAL
              )}
            >
              <Download className="size-3.5" aria-hidden />
            </a>
          </div>
        )}
      </div>
      <ItemDrawer cardItem={item} open={open} onOpenChange={setOpen} />
    </>
  );
}
