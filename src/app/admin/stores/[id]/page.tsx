import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import StoreForm from "@/components/admin/StoreForm";
import { AdminHeader, type SP } from "@/components/admin/ui";

export const metadata = { title: "Edit store" };

export default async function EditStore({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SP>;
}) {
  await requireAdmin();
  const id = Number((await params).id);
  const store = Number.isInteger(id) ? await prisma.store.findUnique({ where: { id } }) : null;
  if (!store) notFound();
  return (
    <>
      <AdminHeader title={store.name} sp={await searchParams} back={{ href: "/admin/stores/", label: "Stores" }} />
      <StoreForm store={store} />
    </>
  );
}
