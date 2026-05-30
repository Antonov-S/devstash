import "server-only";

import { Readable } from "node:stream";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand
} from "@aws-sdk/client-s3";

import { getR2 } from "./r2-core";

// The S3 client + prefix-delete sweep live in `r2-core` (no `server-only`) so
// maintenance scripts can import them under the tsx/Node runner. Re-export the
// public surface here so app code keeps importing from `@/lib/r2`.
export { deleteR2ObjectsByPrefix, isR2Configured } from "./r2-core";

export function publicUrlForKey(key: string): string {
  const { publicUrl } = getR2();
  return `${publicUrl}/${key}`;
}

export function keyFromPublicUrl(url: string): string | null {
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!publicUrl) return null;
  const prefix = `${publicUrl}/`;
  if (!url.startsWith(prefix)) return null;
  const key = url.slice(prefix.length);
  return key.length > 0 ? key : null;
}

export async function uploadObjectToR2(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ url: string }> {
  const { client, bucket } = getR2();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType
    })
  );
  return { url: publicUrlForKey(params.key) };
}

export async function deleteObjectFromR2(key: string): Promise<void> {
  const { client, bucket } = getR2();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    })
  );
}

export type R2ObjectStream = {
  body: ReadableStream<Uint8Array>;
  contentType: string | null;
  contentLength: number | null;
};

export async function getObjectFromR2(key: string): Promise<R2ObjectStream | null> {
  const { client, bucket } = getR2();
  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    const body = response.Body;
    if (!body) return null;

    // AWS SDK returns a Node Readable in Node runtimes and a Web ReadableStream
    // in browser-like runtimes. Normalize to Web so we can hand it to Response.
    let webStream: ReadableStream<Uint8Array>;
    if (body instanceof Readable) {
      webStream = Readable.toWeb(body) as ReadableStream<Uint8Array>;
    } else if (typeof (body as ReadableStream).getReader === "function") {
      webStream = body as ReadableStream<Uint8Array>;
    } else {
      return null;
    }

    return {
      body: webStream,
      contentType: response.ContentType ?? null,
      contentLength: response.ContentLength ?? null
    };
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "NoSuchKey" || name === "NotFound") {
      return null;
    }
    throw error;
  }
}
