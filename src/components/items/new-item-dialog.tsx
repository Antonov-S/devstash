"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Code,
  FileIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Sparkles,
  StickyNote,
  Terminal
} from "lucide-react";
import { toast } from "sonner";

import { createItemAction, type CreateItemType } from "@/actions/items";
import { FileUpload, type UploadedFile } from "@/components/items/file-upload";
import { Field } from "@/components/items/_form-primitives";
import {
  ItemFormFields,
  type ItemFormValue
} from "@/components/items/item-form-fields";
import { Button } from "@/components/ui/button";
import { PendingButton } from "@/components/ui/pending-button";
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
import { Label } from "@/components/ui/label";
import {
  ITEM_TYPES_WITH_CONTENT,
  ITEM_TYPES_WITH_LANGUAGE,
  ITEM_TYPES_WITH_MARKDOWN,
  ITEM_TYPES_WITH_UPLOAD
} from "@/lib/constants";
import { toastActionError } from "@/lib/toast-error";
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

const DEFAULT_TYPE: CreateItemType = "snippet";

const EMPTY_FORM: ItemFormValue = {
  title: "",
  description: "",
  content: "",
  url: "",
  language: "",
  tags: "",
  collectionIds: []
};

type NewItemDialogProps = {
  initialType?: CreateItemType;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function NewItemDialog({
  initialType,
  trigger,
  open: openProp,
  onOpenChange
}: NewItemDialogProps = {}) {
  const router = useRouter();
  const baseType = initialType ?? DEFAULT_TYPE;
  const controlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ? openProp : internalOpen;
  const setOpen = controlled
    ? (next: boolean) => onOpenChange?.(next)
    : setInternalOpen;
  const [type, setType] = useState<CreateItemType>(baseType);
  const [form, setForm] = useState<ItemFormValue>(EMPTY_FORM);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [pending, startTransition] = useTransition();

  const showsContent = ITEM_TYPES_WITH_CONTENT.has(type);
  const showsLanguage = ITEM_TYPES_WITH_LANGUAGE.has(type);
  const showsUrl = type === "link";
  const showsUpload = ITEM_TYPES_WITH_UPLOAD.has(type);

  const titleEmpty = form.title.trim() === "";
  const urlMissing = showsUrl && form.url.trim() === "";
  const uploadMissing = showsUpload && uploaded === null;
  const submitDisabled = pending || titleEmpty || urlMissing || uploadMissing;

  function resetForm() {
    setType(baseType);
    setForm(EMPTY_FORM);
    setUploaded(null);
  }

  function handleTypeChange(next: CreateItemType) {
    setType(next);
    if (!ITEM_TYPES_WITH_UPLOAD.has(next)) {
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
      title: form.title,
      description: form.description,
      content: showsContent ? form.content : null,
      url: showsUrl ? form.url : null,
      language: showsLanguage ? form.language : null,
      fileUrl: showsUpload ? uploaded?.fileUrl ?? null : null,
      fileName: showsUpload ? uploaded?.fileName ?? null : null,
      fileSize: showsUpload ? uploaded?.fileSize ?? null : null,
      tags: parseTags(form.tags),
      collectionIds: form.collectionIds
    };

    startTransition(async () => {
      const result = await createItemAction(payload);
      if (!result.success) {
        // Add an Upgrade CTA when the error is a Pro-gated rejection (capacity
        // limit or Pro-only item type). Heuristic matches the action's error
        // strings; see PRO_ONLY_ITEM_TYPES + checkItemCapacity in src/lib/billing.ts.
        toastActionError(result.error, () => router.push("/settings#billing"));
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
      {!controlled && <DialogTrigger render={triggerNode} />}
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

          <ItemFormFields
            value={form}
            onChange={setForm}
            disabled={pending}
            showsContent={showsContent}
            showsLanguage={showsLanguage}
            showsMarkdown={ITEM_TYPES_WITH_MARKDOWN.has(type)}
            showsUrl={showsUrl}
            typeName={type}
            fileName={showsUpload ? uploaded?.fileName ?? null : null}
            idPrefix="new"
            titleAutoFocus
            urlRequired
            descriptionRows={2}
            contentRows={6}
            editorAriaLabel="New item content"
            extraFields={
              showsUpload ? (
                <Field label={type === "image" ? "Image" : "File"} required>
                  <FileUpload
                    kind={type === "image" ? "image" : "file"}
                    value={uploaded}
                    onChange={setUploaded}
                    disabled={pending}
                  />
                </Field>
              ) : undefined
            }
          />

          <DialogFooter className="pt-2">
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={pending}>
                  Cancel
                </Button>
              }
            />
            <PendingButton
              type="submit"
              pending={pending}
              disabled={submitDisabled}
            >
              Create
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
