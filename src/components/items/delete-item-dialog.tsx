"use client";

import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

export function DeleteItemDialog({
  open,
  onOpenChange,
  title,
  deleting,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  deleting: boolean;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={<>Delete &ldquo;{title}&rdquo;?</>}
      description="This permanently deletes the item and removes it from any collections. This action cannot be undone."
      pending={deleting}
      onConfirm={onConfirm}
    />
  );
}
