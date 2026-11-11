import Link from "next/link";
import type { Order, OrderLine, Store } from "@prisma/client";
import { kes, srcSet } from "@/lib/format";

export default function OrderSummary({ order }: { order: Order & { lines: OrderLine[]; store: Store | null } }) {
  return (
    <div className="row">
      <div className="col-md-8">
        <div className="card mb-3">
          <div className="card-header">Items</div>
          <div className="card-body">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th colSpan={2}>Item</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((l) => (
                  <tr key={l.id}>
                    <td style={{ width: 70 }}>
                      {l.image && <img className="img-fluid" src={l.image} srcSet={srcSet(l.image)} alt="" />}
                    </td>
                    <td>
                      <Link href={`/catalogue/${l.productSlug}/`}>{l.title}</Link>
                      <div className="text-muted small">Product code: {l.sku}</div>
                    </td>
                    <td className="text-center">{l.quantity}</td>
                    <td className="text-right">{kes(l.unitPrice * l.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={3} className="text-right">
                    Order total
                  </th>
                  <th className="text-right">{kes(order.total)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card mb-3">
          <div className="card-header">{order.method === "pickup" ? "Click & Collect" : "Delivery"}</div>
          <div className="card-body">
            <p className="mb-1">
              <strong>
                {order.firstName} {order.lastName}
              </strong>
            </p>
            <p className="mb-1">{order.email}</p>
            <p className="mb-3">{order.phone}</p>
            {order.method === "pickup" && order.store ? (
              <address className="mb-0">
                Collect from <strong>{order.store.name}</strong>
                <br />
                {order.store.address.join(", ")}
              </address>
            ) : (
              <address className="mb-0">
                {order.address}
                <br />
                {order.city}
              </address>
            )}
            {order.notes && <p className="mt-3 mb-0 text-muted">{order.notes}</p>}
          </div>
        </div>
        <p className="text-muted small">
          Status: <span className="text-capitalize">{order.status}</span> · Placed {order.createdAt.toLocaleString("en-GB")}
        </p>
      </div>
    </div>
  );
}
