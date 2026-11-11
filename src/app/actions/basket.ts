"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getBasket, getOrCreateBasket } from "@/lib/basket";

const MAX_LINE_QTY = 99;

export async function addToBasket(productId: number, quantity: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, message: "Product not found." };
  if (!product.inStock) return { ok: false, message: `'${product.name}' is out of stock.` };
  const qty = Math.max(1, Math.min(MAX_LINE_QTY, Math.floor(quantity) || 1));

  const basket = await getOrCreateBasket();
  await prisma.basketLine.upsert({
    where: { basketId_productId: { basketId: basket.id, productId } },
    create: { basketId: basket.id, productId, quantity: qty },
    update: { quantity: { increment: qty } },
  });
  await prisma.basket.update({ where: { id: basket.id }, data: { updatedAt: new Date() } });
  revalidatePath("/", "layout");
  return { ok: true, message: `'${product.name}' has been added to your basket.` };
}

async function ownLine(lineId: number) {
  const basket = await getBasket();
  if (!basket) return null;
  return basket.lines.find((l) => l.id === lineId) ?? null;
}

export async function updateBasketLine(lineId: number, quantity: number) {
  const line = await ownLine(lineId);
  if (!line) return;
  const qty = Math.floor(quantity);
  if (qty <= 0) await prisma.basketLine.delete({ where: { id: lineId } });
  else await prisma.basketLine.update({ where: { id: lineId }, data: { quantity: Math.min(qty, MAX_LINE_QTY) } });
  revalidatePath("/", "layout");
}

export async function removeBasketLine(lineId: number) {
  const line = await ownLine(lineId);
  if (!line) return;
  await prisma.basketLine.delete({ where: { id: lineId } });
  revalidatePath("/", "layout");
}
