import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/** Same response shape as the original select2 endpoint: { results: [{ id, text }] } */
export async function GET(req: Request) {
  const make = Number(new URL(req.url).searchParams.get("make"));
  if (!Number.isInteger(make)) return NextResponse.json({ results: [] });
  const models = await prisma.model.findMany({ where: { makeId: make }, orderBy: { name: "asc" } });
  return NextResponse.json({ results: models.map((m) => ({ id: m.id, text: m.name })), more: false });
}
