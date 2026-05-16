import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { uploadObjectToR2 } from "@/lib/r2";
import {
  UPLOAD_CONSTRAINTS,
  getExtension,
  validateUpload,
  type UploadKind
} from "@/lib/upload-constraints";

export const runtime = "nodejs";

function isUploadKind(value: unknown): value is UploadKind {
  return value === "file" || value === "image";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid upload payload" },
      { status: 400 }
    );
  }

  const kindRaw = formData.get("kind");
  if (!isUploadKind(kindRaw)) {
    return NextResponse.json({ error: "Invalid upload kind" }, { status: 400 });
  }
  const kind = kindRaw;

  const fileField = formData.get("file");
  if (!(fileField instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const validation = validateUpload(kind, {
    name: fileField.name,
    size: fileField.size,
    type: fileField.type
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const arrayBuffer = await fileField.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Belt-and-suspenders: arrayBuffer() may not exactly match File.size on some
  // runtimes, so re-check against the constraint after reading bytes.
  const maxSize = UPLOAD_CONSTRAINTS[kind].maxSize;
  if (buffer.byteLength > maxSize) {
    return NextResponse.json(
      { error: `${UPLOAD_CONSTRAINTS[kind].label} exceeds size limit.` },
      { status: 400 }
    );
  }

  const extension = getExtension(fileField.name);
  const key = `uploads/${session.user.id}/${randomUUID()}${extension}`;

  try {
    const { url } = await uploadObjectToR2({
      key,
      body: buffer,
      contentType: fileField.type || "application/octet-stream"
    });

    return NextResponse.json({
      fileUrl: url,
      fileName: fileField.name,
      fileSize: buffer.byteLength,
      mimeType: fileField.type || null
    });
  } catch (error) {
    console.error("upload route failed", error);
    return NextResponse.json(
      { error: "Could not upload file. Please try again." },
      { status: 500 }
    );
  }
}
