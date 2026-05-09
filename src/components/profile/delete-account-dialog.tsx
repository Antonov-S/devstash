"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccountAction } from "@/actions/account";

const CONFIRM_PHRASE = "DELETE";

export function DeleteAccountDialog({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isValid = confirm === CONFIRM_PHRASE;

  function reset() {
    setConfirm("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    setOpen(next);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result?.error) {
        setError(result.error);
      }
      // Success: signOut() inside the action redirects to "/", so no further
      // client-side navigation is required.
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <Trash2 aria-hidden />
            Delete account
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>
            This permanently deletes <strong>{email}</strong> along with all of
            your items, collections, and tags. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          aria-busy={isPending}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm">
              Type <span className="font-mono font-semibold">{CONFIRM_PHRASE}</span>{" "}
              to confirm
            </Label>
            <Input
              id="confirm"
              name="confirm"
              autoComplete="off"
              autoCapitalize="characters"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder={CONFIRM_PHRASE}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter className="pt-2">
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              }
            />
            <Button
              type="submit"
              variant="destructive"
              disabled={!isValid || isPending}
            >
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : null}
              Delete account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
