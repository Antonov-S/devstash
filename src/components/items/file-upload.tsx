"use client";

import { useEffect, useRef, useState } from "react";
import {
  CloudUpload,
  FileIcon,
  Image as ImageIcon,
  LoaderCircle,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  UPLOAD_CONSTRAINTS,
  formatBytes,
  validateUpload,
  type UploadKind
} from "@/lib/upload-constraints";
import { cn } from "@/lib/utils";

export type UploadedFile = {
  fileUrl: string;
  fileName: string;
  fileSize: number;
};

type Props = {
  kind: UploadKind;
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  disabled?: boolean;
};

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number; fileName: string }
  | { status: "error"; error: string };

export function FileUpload({ kind, value, onChange, disabled }: Props) {
  const constraint = UPLOAD_CONSTRAINTS[kind];
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

  if (value && state.status !== "uploading") {
    return (
      <div className="flex flex-col gap-2">
        <UploadedPreview
          kind={kind}
          file={value}
          previewUrl={previewUrl}
          onRemove={handleRemove}
          disabled={disabled}
        />
        {state.status === "error" && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={interactionDisabled ? -1 : 0}
        aria-disabled={interactionDisabled || undefined}
        onClick={() => {
          if (!interactionDisabled) inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (interactionDisabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!interactionDisabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-8 text-center transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          dragOver && "border-primary/60 bg-primary/10",
          interactionDisabled && "cursor-not-allowed opacity-60"
        )}
      >
        {uploading ? (
          <UploadingIndicator
            progress={state.progress}
            fileName={state.fileName}
          />
        ) : (
          <>
            <span
              className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
              aria-hidden
            >
              {kind === "image" ? (
                <ImageIcon className="size-5" />
              ) : (
                <CloudUpload className="size-5" />
              )}
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">
                Drop {constraint.label.toLowerCase()} here or{" "}
                <span className="text-primary underline-offset-4 hover:underline">
                  browse
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {constraint.extensions.join(", ").toUpperCase()} · up to{" "}
                {formatBytes(constraint.maxSize)}
              </p>
            </div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={constraint.accept}
        className="hidden"
        onChange={handleFileChange}
        disabled={interactionDisabled}
      />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </div>
  );
}

function UploadingIndicator({
  progress,
  fileName
}: {
  progress: number;
  fileName: string;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <LoaderCircle className="size-5 animate-spin text-primary" aria-hidden />
      <div className="flex w-full flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="truncate text-foreground/90">{fileName}</span>
          <span className="text-muted-foreground tabular-nums">
            {progress}%
          </span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full bg-primary transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function UploadedPreview({
  kind,
  file,
  previewUrl,
  onRemove,
  disabled
}: {
  kind: UploadKind;
  file: UploadedFile;
  previewUrl: string | null;
  onRemove: () => void;
  disabled?: boolean;
}) {
  if (kind === "image") {
    return (
      <div className="relative overflow-hidden rounded-lg border border-border/60 bg-muted/30">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={file.fileName}
            className="max-h-64 w-full object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.fileUrl}
            alt={file.fileName}
            className="max-h-64 w-full object-contain"
          />
        )}
        <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-background/80 px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium">{file.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.fileSize)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove image"
            onClick={onRemove}
            disabled={disabled}
          >
            <X aria-hidden />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background"
        aria-hidden
      >
        <FileIcon className="size-4 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.fileName}</p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(file.fileSize)}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Remove file"
        onClick={onRemove}
        disabled={disabled}
      >
        <X aria-hidden />
      </Button>
    </div>
  );
}
