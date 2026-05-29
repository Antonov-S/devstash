"use client";

import { Star } from "lucide-react";

import { setItemFavoriteAction } from "@/actions/items";
import { useOptimisticToggle } from "@/hooks/use-optimistic-toggle";
import { cn } from "@/lib/utils";

import { quickActionButtonClass } from "./quick-action-button";

type Props = {
  itemId: string;
  initialFavorite: boolean;
  label: string;
  className?: string;
};

export function QuickFavoriteButton({
  itemId,
  initialFavorite,
  label,
  className
}: Props) {
  const {
    value: isFavorite,
    pending,
    toggle
  } = useOptimisticToggle({
    initial: initialFavorite,
    action: (next) => setItemFavoriteAction(itemId, next)
  });

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    event.preventDefault();
    toggle();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        isFavorite ? `Remove ${label} from favorites` : `Add ${label} to favorites`
      }
      aria-pressed={isFavorite}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      disabled={pending}
      className={cn(
        quickActionButtonClass,
        "disabled:cursor-not-allowed",
        className
      )}
    >
      <Star
        className={cn(
          "size-3.5",
          isFavorite && "fill-yellow-400 text-yellow-400"
        )}
        aria-hidden
      />
    </button>
  );
}
