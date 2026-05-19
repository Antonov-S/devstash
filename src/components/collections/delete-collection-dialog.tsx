"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { PendingButton } from "@/components/ui/pending-button";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{name}&rdquo;?</DialogTitle>
          <DialogDescription>
            This permanently deletes the collection. Items inside it will not be
            deleted &mdash; they just won&rsquo;t be part of this collection
            anymore. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <DialogClose
            render={
              <Button type="button" variant="outline" disabled={deleting}>
                Cancel
              </Button>
            }
          />
          <PendingButton
            type="button"
            variant="destructive"
            onClick={onConfirm}
            pending={deleting}
            icon={<Trash2 aria-hidden />}
          >
            Delete
          </PendingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
