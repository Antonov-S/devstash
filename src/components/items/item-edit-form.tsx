"use client";

import { CodeEditor } from "@/components/items/code-editor";
import { CollectionsPicker } from "@/components/items/collections-picker";
import { Field, Textarea } from "@/components/items/_form-primitives";
import { LanguageSelect } from "@/components/items/language-select";
import { MarkdownEditor } from "@/components/items/markdown-editor";
import { Input } from "@/components/ui/input";
import type { ItemDetail } from "@/lib/db/items";

export type EditState = {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
  collectionIds: string[];
};

export function detailToEditState(detail: ItemDetail): EditState {
  return {
    title: detail.title,
    description: detail.description ?? "",
    content: detail.content ?? "",
    url: detail.url ?? "",
    language: detail.language ?? "",
    tags: detail.tags.join(", "),
    collectionIds: detail.collections.map((collection) => collection.id)
  };
}

export function ItemEditForm({
  edit,
  onChange,
  disabled,
  showsContent,
  showsLanguage,
  showsMarkdown,
  showsUrl
}: {
  edit: EditState;
  onChange: (next: EditState) => void;
  disabled: boolean;
  showsContent: boolean;
  showsLanguage: boolean;
  showsMarkdown: boolean;
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

      {showsLanguage && (
        <Field label="Language" htmlFor="edit-language">
          <LanguageSelect
            id="edit-language"
            value={edit.language}
            onChange={(next) => update("language", next)}
            disabled={disabled}
          />
        </Field>
      )}

      {showsContent && (
        <Field label="Content" htmlFor="edit-content">
          {showsLanguage ? (
            <CodeEditor
              value={edit.content}
              language={edit.language}
              onChange={(next) => update("content", next)}
              ariaLabel="Edit item content"
            />
          ) : showsMarkdown ? (
            <MarkdownEditor
              value={edit.content}
              onChange={(next) => update("content", next)}
              ariaLabel="Edit item content"
            />
          ) : (
            <Textarea
              id="edit-content"
              value={edit.content}
              onChange={(e) => update("content", e.target.value)}
              disabled={disabled}
              rows={10}
              className="font-mono text-sm"
            />
          )}
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

      <Field label="Collections">
        <CollectionsPicker
          selectedIds={edit.collectionIds}
          onChange={(next) => update("collectionIds", next)}
          disabled={disabled}
        />
      </Field>
    </div>
  );
}
