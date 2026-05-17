"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Code,
  FileIcon,
  Image as ImageIcon,
  LoaderCircle,
  Link as LinkIcon,
  Plus,
  Sparkles,
  StickyNote,
  Terminal
} from "lucide-react";
import { toast } from "sonner";

import { createItemAction, type CreateItemType } from "@/actions/items";
import { CodeEditor } from "@/components/items/code-editor";
import { FileUpload, type UploadedFile } from "@/components/items/file-upload";
import { MarkdownEditor } from "@/components/items/markdown-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, parseTags } from "@/lib/utils";

type TypeOption = {
  value: CreateItemType;
  label: string;
  Icon: typeof Code;
  color: string;
};

const TYPE_OPTIONS: TypeOption[] = [
  { value: "snippet", label: "Snippet", Icon: Code, color: "#3b82f6" },
  { value: "prompt", label: "Prompt", Icon: Sparkles, color: "#8b5cf6" },
  { value: "command", label: "Command", Icon: Terminal, color: "#f97316" },
  { value: "note", label: "Note", Icon: StickyNote, color: "#fde047" },
  { value: "file", label: "File", Icon: FileIcon, color: "#6b7280" },
  { value: "image", label: "Image", Icon: ImageIcon, color: "#ec4899" },
  { value: "link", label: "Link", Icon: LinkIcon, color: "#10b981" }
];

const TYPES_WITH_CONTENT = new Set<CreateItemType>([
  "snippet",
  "prompt",
  "command",
  "note"
]);
const TYPES_WITH_LANGUAGE = new Set<CreateItemType>(["snippet", "command"]);
const TYPES_WITH_MARKDOWN = new Set<CreateItemType>(["note", "prompt"]);
const TYPES_WITH_UPLOAD = new Set<CreateItemType>(["file", "image"]);

const DEFAULT_TYPE: CreateItemType = "snippet";

type NewItemDialogProps = {
  initialType?: CreateItemType;
  trigger?: React.ReactElement;
};

export function NewItemDialog({
  initialType,
  trigger
}: NewItemDialogProps = {}) {
  const router = useRouter();
  const baseType = initialType ?? DEFAULT_TYPE;
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<CreateItemType>(baseType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("");
  const [tags, setTags] = useState("");
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [pending, startTransition] = useTransition();

  const showsContent = TYPES_WITH_CONTENT.has(type);
  const showsLanguage = TYPES_WITH_LANGUAGE.has(type);
  const showsUrl = type === "link";
  const showsUpload = TYPES_WITH_UPLOAD.has(type);

  const titleEmpty = title.trim() === "";
  const urlMissing = showsUrl && url.trim() === "";
  const uploadMissing = showsUpload && uploaded === null;
  const submitDisabled = pending || titleEmpty || urlMissing || uploadMissing;

  function resetForm() {
    setType(baseType);
    setTitle("");
    setDescription("");
    setContent("");
    setUrl("");
    setLanguage("");
    setTags("");
    setUploaded(null);
  }

  function handleTypeChange(next: CreateItemType) {
    setType(next);
    if (!TYPES_WITH_UPLOAD.has(next)) {
      setUploaded(null);
    }
  }

  function handleOpenChange(next: boolean) {
    if (pending) return;
    if (!next) resetForm();
    setOpen(next);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitDisabled) return;

    const payload = {
      type,
      title,
      description,
      content: showsContent ? content : null,
      url: showsUrl ? url : null,
      language: showsLanguage ? language : null,
      fileUrl: showsUpload ? uploaded?.fileUrl ?? null : null,
      fileName: showsUpload ? uploaded?.fileName ?? null : null,
      fileSize: showsUpload ? uploaded?.fileSize ?? null : null,
      tags: parseTags(tags)
    };

    startTransition(async () => {
      const result = await createItemAction(payload);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Item created");
      resetForm();
      setOpen(false);
      router.refresh();
    });
  }

  const triggerNode = trigger ?? (
    <Button size="sm" aria-label="New Item" title="New Item">
      <Plus className="size-4" />
      <span className="hidden md:inline">New Item</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={triggerNode} />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>
            Add a snippet, prompt, command, note, file, image, or link to your
            stash.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          aria-busy={pending}
        >
          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <div
              role="radiogroup"
              aria-label="Item type"
              className="grid grid-cols-7 gap-1 rounded-lg border border-border/60 bg-muted/30 p-1"
            >
              {TYPE_OPTIONS.map((option) => {
                const selected = type === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => handleTypeChange(option.value)}
                    disabled={pending}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 rounded-md px-2 py-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50",
                      selected
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <option.Icon
                      className="size-4"
                      style={{ color: selected ? option.color : undefined }}
                      aria-hidden
                    />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Title" htmlFor="new-title" required>
            <Input
              id="new-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={pending}
              aria-invalid={titleEmpty ? true : undefined}
              autoFocus
              required
            />
          </Field>

          <Field label="Description" htmlFor="new-description">
            <Textarea
              id="new-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
              rows={2}
            />
          </Field>

          {showsContent && (
            <Field label="Content" htmlFor="new-content">
              {showsLanguage ? (
                <CodeEditor
                  value={content}
                  language={language}
                  onChange={setContent}
                  ariaLabel="New item content"
                />
              ) : TYPES_WITH_MARKDOWN.has(type) ? (
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                  ariaLabel="New item content"
                />
              ) : (
                <Textarea
                  id="new-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={pending}
                  rows={6}
                  className="font-mono text-sm"
                />
              )}
            </Field>
          )}

          {showsLanguage && (
            <Field label="Language" htmlFor="new-language">
              <Input
                id="new-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={pending}
                placeholder="e.g. typescript"
              />
            </Field>
          )}

          {showsUrl && (
            <Field label="URL" htmlFor="new-url" required>
              <Input
                id="new-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={pending}
                placeholder="https://example.com"
                aria-invalid={urlMissing ? true : undefined}
                required
              />
            </Field>
          )}

          {showsUpload && (
            <Field label={type === "image" ? "Image" : "File"} required>
              <FileUpload
                kind={type === "image" ? "image" : "file"}
                value={uploaded}
                onChange={setUploaded}
                disabled={pending}
              />
            </Field>
          )}

          <Field label="Tags" htmlFor="new-tags" hint="Comma-separated">
            <Input
              id="new-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={pending}
              placeholder="react, hooks, auth"
            />
          </Field>

          <DialogFooter className="pt-2">
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={pending}>
                  Cancel
                </Button>
              }
            />
            <Button type="submit" disabled={submitDisabled}>
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
  htmlFor?: string;
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
