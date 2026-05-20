"use client";

import { useState } from "react";

import { ImageThumbnailCard } from "@/components/items/image-thumbnail-card";
import { ItemDrawer } from "@/components/items/item-drawer";
import { QuickFavoriteButton } from "@/components/items/quick-favorite-button";
import type { ItemWithMeta } from "@/lib/db/items";

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
            item.isFavorite
              ? "absolute top-2 right-2"
              : "absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
          }
        />
      </div>
      <ItemDrawer cardItem={item} open={open} onOpenChange={setOpen} />
    </>
  );
}
