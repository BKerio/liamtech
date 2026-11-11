import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Breadcrumb from "@/components/Breadcrumb";

type Props = { params: Promise<{ page: string }> };

/** CMS pages from the DB: /about/, /terms-and-conditions/, /privacy-policy/, /delivery-pickup/ … */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await prisma.page.findUnique({ where: { slug: (await params).page } });
  return { title: page?.title ?? "Page not found" };
}

export default async function CmsPage({ params }: Props) {
  const page = await prisma.page.findUnique({ where: { slug: (await params).page } });
  if (!page) notFound();
  return (
    <div className="container">
      <Breadcrumb items={[{ name: page.title }]} />
      <div id="messages"></div>
      <div className="content-header">
        <h1>{page.title}</h1>
      </div>
      <div className="content">
        {/* Body is trusted HTML authored by site admins (seeded from the original CMS). */}
        <div id="content-inner" dangerouslySetInnerHTML={{ __html: page.body }} />
      </div>
    </div>
  );
}
