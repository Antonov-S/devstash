"use client";

import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

export function DeleteCollectionDialog({
  open,
  onOpenChange,
  name,
  deleting,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  deleting: boolean;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={<>Delete &ldquo;{name}&rdquo;?</>}
      description={
        <>
          This permanently deletes the collection. Items inside it will not be
          deleted &mdash; they just won&rsquo;t be part of this collection
          anymore. This action cannot be undone.
        </>
      }
      pending={deleting}
      onConfirm={onConfirm}
    />
  );
}
