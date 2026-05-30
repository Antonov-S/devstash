// R2 client construction + prefix-delete sweep, WITHOUT the `server-only`
// guard. Maintenance scripts (run under the plain tsx/Node runner) import from
// here; the app imports `@/lib/r2`, which re-exports these and keeps the
// `server-only` guard so R2 credentials/logic never reach a client bundle.

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client
} from "@aws-sdk/client-s3";

let cached: { client: S3Client; bucket: string; publicUrl: string } | null = null;

export function getR2() {
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

// Deletes every object under `prefix`, following pagination so it handles more
// than 1000 objects. Best-effort/fail-open by contract: returns { deleted: 0 }
// when R2 isn't configured. ListObjectsV2 returns at most 1000 keys per page,
// so each DeleteObjects batch is already within the 1000-key API limit.
//
// GUARD: `prefix` MUST be a caller-supplied per-user prefix like
// `uploads/<userId>/`. An empty string or a bare `uploads/` would widen the
// blast radius, so we assert a non-empty, trailing-slash prefix.
export async function deleteR2ObjectsByPrefix(
  prefix: string
): Promise<{ deleted: number }> {
  if (!isR2Configured()) return { deleted: 0 };

  if (!prefix || !prefix.endsWith("/")) {
    throw new Error(
      `deleteR2ObjectsByPrefix requires a non-empty prefix ending in "/"; got "${prefix}"`
    );
  }

  const { client, bucket } = getR2();
  let deleted = 0;
  let continuationToken: string | undefined;

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken
      })
    );

    const objects = (listed.Contents ?? [])
      .map((object) => object.Key)
      .filter((key): key is string => Boolean(key))
      .map((Key) => ({ Key }));

    if (objects.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: objects }
        })
      );
      deleted += objects.length;
    }

    continuationToken = listed.IsTruncated
      ? listed.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return { deleted };
}
