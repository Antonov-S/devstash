"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  deleteItemAction,
  setItemFavoriteAction,
  setItemPinnedAction,
  updateItemAction
} from "@/actions/items";
import { DeleteItemDialog } from "@/components/items/delete-item-dialog";
import { ItemDrawerBody } from "@/components/items/item-drawer-body";
import { ItemDrawerSkeleton } from "@/components/items/item-drawer-skeleton";
import {
  EditActionBar,
  ViewActionBar
} from "@/components/items/item-drawer-action-bars";
import {
  detailToEditState,
  ItemEditForm,
  type EditState
} from "@/components/items/item-edit-form";
import { Badge } from "@/components/ui/badge";
import { FormError } from "@/components/ui/form-error";
import { useOptimisticToggle } from "@/hooks/use-optimistic-toggle";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  ITEM_TYPES_WITH_CONTENT,
  ITEM_TYPES_WITH_LANGUAGE,
  ITEM_TYPES_WITH_MARKDOWN
} from "@/lib/constants";
import type { ItemDetail, ItemWithMeta } from "@/lib/db/items";
import { iconMap } from "@/lib/icons";
import { parseTags } from "@/lib/utils";

type Props = {
  cardItem: ItemWithMeta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ItemDrawer({ cardItem, open, onOpenChange }: Props) {
  const router = useRouter();
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, startSaving] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, startDeleting] = useTransition();
  const {
    value: isFavorite,
    pending: favoritePending,
    toggle: handleToggleFavorite
  } = useOptimisticToggle({
    initial: cardItem.isFavorite,
    action: (next) => setItemFavoriteAction(cardItem.id, next)
  });
  const {
    value: isPinned,
    pending: pinPending,
    toggle: handleTogglePin
  } = useOptimisticToggle({
    initial: cardItem.isPinned,
    action: (next) => setItemPinnedAction(cardItem.id, next)
  });
  const [applyingOptimized, startApplyingOptimized] = useTransition();

  useEffect(() => {
    if (!open || detail) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/items/${cardItem.id}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error ?? "Failed to load item");
        }
        return res.json() as Promise<ItemDetail>;
      })
      .then((data) => setDetail(data))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load item");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [open, detail, cardItem.id]);

  useEffect(() => {
    if (!open) {
      setMode("view");
      setEdit(null);
    }
  }, [open]);

  const Icon = iconMap[cardItem.itemType.icon] ?? null;
  const typeName = (detail?.itemType.name ?? cardItem.itemType.name).toLowerCase();
  const showsContent = ITEM_TYPES_WITH_CONTENT.has(typeName);
  const showsLanguage = ITEM_TYPES_WITH_LANGUAGE.has(typeName);
  const showsMarkdown = ITEM_TYPES_WITH_MARKDOWN.has(typeName);
  const showsUrl = typeName === "link";

  async function handleCopy() {
    const text =
      detail?.content ?? detail?.url ?? detail?.fileUrl ?? cardItem.title;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  function handleStartEdit() {
    if (!detail) return;
    setEdit(detailToEditState(detail));
    setMode("edit");
  }

  function handleCancelEdit() {
    setMode("view");
    setEdit(null);
  }

  function handleSave() {
    if (!detail || !edit) return;
    const payload = {
      title: edit.title,
      description: edit.description,
      content: showsContent ? edit.content : null,
      url: showsUrl ? edit.url : null,
      language: showsLanguage ? edit.language : null,
      tags: parseTags(edit.tags),
      collectionIds: edit.collectionIds
    };

    startSaving(async () => {
      const result = await updateItemAction(detail.id, payload);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setDetail(result.data);
      setMode("view");
      setEdit(null);
      toast.success("Item updated");
      router.refresh();
    });
  }

  function handleApplyOptimized(newContent: string) {
    if (!detail) return;
    startApplyingOptimized(async () => {
      const result = await updateItemAction(detail.id, {
        title: detail.title,
        description: detail.description,
        content: newContent,
        url: detail.url,
        language: detail.language,
        tags: detail.tags,
        collectionIds: detail.collections.map((c) => c.id)
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setDetail(result.data);
      toast.success("Prompt updated");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!detail) return;
    startDeleting(async () => {
      const result = await deleteItemAction(detail.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setDeleteOpen(false);
      onOpenChange(false);
      toast.success("Item deleted");
      router.refresh();
    });
  }

  const editTitleEmpty =
    mode === "edit" && edit !== null && edit.title.trim() === "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[max(36rem,40vw)]">
        <SheetHeader className="gap-4 border-b border-border/60 px-6 py-5">
          <div className="flex items-start gap-3 pr-8">
            {Icon && (
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/50"
                aria-hidden
              >
                <Icon
                  className="size-4"
                  style={{ color: cardItem.itemType.color }}
                />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-lg">
                {detail?.title ?? cardItem.title}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Item details
              </SheetDescription>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="text-[11px] capitalize"
                  style={{
                    borderColor: cardItem.itemType.color,
                    color: cardItem.itemType.color
                  }}
                >
                  {cardItem.itemType.name}
                </Badge>
                {(detail?.language ?? cardItem.language) && (
                  <Badge variant="secondary" className="text-[11px]">
                    {detail?.language ?? cardItem.language}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {mode === "view" ? (
            <ViewActionBar
              isFavorite={isFavorite}
              favoritePending={favoritePending}
              onToggleFavorite={handleToggleFavorite}
              isPinned={isPinned}
              pinPending={pinPending}
              onTogglePin={handleTogglePin}
              disabled={loading || !detail}
              onCopy={handleCopy}
              onEdit={handleStartEdit}
              onDelete={() => setDeleteOpen(true)}
            />
          ) : (
            <EditActionBar
              saving={saving}
              saveDisabled={editTitleEmpty || saving}
              onCancel={handleCancelEdit}
              onSave={handleSave}
            />
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading && !detail ? (
            <ItemDrawerSkeleton />
          ) : error ? (
            <FormError>{error}</FormError>
          ) : detail && mode === "edit" && edit ? (
            <ItemEditForm
              edit={edit}
              onChange={setEdit}
              disabled={saving}
              showsContent={showsContent}
              showsLanguage={showsLanguage}
              showsMarkdown={showsMarkdown}
              showsUrl={showsUrl}
              typeName={typeName}
              fileName={detail.fileName}
            />
          ) : detail ? (
            <ItemDrawerBody
              detail={detail}
              showsLanguage={showsLanguage}
              showsMarkdown={showsMarkdown}
              onApplyOptimized={handleApplyOptimized}
              applyingOptimized={applyingOptimized}
            />
          ) : null}
        </div>

        <DeleteItemDialog
          open={deleteOpen}
          onOpenChange={(next) => {
            if (deleting) return;
            setDeleteOpen(next);
          }}
          title={detail?.title ?? cardItem.title}
          deleting={deleting}
          onConfirm={handleDelete}
        />
      </SheetContent>
    </Sheet>
  );
}
