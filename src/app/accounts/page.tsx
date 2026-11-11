import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Breadcrumb from "@/components/Breadcrumb";
import { ProfileForm } from "@/components/forms/AccountForms";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/account";
import { kes } from "@/lib/format";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/accounts/login/?next=/accounts/");
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { lines: true } } },
  });

  return (
    <div className="container">
      <Breadcrumb items={[{ name: "Account" }]} />
      <div id="messages"></div>
      <div className="content-header">
        <h1>Your account</h1>
      </div>
      <div className="content">
        <div id="content-inner">
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="card">
                <div className="card-header">Profile</div>
                <div className="card-body">
                  <p className="mb-3">
                    <strong>Email:</strong> {user.email}
                  </p>
                  <ProfileForm user={user} />
                </div>
                <div className="card-footer">
                  <form action={logout}>
                    <button type="submit" className="btn btn-outline-dark btn-sm">
                      Logout
                    </button>
                  </form>
                </div>
              </div>
            </div>
            <div className="col-md-8">
              <h3 className="subheading">
                <span className="subheading-text">Order history</span>
              </h3>
              {orders.length === 0 ? (
                <p>
                  You haven&apos;t placed any orders. <Link href="/">Continue shopping</Link>
                </p>
              ) : (
                <table className="table table-striped table-bordered">
                  <thead>
                    <tr>
                      <th>Order number</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Date placed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link href={`/accounts/orders/${o.number}/`}>{o.number}</Link>
                        </td>
                        <td>{o._count.lines}</td>
                        <td>{kes(o.total)}</td>
                        <td>{o.createdAt.toLocaleDateString("en-GB")}</td>
                        <td className="text-capitalize">{o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
