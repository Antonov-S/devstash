"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Copy,
  ExternalLink,
  FileIcon,
  LoaderCircle,
  Pencil,
  Pin,
  Star,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { ItemDetail } from "@/lib/db/items";
import type { ItemWithMeta } from "@/lib/db/items";
import { iconMap } from "@/lib/icons";

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

type Props = {
  cardItem: ItemWithMeta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ItemDrawer({ cardItem, open, onOpenChange }: Props) {
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const Icon = iconMap[cardItem.itemType.icon] ?? null;

  const handleCopy = useCallback(async () => {
    const text =
      detail?.content ?? detail?.url ?? detail?.fileUrl ?? cardItem.title;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, [detail, cardItem.title]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="gap-3 border-b border-border/60 px-5 py-4">
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
              <SheetTitle className="truncate text-base">
                {cardItem.title}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Item details
              </SheetDescription>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <Badge
                  variant="outline"
                  className="text-[10px] capitalize"
                  style={{
                    borderColor: cardItem.itemType.color,
                    color: cardItem.itemType.color
                  }}
                >
                  {cardItem.itemType.name}
                </Badge>
                {(detail?.language ?? cardItem.language) && (
                  <Badge variant="secondary" className="text-[10px]">
                    {detail?.language ?? cardItem.language}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={cardItem.isFavorite}
              disabled={loading || !detail}
            >
              <Star
                className={
                  cardItem.isFavorite
                    ? "fill-yellow-400 text-yellow-400"
                    : undefined
                }
                aria-hidden
              />
              Favorite
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={cardItem.isPinned}
              disabled={loading || !detail}
            >
              <Pin aria-hidden />
              Pin
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={loading || !detail}
            >
              <Copy aria-hidden />
              Copy
            </Button>
            <span className="flex-1" />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Edit"
              disabled={loading || !detail}
            >
              <Pencil aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete"
              disabled={loading || !detail}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading && !detail ? (
            <ItemDrawerSkeleton />
          ) : error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : detail ? (
            <ItemDrawerBody detail={detail} />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ItemDrawerBody({ detail }: { detail: ItemDetail }) {
  return (
    <div className="flex flex-col gap-5">
      {detail.description && (
        <Section title="Description">
          <p className="text-sm text-foreground/90">{detail.description}</p>
        </Section>
      )}

      <Section title="Content">
        <ItemContent detail={detail} />
      </Section>

      {detail.tags.length > 0 && (
        <Section title="Tags">
          <div className="flex flex-wrap gap-1">
            {detail.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[11px]">
                {tag}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {detail.collections.length > 0 && (
        <Section title="Collections">
          <div className="flex flex-wrap gap-1">
            {detail.collections.map((collection) => (
              <Badge
                key={collection.id}
                variant="outline"
                className="text-[11px]"
              >
                {collection.name}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      <Section title="Details">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
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
      <pre className="overflow-x-auto rounded-md border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed">
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
          <p className="text-xs text-muted-foreground">
            {formatBytes(detail.fileSize)}
          </p>
        )}
      </div>
      <a
        href={detail.fileUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="text-xs text-primary hover:underline"
      >
        Open
      </a>
    </div>
  );
}

function EmptyContent({ label }: { label: string }) {
  return (
    <p className="rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
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
