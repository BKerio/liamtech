import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import BrowsePage from "@/components/catalogue/BrowsePage";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await prisma.manufacturer.findUnique({ where: { slug: (await params).slug } });
  return { title: m?.name ?? "Manufacturer" };
}

export default async function ManufacturerPage({ params, searchParams }: Props) {
  const m = await prisma.manufacturer.findUnique({ where: { slug: (await params).slug } });
  if (!m) notFound();
  return (
    <BrowsePage
      title={m.name}
      crumbs={[{ name: m.name }]}
      basePath={`/catalogue/manufacturer/${m.slug}/`}
      scope={{ manufacturerSlug: m.slug }}
      searchParams={await searchParams}
      categoryLinksAsQuery
    />
  );
}
