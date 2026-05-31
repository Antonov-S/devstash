"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateFolderAction } from "@/actions/folders";
import { FolderFormFields } from "@/components/folders/folder-form-fields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

type EditFolderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: {
    id: string;
    name: string;
  };
};

export function EditFolderDialog({
  open,
  onOpenChange,
  folder
}: EditFolderDialogProps) {
  const router = useRouter();
  const [name, setName] = useState(folder.name);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) setName(folder.name);
  }, [open, folder.name]);

  const submitDisabled = pending || name.trim() === "";

  function handleOpenChange(next: boolean) {
    if (pending) return;
    onOpenChange(next);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitDisabled) return;

    startTransition(async () => {
      const result = await updateFolderAction(folder.id, { name });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Folder updated");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rename folder</DialogTitle>
          <DialogDescription>Update the name for this folder.</DialogDescription>
        </DialogHeader>

        <FolderFormFields
          idPrefix="edit-folder"
          name={name}
          onNameChange={setName}
          pending={pending}
          submitLabel="Save"
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
