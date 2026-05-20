"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteCollectionAction,
  setCollectionFavoriteAction
} from "@/actions/collections";
import { DeleteCollectionDialog } from "@/components/collections/delete-collection-dialog";
import { EditCollectionDialog } from "@/components/collections/edit-collection-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type CollectionCardMenuProps = {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
};

export function CollectionCardMenu({ collection }: CollectionCardMenuProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, startDeleting] = useTransition();
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite);
  const [, startToggleFavorite] = useTransition();

  useEffect(() => {
    setIsFavorite(collection.isFavorite);
  }, [collection.id, collection.isFavorite]);

  function stop(event: React.SyntheticEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDeleteConfirm() {
    startDeleting(async () => {
      const result = await deleteCollectionAction(collection.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Collection deleted");
      setDeleteOpen(false);
      router.refresh();
    });
  }

  function handleToggleFavorite() {
    const next = !isFavorite;
    const previous = isFavorite;
    setIsFavorite(next);
    startToggleFavorite(async () => {
      const result = await setCollectionFavoriteAction(collection.id, next);
      if (!result.success) {
        setIsFavorite(previous);
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <div
        className="absolute top-3 right-3 z-10"
        onClick={stop}
        onMouseDown={stop}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Collection actions"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-muted data-popup-open:text-foreground"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleToggleFavorite}>
              <Star
                className={
                  isFavorite ? "fill-yellow-400 text-yellow-400" : undefined
                }
              />
              <span>{isFavorite ? "Unfavorite" : "Favorite"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditCollectionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={collection}
      />

      <DeleteCollectionDialog
        open={deleteOpen}
        onOpenChange={(next) => {
          if (deleting) return;
          setDeleteOpen(next);
        }}
        name={collection.name}
        deleting={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
