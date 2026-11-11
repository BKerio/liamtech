"use client";

import Link from "next/link";
import { useTransition } from "react";
import { removeBasketLine, updateBasketLine } from "@/app/actions/basket";
import { kes, srcSet } from "@/lib/format";

type Line = {
  id: number;
  quantity: number;
  slug: string;
  name: string;
  sku: string;
  price: number;
  oldPrice: number | null;
  inStock: boolean;
  image: string | null;
};

export default function BasketLines({ lines }: { lines: Line[] }) {
  const [pending, start] = useTransition();
  return (
    <div className="basket-lines" style={pending ? { opacity: 0.6 } : undefined}>
      {lines.map((l) => (
        <div className="basket-line py-3" key={l.id}>
          <div className="row align-items-center">
            <div className="col-3 col-md-2">
              <Link href={`/catalogue/${l.slug}/`}>
                <img className="img-fluid" src={l.image ?? undefined} srcSet={srcSet(l.image)} alt={l.name} />
              </Link>
            </div>
            <div className="col-9 col-md-5">
              <h3 className="basket-line-title">
                <Link href={`/catalogue/${l.slug}/`}>{l.name}</Link>
              </h3>
              <p className="text-muted small mb-1">Product code: {l.sku}</p>
              {!l.inStock && <p className="basket-line-availability--outofstock mb-1">Out of stock</p>}
              <a
                href="#"
                className="small"
                onClick={(e) => {
                  e.preventDefault();
                  start(() => removeBasketLine(l.id));
                }}
              >
                Remove
              </a>
            </div>
            <div className="col-6 col-md-2 mt-2 mt-md-0">
              <select
                className="form-control form-control-sm"
                value={l.quantity}
                aria-label="Quantity"
                onChange={(e) => {
                  const q = Number(e.target.value);
                  start(() => updateBasketLine(l.id, q));
                }}
              >
                {Array.from({ length: Math.max(9, l.quantity) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3 text-right mt-2 mt-md-0">
              <div className="stockrecord-prices">
                <span className="stockrecord-price-current">{kes(l.price * l.quantity)}</span>
              </div>
              {l.quantity > 1 && <div className="text-muted small">{kes(l.price)} each</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
