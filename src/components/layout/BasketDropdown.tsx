"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import Icon from "@/components/Icon";
import { kes, srcSet } from "@/lib/format";
import { removeBasketLine } from "@/app/actions/basket";

export type BasketSummary = {
  count: number;
  total: number;
  lines: { id: number; slug: string; name: string; quantity: number; price: number; image: string | null }[];
};

export default function BasketDropdown({ basket }: { basket: BasketSummary }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  return (
    <>
      <div className={`btn-group${open ? " show" : ""}`} role="group" ref={ref}>
        <button
          id="header-basket-btn"
          className="btn btn-link"
          type="button"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name="basket" />
        </button>
        <div
          id="header-basket-dropdown"
          className={`dropdown-menu dropdown-menu-right dropdown-basket${open ? " show" : ""}`}
          aria-labelledby="header-basket-btn"
          style={open ? { position: "absolute", right: 0, left: "auto", top: "100%" } : undefined}
        >
          <div className="basket-compact" style={pending ? { opacity: 0.5 } : undefined}>
            {basket.lines.length === 0 && <p className="text-center px-2">Your basket is empty!</p>}
            <div className="basket-lines pt-2">
              {basket.lines.map((l) => (
                <div className="basket-line" key={l.id}>
                  <div className="row no-gutters">
                    <div className="col-3">
                      <Link href={`/catalogue/${l.slug}/`}>
                        <img className="img-fluid" src={l.image ?? undefined} srcSet={srcSet(l.image)} alt={l.name} />
                      </Link>
                    </div>
                    <div className="col-9 pl-2">
                      <div className="basket-line-description">
                        <Link href={`/catalogue/${l.slug}/`}>{l.name}</Link>
                      </div>
                      <div className="basket-line-amount">
                        <span className="basket-line-quantity">Qty {l.quantity}</span>
                        <span className="basket-line-price">{kes(l.price * l.quantity)}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href="#"
                    className="basket-line-remove text-muted"
                    title="Remove"
                    onClick={(e) => {
                      e.preventDefault();
                      start(() => removeBasketLine(l.id));
                    }}
                  >
                    &times;
                  </a>
                </div>
              ))}
            </div>
            <div className="basket-details">
              <div className="basket-total total">
                <span className="amount-label">Total</span>
                <span className="amount-value">{kes(basket.total)}</span>
              </div>
            </div>
            {basket.lines.length > 0 && (
              <div className="px-2 pt-2 pb-1">
                <Link className="btn btn-outline-primary btn-block btn-sm" href="/basket/">
                  View basket
                </Link>
                <Link className="btn btn-primary btn-block btn-sm" href="/checkout/">
                  Checkout now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <span className="badge badge-pill header-basket-quantity">{basket.count || ""}</span>
    </>
  );
}
