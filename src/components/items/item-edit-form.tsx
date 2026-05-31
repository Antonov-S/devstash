"use client";

import {
  ItemFormFields,
  type ItemFormValue
} from "@/components/items/item-form-fields";
import type { ItemDetail } from "@/lib/db/items";

export type EditState = ItemFormValue;

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
  showsUrl,
  typeName,
  fileName
}: {
  edit: EditState;
  onChange: (next: EditState) => void;
  disabled: boolean;
  showsContent: boolean;
  showsLanguage: boolean;
  showsMarkdown: boolean;
  showsUrl: boolean;
  typeName: string;
  fileName?: string | null;
}) {
  return (
    <ItemFormFields
      value={edit}
      onChange={onChange}
      disabled={disabled}
      showsContent={showsContent}
      showsLanguage={showsLanguage}
      showsMarkdown={showsMarkdown}
      showsUrl={showsUrl}
      typeName={typeName}
      fileName={fileName}
      idPrefix="edit"
      editorAriaLabel="Edit item content"
      showCollections={false}
    />
  );
}
