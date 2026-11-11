import "server-only";
import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Detect the real image type from magic bytes (never trust the browser-supplied type). */
function sniffImage(buf: Buffer): { type: string; ext: string } | null {
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { type: "image/png", ext: "png" };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { type: "image/jpeg", ext: "jpg" };
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return { type: "image/webp", ext: "webp" };
  if (buf.subarray(0, 6).toString() === "GIF87a" || buf.subarray(0, 6).toString() === "GIF89a") return { type: "image/gif", ext: "gif" };
  return null;
}

/**
 * Uploads an admin-supplied image to the bucket under media/uploads/<yyyy>/<mm>/<uuid>.<ext>
 * and returns its public path (/media/…), served by src/app/media/[...key]/route.ts.
 * Only PNG / JPEG / WebP / GIF up to 5 MB are accepted (SVG is rejected: it can carry script).
 */
export async function uploadImage(file: File): Promise<string> {
  if (file.size === 0) throw new Error("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 5 MB or smaller.");
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(buf);
  if (!kind) throw new Error("Only PNG, JPEG, WebP or GIF images can be uploaded.");
  const now = new Date();
  const path = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${kind.ext}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: ASSETS_BUCKET,
      Key: MEDIA_PREFIX + path,
      Body: buf,
      ContentType: kind.type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `/media/${path}`;
}
