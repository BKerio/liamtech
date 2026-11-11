/**
 * Seeds the database from prisma/seed-data/seed.json (scraped from the original site).
 * Run with: npm run db:seed   (destructive — clears catalogue/CMS tables first)
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { prismaDatabaseUrl } from "../src/lib/db-url";
import { upsertAdmin } from "../scripts/create-admin";

const prisma = new PrismaClient({ datasourceUrl: prismaDatabaseUrl() });

type SeedData = {
  categories: { path: string; name: string; parent: string | null; position: number }[];
  makes: { id: number; name: string; models: { id: number; name: string }[] }[];
  manufacturers: { name: string; slug: string; logo: string | null; featured: boolean }[];
  products: {
    slug: string;
    name: string;
    sku: string;
    price: number | null;
    oldPrice: number | null;
    inStock: boolean;
    maxQty: number;
    category: string | null;
    manufacturer: string | null;
    cardImage: string | null;
    images: string[];
    thumbs: string[];
    vehicles: string[];
  }[];
  homeSections: { title: string; products: string[] }[];
  banners: {
    topDesktop: string;
    topMobile: string;
    hero: string[];
    midCarousel: string[];
    featuredLinks: { href: string | null; image: string; alt: string; caption: string }[];
    sidebar: { href: string | null; image: string; mobileImage: string | null; alt: string }[];
  };
  stores: {
    slug: string;
    name: string;
    region: string;
    address: string[];
    phones: string[];
    email: string | null;
    hours: { day: string; time: string }[];
    lat: number | null;
    lng: number | null;
    image: string | null;
    position: number;
  }[];
  pages: { slug: string; title: string; body: string }[];
};

const data: SeedData = JSON.parse(readFileSync(join(__dirname, "seed-data", "seed.json"), "utf-8"));

/** "Nissan Xtrail (2008-2013)" → { modelId, yearFrom, yearTo } */
function parseVehicles(lines: string[]) {
  const makes = [...data.makes].filter((m) => m.name).sort((a, b) => b.name.length - a.name.length);
  const out: { modelId: number; yearFrom: number | null; yearTo: number | null }[] = [];
  for (const raw of lines) {
    const yearMatch = raw.match(/\(\s*(\d{4})?\s*(-)?\s*(\d{4})?\s*\)/);
    const text = raw.replace(/\(.*?\)/g, "").trim().toLowerCase();
    const make = makes.find((m) => text === m.name.toLowerCase() || text.startsWith(m.name.toLowerCase() + " "));
    if (!make) continue;
    const rest = text.slice(make.name.length).trim();
    const models = [...make.models].sort((a, b) => b.name.length - a.name.length);
    const model =
      models.find((m) => m.name.toLowerCase() === rest) ??
      models.find((m) => rest.startsWith(m.name.toLowerCase() + " ") || rest.startsWith(m.name.toLowerCase()));
    if (!model) continue;
    let yearFrom: number | null = null;
    let yearTo: number | null = null;
    if (yearMatch) {
      yearFrom = yearMatch[1] ? Number(yearMatch[1]) : null;
      yearTo = yearMatch[3] ? Number(yearMatch[3]) : yearMatch[2] ? null : yearFrom;
    }
    out.push({ modelId: model.id, yearFrom, yearTo });
  }
  return out;
}

