"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Folder as FolderIcon, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteFolderAction } from "@/actions/folders";
import { EditFolderDialog } from "@/components/folders/edit-folder-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { SYSTEM_TYPE_COLORS } from "@/lib/constants";
import type { FolderWithMeta } from "@/lib/db/folders";
import { formatDateLong } from "@/lib/format-date";
import { formatBytes } from "@/lib/upload-constraints";

type Props = {
  folder: FolderWithMeta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// A thin quick-peek panel for a folder. It is NOT a container for the item
// detail drawer — every substantive action navigates to the canonical
// /folders/[id] page (Resolved decision #4). Download-all lands in Slice B.
export function FolderHubDrawer({ folder, open, onOpenChange }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, startDeleting] = useTransition();

  const folderHref = `/folders/${folder.id}`;
  const previews = folder.previewImageUrls.slice(0, 4);

  function handleDeleteConfirm() {
    startDeleting(async () => {
      const result = await deleteFolderAction(folder.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Folder deleted");
      // The hub opens from /items/files|images (not the folder page), so just
      // close + refresh — no navigation needed.
      setDeleteOpen(false);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[max(36rem,40vw)]">
        <SheetHeader className="gap-4 border-b border-border/60 px-6 py-5">
          <div className="flex items-start gap-3 pr-8">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/50"
              aria-hidden
            >
              <FolderIcon
                className="size-4"
                style={{ color: SYSTEM_TYPE_COLORS.file }}
              />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-lg">{folder.name}</SheetTitle>
              <SheetDescription className="mt-1 text-sm text-muted-foreground">
                {folder.itemCount} {folder.itemCount === 1 ? "item" : "items"}
                {folder.totalSize > 0 && (
                  <> &middot; {formatBytes(folder.totalSize)}</>
                )}
              </SheetDescription>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditOpen(true)}
              disabled={deleting}
            >
              <Pencil aria-hidden />
              Rename
            </Button>
            <span className="flex-1" />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete folder"
              onClick={() => setDeleteOpen(true)}
              disabled={deleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {previews.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {previews.map((url, i) => (
                <Link
                  key={`${url}-${i}`}
                  href={folderHref}
                  onClick={() => onOpenChange(false)}
                  className="aspect-video overflow-hidden rounded-md bg-muted/40 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="size-full object-cover" />
                </Link>
              ))}
            </div>
          ) : (
            <Link
              href={folderHref}
              onClick={() => onOpenChange(false)}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-card p-10 text-center transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <FolderIcon
                className="size-8"
                style={{ color: SYSTEM_TYPE_COLORS.file }}
                aria-hidden
              />
              <p className="mt-1 text-sm text-muted-foreground">
                {folder.itemCount === 0
                  ? "This folder is empty."
                  : "Open the folder to browse its contents."}
              </p>
            </Link>
          )}
        </div>

        <div className="border-t border-border/60 px-6 py-4">
          <Link
            href={folderHref}
            onClick={() => onOpenChange(false)}
            className={buttonVariants({
              variant: "outline",
              className: "w-full"
            })}
          >
            Open folder
            <ArrowRight aria-hidden />
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Created {formatDateLong(folder.createdAt)}
          </p>
        </div>

        <EditFolderDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          folder={{ id: folder.id, name: folder.name }}
        />

        <ConfirmDeleteDialog
          open={deleteOpen}
          onOpenChange={(next) => {
            if (deleting) return;
            setDeleteOpen(next);
          }}
          title={<>Delete &ldquo;{folder.name}&rdquo;?</>}
          description={
            <>
              Items in this folder won&rsquo;t be deleted &mdash; they&rsquo;ll
              move back to the top level. This action cannot be undone.
            </>
          }
          pending={deleting}
          onConfirm={handleDeleteConfirm}
        />
      </SheetContent>
    </Sheet>
  );
}
