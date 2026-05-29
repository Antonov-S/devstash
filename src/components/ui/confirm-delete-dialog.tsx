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

// Shared confirmation dialog for destructive deletes. Presentational only —
// "dismiss locked while pending" stays the caller's responsibility (callers
// short-circuit onOpenChange while their delete is in flight).
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  pending,
  onConfirm,
  confirmLabel = "Delete"
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  pending: boolean;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <DialogClose
            render={
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            }
          />
          <PendingButton
            type="button"
            variant="destructive"
            onClick={onConfirm}
            pending={pending}
            icon={<Trash2 aria-hidden />}
          >
            {confirmLabel}
          </PendingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
