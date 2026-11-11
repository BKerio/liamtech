/**
 * Normalises the Neon connection string for Prisma 5's query engine:
 * - drops `channel_binding=require` (Neon adds it; the engine hangs negotiating SCRAM channel binding)
 * - adds a `connect_timeout` that tolerates a scale-to-zero compute waking up
 *
 * Done in code rather than in .env because `neon env pull` / `neon deploy` rewrite .env.
 */
export function prismaDatabaseUrl(raw = process.env.DATABASE_URL) {
  if (!raw) return undefined;
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "30");
  if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "30");
  return url.toString();
}
