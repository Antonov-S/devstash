"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { moveItemToFolderAction } from "@/actions/folders";
import { useUserFolders } from "@/components/folders/folders-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Sentinel for the "No folder" option — base-ui Select values are strings, so
// null can't be a value directly.
const NO_FOLDER = "__none__";

type Props = {
  itemId: string;
  currentFolderId: string | null;
};

export function MoveToFolderSelect({ itemId, currentFolderId }: Props) {
  const router = useRouter();
  const folders = useUserFolders();
  const [value, setValue] = useState(currentFolderId ?? NO_FOLDER);
  const [pending, startTransition] = useTransition();

  // Re-sync from props after a parent refresh.
  useEffect(() => {
    setValue(currentFolderId ?? NO_FOLDER);
  }, [currentFolderId]);

  const labelByValue: Record<string, string> = {
    [NO_FOLDER]: "No folder",
    ...Object.fromEntries(folders.map((f) => [f.id, f.name]))
  };

  function handleChange(next: string) {
    if (next === value) return;
    const previous = value;
    const folderId = next === NO_FOLDER ? null : next;
    setValue(next);

    startTransition(async () => {
      const result = await moveItemToFolderAction(itemId, folderId);
      if (!result.success) {
        setValue(previous);
        toast.error(result.error);
        return;
      }
      toast.success(
        folderId === null
          ? "Removed from folder"
          : `Moved to ${labelByValue[next] ?? "folder"}`
      );
      router.refresh();
    });
  }

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (typeof next === "string") handleChange(next);
      }}
    >
      <SelectTrigger id="move-to-folder" disabled={pending} className="w-full">
        <SelectValue>
          {(v) => labelByValue[v as string] ?? "No folder"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_FOLDER}>No folder</SelectItem>
        {folders.map((folder) => (
          <SelectItem key={folder.id} value={folder.id}>
            {folder.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
