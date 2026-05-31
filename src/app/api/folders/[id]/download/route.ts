import { Readable } from "node:stream";

import { ZipArchive } from "archiver";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getUserIsPro } from "@/lib/billing";
import { MAX_ZIP_BYTES } from "@/lib/constants";
import { getFolderFilesForDownload } from "@/lib/db/folders";
import { getObjectNodeStreamFromR2, keyFromPublicUrl } from "@/lib/r2";

export const runtime = "nodejs";
// Vercel's default maxDuration is ~10s and the Hobby (legacy compute) ceiling
// is 60s. A streamed ZIP holds the function open for the client's ENTIRE
// download (backpressure), so this MUST be declared or large downloads die
// mid-stream. See MAX_ZIP_BYTES for how the cap is sized against this ceiling.
export const maxDuration = 60;

function encodeContentDisposition(fileName: string): string {
  const fallback = fileName.replace(/[^\x20-\x7E]+/g, "_").replace(/"/g, "");
  const encoded = encodeURIComponent(fileName);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

// Dedupe entry names within the archive: x.png, x (2).png, x (3).png. Only
// called for files we actually append, so a skipped file never burns a slot.
function uniqueZipName(name: string, seen: Set<string>): string {
  if (!seen.has(name)) {
    seen.add(name);
    return name;
  }
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let n = 2;
  let candidate = `${base} (${n})${ext}`;
  while (seen.has(candidate)) {
    n += 1;
    candidate = `${base} (${n})${ext}`;
  }
  seen.add(candidate);
  return candidate;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // DB read, not session.user.isPro — the JWT lags a Stripe downgrade.
  const isPro = await getUserIsPro(session.user.id);
  if (!isPro) {
    return NextResponse.json({ error: "Folders require Pro." }, { status: 403 });
  }

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid folder id" }, { status: 400 });
  }

  const folder = await getFolderFilesForDownload(session.user.id, id);
  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (folder.files.length === 0) {
    return NextResponse.json(
      { error: "This folder has no files to download." },
      { status: 404 }
    );
  }
  if (folder.totalSize > MAX_ZIP_BYTES) {
    return NextResponse.json(
      { error: "This folder is too large to download as a ZIP." },
      { status: 409 }
    );
  }

  try {
    // level 1: folder contents are images/PDFs (already-compressed binary), so
    // higher levels just burn CPU and slow the stream for ~no size win.
    const archive = new ZipArchive({ zlib: { level: 1 } });
    archive.on("error", (error) => {
      console.error("folder zip archive error", error);
    });

    const webStream = Readable.toWeb(archive) as ReadableStream<Uint8Array>;

    // Append every file then finalize — runs after we return the Response so
    // the archive streams to the client with backpressure as it's built. A
    // per-file R2 failure is skipped + logged, never aborting the archive.
    void (async () => {
      const seen = new Set<string>();
      for (const file of folder.files) {
        try {
          const key = keyFromPublicUrl(file.fileUrl);
          if (!key) continue;
          const nodeStream = await getObjectNodeStreamFromR2(key);
          if (!nodeStream) continue;
          const entryName = uniqueZipName(
            file.fileName ?? `item-${file.id}`,
            seen
          );
          archive.append(nodeStream, { name: entryName });
        } catch (error) {
          console.error("folder zip: skipping file", file.id, error);
        }
      }
      await archive.finalize();
    })();

    const headers = new Headers();
    headers.set("Content-Type", "application/zip");
    headers.set(
      "Content-Disposition",
      encodeContentDisposition(`${folder.name}.zip`)
    );
    headers.set("Cache-Control", "private, no-store");

    return new Response(webStream, { status: 200, headers });
  } catch (error) {
    console.error("folder zip download failed", error);
    return NextResponse.json(
      { error: "Could not download folder." },
      { status: 500 }
    );
  }
}
