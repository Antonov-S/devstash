"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setItemCollectionsAction } from "@/actions/items";
import { CollectionsPicker } from "@/components/items/collections-picker";

export function InlineCollectionsPicker({
  itemId,
  collectionIds
}: {
  itemId: string;
  collectionIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(collectionIds);
  const [pending, startTransition] = useTransition();

  // Re-sync from props after a parent refresh (e.g. saving the edit form).
  // Collection ids are cuids (no commas), so a join key is a stable dep that
  // only changes when the underlying set actually changes — avoids clobbering
  // the optimistic value on every render the way an array dep would.
  const collectionsKey = collectionIds.join(",");
  useEffect(() => {
    setSelected(collectionsKey ? collectionsKey.split(",") : []);
  }, [collectionsKey]);

  function handleChange(next: string[]) {
    const previous = selected;
    setSelected(next);

    startTransition(async () => {
      const result = await setItemCollectionsAction(itemId, next);
      if (!result.success) {
        setSelected(previous);
        toast.error(result.error);
        return;
      }
      toast.success("Collections updated");
      router.refresh();
    });
  }

  return (
    <CollectionsPicker
      selectedIds={selected}
      onChange={handleChange}
      disabled={pending}
    />
  );
}
