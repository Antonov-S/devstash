"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteFolderAction } from "@/actions/folders";
import { EditFolderDialog } from "@/components/folders/edit-folder-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

type FolderActionsProps = {
  folder: {
    id: string;
    name: string;
  };
};

export function FolderActions({ folder }: FolderActionsProps) {
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
      <div className="flex items-center gap-1.5">
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
