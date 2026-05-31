"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";

import { createFolderAction } from "@/actions/folders";
import { FolderFormFields } from "@/components/folders/folder-form-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

type NewFolderDialogProps = {
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function NewFolderDialog({
  trigger,
  open: openProp,
  onOpenChange
}: NewFolderDialogProps = {}) {
  const router = useRouter();
  const controlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ? openProp : internalOpen;
  const setOpen = controlled
    ? (next: boolean) => onOpenChange?.(next)
    : setInternalOpen;
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  const submitDisabled = pending || name.trim() === "";

  function resetForm() {
    setName("");
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
      const result = await createFolderAction({ name });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Folder created");
      resetForm();
      setOpen(false);
      router.refresh();
    });
  }

  const triggerNode = trigger ?? (
    <Button variant="outline" size="sm" aria-label="New Folder" title="New Folder">
      <FolderPlus className="size-4" />
      <span className="hidden md:inline">New Folder</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!controlled && <DialogTrigger render={triggerNode} />}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
          <DialogDescription>
            Group files and images together for fast access.
          </DialogDescription>
        </DialogHeader>

        <FolderFormFields
          idPrefix="new-folder"
          name={name}
          onNameChange={setName}
          pending={pending}
          submitLabel="Create"
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
