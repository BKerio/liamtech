"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getBasket, basketTotals } from "@/lib/basket";
import { getCurrentUser } from "@/lib/auth";
import { echo, type FormState } from "@/lib/forms";

const schema = z
  .object({
    firstName: z.string().trim().min(1, "This field is required."),
    lastName: z.string().trim().min(1, "This field is required."),
    email: z.string().trim().email("Enter a valid email address."),
    phone: z
      .string()
      .transform((s) => s.replace(/[\s-]/g, ""))
      .pipe(z.string().regex(/^(\+?254|0)[17]\d{8}$/, "Enter a valid Kenyan phone number, e.g. 0712 345678.")),
    method: z.enum(["pickup", "delivery"]),
    storeId: z.coerce.number().int().optional(),
    address: z.string().trim().optional(),
    city: z.string().trim().optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.method === "pickup" && !d.storeId)
      ctx.addIssue({ code: "custom", path: ["storeId"], message: "Please choose a store." });
    if (d.method === "delivery" && !d.address)
      ctx.addIssue({ code: "custom", path: ["address"], message: "This field is required." });
    if (d.method === "delivery" && !d.city)
      ctx.addIssue({ code: "custom", path: ["city"], message: "This field is required." });
  });

export async function placeOrder(_: FormState, form: FormData): Promise<FormState> {
  const basket = await getBasket();
  if (!basket || basket.lines.length === 0) redirect("/basket/");

  const parsed = schema.safeParse({
    firstName: form.get("first_name"),
    lastName: form.get("last_name"),
    email: form.get("email"),
    phone: form.get("phone"),
    method: form.get("method"),
    storeId: form.get("store") || undefined,
    address: form.get("address") || undefined,
    city: form.get("city") || undefined,
    notes: form.get("notes") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values: echo(form) };

  const unavailable = basket.lines.filter((l) => !l.product.inStock);
  if (unavailable.length)
    return { values: echo(form), message: `Please remove out of stock items: ${unavailable.map((l) => l.product.name).join(", ")}` };

  const user = await getCurrentUser();
  const { total } = basketTotals(basket);
  const d = parsed.data;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        number: `tmp-${randomUUID()}`,
        userId: user?.id,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phone: d.phone,
        method: d.method,
        storeId: d.method === "pickup" ? d.storeId : null,
        address: d.method === "delivery" ? d.address : null,
        city: d.method === "delivery" ? d.city : null,
        notes: d.notes,
        total,
        lines: {
          create: basket.lines.map((l) => ({
            productId: l.product.id,
            productSlug: l.product.slug,
            title: l.product.name,
            sku: l.product.sku,
            image: l.product.cardImage,
            unitPrice: l.product.price,
            quantity: l.quantity,
          })),
        },
      },
    });
    const number = String(100000 + created.id);
    await tx.order.update({ where: { id: created.id }, data: { number } });
    await tx.basket.update({ where: { id: basket.id }, data: { status: "submitted" } });
    for (const l of basket.lines)
      await tx.product.update({ where: { id: l.product.id }, data: { popularity: { increment: l.quantity } } });
    return { ...created, number };
  });

  revalidatePath("/", "layout");
  redirect(`/checkout/thank-you/?order=${order.number}&email=${encodeURIComponent(order.email)}`);
}
