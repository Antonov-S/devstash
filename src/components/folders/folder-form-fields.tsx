"use client";

import { Field } from "@/components/items/_form-primitives";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PendingButton } from "@/components/ui/pending-button";

// Shared Name (required) form body used by the create and rename folder
// dialogs. Each dialog owns its own state + action wiring and passes the value
// in; this component just renders the markup and the footer.
export function FolderFormFields({
  idPrefix,
  name,
  onNameChange,
  pending,
  submitLabel,
  onSubmit
}: {
  idPrefix: string;
  name: string;
  onNameChange: (value: string) => void;
  pending: boolean;
  submitLabel: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const nameEmpty = name.trim() === "";
  const submitDisabled = pending || nameEmpty;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" aria-busy={pending}>
      <Field label="Name" htmlFor={`${idPrefix}-name`} required>
        <Input
          id={`${idPrefix}-name`}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={pending}
          aria-invalid={nameEmpty ? true : undefined}
          autoFocus
          required
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
        <PendingButton type="submit" pending={pending} disabled={submitDisabled}>
          {submitLabel}
        </PendingButton>
      </DialogFooter>
    </form>
  );
}
