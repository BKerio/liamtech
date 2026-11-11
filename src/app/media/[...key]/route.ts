import { GetObjectCommand, NoSuchKey } from "@aws-sdk/client-s3";
import { ASSETS_BUCKET, MEDIA_PREFIX, s3 } from "@/lib/storage";

/**
 * Serves /media/** (product, brand, banner and store images) from the private Neon
 * Object Storage bucket. URLs stored in Postgres stay "/media/…"; objects are
 * immutable (content-hashed cache paths), so the CDN and browsers cache them for a year.
 */
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  if (!key.length || key.some((s) => s === ".." || s === "." || s === "")) {
    return new Response("Not found", { status: 404 });
  }
  const objectKey = MEDIA_PREFIX + key.map(decodeURIComponent).join("/");

  try {
    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: ASSETS_BUCKET,
        Key: objectKey,
        IfNoneMatch: req.headers.get("if-none-match") ?? undefined,
      }),
    );
    const headers = new Headers({
      "Content-Type": obj.ContentType ?? "application/octet-stream",
      "Cache-Control": obj.CacheControl ?? "public, max-age=31536000, immutable",
    });
    if (obj.ETag) headers.set("ETag", obj.ETag);
    if (obj.ContentLength != null) headers.set("Content-Length", String(obj.ContentLength));
    return new Response(obj.Body!.transformToWebStream(), { headers });
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 304) return new Response(null, { status: 304 });
    if (err instanceof NoSuchKey || status === 404) return new Response("Not found", { status: 404 });
    console.error("media fetch failed", objectKey, err);
    return new Response("Storage error", { status: 502 });
  }
}
