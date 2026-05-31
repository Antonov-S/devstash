"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteFolderAction } from "@/actions/folders";
import { EditFolderDialog } from "@/components/folders/edit-folder-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { MAX_ZIP_BYTES } from "@/lib/constants";

const MAX_ZIP_MB = Math.floor(MAX_ZIP_BYTES / (1024 * 1024));

type FolderActionsProps = {
  folder: {
    id: string;
    name: string;
  };
  // Whether the folder has any downloadable file/image items. Hides the
  // Download-all anchor when false (the route 404s with no files).
  showDownload?: boolean;
  // Sum of fileSize across the folder. When it exceeds MAX_ZIP_BYTES the anchor
  // becomes a disabled button + helper text — a plain <a download> can't toast
  // the route's 409, so we never offer a link that would fail.
  totalSize?: number;
};

export function FolderActions({
  folder,
  showDownload = true,
  totalSize = 0
}: FolderActionsProps) {
  const tooLarge = totalSize > MAX_ZIP_BYTES;
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, startDeleting] = useTransition();

  function handleDeleteConfirm() {
    startDeleting(async () => {
      const result = await deleteFolderAction(folder.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Folder deleted");
      // The folder page no longer exists — files is the canonical uploads home.
      router.push("/items/files");
    });
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
        {showDownload &&
          (tooLarge ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="gap-1.5"
              title={`Folder too large to download as a ZIP (max ${MAX_ZIP_MB} MB).`}
            >
              <Download className="size-4" aria-hidden />
              Download (.zip)
            </Button>
          ) : (
            <a
              href={`/api/folders/${folder.id}/download`}
              download
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "gap-1.5"
              })}
            >
              <Download className="size-4" aria-hidden />
              Download (.zip)
            </a>
          ))}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Rename folder"
          title="Rename"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="size-4" aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete folder"
          title="Delete"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
        </div>
        {showDownload && tooLarge && (
          <p className="text-xs text-muted-foreground">
            Over {MAX_ZIP_MB} MB — too large to download as a ZIP.
          </p>
        )}
      </div>

      <EditFolderDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        folder={folder}
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
    </>
  );
}
