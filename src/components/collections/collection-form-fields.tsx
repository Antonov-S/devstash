"use client";

import { Field, Textarea } from "@/components/items/_form-primitives";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PendingButton } from "@/components/ui/pending-button";

// Shared Name (required) + Description form body used by the create and edit
// collection dialogs. Each dialog owns its own state + action wiring and passes
// the values in; this component just renders the markup and the footer.
export function CollectionFormFields({
  idPrefix,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  pending,
  submitLabel,
  onSubmit
}: {
  idPrefix: string;
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
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

      <Field label="Description" htmlFor={`${idPrefix}-description`}>
        <Textarea
          id={`${idPrefix}-description`}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
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
        <PendingButton type="submit" pending={pending} disabled={submitDisabled}>
          {submitLabel}
        </PendingButton>
      </DialogFooter>
    </form>
  );
}
