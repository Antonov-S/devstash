"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateCollectionAction } from "@/actions/collections";
import { Field, Textarea } from "@/components/items/_form-primitives";
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
import { Input } from "@/components/ui/input";
import { PendingButton } from "@/components/ui/pending-button";

type EditCollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: {
    id: string;
    name: string;
    description: string | null;
  };
};

export function EditCollectionDialog({
  open,
  onOpenChange,
  collection
}: EditCollectionDialogProps) {
  const router = useRouter();
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setName(collection.name);
      setDescription(collection.description ?? "");
    }
  }, [open, collection.name, collection.description]);

  const nameEmpty = name.trim() === "";
  const submitDisabled = pending || nameEmpty;

  function handleOpenChange(next: boolean) {
    if (pending) return;
    onOpenChange(next);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitDisabled) return;

    startTransition(async () => {
      const result = await updateCollectionAction(collection.id, {
        name,
        description
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Collection updated");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit collection</DialogTitle>
          <DialogDescription>
            Update the name and description for this collection.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          aria-busy={pending}
        >
          <Field label="Name" htmlFor="edit-collection-name" required>
            <Input
              id="edit-collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={pending}
              aria-invalid={nameEmpty ? true : undefined}
              autoFocus
              required
            />
          </Field>

          <Field label="Description" htmlFor="edit-collection-description">
            <Textarea
              id="edit-collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
              rows={3}
            />
          </Field>

          <DialogFooter className="pt-2">
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={pending}>
                  Cancel
                </Button>
              }
            />
            <PendingButton
              type="submit"
              pending={pending}
              disabled={submitDisabled}
            >
              Save
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
