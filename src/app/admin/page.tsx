import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { kes } from "@/lib/format";
import { AdminHeader, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  await requireAdmin();
  const since = new Date(Date.now() - 30 * 864e5);
  const [pending, processing, revenue30, orders30, products, outOfStock, messages, reviews, customers, recent] = await Promise.all([
    prisma.order.count({ where: { status: "pending" } }),
    prisma.order.count({ where: { status: "processing" } }),
    prisma.order.aggregate({ where: { createdAt: { gte: since }, status: { not: "cancelled" } }, _sum: { total: true } }),
    prisma.order.count({ where: { createdAt: { gte: since } } }),
    prisma.product.count(),
    prisma.product.count({ where: { inStock: false } }),
    prisma.contactMessage.count({ where: { createdAt: { gte: since } } }),
    prisma.review.count(),
    prisma.user.count(),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { _count: { select: { lines: true } } } }),
  ]);

  const stats = [
    { label: "Pending orders", value: pending, href: "/admin/orders/?status=pending", tone: pending ? "text-danger" : "" },
    { label: "Processing", value: processing, href: "/admin/orders/?status=processing" },
    { label: "Revenue (30 days)", value: kes(revenue30._sum.total ?? 0), href: "/admin/orders/" },
    { label: "Orders (30 days)", value: orders30, href: "/admin/orders/" },
    { label: "Products", value: products, href: "/admin/products/" },
    { label: "Out of stock", value: outOfStock, href: "/admin/products/?stock=out" },
    { label: "Messages (30 days)", value: messages, href: "/admin/messages/" },
    { label: "Customers", value: customers, href: "/admin/users/" },
  ];

  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="row">
        {stats.map((s) => (
          <div className="col-6 col-lg-3 mb-3" key={s.label}>
            <Link href={s.href} className="card h-100 text-reset text-decoration-none">
              <div className="card-body">
                <div className={`stat ${s.tone ?? ""}`}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="card mt-2">
        <div className="card-header d-flex justify-content-between align-items-center bg-white">
          <strong>Recent orders</strong>
          <Link href="/admin/orders/">All orders →</Link>
        </div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Method</th>
                <th>Items</th>
                <th className="text-right">Total</th>
                <th>Status</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-muted text-center py-4">
                    No orders yet.
                  </td>
                </tr>
              )}
              {recent.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}/`}>#{o.number}</Link>
                  </td>
                  <td>
                    {o.firstName} {o.lastName}
                  </td>
                  <td className="text-capitalize">{o.method}</td>
                  <td>{o._count.lines}</td>
                  <td className="text-right">{kes(o.total)}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="text-muted small">{o.createdAt.toLocaleString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {reviews > 0 && (
        <p className="text-muted small mt-3">
          {reviews} product reviews — <Link href="/admin/reviews/">moderate</Link>
        </p>
      )}
    </>
  );
}
