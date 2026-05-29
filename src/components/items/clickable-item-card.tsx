"use client";

import { useState } from "react";

import { ItemCard } from "@/components/dashboard/item-card";
import { ItemDrawer } from "@/components/items/item-drawer";
import { QuickCopyButton } from "@/components/items/quick-copy-button";
import { ITEM_TYPES_WITH_CONTENT } from "@/lib/constants";
import type { ItemWithMeta } from "@/lib/db/items";

function getCopyText(item: ItemWithMeta): string | null {
  const typeName = item.itemType.name.toLowerCase();
  if (typeName === "link") return item.url;
  if (ITEM_TYPES_WITH_CONTENT.has(typeName)) return item.content;
  return null;
}

export function ClickableItemCard({ item }: { item: ItemWithMeta }) {
  const [open, setOpen] = useState(false);
  const copyText = getCopyText(item);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    // Only react when the wrapper itself receives the key — not bubbled from
    // an inner control like the favorite button.
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  return (
    <>
      <div className="group relative">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="block w-full cursor-pointer rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Open ${item.title}`}
        >
          <ItemCard item={item} />
        </div>
        {copyText && (
          <QuickCopyButton
            text={copyText}
            label={`Copy ${item.title}`}
            className="absolute bottom-3 right-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
          />
        )}
      </div>
      <ItemDrawer cardItem={item} open={open} onOpenChange={setOpen} />
    </>
  );
}
