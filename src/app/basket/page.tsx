import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import BasketLines from "@/components/basket/BasketLines";
import { getBasket, basketTotals } from "@/lib/basket";
import { kes } from "@/lib/format";

export const metadata: Metadata = { title: "Basket" };

export default async function BasketPage() {
  const basket = await getBasket();
  const { total } = basketTotals(basket);
  const lines = basket?.lines ?? [];

  return (
    <div className="container">
      <Breadcrumb items={[{ name: "Basket" }]} />
      <div id="messages"></div>
      <div className="content-header basket-header">
        <div className="basket-header-title">
          <h1>Basket</h1>
        </div>
      </div>
      <div className="content">
        <div id="content-inner">
          <div className="basket">
            {lines.length === 0 ? (
              <p>
                Your basket is empty. <Link href="/">Continue shopping</Link>
              </p>
            ) : (
              <div className="row">
                <div className="col-lg-8">
                  <BasketLines
                    lines={lines.map((l) => ({
                      id: l.id,
                      quantity: l.quantity,
                      slug: l.product.slug,
                      name: l.product.name,
                      sku: l.product.sku,
                      price: l.product.price,
                      oldPrice: l.product.oldPrice,
                      inStock: l.product.inStock,
                      image: l.product.cardImage,
                    }))}
                  />
                </div>
                <div className="col-lg-4">
                  <div className="card">
                    <div className="card-body">
                      <h3 className="h5">Basket totals</h3>
                      <table className="table table-sm mb-3">
                        <tbody>
                          <tr>
                            <th>Basket total</th>
                            <td className="text-right">{kes(total)}</td>
                          </tr>
                          <tr>
                            <th>Order total</th>
                            <td className="text-right">
                              <strong>{kes(total)}</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <Link href="/checkout/" className="btn btn-primary btn-lg btn-block">
                        Proceed to checkout
                      </Link>
                      <Link href="/" className="btn btn-link btn-block">
                        Continue shopping
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
