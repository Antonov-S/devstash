"use client";

import { CodeEditor } from "@/components/items/code-editor";
import { CollectionsPicker } from "@/components/items/collections-picker";
import { Field, Textarea } from "@/components/items/_form-primitives";
import { GenerateDescriptionButton } from "@/components/items/generate-description-button";
import { LanguageSelect } from "@/components/items/language-select";
import { MarkdownEditor } from "@/components/items/markdown-editor";
import { SuggestTagsButton } from "@/components/items/suggest-tags-button";
import { Input } from "@/components/ui/input";
import { parseTags } from "@/lib/utils";

export type ItemFormValue = {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
  collectionIds: string[];
};

type Props = {
  value: ItemFormValue;
  onChange: (next: ItemFormValue) => void;
  disabled: boolean;
  showsContent: boolean;
  showsLanguage: boolean;
  showsMarkdown: boolean;
  showsUrl: boolean;
  /** Lowercased system type name — drives the AI button payloads. */
  typeName: string;
  /** Filename context for the AI description button (upload items). */
  fileName?: string | null;
  /** Prefix for field ids/labels so create + edit don't collide. */
  idPrefix: string;
  titleAutoFocus?: boolean;
  urlRequired?: boolean;
  descriptionRows?: number;
  contentRows?: number;
  editorAriaLabel: string;
  /** Slot rendered between the URL field and Tags (e.g. file upload on create). */
  extraFields?: React.ReactNode;
  /**
   * Whether to render the collections picker. Create keeps it (you assign
   * collections at create time); the edit form drops it because collections are
   * managed inline in the drawer's read view instead.
   */
  showCollections?: boolean;
};

/**
 * The shared field set for the new-item dialog and the item-drawer edit form:
 * Title, Description (+AI), Language, Content (code/markdown/plain), URL, an
 * optional slot, Tags (+AI), and Collections. Create-only affordances (the type
 * selector, file upload) are composed by the caller.
 */
export function ItemFormFields({
  value,
  onChange,
  disabled,
  showsContent,
  showsLanguage,
  showsMarkdown,
  showsUrl,
  typeName,
  fileName,
  idPrefix,
  titleAutoFocus = false,
  urlRequired = false,
  descriptionRows = 3,
  contentRows = 10,
  editorAriaLabel,
  extraFields,
  showCollections = true
}: Props) {
  function update<K extends keyof ItemFormValue>(
    key: K,
    next: ItemFormValue[K]
  ) {
    onChange({ ...value, [key]: next });
  }

  const titleEmpty = value.title.trim() === "";
  const urlEmpty = value.url.trim() === "";
  const aiDescriptionDisabled =
    disabled ||
    (titleEmpty &&
      value.content.trim() === "" &&
      value.url.trim() === "" &&
      (fileName ?? "").trim() === "");

  return (
    <div className="flex flex-col gap-4">
      <Field label="Title" htmlFor={`${idPrefix}-title`} required>
        <Input
          id={`${idPrefix}-title`}
          value={value.title}
          onChange={(e) => update("title", e.target.value)}
          disabled={disabled}
          aria-invalid={titleEmpty ? true : undefined}
          autoFocus={titleAutoFocus}
          required
        />
      </Field>

      <Field
        label="Description"
        htmlFor={`${idPrefix}-description`}
        action={
          <GenerateDescriptionButton
            getPayload={() => ({
              typeName,
              title: value.title,
              content: showsContent ? value.content : null,
              url: showsUrl ? value.url : null,
              language: showsLanguage ? value.language : null,
              fileName: fileName ?? null,
              tags: parseTags(value.tags)
            })}
            onResult={(next) => update("description", next)}
            disabled={aiDescriptionDisabled}
          />
        }
      >
        <Textarea
          id={`${idPrefix}-description`}
          value={value.description}
          onChange={(e) => update("description", e.target.value)}
          disabled={disabled}
          rows={descriptionRows}
        />
      </Field>

      {showsLanguage && (
        <Field label="Language" htmlFor={`${idPrefix}-language`}>
          <LanguageSelect
            id={`${idPrefix}-language`}
            value={value.language}
            onChange={(next) => update("language", next)}
            disabled={disabled}
          />
        </Field>
      )}

      {showsContent && (
        <Field label="Content" htmlFor={`${idPrefix}-content`}>
          {showsLanguage ? (
            <CodeEditor
              value={value.content}
              language={value.language}
              onChange={(next) => update("content", next)}
              ariaLabel={editorAriaLabel}
            />
          ) : showsMarkdown ? (
            <MarkdownEditor
              value={value.content}
              onChange={(next) => update("content", next)}
              ariaLabel={editorAriaLabel}
            />
          ) : (
            <Textarea
              id={`${idPrefix}-content`}
              value={value.content}
              onChange={(e) => update("content", e.target.value)}
              disabled={disabled}
              rows={contentRows}
              className="font-mono text-sm"
            />
          )}
        </Field>
      )}

      {showsUrl && (
        <Field label="URL" htmlFor={`${idPrefix}-url`} required={urlRequired}>
          <Input
            id={`${idPrefix}-url`}
            type="url"
            value={value.url}
            onChange={(e) => update("url", e.target.value)}
            disabled={disabled}
            placeholder="https://example.com"
            aria-invalid={urlRequired && urlEmpty ? true : undefined}
            required={urlRequired}
          />
        </Field>
      )}

      {extraFields}

      <Field label="Tags" htmlFor={`${idPrefix}-tags`} hint="Comma-separated">
        <Input
          id={`${idPrefix}-tags`}
          value={value.tags}
          onChange={(e) => update("tags", e.target.value)}
          disabled={disabled}
          placeholder="react, hooks, auth"
        />
        <SuggestTagsButton
          getPayload={() => ({
            title: value.title,
            content: showsContent ? value.content : null,
            description: value.description,
            language: showsLanguage ? value.language : null,
            typeName
          })}
          existingTags={parseTags(value.tags)}
          onAccept={(tag) =>
            update(
              "tags",
              value.tags.trim() === "" ? tag : `${value.tags}, ${tag}`
            )
          }
          disabled={disabled || titleEmpty}
        />
      </Field>

      {showCollections && (
        <Field label="Collections">
          <CollectionsPicker
            selectedIds={value.collectionIds}
            onChange={(next) => update("collectionIds", next)}
            disabled={disabled}
          />
        </Field>
      )}
    </div>
  );
}
