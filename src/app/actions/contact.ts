"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { echo, type FormState } from "@/lib/forms";

const contactSchema = z.object({
  name: z.string().trim().min(1, "This field is required.").max(100),
  email: z.string().trim().email("Enter a valid email address.").max(200),
  body: z.string().trim().min(1, "This field is required.").max(5000),
});

export async function sendContactMessage(_: FormState, form: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse({ name: form.get("name"), email: form.get("email"), body: form.get("body") });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values: echo(form) };
  await prisma.contactMessage.create({ data: parsed.data });
  return { message: "Thank you for your enquiry. We will get back to you shortly." };
}

const reviewSchema = z.object({
  productId: z.coerce.number().int(),
  title: z.string().trim().min(1, "This field is required.").max(255),
  score: z.coerce.number().int().min(1, "Please choose a score.").max(5),
  body: z.string().trim().min(1, "This field is required.").max(5000),
  name: z.string().trim().min(1, "This field is required.").max(255),
  email: z.string().trim().email("Enter a valid email address."),
});

export async function addReview(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  const parsed = reviewSchema.safeParse({
    productId: form.get("product_id"),
    title: form.get("title"),
    score: form.get("score") ?? 0,
    body: form.get("body"),
    name: form.get("name") || [user?.firstName, user?.lastName].filter(Boolean).join(" "),
    email: form.get("email") || user?.email,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values: echo(form) };
  await prisma.review.create({ data: { ...parsed.data, userId: user?.id } });
  return { message: "Thank you for reviewing this product" };
}
