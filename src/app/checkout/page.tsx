import type { Metadata } from "next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Breadcrumb from "@/components/Breadcrumb";
import CheckoutForm from "@/components/basket/CheckoutForm";
import { getBasket, basketTotals } from "@/lib/basket";
import { getCurrentUser } from "@/lib/auth";
import { kes, srcSet } from "@/lib/format";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const basket = await getBasket();
  if (!basket || basket.lines.length === 0) redirect("/basket/");
  const [user, stores] = await Promise.all([
    getCurrentUser(),
    prisma.store.findMany({ orderBy: [{ region: "asc" }, { position: "asc" }], select: { id: true, name: true, region: true } }),
  ]);
  const { total } = basketTotals(basket);

  return (
    <div className="container">
      <Breadcrumb items={[{ name: "Basket", href: "/basket/" }, { name: "Checkout" }]} />
      <div className="content-header">
        <h1>Checkout</h1>
      </div>
      <div className="content">
        <div id="content-inner">
          <div className="row">
            <div className="col-lg-8">
              <CheckoutForm
                stores={stores}
                user={user ? { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone } : null}
              />
            </div>
            <div className="col-lg-4">
              <div className="card checkout-preview-basket">
                <div className="card-header">Order summary</div>
                <div className="card-body basket-compact read-only">
                  <div className="basket-lines">
                    {basket.lines.map((l) => (
                      <div className="basket-line" key={l.id}>
                        <div className="row no-gutters">
                          <div className="col-3">
                            <img className="img-fluid" src={l.product.cardImage ?? undefined} srcSet={srcSet(l.product.cardImage)} alt="" />
                          </div>
                          <div className="col-9 pl-2 basket-line-detail">
                            <h3>{l.product.name}</h3>
                            <div className="basket-line-amount">
                              <span className="basket-line-quantity">Qty {l.quantity}</span>
                              <span>{kes(l.product.price * l.quantity)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="basket-details">
                    <div className="basket-total total">
                      <span className="amount-label">Total</span>
                      <span className="amount-value">{kes(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
