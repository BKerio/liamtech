import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import ProductForm from "@/components/admin/ProductForm";
import { AdminHeader, type SP } from "@/components/admin/ui";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  await requireAdmin();
  const id = Number((await params).id);
  const product = Number.isInteger(id) ? await prisma.product.findUnique({ where: { id } }) : null;
  if (!product) notFound();
  return (
    <>
      <AdminHeader title={product.name} sp={await searchParams} back={{ href: "/admin/products/", label: "Products" }} />
      <ProductForm product={product} />
    </>
  );
}
