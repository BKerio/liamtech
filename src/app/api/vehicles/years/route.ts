import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/** Years for a model, derived from the year ranges of products that fit it (newest first). */
export async function GET(req: Request) {
  const model = Number(new URL(req.url).searchParams.get("model"));
  if (!Number.isInteger(model)) return NextResponse.json({ results: [] });
  const now = new Date().getFullYear();
  const ranges = await prisma.productVehicle.findMany({
    where: { modelId: model },
    select: { yearFrom: true, yearTo: true },
  });
  const years = new Set<number>();
  for (const r of ranges) {
    const from = r.yearFrom ?? r.yearTo;
    const to = r.yearTo ?? (r.yearFrom ? now : null);
    if (from && to) for (let y = Math.max(from, 1970); y <= Math.min(to, now); y++) years.add(y);
  }
  if (years.size === 0) for (let y = now; y >= 1990; y--) years.add(y);
  return NextResponse.json({ results: Array.from(years).sort((a, b) => b - a) });
}
