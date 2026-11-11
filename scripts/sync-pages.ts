/**
 * Upserts the CMS pages from prisma/seed-data/seed.json into the database
 * without touching the rest of the catalogue.   npm run db:sync-pages
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { prismaDatabaseUrl } from "../src/lib/db-url";

const prisma = new PrismaClient({ datasourceUrl: prismaDatabaseUrl() });
const { pages } = JSON.parse(readFileSync(join(__dirname, "..", "prisma", "seed-data", "seed.json"), "utf-8")) as {
  pages: { slug: string; title: string; body: string }[];
};

async function main() {
  for (const p of pages) {
    await prisma.page.upsert({ where: { slug: p.slug }, create: p, update: { title: p.title, body: p.body } });
    console.log(`synced /${p.slug}/ — ${p.title}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
