"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";

import { createCollectionAction } from "@/actions/collections";
import { CollectionFormFields } from "@/components/collections/collection-form-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

type NewCollectionDialogProps = {
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function NewCollectionDialog({
  trigger,
  open: openProp,
  onOpenChange
}: NewCollectionDialogProps = {}) {
  const router = useRouter();
  const controlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ? openProp : internalOpen;
  const setOpen = controlled
    ? (next: boolean) => onOpenChange?.(next)
    : setInternalOpen;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  const nameEmpty = name.trim() === "";
  const submitDisabled = pending || nameEmpty;

  function resetForm() {
    setName("");
    setDescription("");
  }

  function handleOpenChange(next: boolean) {
    if (pending) return;
    if (!next) resetForm();
    setOpen(next);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitDisabled) return;

    startTransition(async () => {
      const result = await createCollectionAction({ name, description });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Collection created");
      resetForm();
      setOpen(false);
      router.refresh();
    });
  }

  const triggerNode = trigger ?? (
    <Button
      variant="outline"
      size="sm"
      aria-label="New Collection"
      title="New Collection"
    >
      <FolderPlus className="size-4" />
      <span className="hidden md:inline">New Collection</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!controlled && <DialogTrigger render={triggerNode} />}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>
            Group related items together for fast access.
          </DialogDescription>
        </DialogHeader>

        <CollectionFormFields
          idPrefix="new-collection"
          name={name}
          onNameChange={setName}
          description={description}
          onDescriptionChange={setDescription}
          pending={pending}
          submitLabel="Create"
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
