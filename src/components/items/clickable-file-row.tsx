"use client";

import {
  Download,
  File as FileIcon,
  FileCode,
  FileCode2,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileType,
  FileType2,
  type LucideIcon
} from "lucide-react";
import { useState } from "react";

import { ItemDrawer } from "@/components/items/item-drawer";
import { QuickFavoriteButton } from "@/components/items/quick-favorite-button";
import type { ItemWithMeta } from "@/lib/db/items";
import { formatDateMedium } from "@/lib/format-date";
import { formatBytes, getExtension } from "@/lib/upload-constraints";

const EXTENSION_ICON: Record<string, LucideIcon> = {
  ".pdf": FileText,
  ".txt": FileType,
  ".md": FileType2,
  ".json": FileJson,
  ".yaml": FileCode,
  ".yml": FileCode,
  ".toml": FileCode,
  ".ini": FileCode,
  ".xml": FileCode2,
  ".csv": FileSpreadsheet
};

function iconForFile(fileName: string | null): LucideIcon {
  if (!fileName) return FileIcon;
  return EXTENSION_ICON[getExtension(fileName)] ?? FileIcon;
}

export function ClickableFileRow({ item }: { item: ItemWithMeta }) {
  const [open, setOpen] = useState(false);
  const Icon = iconForFile(item.fileName);
  const downloadHref = `/api/files/${item.id}`;

  return (
    <>
      <div className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-card/80 sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Open ${item.title}`}
        >
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/50"
            aria-hidden
          >
            <Icon className="size-4" style={{ color: item.itemType.color }} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
            <p className="min-w-0 truncate text-sm font-medium sm:flex-1">
              {item.fileName ?? item.title}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground sm:shrink-0 sm:text-sm">
              {item.fileSize !== null && (
                <span className="tabular-nums">
                  {formatBytes(item.fileSize)}
                </span>
              )}
              {item.fileSize !== null && <span aria-hidden>·</span>}
              <span className="tabular-nums">
                {formatDateMedium(item.createdAt)}
              </span>
            </div>
          </div>
        </button>
        <QuickFavoriteButton
          itemId={item.id}
          initialFavorite={item.isFavorite}
          label={item.title}
          className={
            item.isFavorite
              ? "shrink-0"
              : "shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
          }
        />
        <a
          href={downloadHref}
          download={item.fileName ?? undefined}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Download ${item.fileName ?? item.title}`}
          title="Download"
        >
          <Download className="size-4" aria-hidden />
        </a>
      </div>
      <ItemDrawer cardItem={item} open={open} onOpenChange={setOpen} />
    </>
  );
}