async function main() {
  console.log("Clearing tables…");
  await prisma.$transaction([
    prisma.homeSectionItem.deleteMany(),
    prisma.homeSection.deleteMany(),
    prisma.productVehicle.deleteMany(),
    prisma.basketLine.deleteMany(),
    prisma.review.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.manufacturer.deleteMany(),
    prisma.model.deleteMany(),
    prisma.make.deleteMany(),
    prisma.banner.deleteMany(),
    prisma.page.deleteMany(),
  ]);

  // ── categories (parents first; the scrape is already ordered top-down)
  console.log(`Categories: ${data.categories.length}`);
  const catIds = new Map<string, number>();
  for (const c of data.categories) {
    if (catIds.has(c.path)) continue;
    const row = await prisma.category.create({
      data: { path: c.path, name: c.name, position: c.position, parentId: c.parent ? catIds.get(c.parent) ?? null : null },
    });
    catIds.set(c.path, row.id);
  }

  // ── vehicles
  const makes = data.makes.filter((m) => m.name);
  console.log(`Makes: ${makes.length}`);
  await prisma.make.createMany({ data: makes.map((m) => ({ id: m.id, name: m.name })) });
  const seenModels = new Set<number>();
  const models = makes.flatMap((m) =>
    m.models.filter((x) => !seenModels.has(x.id) && seenModels.add(x.id)).map((x) => ({ id: x.id, name: x.name, makeId: m.id })),
  );
  await prisma.model.createMany({ data: models });

  // ── manufacturers
  const featuredOrder = data.manufacturers.filter((m) => m.featured).map((m) => m.name);
  await prisma.manufacturer.createMany({
    data: data.manufacturers.map((m) => ({
      name: m.name,
      slug: m.slug,
      logo: m.logo,
      featured: m.featured,
      position: m.featured ? featuredOrder.indexOf(m.name) : 999,
    })),
    skipDuplicates: true,
  });
  const manIds = new Map((await prisma.manufacturer.findMany()).map((m) => [m.name, m.id]));

  // ── products
  const products = data.products.filter((p) => p.name && p.price != null);
  console.log(`Products: ${products.length}`);
  const productIds = new Map<string, number>();
  for (const [i, p] of products.entries()) {
    const row = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        sku: p.sku,
        price: p.price!,
        oldPrice: p.oldPrice && p.oldPrice > p.price! ? p.oldPrice : null,
        inStock: p.inStock,
        stockQty: p.inStock ? Math.max(1, p.maxQty || 9) : 0,
        popularity: products.length - i,
        cardImage: p.cardImage,
        images: p.images,
        thumbs: p.thumbs,
        vehicleText: p.vehicles,
        categoryId: p.category ? catIds.get(p.category) ?? null : null,
        manufacturerId: p.manufacturer ? manIds.get(p.manufacturer) ?? null : null,
      },
    });
    productIds.set(`/catalogue/${p.slug}/`, row.id);
    const fits = parseVehicles(p.vehicles);
    if (fits.length) await prisma.productVehicle.createMany({ data: fits.map((f) => ({ ...f, productId: row.id })) });
  }

  // ── home page sections
  for (const [i, s] of data.homeSections.entries()) {
    const ids = s.products.map((u) => productIds.get(u)).filter((x): x is number => !!x);
    await prisma.homeSection.create({
      data: { title: s.title, position: i, items: { create: ids.map((productId, j) => ({ productId, position: j })) } },
    });
  }

  // ── banners
  const b = data.banners;
  await prisma.banner.createMany({
    data: [
      { placement: "top", image: b.topDesktop, mobileImage: b.topMobile, href: "/", alt: "Promotion", position: 0 },
      ...b.hero.map((image, i) => ({ placement: "hero", image, position: i })),
      ...b.midCarousel.map((image, i) => ({ placement: "mid", image, position: i })),
      ...b.featuredLinks.map((f, i) => ({
        placement: "featured_link",
        image: f.image,
        href: f.href,
        alt: f.alt,
        caption: f.caption,
        position: i,
      })),
      ...b.sidebar.map((s, i) => ({
        placement: "sidebar",
        image: s.image,
        mobileImage: s.mobileImage,
        href: s.href,
        alt: s.alt,
        position: i,
      })),
    ],
  });

  // ── stores (upsert so existing orders keep their store reference)
  for (const s of data.stores) {
    const { slug, ...rest } = s;
    await prisma.store.upsert({ where: { slug }, create: { slug, ...rest }, update: rest });
  }

  // ── CMS pages
  await prisma.page.createMany({ data: data.pages });

  // ── admin account (credentials come from .env, never from the repo)
  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    const admin = await upsertAdmin(prisma, process.env.SEED_ADMIN_EMAIL, process.env.SEED_ADMIN_PASSWORD);
    console.log(`Admin account: ${admin.email}`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
