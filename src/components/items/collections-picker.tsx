"use client";

import { Check } from "lucide-react";

import { useUserCollections } from "@/components/items/collections-context";
import { cn } from "@/lib/utils";

export function CollectionsPicker({
  selectedIds,
  onChange,
  disabled
}: {
  selectedIds: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const collections = useUserCollections();

  if (collections.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
        No collections yet. Create one from the top bar to start grouping items.
      </p>
    );
  }

  const selectedSet = new Set(selectedIds);

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((existing) => existing !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div
      role="group"
      aria-label="Collections"
      className="flex flex-wrap gap-1.5"
    >
      {collections.map((collection) => {
        const selected = selectedSet.has(collection.id);
        return (
          <button
            key={collection.id}
            type="button"
            role="checkbox"
            aria-checked={selected}
            onClick={() => toggle(collection.id)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-4xl border px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {selected && <Check className="size-3" aria-hidden />}
            <span className="max-w-[16rem] truncate">{collection.name}</span>
          </button>
        );
      })}
    </div>
  );
}
