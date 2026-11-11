import { requireAdmin } from "@/lib/admin";
import StoreForm from "@/components/admin/StoreForm";
import { AdminHeader, type SP } from "@/components/admin/ui";

export const metadata = { title: "New store" };

export default async function NewStore({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="New store" sp={await searchParams} back={{ href: "/admin/stores/", label: "Stores" }} />
      <StoreForm />
    </>
  );
}
