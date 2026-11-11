import prisma from "@/lib/prisma";
import { requireAdmin, isAdminEmail } from "@/lib/admin";
import { AdminHeader, Pager, one, type SP } from "@/components/admin/ui";

export const metadata = { title: "Customers" };
const PER_PAGE = 30;

export default async function AdminUsers({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (one(sp.q) ?? "").trim();
  const page = Math.max(1, parseInt(one(sp.page) ?? "1", 10) || 1);
  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { firstName: { contains: q, mode: "insensitive" as const } },
          { lastName: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q } },
        ],
      }
    : {};
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { _count: { select: { orders: true } } },
    }),
  ]);
  return (
    <>
      <AdminHeader title={`Customers (${total})`} sp={sp} />
      <form className="form-inline mb-3" method="get">
        <input name="q" defaultValue={q} className="form-control form-control-sm mr-2" placeholder="Name, email or phone" style={{ minWidth: 260 }} />
        <button className="btn btn-sm btn-primary">Search</button>
      </form>
      <div className="card">
        <table className="table mb-0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Marketing</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
                  No customers found.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                  {isAdminEmail(u.email) && <span className="badge badge-danger ml-2">Admin</span>}
                </td>
                <td>{u.email}</td>
                <td>{u.phone ?? "—"}</td>
                <td>{u._count.orders > 0 ? <a href={`/admin/orders/?q=${encodeURIComponent(u.email)}`}>{u._count.orders}</a> : 0}</td>
                <td>{u.marketingConsent ? "Yes" : "No"}</td>
                <td className="small text-muted">{u.createdAt.toLocaleDateString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small text-muted mt-3">Admin access is granted by adding an account email to ADMIN_EMAILS in the server environment.</p>
      <Pager
        page={page}
        pages={Math.ceil(total / PER_PAGE)}
        href={(p) => `/admin/users/?${new URLSearchParams({ ...(q && { q }), page: String(p) })}`}
      />
    </>
  );
}
