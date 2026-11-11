import { requireAdmin } from "@/lib/admin";
import ProductForm from "@/components/admin/ProductForm";
import { AdminHeader, type SP } from "@/components/admin/ui";

export const metadata = { title: "New product" };

export default async function NewProduct({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="New product" sp={await searchParams} back={{ href: "/admin/products/", label: "Products" }} />
      <ProductForm />
    </>
  );
}
