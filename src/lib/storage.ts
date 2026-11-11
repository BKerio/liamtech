import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

/**
 * Neon Object Storage client. Credentials, endpoint and region come from the standard
 * AWS_* env vars that `neon deploy` / `neon env pull` write (bucket declared in neon.ts).
 */
export const ASSETS_BUCKET = "assets";

/** Catalogue media (product, brand, banner and store images) live under this key prefix. */
export const MEDIA_PREFIX = "media/";

const globalForS3 = globalThis as unknown as { s3?: S3Client };

export const s3 =
  globalForS3.s3 ??
  new S3Client({
    forcePathStyle: true, // required: Neon uses path-style addressing
    // Fail fast on an unreachable endpoint address and let the SDK retry, rather than
    // hanging for the OS connect timeout (~21s) on every image request.
    maxAttempts: 4,
    requestHandler: { connectionTimeout: 5_000, requestTimeout: 30_000 },
  });

if (process.env.NODE_ENV !== "production") globalForS3.s3 = s3;
