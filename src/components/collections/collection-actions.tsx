"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteCollectionAction } from "@/actions/collections";
import { DeleteCollectionDialog } from "@/components/collections/delete-collection-dialog";
import { EditCollectionDialog } from "@/components/collections/edit-collection-dialog";
import { Button } from "@/components/ui/button";

type CollectionActionsProps = {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
};

export function CollectionActions({ collection }: CollectionActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, startDeleting] = useTransition();

  function handleDeleteConfirm() {
    startDeleting(async () => {
      const result = await deleteCollectionAction(collection.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Collection deleted");
      router.push("/collections");
    });
  }

  function handleFavoriteStub() {
    toast.info("Favorites coming soon");
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            collection.isFavorite ? "Remove from favorites" : "Add to favorites"
          }
          title="Favorite"
          onClick={handleFavoriteStub}
        >
          <Star
            className={
              collection.isFavorite
                ? "size-4 fill-yellow-400 text-yellow-400"
                : "size-4"
            }
            aria-hidden
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit collection"
          title="Edit"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="size-4" aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete collection"
          title="Delete"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
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
