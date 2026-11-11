import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ORDER_STATUSES } from "@/lib/admin-constants";
import { updateOrderStatus } from "@/app/admin/actions";
import OrderSummary from "@/components/OrderSummary";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { AdminHeader, StatusBadge, type SP } from "@/components/admin/ui";

export const metadata = { title: "Order" };

export default async function AdminOrder({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  await requireAdmin();
  const id = Number((await params).id);
  const order = Number.isInteger(id) ? await prisma.order.findUnique({ where: { id }, include: { lines: true, store: true, user: { select: { email: true } } } }) : null;
  if (!order) notFound();
  const tel = order.phone.replace(/\s/g, "").replace(/^0/, "+254");

  return (
    <>
      <AdminHeader title={`Order #${order.number}`} sp={await searchParams} back={{ href: "/admin/orders/", label: "Orders" }} actions={<StatusBadge status={order.status} />} />
      <div className="card mb-3">
        <div className="card-body d-flex flex-wrap align-items-center">
          <form action={updateOrderStatus} className="form-inline mr-4 mb-2">
            <input type="hidden" name="id" value={order.id} />
            <label className="mr-2" htmlFor="status">
              Status
            </label>
            <select id="status" name="status" defaultValue={order.status} className="form-control form-control-sm mr-2">
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ConfirmButton className="btn btn-sm btn-primary">Update status</ConfirmButton>
          </form>
          <a className="btn btn-sm btn-outline-secondary mr-2 mb-2" href={`tel:${tel}`}>
            Call {order.phone}
          </a>
          <a className="btn btn-sm btn-outline-success mr-2 mb-2" href={`https://wa.me/${tel.replace("+", "")}`} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a className="btn btn-sm btn-outline-secondary mb-2" href={`mailto:${order.email}?subject=${encodeURIComponent(`Your order #${order.number}`)}`}>
            Email
          </a>
          <span className="ml-auto small text-muted mb-2">{order.user ? `Account: ${order.user.email}` : "Guest checkout"}</span>
        </div>
      </div>
      <OrderSummary order={order} />
    </>
  );
}
