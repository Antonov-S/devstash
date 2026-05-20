"use client";

import { Star } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setItemFavoriteAction } from "@/actions/items";
import { cn } from "@/lib/utils";

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
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [itemId, initialFavorite]);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    event.preventDefault();
    const next = !isFavorite;
    const previous = isFavorite;
    setIsFavorite(next);
    startTransition(async () => {
      const result = await setItemFavoriteAction(itemId, next);
      if (!result.success) {
        setIsFavorite(previous);
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
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
        "inline-flex size-7 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed",
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
