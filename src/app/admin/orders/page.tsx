import Link from "next/link";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { kes } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/admin-constants";
import { AdminHeader, Pager, StatusBadge, one, type SP } from "@/components/admin/ui";

export const metadata = { title: "Orders" };
const PER_PAGE = 25;

export default async function AdminOrders({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = one(sp.status) ?? "";
  const q = (one(sp.q) ?? "").trim();
  const page = Math.max(1, parseInt(one(sp.page) ?? "1", 10) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { lastName: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { store: { select: { name: true } }, _count: { select: { lines: true } } },
    }),
  ]);
  const href = (p: number) => `/admin/orders/?${new URLSearchParams({ ...(status && { status }), ...(q && { q }), page: String(p) })}`;

  return (
    <>
      <AdminHeader title="Orders" sp={sp} />
      <form className="form-inline mb-3" method="get">
        <input name="q" defaultValue={q} className="form-control form-control-sm mr-2" placeholder="Order #, name, email or phone" style={{ minWidth: 260 }} />
        <select name="status" defaultValue={status} className="form-control form-control-sm mr-2">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button className="btn btn-sm btn-primary">Filter</button>
      </form>
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Fulfilment</th>
                <th>Items</th>
                <th className="text-right">Total</th>
                <th>Status</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-muted text-center py-4">
                    No orders found.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}/`}>#{o.number}</Link>
                  </td>
                  <td>
                    {o.firstName} {o.lastName}
                    <div className="small text-muted">{o.email}</div>
                  </td>
                  <td>{o.phone}</td>
                  <td>{o.method === "pickup" ? `Collect: ${o.store?.name ?? "—"}` : `Deliver: ${o.city ?? ""}`}</td>
                  <td>{o._count.lines}</td>
                  <td className="text-right">{kes(o.total)}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="small text-muted">{o.createdAt.toLocaleString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pager page={page} pages={Math.ceil(total / PER_PAGE)} href={href} />
    </>
  );
}
