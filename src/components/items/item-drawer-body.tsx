"use client";

import { Download, ExternalLink, FileIcon } from "lucide-react";

import { MoveToFolderSelect } from "@/components/folders/move-to-folder-select";
import { CodeEditor, type ExplainContext } from "@/components/items/code-editor";
import {
  MarkdownEditor,
  type OptimizeContext
} from "@/components/items/markdown-editor";
import { Badge } from "@/components/ui/badge";
import type { ItemDetail } from "@/lib/db/items";
import { formatDateLong } from "@/lib/format-date";
import { formatBytes } from "@/lib/upload-constraints";

export function ItemDrawerBody({
  detail,
  showsLanguage,
  showsMarkdown,
  onApplyOptimized,
  applyingOptimized
}: {
  detail: ItemDetail;
  showsLanguage: boolean;
  showsMarkdown: boolean;
  onApplyOptimized?: (newContent: string) => void;
  applyingOptimized?: boolean;
}) {
  const contentSectionTitle =
    detail.contentType === "FILE"
      ? "File"
      : detail.contentType === "URL"
        ? "Link"
        : "Content";

  // Folders are a file/image-only organization layer.
  const typeName = detail.itemType.name.toLowerCase();
  const isFoldered = typeName === "file" || typeName === "image";

  return (
    <div className="flex flex-col gap-6">
      {detail.description && (
        <Section title="Description">
          <p className="text-sm leading-relaxed text-foreground/90">
            {detail.description}
          </p>
        </Section>
      )}

      <Section title={contentSectionTitle}>
        <ItemContent
          detail={detail}
          showsLanguage={showsLanguage}
          showsMarkdown={showsMarkdown}
          onApplyOptimized={onApplyOptimized}
          applyingOptimized={applyingOptimized}
        />
      </Section>

      {detail.tags.length > 0 && (
        <Section title="Tags">
          <div className="flex flex-wrap gap-1.5">
            {detail.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[13px]">
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
                className="text-[13px]"
              >
                {collection.name}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {isFoldered && (
        <Section title="Folder">
          <MoveToFolderSelect
            itemId={detail.id}
            currentFolderId={detail.folderId}
          />
        </Section>
      )}

      <Section title="Details">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Created</dt>
          <dd className="text-foreground/90">{formatDateLong(detail.createdAt)}</dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="text-foreground/90">{formatDateLong(detail.updatedAt)}</dd>
          {detail.lastUsedAt && (
            <>
              <dt className="text-muted-foreground">Last used</dt>
              <dd className="text-foreground/90">
                {formatDateLong(detail.lastUsedAt)}
              </dd>
            </>
          )}
        </dl>
      </Section>
    </div>
  );
}

function ItemContent({
  detail,
  showsLanguage,
  showsMarkdown,
  onApplyOptimized,
  applyingOptimized
}: {
  detail: ItemDetail;
  showsLanguage: boolean;
  showsMarkdown: boolean;
  onApplyOptimized?: (newContent: string) => void;
  applyingOptimized?: boolean;
}) {
  if (detail.contentType === "TEXT") {
    if (!detail.content) {
      return <EmptyContent label="No content" />;
    }
    if (showsLanguage) {
      const explainTypeName = detail.itemType.name.toLowerCase();
      const explainContext: ExplainContext | undefined =
        explainTypeName === "snippet" || explainTypeName === "command"
          ? { typeName: explainTypeName, title: detail.title }
          : undefined;
      return (
        <CodeEditor
          value={detail.content}
          language={detail.language}
          readOnly
          ariaLabel="Item content"
          explainContext={explainContext}
        />
      );
    }
    if (showsMarkdown) {
      const markdownTypeName = detail.itemType.name.toLowerCase();
      const optimizeContext: OptimizeContext | undefined =
        markdownTypeName === "prompt"
          ? { typeName: "prompt", title: detail.title }
          : undefined;
      return (
        <MarkdownEditor
          value={detail.content}
          readOnly
          ariaLabel="Item content"
          optimizeContext={optimizeContext}
          onApplyOptimized={onApplyOptimized}
          applyingOptimized={applyingOptimized}
        />
      );
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

  const isImage = detail.itemType.name.toLowerCase() === "image";
  const downloadHref = `/api/files/${detail.id}`;

  if (isImage) {
    return (
      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-md border border-border/60 bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={detail.fileUrl}
            alt={detail.fileName ?? detail.title}
            className="max-h-96 w-full object-contain"
          />
        </div>
        <FileMetaRow detail={detail} downloadHref={downloadHref} />
      </div>
    );
  }

  return <FileMetaRow detail={detail} downloadHref={downloadHref} />;
}

function FileMetaRow({
  detail,
  downloadHref
}: {
  detail: ItemDetail;
  downloadHref: string;
}) {
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
        href={downloadHref}
        download={detail.fileName ?? undefined}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <Download className="size-3.5" aria-hidden />
        Download
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
      <h3 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}
