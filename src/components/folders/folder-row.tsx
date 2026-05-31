"use client";

import { useState } from "react";
import { Folder as FolderIcon } from "lucide-react";

import { FolderHubDrawer } from "@/components/folders/folder-hub-drawer";
import { SYSTEM_TYPE_COLORS } from "@/lib/constants";
import type { FolderWithMeta } from "@/lib/db/folders";

// File-page folder row: Drive-style row (folder icon + name + item count).
// Clicking the row opens the FolderHubDrawer quick-peek (not the page directly).
export function FolderRow({ folder }: { folder: FolderWithMeta }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open ${folder.name}`}
        className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/50"
          aria-hidden
        >
          <FolderIcon className="size-5" style={{ color: SYSTEM_TYPE_COLORS.file }} />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {folder.name}
        </span>
        <span className="shrink-0 text-sm text-muted-foreground">
          {folder.itemCount} {folder.itemCount === 1 ? "item" : "items"}
        </span>
      </button>
      <FolderHubDrawer folder={folder} open={open} onOpenChange={setOpen} />
    </>
  );
}
