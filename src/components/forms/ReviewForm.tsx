"use client";

import Link from "next/link";
import { useActionState } from "react";
import { addReview } from "@/app/actions/contact";
import Field, { SubmitButton } from "./Field";
import { NonFieldError } from "./AccountForms";

export default function ReviewForm({
  productId,
  productSlug,
  user,
}: {
  productId: number;
  productSlug: string;
  user: { name: string; email: string } | null;
}) {
  const [state, action] = useActionState(addReview, undefined);
  if (state?.message && !state.errors)
    return (
      <div className="alert alert-success">
        {state.message}. <Link href={`/catalogue/${productSlug}/`}>Back to the product</Link>
      </div>
    );
  const e = state?.errors;
  return (
    <form id="addreview" action={action} className="card">
      <div className="card-body">
        <NonFieldError message={state?.message} />
        <input type="hidden" name="product_id" value={productId} />
        <Field name="title" label="Title" required maxLength={255} errors={e?.title} defaultValue={state?.values?.title} />
        <div className="form-group">
          <label className="col-form-label required">Score</label>
          <div>
            {[1, 2, 3, 4, 5].map((n) => (
              <div className="form-check form-check-inline" key={n}>
                <input className="form-check-input" type="radio" name="score" id={`id_score_${n}`} value={n} required defaultChecked={state?.values?.score === String(n)} />
                <label className="form-check-label" htmlFor={`id_score_${n}`}>
                  {n}
                </label>
              </div>
            ))}
            {e?.score?.map((m) => (
              <div className="invalid-feedback d-block" key={m}>
                {m}
              </div>
            ))}
          </div>
        </div>
        <Field name="body" label="Body" required textarea errors={e?.body} defaultValue={state?.values?.body} />
        {!user && (
          <>
            <Field name="name" label="Name" required errors={e?.name} defaultValue={state?.values?.name} />
            <Field name="email" label="Email" type="email" required errors={e?.email} defaultValue={state?.values?.email} />
          </>
        )}
      </div>
      <div className="card-footer">
        <SubmitButton pendingText="Saving...">Save review</SubmitButton>{" "}
        <Link href={`/catalogue/${productSlug}/`} className="btn btn-link">
          cancel
        </Link>
      </div>
    </form>
  );
}
