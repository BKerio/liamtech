/**
 * Uploads a local media folder into the Neon Object Storage bucket ("assets"), keyed as media/<relative path>.
 * Skips objects that already exist with the same size.
 *
 *   npm run media:upload -- <folder>      (default folder: ./public/media)
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { extname, join, relative, sep } from "path";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const BUCKET = "assets";
const root = process.argv[2] ?? join(process.cwd(), "public", "media");
const s3 = new S3Client({ forcePathStyle: true });

const TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** Sniff the real format — some ".webp" cache files from the original site are actually PNG. */
function contentType(buf: Buffer, file: string) {
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (buf.subarray(0, 3).toString() === "GIF") return "image/gif";
  return TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
}

async function main() {
  const files = walk(root);
  console.log(`Uploading ${files.length} files from ${root} to bucket "${BUCKET}"…`);
  let uploaded = 0;
  let skipped = 0;
  let i = 0;
  const worker = async () => {
    while (i < files.length) {
      const file = files[i++];
      const key = "media/" + relative(root, file).split(sep).join("/");
      const size = statSync(file).size;
      try {
        const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        if (head.ContentLength === size) {
          skipped++;
          continue;
        }
      } catch {
        /* not found → upload */
      }
      const body = readFileSync(file);
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: body,
          ContentType: contentType(body, file),
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      uploaded++;
      if (uploaded % 200 === 0) console.log(`  ${uploaded} uploaded…`);
    }
  };
  await Promise.all(Array.from({ length: 16 }, worker));
  console.log(`Done: ${uploaded} uploaded, ${skipped} already present.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
