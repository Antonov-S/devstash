import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemDetailForUser } from "@/lib/db/items";
import { getObjectFromR2, keyFromPublicUrl } from "@/lib/r2";

export const runtime = "nodejs";

function encodeContentDisposition(fileName: string): string {
  const fallback = fileName.replace(/[^\x20-\x7E]+/g, "_").replace(/"/g, "");
  const encoded = encodeURIComponent(fileName);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
  }

  const detail = await getItemDetailForUser(session.user.id, id);
  if (!detail || detail.contentType !== "FILE" || !detail.fileUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const key = keyFromPublicUrl(detail.fileUrl);
  if (!key) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const object = await getObjectFromR2(key);
    if (!object) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      object.contentType ?? "application/octet-stream"
    );
    if (object.contentLength !== null) {
      headers.set("Content-Length", String(object.contentLength));
    }
    headers.set(
      "Content-Disposition",
      encodeContentDisposition(detail.fileName ?? "download")
    );
    headers.set("Cache-Control", "private, no-store");

    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    console.error("file download proxy failed", error);
    return NextResponse.json(
      { error: "Could not download file." },
      { status: 500 }
    );
  }
}
