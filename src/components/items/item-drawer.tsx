"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  ExternalLink,
  FileIcon,
  LoaderCircle,
  Pencil,
  Pin,
  Star,
  Trash2,
  X
} from "lucide-react";
import { toast } from "sonner";

import { deleteItemAction, updateItemAction } from "@/actions/items";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { ItemDetail, ItemWithMeta } from "@/lib/db/items";
import { iconMap } from "@/lib/icons";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric"
});

function formatDate(value: Date | string): string {
  return dateFormatter.format(value instanceof Date ? value : new Date(value));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TYPES_WITH_CONTENT = new Set(["snippet", "prompt", "command", "note"]);
const TYPES_WITH_LANGUAGE = new Set(["snippet", "command"]);

type EditState = {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
};

function detailToEditState(detail: ItemDetail): EditState {
  return {
    title: detail.title,
    description: detail.description ?? "",
    content: detail.content ?? "",
    url: detail.url ?? "",
    language: detail.language ?? "",
    tags: detail.tags.join(", ")
  };
}

function parseTags(input: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of input.split(",")) {
    const trimmed = part.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

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
  const showsContent = TYPES_WITH_CONTENT.has(typeName);
  const showsLanguage = TYPES_WITH_LANGUAGE.has(typeName);
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
      tags: parseTags(edit.tags)
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
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
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
              cardItem={cardItem}
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
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : detail && mode === "edit" && edit ? (
            <ItemEditForm
              edit={edit}
              onChange={setEdit}
              disabled={saving}
              showsContent={showsContent}
              showsLanguage={showsLanguage}
              showsUrl={showsUrl}
            />
          ) : detail ? (
            <ItemDrawerBody detail={detail} />
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

function ViewActionBar({
  cardItem,
  disabled,
  onCopy,
  onEdit,
  onDelete
}: {
  cardItem: ItemWithMeta;
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
        aria-pressed={cardItem.isFavorite}
        disabled={disabled}
      >
        <Star
          className={
            cardItem.isFavorite ? "fill-yellow-400 text-yellow-400" : undefined
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

function DeleteItemDialog({
  open,
  onOpenChange,
  title,
  deleting,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  deleting: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{title}&rdquo;?</DialogTitle>
          <DialogDescription>
            This permanently deletes the item and removes it from any
            collections. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <DialogClose
            render={
              <Button type="button" variant="outline" disabled={deleting}>
                Cancel
              </Button>
            }
          />
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 aria-hidden />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditActionBar({
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
      <Button size="sm" onClick={onSave} disabled={saveDisabled}>
        {saving ? (
          <LoaderCircle className="animate-spin" aria-hidden />
        ) : (
          <Check aria-hidden />
        )}
        Save
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
        <X aria-hidden />
        Cancel
      </Button>
    </div>
  );
}

function ItemEditForm({
  edit,
  onChange,
  disabled,
  showsContent,
  showsLanguage,
  showsUrl
}: {
  edit: EditState;
  onChange: (next: EditState) => void;
  disabled: boolean;
  showsContent: boolean;
  showsLanguage: boolean;
  showsUrl: boolean;
}) {
  function update<K extends keyof EditState>(key: K, value: EditState[K]) {
    onChange({ ...edit, [key]: value });
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Title" htmlFor="edit-title" required>
        <Input
          id="edit-title"
          value={edit.title}
          onChange={(e) => update("title", e.target.value)}
          disabled={disabled}
          aria-invalid={edit.title.trim() === "" ? true : undefined}
          required
        />
      </Field>

      <Field label="Description" htmlFor="edit-description">
        <Textarea
          id="edit-description"
          value={edit.description}
          onChange={(e) => update("description", e.target.value)}
          disabled={disabled}
          rows={3}
        />
      </Field>

      {showsContent && (
        <Field label="Content" htmlFor="edit-content">
          <Textarea
            id="edit-content"
            value={edit.content}
            onChange={(e) => update("content", e.target.value)}
            disabled={disabled}
            rows={10}
            className="font-mono text-sm"
          />
        </Field>
      )}

      {showsLanguage && (
        <Field label="Language" htmlFor="edit-language">
          <Input
            id="edit-language"
            value={edit.language}
            onChange={(e) => update("language", e.target.value)}
            disabled={disabled}
            placeholder="e.g. typescript"
          />
        </Field>
      )}

      {showsUrl && (
        <Field label="URL" htmlFor="edit-url">
          <Input
            id="edit-url"
            type="url"
            value={edit.url}
            onChange={(e) => update("url", e.target.value)}
            disabled={disabled}
            placeholder="https://example.com"
          />
        </Field>
      )}

      <Field label="Tags" htmlFor="edit-tags" hint="Comma-separated">
        <Input
          id="edit-tags"
          value={edit.tags}
          onChange={(e) => update("tags", e.target.value)}
          disabled={disabled}
          placeholder="react, hooks, auth"
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-16 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  );
}

function ItemDrawerBody({ detail }: { detail: ItemDetail }) {
  return (
    <div className="flex flex-col gap-6">
      {detail.description && (
        <Section title="Description">
          <p className="text-sm leading-relaxed text-foreground/90">
            {detail.description}
          </p>
        </Section>
      )}

      <Section title="Content">
        <ItemContent detail={detail} />
      </Section>

      {detail.tags.length > 0 && (
        <Section title="Tags">
          <div className="flex flex-wrap gap-1.5">
            {detail.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {detail.collections.length > 0 && (
        <Section title="Collections">
          <div className="flex flex-wrap gap-1.5">
            {detail.collections.map((collection) => (
              <Badge
                key={collection.id}
                variant="outline"
                className="text-xs"
              >
                {collection.name}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      <Section title="Details">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Created</dt>
          <dd className="text-foreground/90">{formatDate(detail.createdAt)}</dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="text-foreground/90">{formatDate(detail.updatedAt)}</dd>
          {detail.lastUsedAt && (
            <>
              <dt className="text-muted-foreground">Last used</dt>
              <dd className="text-foreground/90">
                {formatDate(detail.lastUsedAt)}
              </dd>
            </>
          )}
        </dl>
      </Section>
    </div>
  );
}

function ItemContent({ detail }: { detail: ItemDetail }) {
  if (detail.contentType === "TEXT") {
    if (!detail.content) {
      return <EmptyContent label="No content" />;
    }
    return (
      <pre className="overflow-x-auto rounded-md border border-border/60 bg-muted/40 p-4 text-sm leading-relaxed">
        <code>{detail.content}</code>
      </pre>
    );
  }

  if (detail.contentType === "URL") {
    if (!detail.url) {
      return <EmptyContent label="No URL" />;
    }
    return (
      <a
        href={detail.url}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1.5 break-all rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-primary hover:underline"
      >
        <ExternalLink className="size-3.5 shrink-0" aria-hidden />
        {detail.url}
      </a>
    );
  }

  // FILE
  if (!detail.fileUrl) {
    return <EmptyContent label="No file" />;
  }
  return (
    <div className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/40 p-3">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background"
        aria-hidden
      >
        <FileIcon className="size-4 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {detail.fileName ?? "File"}
        </p>
        {detail.fileSize !== null && (
          <p className="text-sm text-muted-foreground">
            {formatBytes(detail.fileSize)}
          </p>
        )}
      </div>
      <a
        href={detail.fileUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="text-sm text-primary hover:underline"
      >
        Open
      </a>
    </div>
  );
}

function EmptyContent({ label }: { label: string }) {
  return (
    <p className="rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
      {label}
    </p>
  );
}

function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ItemDrawerSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy aria-live="polite">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
        Loading…
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-10" />
        </div>
      </div>
    </div>
  );
}
