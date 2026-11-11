"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { uploadImage } from "@/lib/storage";
import { slugify } from "@/lib/format";
import { BANNER_PLACEMENTS, ORDER_STATUSES } from "@/lib/admin-constants";

// Every action below starts with requireAdmin(): server actions are public POST endpoints,
// so the page-level check in the admin layout is not enough on its own.

// ───────────────────────────── helpers ─────────────────────────────

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const optStr = (f: FormData, k: string) => str(f, k) || null;
const int = (f: FormData, k: string) => {
  const n = parseInt(str(f, k), 10);
  return Number.isFinite(n) ? n : null;
};
const bool = (f: FormData, k: string) => f.get(k) === "on";
const lines = (f: FormData, k: string) =>
  str(f, k)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
const files = (f: FormData, k: string) => f.getAll(k).filter((v): v is File => v instanceof File && v.size > 0);

function done(path: string, msg: string): never {
  revalidatePath("/", "layout");
  redirect(`${path}${path.includes("?") ? "&" : "?"}msg=${encodeURIComponent(msg)}`);
}
function fail(path: string, err: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}err=${encodeURIComponent(err)}`);
}
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function uploadOrFail(file: File, back: string) {
  try {
    return await uploadImage(file);
  } catch (e) {
    fail(back, e instanceof Error ? e.message : "Upload failed.");
  }
}

// ───────────────────────────── orders ─────────────────────────────

export async function updateOrderStatus(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const status = str(form, "status");
  const back = `/admin/orders/${id}/`;
  if (!id || !(ORDER_STATUSES as readonly string[]).includes(status)) fail(back, "Invalid status.");
  await prisma.order.update({ where: { id }, data: { status } });
  done(back, `Order marked ${status}.`);
}

// ───────────────────────────── products ─────────────────────────────

export async function saveProduct(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const back = id ? `/admin/products/${id}/` : "/admin/products/new/";

  const name = str(form, "name");
  const sku = str(form, "sku");
  const price = int(form, "price");
  const oldPrice = int(form, "oldPrice");
  const slugInput = str(form, "slug");
  if (!name) fail(back, "Name is required.");
  if (!sku) fail(back, "SKU is required.");
  if (price === null || price < 0) fail(back, "Price must be a whole number of shillings.");
  const slug = slugInput || `${slugify(name)}_${sku.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(slug)) fail(back, "Slug may only contain lowercase letters, numbers, - and _.");

  // images: keep the existing ones not ticked for removal (in their order), then append uploads
  const remove = new Set(form.getAll("remove_image").map(String));
  const kept = form.getAll("images").map(String).filter((src) => src && !remove.has(src));
  const uploaded: string[] = [];
  for (const file of files(form, "new_images")) uploaded.push((await uploadOrFail(file, back))!);
  const images = [...kept, ...uploaded];

  const categoryId = int(form, "categoryId");
  const manufacturerId = int(form, "manufacturerId");
  const data = {
    name,
    slug,
    sku,
    price: price!,
    oldPrice: oldPrice && oldPrice > price! ? oldPrice : null,
    inStock: bool(form, "inStock"),
    stockQty: Math.max(0, int(form, "stockQty") ?? 0),
    categoryId: categoryId || null,
    manufacturerId: manufacturerId || null,
    vehicleText: lines(form, "vehicleText"),
    images,
    thumbs: [] as string[], // the gallery falls back to the full images for thumbnails
    cardImage: images[0] ?? null,
  };

  try {
    const saved = id
      ? await prisma.product.update({ where: { id }, data })
      : await prisma.product.create({ data });
    done(`/admin/products/${saved.id}/`, id ? "Product saved." : "Product created.");
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      fail(back, "Another product already uses that slug.");
    throw e;
  }
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  if (id) await prisma.product.delete({ where: { id } });
  done("/admin/products/", "Product deleted.");
}

// ───────────────────────────── categories ─────────────────────────────

