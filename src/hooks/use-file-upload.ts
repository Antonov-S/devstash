"use client";

import { useEffect, useRef, useState } from "react";

import { validateUpload, type UploadKind } from "@/lib/upload-constraints";

export type UploadedFile = {
  fileUrl: string;
  fileName: string;
  fileSize: number;
};

export type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number; fileName: string }
  | { status: "error"; error: string };

// Owns the drag/drop + XHR-upload lifecycle for FileUpload: client-side
// validation, object-URL preview, progress tracking, abort-on-unmount/remove.
// The component consumes the returned state + handlers and renders the dropzone.
export function useFileUpload({
  kind,
  onChange,
  disabled
}: {
  kind: UploadKind;
  onChange: (file: UploadedFile | null) => void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      xhrRef.current?.abort();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function startUpload(file: File) {
    const validation = validateUpload(kind, {
      name: file.name,
      size: file.size,
      type: file.type
    });
    if (!validation.ok) {
      setState({ status: "error", error: validation.error });
      return;
    }

    if (kind === "image") {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return objectUrl;
      });
    } else {
      setPreviewUrl(null);
    }

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    setState({ status: "uploading", progress: 0, fileName: file.name });

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.round((event.loaded / event.total) * 100);
      setState({ status: "uploading", progress, fileName: file.name });
    });

    xhr.addEventListener("load", () => {
      xhrRef.current = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as UploadedFile;
          setState({ status: "idle" });
          onChange({
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileSize: data.fileSize
          });
        } catch {
          setState({ status: "error", error: "Invalid server response." });
        }
        return;
      }
      let message = "Upload failed.";
      try {
        const body = JSON.parse(xhr.responseText) as { error?: string };
        if (body?.error) message = body.error;
      } catch {
        // ignore
      }
      setState({ status: "error", error: message });
    });

    xhr.addEventListener("error", () => {
      xhrRef.current = null;
      setState({ status: "error", error: "Upload failed." });
    });

    xhr.addEventListener("abort", () => {
      xhrRef.current = null;
    });

    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) startUpload(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = event.dataTransfer.files[0];
    if (file) startUpload(file);
  }

  function handleRemove() {
    xhrRef.current?.abort();
    xhrRef.current = null;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setState({ status: "idle" });
    onChange(null);
  }

  const uploading = state.status === "uploading";
  const interactionDisabled = disabled || uploading;

  return {
    state,
    dragOver,
    setDragOver,
    previewUrl,
    inputRef,
    uploading,
    interactionDisabled,
    handleFileChange,
    handleDrop,
    handleRemove
  };
}
