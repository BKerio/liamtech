"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createSession, destroySession, getCurrentUser, verifyPassword } from "@/lib/auth";
import { mergeAnonymousBasket } from "@/lib/basket";
import { echo, type FormState } from "@/lib/forms";

export type { FormState };

/** Only allow same-site relative redirects. */
const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/accounts/";
};

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "This field is required."),
});

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values: echo(form) };
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.hashedPassword))) {
    return { values: echo(form), message: "Please enter a correct username and password. Note that both fields may be case-sensitive." };
  }
  await mergeAnonymousBasket(user.id);
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

const profileSchema = z.object({
  firstName: z.string().trim().max(255),
  lastName: z.string().trim().max(255),
  phone: z.string().trim().max(30),
});

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/accounts/login/");
  const parsed = profileSchema.safeParse({
    firstName: form.get("first_name") ?? "",
    lastName: form.get("last_name") ?? "",
    phone: form.get("phone") ?? "",
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values: echo(form) };
  await prisma.user.update({ where: { id: user.id }, data: parsed.data });
  return { message: "Profile updated", values: echo(form) };
}
