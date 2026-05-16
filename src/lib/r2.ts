import "server-only";

import { Readable } from "node:stream";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";

let cached: { client: S3Client; bucket: string; publicUrl: string } | null = null;

function getR2() {
  if (cached) return cached;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error("R2 storage is not configured.");
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });

  cached = {
    client,
    bucket,
    publicUrl: publicUrl.replace(/\/$/, "")
  };
  return cached;
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL
  );
}

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
