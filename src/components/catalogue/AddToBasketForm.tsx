"use client";

import { useState, useTransition } from "react";
import { addToBasket } from "@/app/actions/basket";
import { showToast } from "@/components/Toasts";

export default function AddToBasketForm({ productId, maxQty }: { productId: number; maxQty: number }) {
  const [qty, setQty] = useState(1);
  const [pending, start] = useTransition();

  if (maxQty < 1) {
    return (
      <div className="add_to_cart">
        <button className="btn btn-icon btn-block btn-lg btn-secondary" disabled>
          Out of stock
        </button>
      </div>
    );
  }

  return (
    <form
      className="js-basket-add-form basket-add-form"
      method="post"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await addToBasket(productId, qty);
          showToast(res.message, res.ok ? "success" : "danger");
        });
      }}
    >
      <div className="add_to_cart">
        <select className="form-control quantity" name="quantity" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
          {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
            <option value={n} key={n}>
              {n}
            </option>
          ))}
        </select>
        <button className="js-add-to-cart-button btn btn-icon btn-block btn-lg btn-primary" disabled={pending}>
          {pending ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </form>
  );
}
