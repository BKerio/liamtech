import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AdminHeader, Thumb, type SP } from "@/components/admin/ui";

export const metadata = { title: "Stores" };

export default async function AdminStores({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const stores = await prisma.store.findMany({
    orderBy: [{ region: "asc" }, { position: "asc" }],
    include: { _count: { select: { orders: true } } },
  });
  return (
    <>
      <AdminHeader
        title="Stores"
        sp={await searchParams}
        actions={
          <Link href="/admin/stores/new/" className="btn btn-primary">
            + New store
          </Link>
        }
      />
      <div className="card">
        <table className="table mb-0">
          <thead>
            <tr>
              <th></th>
              <th>Branch</th>
              <th>Region</th>
              <th>Phones</th>
              <th>Email</th>
              <th>Pickup orders</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stores.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  No stores yet.
                </td>
              </tr>
            )}
            {stores.map((s) => (
              <tr key={s.id}>
                <td>
                  <Thumb src={s.image} />
                </td>
                <td>
                  <Link href={`/admin/stores/${s.id}/`}>{s.name}</Link>
                </td>
                <td>{s.region}</td>
                <td className="small">{s.phones.join(", ")}</td>
                <td className="small">{s.email ?? "—"}</td>
                <td>{s._count.orders}</td>
                <td className="text-right">
                  <Link href={`/admin/stores/${s.id}/`} className="btn btn-sm btn-outline-primary">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
