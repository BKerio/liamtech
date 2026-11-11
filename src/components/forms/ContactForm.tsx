"use client";

import { useActionState } from "react";
import { sendContactMessage } from "@/app/actions/contact";
import Field, { SubmitButton } from "./Field";
import { NonFieldError } from "./AccountForms";

export default function ContactForm() {
  const [state, action] = useActionState(sendContactMessage, undefined);
  if (state?.message && !state.errors) return <div className="alert alert-success">{state.message}</div>;
  return (
    <form className="contact-form" action={action}>
      <NonFieldError message={state?.message} />
      <Field name="name" label="Your name" required maxLength={100} errors={state?.errors?.name} defaultValue={state?.values?.name} />
      <Field name="email" label="Your email address" type="email" required maxLength={200} errors={state?.errors?.email} defaultValue={state?.values?.email} />
      <Field name="body" label="Your message" required textarea errors={state?.errors?.body} defaultValue={state?.values?.body} />
      <p>
        <SubmitButton pendingText="Sending...">Submit</SubmitButton>
      </p>
    </form>
  );
}
