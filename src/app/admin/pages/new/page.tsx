import { requireAdmin } from "@/lib/admin";
import PageForm from "@/components/admin/PageForm";
import { AdminHeader, type SP } from "@/components/admin/ui";

export const metadata = { title: "New page" };

export default async function NewPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="New page" sp={await searchParams} back={{ href: "/admin/pages/", label: "Pages" }} />
      <PageForm />
    </>
  );
}
