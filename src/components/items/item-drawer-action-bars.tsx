"use client";

import { Check, Copy, Pencil, Pin, Star, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PendingButton } from "@/components/ui/pending-button";
import type { ItemWithMeta } from "@/lib/db/items";

export function ViewActionBar({
  cardItem,
  isFavorite,
  favoritePending,
  onToggleFavorite,
  disabled,
  onCopy,
  onEdit,
  onDelete
}: {
  cardItem: ItemWithMeta;
  isFavorite: boolean;
  favoritePending: boolean;
  onToggleFavorite: () => void;
  disabled: boolean;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={isFavorite}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        onClick={onToggleFavorite}
        disabled={disabled || favoritePending}
      >
        <Star
          className={
            isFavorite ? "fill-yellow-400 text-yellow-400" : undefined
          }
          aria-hidden
        />
        Favorite
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={cardItem.isPinned}
        disabled={disabled}
      >
        <Pin aria-hidden />
        Pin
      </Button>
      <Button variant="ghost" size="sm" onClick={onCopy} disabled={disabled}>
        <Copy aria-hidden />
        Copy
      </Button>
      <span className="flex-1" />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit"
        onClick={onEdit}
        disabled={disabled}
      >
        <Pencil aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete"
        disabled={disabled}
        onClick={onDelete}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 aria-hidden />
      </Button>
    </div>
  );
}

export function EditActionBar({
  saving,
  saveDisabled,
  onCancel,
  onSave
}: {
  saving: boolean;
  saveDisabled: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <PendingButton
        size="sm"
        onClick={onSave}
        pending={saving}
        disabled={saveDisabled}
        icon={<Check aria-hidden />}
      >
        Save
      </PendingButton>
      <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
        <X aria-hidden />
        Cancel
      </Button>
    </div>
  );
}
