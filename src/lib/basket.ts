import "server-only";
import { cookies } from "next/headers";
import prisma from "./prisma";
import { getCurrentUser } from "./auth";

export const BASKET_COOKIE = "basket_id";

const lineInclude = {
  lines: {
    orderBy: { id: "asc" as const },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          sku: true,
          price: true,
          oldPrice: true,
          inStock: true,
          stockQty: true,
          cardImage: true,
        },
      },
    },
  },
};

export type BasketWithLines = NonNullable<Awaited<ReturnType<typeof getBasket>>>;

/** Read-only lookup of the visitor's open basket (safe to call while rendering). */
export async function getBasket() {
  const user = await getCurrentUser();
  if (user) {
    const b = await prisma.basket.findFirst({
      where: { userId: user.id, status: "open" },
      orderBy: { updatedAt: "desc" },
      include: lineInclude,
    });
    if (b) return b;
  }
  const id = (await cookies()).get(BASKET_COOKIE)?.value;
  if (!id) return null;
  const b = await prisma.basket.findUnique({ where: { id }, include: lineInclude });
  return b && b.status === "open" ? b : null;
}

/** Gets or creates the open basket. Sets a cookie — server actions / route handlers only. */
export async function getOrCreateBasket() {
  const existing = await getBasket();
  if (existing) return existing;
  const user = await getCurrentUser();
  const b = await prisma.basket.create({
    data: { userId: user?.id ?? null },
    include: lineInclude,
  });
  (await cookies()).set(BASKET_COOKIE, b.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return b;
}

/** On login, merge the anonymous basket into the user's basket. */
export async function mergeAnonymousBasket(userId: string) {
  const anonId = (await cookies()).get(BASKET_COOKIE)?.value;
  if (!anonId) return;
  const anon = await prisma.basket.findUnique({ where: { id: anonId }, include: { lines: true } });
  if (!anon || anon.status !== "open" || anon.userId === userId) return;
  const userBasket = await prisma.basket.findFirst({ where: { userId, status: "open" } });
  if (!userBasket) {
    await prisma.basket.update({ where: { id: anon.id }, data: { userId } });
    return;
  }
  for (const line of anon.lines) {
    await prisma.basketLine.upsert({
      where: { basketId_productId: { basketId: userBasket.id, productId: line.productId } },
      create: { basketId: userBasket.id, productId: line.productId, quantity: line.quantity },
      update: { quantity: { increment: line.quantity } },
    });
  }
  await prisma.basket.delete({ where: { id: anon.id } });
  (await cookies()).set(BASKET_COOKIE, userBasket.id, { httpOnly: true, sameSite: "lax", path: "/" });
}

export function basketTotals(basket: BasketWithLines | null) {
  const lines = basket?.lines ?? [];
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const total = lines.reduce((n, l) => n + l.quantity * l.product.price, 0);
  return { count, total };
}
