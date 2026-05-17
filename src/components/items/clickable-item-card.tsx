"use client";

import { useState } from "react";

import { ItemCard } from "@/components/dashboard/item-card";
import { ItemDrawer } from "@/components/items/item-drawer";
import { QuickCopyButton } from "@/components/items/quick-copy-button";
import type { ItemWithMeta } from "@/lib/db/items";

const TYPES_WITH_CONTENT_COPY = new Set([
  "snippet",
  "prompt",
  "command",
  "note"
]);

function getCopyText(item: ItemWithMeta): string | null {
  const typeName = item.itemType.name.toLowerCase();
  if (typeName === "link") return item.url;
  if (TYPES_WITH_CONTENT_COPY.has(typeName)) return item.content;
  return null;
}

export function ClickableItemCard({ item }: { item: ItemWithMeta }) {
  const [open, setOpen] = useState(false);
  const copyText = getCopyText(item);

  return (
    <>
      <div className="group relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Open ${item.title}`}
        >
          <ItemCard item={item} />
        </button>
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
