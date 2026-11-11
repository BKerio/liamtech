import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import PageForm from "@/components/admin/PageForm";
import { AdminHeader, type SP } from "@/components/admin/ui";

export const metadata = { title: "Edit page" };

export default async function EditPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  await requireAdmin();
  const page = await prisma.page.findUnique({ where: { slug: (await params).slug } });
  if (!page) notFound();
  return (
    <>
      <AdminHeader title={page.title} sp={await searchParams} back={{ href: "/admin/pages/", label: "Pages" }} />
      <PageForm page={page} />
    </>
  );
}
