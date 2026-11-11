"use client";

import { useActionState, useState } from "react";
import { placeOrder } from "@/app/actions/checkout";
import Field, { SubmitButton } from "@/components/forms/Field";
import { NonFieldError } from "@/components/forms/AccountForms";

type Props = {
  stores: { id: number; name: string; region: string }[];
  user: { firstName: string | null; lastName: string | null; email: string; phone: string | null } | null;
};

export default function CheckoutForm({ stores, user }: Props) {
  const [state, action] = useActionState(placeOrder, undefined);
  const [method, setMethod] = useState<"pickup" | "delivery">("pickup");
  const e = state?.errors;
  const v = state?.values;
  const regions = Array.from(new Set(stores.map((s) => s.region)));

  return (
    <form action={action}>
      <NonFieldError message={state?.message} />
      <div className="card mb-3">
        <div className="card-header">Your details</div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <Field name="first_name" label="First name" required defaultValue={v?.first_name ?? user?.firstName} errors={e?.firstName} />
            </div>
            <div className="col-md-6">
              <Field name="last_name" label="Last name" required defaultValue={v?.last_name ?? user?.lastName} errors={e?.lastName} />
            </div>
            <div className="col-md-6">
              <Field name="email" label="Email address" type="email" required defaultValue={v?.email ?? user?.email} errors={e?.email} />
            </div>
            <div className="col-md-6">
              <Field name="phone" label="Phone number" type="tel" required defaultValue={v?.phone ?? user?.phone} errors={e?.phone} />
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header">Delivery &amp; Pickup</div>
        <div className="card-body">
          <div className="form-group">
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="method"
                id="method_pickup"
                value="pickup"
                checked={method === "pickup"}
                onChange={() => setMethod("pickup")}
              />
              <label className="form-check-label" htmlFor="method_pickup">
                Click &amp; Collect — pick up from one of our stores (free)
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="method"
                id="method_delivery"
                value="delivery"
                checked={method === "delivery"}
                onChange={() => setMethod("delivery")}
              />
              <label className="form-check-label" htmlFor="method_delivery">
                Delivery — we will contact you with the delivery cost
              </label>
            </div>
          </div>

          {method === "pickup" ? (
            <div className="form-group">
              <label htmlFor="id_store" className="col-form-label required">
                Store
              </label>
              <select name="store" id="id_store" className={`form-control${e?.storeId ? " is-invalid" : ""}`} required defaultValue={v?.store ?? ""} key={v?.store}>
                <option value="">---------</option>
                {regions.map((r) => (
                  <optgroup label={r} key={r}>
                    {stores
                      .filter((s) => s.region === r)
                      .map((s) => (
                        <option value={s.id} key={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              {e?.storeId?.map((m) => (
                <div className="invalid-feedback d-block" key={m}>
                  {m}
                </div>
              ))}
            </div>
          ) : (
            <div className="row">
              <div className="col-md-8">
                <Field name="address" label="Delivery address" required errors={e?.address} defaultValue={v?.address} />
              </div>
              <div className="col-md-4">
                <Field name="city" label="Town / City" required errors={e?.city} defaultValue={v?.city} />
              </div>
            </div>
          )}
          <Field name="notes" label="Order notes (optional)" textarea errors={e?.notes} defaultValue={v?.notes} />
        </div>
      </div>

      <p className="text-muted small">
        Payment is made on collection or delivery. Our team will call you to confirm availability before your order is
        prepared.
      </p>
      <SubmitButton pendingText="Placing order..." className="btn btn-primary btn-lg">
        Place order
      </SubmitButton>
    </form>
  );
}
