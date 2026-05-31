"use client";

import { useState } from "react";
import { Folder as FolderIcon } from "lucide-react";

import { FolderHubDrawer } from "@/components/folders/folder-hub-drawer";
import { SYSTEM_TYPE_COLORS } from "@/lib/constants";
import type { FolderWithMeta } from "@/lib/db/folders";

// Image-page folder card: a 2×2 mosaic of up to 4 image previews (or a Folder
// icon fallback when the folder has no images) + name + item count. Clicking
// the card opens the FolderHubDrawer quick-peek (not the folder page directly).
export function FolderCard({ folder }: { folder: FolderWithMeta }) {
  const [open, setOpen] = useState(false);
  const previews = folder.previewImageUrls.slice(0, 4);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open ${folder.name}`}
        className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="aspect-video w-full bg-muted/40">
          {previews.length > 0 ? (
            <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-px">
              {previews.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="overflow-hidden bg-muted/60"
                  // A single image spans the full row when it's the only one.
                  style={previews.length === 1 ? { gridColumn: "span 2", gridRow: "span 2" } : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex size-full items-center justify-center">
              <FolderIcon
                className="size-10"
                style={{ color: SYSTEM_TYPE_COLORS.file }}
                aria-hidden
              />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <FolderIcon
              className="size-4 shrink-0"
              style={{ color: SYSTEM_TYPE_COLORS.file }}
              aria-hidden
            />
            <span className="truncate text-[15px] font-medium">{folder.name}</span>
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">
            {folder.itemCount} {folder.itemCount === 1 ? "item" : "items"}
          </span>
        </div>
      </button>
      <FolderHubDrawer folder={folder} open={open} onOpenChange={setOpen} />
    </>
  );
}
