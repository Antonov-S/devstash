import Link from "next/link";
import { Folder as FolderIcon } from "lucide-react";

import { SYSTEM_TYPE_COLORS } from "@/lib/constants";
import type { FolderWithMeta } from "@/lib/db/folders";

// File-page folder row: Drive-style row (folder icon + name + item count) that
// links straight to the folder page.
export function FolderRow({ folder }: { folder: FolderWithMeta }) {
  return (
    <Link
      href={`/folders/${folder.id}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
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
    </Link>
  );
}