export async function saveCategory(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const back = "/admin/categories/";
  const name = str(form, "name");
  const segment = str(form, "slug") || slugify(name);
  const parentId = int(form, "parentId") || null;
  if (!name) fail(back, "Category name is required.");
  if (!SLUG_RE.test(segment)) fail(back, "Slug may only contain lowercase letters, numbers and dashes.");

  const parent = parentId ? await prisma.category.findUnique({ where: { id: parentId } }) : null;
  if (parentId && !parent) fail(back, "Parent category not found.");
  const path = parent ? `${parent.path}/${segment}` : segment;

  if (id) {
    const current = await prisma.category.findUnique({ where: { id } });
    if (!current) fail(back, "Category not found.");
    if (parent && (parent.id === id || parent.path.startsWith(current.path + "/")))
      fail(back, "A category can't be moved inside itself.");
    try {
      await prisma.$transaction(async (tx) => {
        await tx.category.update({ where: { id }, data: { name, path, parentId, position: int(form, "position") ?? current.position } });
        if (path !== current.path) {
          // re-root every descendant's path
          await tx.$executeRaw`UPDATE "Category" SET path = ${path} || substr(path, ${current.path.length + 1}) WHERE path LIKE ${current.path + "/%"}`;
        }
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") fail(back, `A category with the path "${path}" already exists.`);
      throw e;
    }
    done(back, `Category "${name}" saved.`);
  }

  try {
    await prisma.category.create({ data: { name, path, parentId, position: int(form, "position") ?? 0 } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") fail(back, `A category with the path "${path}" already exists.`);
    throw e;
  }
  done(back, `Category "${name}" created.`);
}

export async function deleteCategory(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const back = "/admin/categories/";
  if (!id) fail(back, "Missing category.");
  const [children, products] = await Promise.all([
    prisma.category.count({ where: { parentId: id } }),
    prisma.product.count({ where: { categoryId: id } }),
  ]);
  if (children || products)
    fail(back, `Can't delete: the category still has ${children} sub-categories and ${products} products. Move them first.`);
  await prisma.category.delete({ where: { id } });
  done(back, "Category deleted.");
}

// ───────────────────────────── manufacturers ─────────────────────────────

export async function saveManufacturer(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const back = "/admin/brands/";
  const name = str(form, "name");
  const slug = str(form, "slug") || slugify(name);
  if (!name) fail(back, "Brand name is required.");
  if (!SLUG_RE.test(slug)) fail(back, "Slug may only contain lowercase letters, numbers and dashes.");
  const logoFile = files(form, "logo")[0];
  const logo = logoFile ? await uploadOrFail(logoFile, back) : optStr(form, "currentLogo");
  const data = { name, slug, logo, featured: bool(form, "featured"), position: int(form, "position") ?? 0 };
  try {
    if (id) await prisma.manufacturer.update({ where: { id }, data });
    else await prisma.manufacturer.create({ data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") fail(back, "That brand name or slug is already used.");
    throw e;
  }
  done(back, `Brand "${name}" saved.`);
}

export async function deleteManufacturer(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const back = "/admin/brands/";
  if (!id) fail(back, "Missing brand.");
  const products = await prisma.product.count({ where: { manufacturerId: id } });
  if (products) fail(back, `Can't delete: ${products} products use this brand.`);
  await prisma.manufacturer.delete({ where: { id } });
  done(back, "Brand deleted.");
}

// ───────────────────────────── banners ─────────────────────────────

export async function saveBanner(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const back = "/admin/banners/";
  const placement = str(form, "placement");
  if (!(BANNER_PLACEMENTS as readonly string[]).includes(placement)) fail(back, "Choose a placement.");
  const imageFile = files(form, "image")[0];
  const mobileFile = files(form, "mobileImage")[0];
  const image = imageFile ? await uploadOrFail(imageFile, back) : optStr(form, "currentImage");
  if (!image) fail(back, "Upload an image for the banner.");
  const mobileImage = mobileFile
    ? await uploadOrFail(mobileFile, back)
    : bool(form, "removeMobile")
      ? null
      : optStr(form, "currentMobileImage");
  const data = {
    placement,
    image: image!,
    mobileImage,
    href: optStr(form, "href"),
    alt: str(form, "alt"),
    caption: optStr(form, "caption"),
    position: int(form, "position") ?? 0,
    active: bool(form, "active"),
  };
  if (id) await prisma.banner.update({ where: { id }, data });
  else await prisma.banner.create({ data });
  done(back, "Banner saved.");
}

export async function deleteBanner(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  if (id) await prisma.banner.delete({ where: { id } });
  done("/admin/banners/", "Banner deleted.");
}

// ───────────────────────────── home sections ─────────────────────────────

export async function saveHomeSection(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const back = "/admin/home/";
  const title = str(form, "title");
  if (!title) fail(back, "Section title is required.");
  const data = { title, position: int(form, "position") ?? 0 };
  if (id) await prisma.homeSection.update({ where: { id }, data });
  else await prisma.homeSection.create({ data });
  done(back, `Section "${title}" saved.`);
}

export async function deleteHomeSection(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  if (id) await prisma.homeSection.delete({ where: { id } });
  done("/admin/home/", "Section deleted.");
}

export async function addHomeSectionItem(form: FormData) {
  await requireAdmin();
  const sectionId = int(form, "sectionId");
  const back = "/admin/home/";
  const ref = str(form, "product");
  if (!sectionId || !ref) fail(back, "Enter a product SKU or slug.");
  const product = await prisma.product.findFirst({
    where: { OR: [{ sku: { equals: ref, mode: "insensitive" } }, { slug: ref }] },
  });
  if (!product) fail(back, `No product with SKU or slug "${ref}".`);
  const last = await prisma.homeSectionItem.aggregate({ where: { sectionId }, _max: { position: true } });
  await prisma.homeSectionItem.create({
    data: { sectionId, productId: product.id, position: (last._max.position ?? -1) + 1 },
  });
  done(back, `Added "${product.name}".`);
}

export async function moveHomeSectionItem(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const dir = str(form, "dir");
  const item = id ? await prisma.homeSectionItem.findUnique({ where: { id } }) : null;
  if (!item) done("/admin/home/", "Item not found.");
  const siblings = await prisma.homeSectionItem.findMany({ where: { sectionId: item.sectionId }, orderBy: { position: "asc" } });
  const i = siblings.findIndex((s) => s.id === item.id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (j >= 0 && j < siblings.length) {
    [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
    await prisma.$transaction(siblings.map((s, pos) => prisma.homeSectionItem.update({ where: { id: s.id }, data: { position: pos } })));
  }
  done("/admin/home/", "Order updated.");
}

export async function removeHomeSectionItem(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  if (id) await prisma.homeSectionItem.delete({ where: { id } });
  done("/admin/home/", "Product removed from section.");
}

// ───────────────────────────── CMS pages ─────────────────────────────

const RESERVED_SLUGS = ["admin", "api", "media", "static", "catalogue", "search", "basket", "checkout", "accounts", "stores", "contact"];

export async function savePage(form: FormData) {
  await requireAdmin();
  const originalSlug = str(form, "originalSlug");
  const back = originalSlug ? `/admin/pages/${originalSlug}/` : "/admin/pages/new/";
  const slug = str(form, "slug");
  const title = str(form, "title");
  const body = String(form.get("body") ?? "");
  if (!title) fail(back, "Title is required.");
  if (!SLUG_RE.test(slug)) fail(back, "URL slug may only contain lowercase letters, numbers and dashes.");
  if (RESERVED_SLUGS.includes(slug)) fail(back, `"${slug}" is reserved by the site.`);
  try {
    if (originalSlug) await prisma.page.update({ where: { slug: originalSlug }, data: { slug, title, body } });
    else await prisma.page.create({ data: { slug, title, body } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") fail(back, `A page at /${slug}/ already exists.`);
    throw e;
  }
  done(`/admin/pages/${slug}/`, "Page saved.");
}

export async function deletePage(form: FormData) {
  await requireAdmin();
  const slug = str(form, "slug");
  if (slug) await prisma.page.delete({ where: { slug } });
  done("/admin/pages/", "Page deleted.");
}

// ───────────────────────────── stores ─────────────────────────────

export async function saveStore(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const back = id ? `/admin/stores/${id}/` : "/admin/stores/new/";
  const name = str(form, "name");
  const region = str(form, "region");
  const slug = str(form, "slug") || slugify(name);
  if (!name || !region) fail(back, "Name and region are required.");
  if (!SLUG_RE.test(slug)) fail(back, "Slug may only contain lowercase letters, numbers and dashes.");

  // "Monday: 08:00 - 17:00" per line
  const hours = lines(form, "hours").map((l) => {
    const [day, ...rest] = l.split(":");
    return { day: day.trim(), time: rest.join(":").trim() };
  });
  if (hours.some((h) => !h.day || !h.time)) fail(back, 'Opening times must be one per line, e.g. "Monday: 08:00 - 17:00".');

  const imageFile = files(form, "image")[0];
  const image = imageFile ? await uploadOrFail(imageFile, back) : optStr(form, "currentImage");
  const lat = parseFloat(str(form, "lat"));
  const lng = parseFloat(str(form, "lng"));
  const data = {
    name,
    slug,
    region,
    address: lines(form, "address"),
    phones: lines(form, "phones"),
    email: optStr(form, "email"),
    hours,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    image,
    position: int(form, "position") ?? 0,
  };
  try {
    const saved = id ? await prisma.store.update({ where: { id }, data }) : await prisma.store.create({ data });
    done(`/admin/stores/${saved.id}/`, "Store saved.");
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") fail(back, "Another store already uses that slug.");
    throw e;
  }
}

export async function deleteStore(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  if (id) await prisma.store.delete({ where: { id } }); // orders keep their data (storeId → null)
  done("/admin/stores/", "Store deleted.");
}

// ───────────────────────────── messages & reviews ─────────────────────────────

export async function deleteMessage(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  if (id) await prisma.contactMessage.delete({ where: { id } });
  done("/admin/messages/", "Message deleted.");
}

export async function setReviewApproved(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const approved = str(form, "approved") === "true";
  if (id) await prisma.review.update({ where: { id }, data: { approved } });
  done("/admin/reviews/", approved ? "Review published." : "Review hidden.");
}

export async function deleteReview(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  if (id) await prisma.review.delete({ where: { id } });
  done("/admin/reviews/", "Review deleted.");
}
