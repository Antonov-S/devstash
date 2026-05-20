"use client";

import { useState } from "react";

import { ItemDrawer } from "@/components/items/item-drawer";
import { iconMap } from "@/lib/icons";
import type { ItemWithMeta } from "@/lib/db/items";
import { formatDateRelative } from "@/lib/format-date";
import { capitalize } from "@/lib/utils";

export function FavoriteItemRow({ item }: { item: ItemWithMeta }) {
  const [open, setOpen] = useState(false);
  const Icon = iconMap[item.itemType.icon] ?? null;
  const color = item.itemType.color;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
        aria-label={`Open ${item.title}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          {Icon ? (
            <Icon
              className="size-4 shrink-0"
              style={{ color }}
              aria-hidden
            />
          ) : (
            <span className="size-4 shrink-0" aria-hidden />
          )}
          <span className="truncate font-mono text-sm text-foreground">
            {item.title}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className="rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium"
            style={{
              color,
              borderColor: `${color}66`,
              backgroundColor: `${color}1a`
            }}
          >
            {capitalize(item.itemType.name)}
          </span>
          <span className="hidden whitespace-nowrap font-mono text-xs text-muted-foreground sm:inline">
            {formatDateRelative(item.updatedAt)}
          </span>
        </div>
      </button>
      <ItemDrawer cardItem={item} open={open} onOpenChange={setOpen} />
    </>
  );
}
