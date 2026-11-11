import Link from "next/link";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { kes, discountPercent } from "@/lib/format";
import { AdminHeader, Pager, Thumb, one, type SP } from "@/components/admin/ui";

export const metadata = { title: "Products" };
const PER_PAGE = 30;

export default async function AdminProducts({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (one(sp.q) ?? "").trim();
  const stock = one(sp.stock) ?? "";
  const categoryId = parseInt(one(sp.category) ?? "", 10) || undefined;
  const page = Math.max(1, parseInt(one(sp.page) ?? "1", 10) || 1);

  const where: Prisma.ProductWhereInput = {
    AND: [
      ...q
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => ({ OR: [{ name: { contains: w, mode: "insensitive" as const } }, { sku: { contains: w, mode: "insensitive" as const } }] })),
      stock === "out" ? { inStock: false } : stock === "in" ? { inStock: true } : {},
      stock === "sale" ? { oldPrice: { not: null } } : {},
      categoryId ? { category: { OR: [{ id: categoryId }, { parent: { id: categoryId } }, { parent: { parent: { id: categoryId } } }] } } : {},
    ],
  };
  const [total, products, roots] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { category: { select: { name: true } }, manufacturer: { select: { name: true } } },
    }),
    prisma.category.findMany({ where: { parentId: null }, orderBy: { position: "asc" } }),
  ]);
  const href = (p: number) =>
    `/admin/products/?${new URLSearchParams({ ...(q && { q }), ...(stock && { stock }), ...(categoryId && { category: String(categoryId) }), page: String(p) })}`;

  return (
    <>
      <AdminHeader
        title={`Products (${total})`}
        sp={sp}
        actions={
          <Link href="/admin/products/new/" className="btn btn-primary">
            + New product
          </Link>
        }
      />
      <form className="form-inline mb-3" method="get">
        <input name="q" defaultValue={q} className="form-control form-control-sm mr-2" placeholder="Search name or SKU" style={{ minWidth: 240 }} />
        <select name="category" defaultValue={categoryId ?? ""} className="form-control form-control-sm mr-2">
          <option value="">All categories</option>
          {roots.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="stock" defaultValue={stock} className="form-control form-control-sm mr-2">
          <option value="">Any stock</option>
          <option value="in">In stock</option>
          <option value="out">Out of stock</option>
          <option value="sale">On sale</option>
        </select>
        <button className="btn btn-sm btn-primary">Filter</button>
      </form>
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th></th>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Brand</th>
                <th className="text-right">Price</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    No products found.
                  </td>
                </tr>
              )}
              {products.map((p) => {
                const off = discountPercent(p.price, p.oldPrice);
                return (
                  <tr key={p.id}>
                    <td>
                      <Thumb src={p.cardImage} />
                    </td>
                    <td>
                      <Link href={`/admin/products/${p.id}/`}>{p.name}</Link>
                    </td>
                    <td className="small">{p.sku}</td>
                    <td className="small">{p.category?.name ?? "—"}</td>
                    <td className="small">{p.manufacturer?.name ?? "—"}</td>
                    <td className="text-right text-nowrap">
                      {kes(p.price)}
                      {off > 0 && <div className="small text-danger">{off}% off</div>}
                    </td>
                    <td>{p.inStock ? <span className="badge badge-success">{p.stockQty}</span> : <span className="badge badge-secondary">Out</span>}</td>
                    <td className="text-right text-nowrap">
                      <Link href={`/catalogue/${p.slug}/`} target="_blank" className="small mr-2">
                        View
                      </Link>
                      <Link href={`/admin/products/${p.id}/`} className="btn btn-sm btn-outline-primary">
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Pager page={page} pages={Math.ceil(total / PER_PAGE)} href={href} />
    </>
  );
}
