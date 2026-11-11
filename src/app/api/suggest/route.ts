import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ suggestions: [] });
  const words = q.split(/\s+/).filter(Boolean).slice(0, 6);
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 5,
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: {
        AND: words.map((w) => ({
          OR: [
            { name: { contains: w, mode: "insensitive" as const } },
            { sku: { contains: w, mode: "insensitive" as const } },
          ],
        })),
      },
      orderBy: [{ inStock: "desc" }, { popularity: "desc" }],
      take: 8,
      select: { slug: true, name: true, cardImage: true },
    }),
  ]);
  return NextResponse.json({
    suggestions: [
      ...categories.map((c) => ({ type: "category", name: c.name, url: `/catalogue/category/${c.path}/` })),
      ...products.map((p) => ({ type: "product", name: p.name, url: `/catalogue/${p.slug}/`, image: p.cardImage })),
    ],
  });
}
