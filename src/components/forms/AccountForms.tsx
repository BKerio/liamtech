"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, updateProfile } from "@/app/actions/account";
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

function RegisterFields({ errors, values }: { errors?: Record<string, string[]>; values?: Record<string, string> }) {
  return (
    <>
      <Field name="first_name" label="First name" maxLength={255} errors={errors?.firstName} defaultValue={values?.first_name} />
      <Field name="last_name" label="Last name" maxLength={255} errors={errors?.lastName} defaultValue={values?.last_name} />
      <Field name="email" label="Email address" type="email" required maxLength={320} errors={errors?.email} defaultValue={values?.email} />
      <Field name="password1" label="Password" type="password" required autoComplete="new-password" errors={errors?.password} />
      <div className="form-group">
        <div className="">
          <div className="form-check">
            <input type="checkbox" name="personal_data_consent" className="form-check-input" id="id_personal_data_consent" defaultChecked />
            <label htmlFor="id_personal_data_consent" className="form-check-label ">
              We value your privacy. By checking this box, you agree to receive occasional emails about our products and
              services. You can unsubscribe at any time.
            </label>
          </div>
        </div>
      </div>
    </>
  );
}

/** Register card used beside the login form. */
export function RegisterCard({ next }: { next?: string }) {
  const [state, action] = useActionState(register, undefined);
  return (
    <form action={action} className="card">
      <div className="card-body">
        <NonFieldError message={state?.message} />
        <input type="hidden" name="next" value={next ?? ""} />
        <RegisterFields errors={state?.errors} values={state?.values} />
      </div>
      <div className="card-footer">
        <SubmitButton pendingText="Registering..." name="registration_submit">
          Register
        </SubmitButton>
      </div>
    </form>
  );
}

/** Stand-alone /accounts/register/ form. */
export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState(register, undefined);
  return (
    <form id="register_form" action={action} className="form-stacked">
      <NonFieldError message={state?.message} />
      <input type="hidden" name="next" value={next ?? ""} />
      <RegisterFields errors={state?.errors} values={state?.values} />
      <SubmitButton pendingText="Registering..." className="btn btn-primary btn-lg" name="registration_submit">
        Register
      </SubmitButton>
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
