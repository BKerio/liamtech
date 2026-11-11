"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, updateProfile } from "@/app/actions/account";
import Field, { SubmitButton } from "./Field";

export function NonFieldError({ message, tone = "danger" }: { message?: string; tone?: "danger" | "success" }) {
  if (!message) return null;
  return <div className={`alert alert-${tone}`}>{message}</div>;
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="card">
      <div className="card-body">
        <NonFieldError message={state?.message} />
        <input type="hidden" name="next" value={next ?? ""} />
        <Field name="email" id="id_auth-username" label="Email address" type="email" required maxLength={254} errors={state?.errors?.email} defaultValue={state?.values?.email} />
        <Field
          name="password"
          id="id_auth-password"
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          errors={state?.errors?.password}
        />
      </div>
      <div className="card-footer">
        <Link className="customer-login-forgotten-password" href="/contact/">
          Forgotten your password?
        </Link>
        <SubmitButton pendingText="Logging in...">Login</SubmitButton>
      </div>
    </form>
  );
}

export function ProfileForm({ user }: { user: { firstName: string | null; lastName: string | null; phone: string | null } }) {
  const [state, action] = useActionState(updateProfile, undefined);
  return (
    <form action={action} className="form-stacked">
      <NonFieldError message={state?.message} tone={state?.errors ? "danger" : "success"} />
      <Field name="first_name" label="First name" defaultValue={state?.values?.first_name ?? user.firstName} errors={state?.errors?.firstName} />
      <Field name="last_name" label="Last name" defaultValue={state?.values?.last_name ?? user.lastName} errors={state?.errors?.lastName} />
      <Field name="phone" label="Phone number" type="tel" defaultValue={state?.values?.phone ?? user.phone} errors={state?.errors?.phone} />
      <SubmitButton pendingText="Saving...">Save</SubmitButton>
    </form>
  );
}
