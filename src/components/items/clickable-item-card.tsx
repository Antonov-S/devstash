"use client";

import { useState } from "react";

import { ItemCard } from "@/components/dashboard/item-card";
import { ItemDrawer } from "@/components/items/item-drawer";
import type { ItemWithMeta } from "@/lib/db/items";

export function ClickableItemCard({ item }: { item: ItemWithMeta }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Open ${item.title}`}
      >
        <ItemCard item={item} />
      </button>
      <ItemDrawer cardItem={item} open={open} onOpenChange={setOpen} />
    </>
  );
}
