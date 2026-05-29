"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateCollectionAction } from "@/actions/collections";
import { CollectionFormFields } from "@/components/collections/collection-form-fields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

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

        <CollectionFormFields
          idPrefix="edit-collection"
          name={name}
          onNameChange={setName}
          description={description}
          onDescriptionChange={setDescription}
          pending={pending}
          submitLabel="Save"
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
