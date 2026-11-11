import Link from "next/link";
import type { Product } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getCategoryTree, type CategoryNode } from "@/lib/catalogue";
import { saveProduct, deleteProduct } from "@/app/admin/actions";
import ConfirmButton from "./ConfirmButton";
import { ActionButton } from "./ui";

function categoryOptions(nodes: CategoryNode[], depth = 0): { id: number; label: string }[] {
  return nodes.flatMap((n) => [{ id: n.id, label: `${"— ".repeat(depth)}${n.name}` }, ...categoryOptions(n.children, depth + 1)]);
}

export default async function ProductForm({ product }: { product?: Product }) {
  const [{ roots }, brands] = await Promise.all([getCategoryTree(), prisma.manufacturer.findMany({ orderBy: { name: "asc" } })]);
  const cats = categoryOptions(roots);
  const p = product;

  return (
    <>
      <form action={saveProduct}>
        {p && <input type="hidden" name="id" value={p.id} />}
        <div className="row">
          <div className="col-lg-8">
            <div className="card mb-3">
              <div className="card-body">
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input id="name" name="name" className="form-control" required defaultValue={p?.name} />
                </div>
                <div className="form-row">
                  <div className="form-group col-md-4">
                    <label htmlFor="sku">SKU *</label>
                    <input id="sku" name="sku" className="form-control" required defaultValue={p?.sku} />
                  </div>
                  <div className="form-group col-md-8">
                    <label htmlFor="slug">URL slug</label>
                    <input id="slug" name="slug" className="form-control" defaultValue={p?.slug} placeholder="auto-generated from name + SKU" />
                    <small className="form-text text-muted">/catalogue/&lt;slug&gt;/ — changing it breaks old links.</small>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label htmlFor="categoryId">Category</label>
                    <select id="categoryId" name="categoryId" className="form-control" defaultValue={p?.categoryId ?? ""}>
                      <option value="">— none —</option>
                      {cats.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group col-md-6">
                    <label htmlFor="manufacturerId">Brand</label>
                    <select id="manufacturerId" name="manufacturerId" className="form-control" defaultValue={p?.manufacturerId ?? ""}>
                      <option value="">— none —</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group mb-0">
                  <label htmlFor="vehicleText">Applicable vehicles</label>
                  <textarea id="vehicleText" name="vehicleText" rows={3} className="form-control" defaultValue={p?.vehicleText.join("\n")} placeholder={"One per line, e.g.\nToyota Hilux (2005-2015)"} />
                  <small className="form-text text-muted">Shown on the product page.</small>
                </div>
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-header bg-white">
                <strong>Images</strong> <span className="text-muted small">— the first image is the listing thumbnail</span>
              </div>
              <div className="card-body">
                {p && p.images.length > 0 ? (
                  <div className="mb-3">
                    {p.images.map((src, i) => (
                      <label className="img-tile" key={src + i}>
                        <input type="hidden" name="images" value={src} />
                        <img src={src} alt="" />
                        <input type="checkbox" name="remove_image" value={src} /> remove
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted small">No images yet.</p>
                )}
                <label htmlFor="new_images">Add images</label>
                <input id="new_images" type="file" name="new_images" accept="image/png,image/jpeg,image/webp,image/gif" multiple className="form-control-file" />
                <small className="form-text text-muted">PNG, JPEG, WebP or GIF up to 5 MB each. Stored in Neon Object Storage.</small>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card mb-3">
              <div className="card-body">
                <div className="form-group">
                  <label htmlFor="price">Price (KES) *</label>
                  <input id="price" name="price" type="number" min={0} step={1} className="form-control" required defaultValue={p?.price} />
                </div>
                <div className="form-group">
                  <label htmlFor="oldPrice">Was price (KES)</label>
                  <input id="oldPrice" name="oldPrice" type="number" min={0} step={1} className="form-control" defaultValue={p?.oldPrice ?? ""} />
                  <small className="form-text text-muted">Set higher than the price to show it on sale with a “% Off” ribbon.</small>
                </div>
                <div className="form-check mb-3">
                  <input id="inStock" name="inStock" type="checkbox" className="form-check-input" defaultChecked={p ? p.inStock : true} />
                  <label htmlFor="inStock" className="form-check-label">
                    In stock
                  </label>
                </div>
                <div className="form-group">
                  <label htmlFor="stockQty">Quantity available</label>
                  <input id="stockQty" name="stockQty" type="number" min={0} step={1} className="form-control" defaultValue={p?.stockQty ?? 10} />
                  <small className="form-text text-muted">Caps the quantity a customer can pick (max 9).</small>
                </div>
                <ConfirmButton className="btn btn-primary btn-block">{p ? "Save product" : "Create product"}</ConfirmButton>
                {p && (
                  <Link href={`/catalogue/${p.slug}/`} target="_blank" className="btn btn-link btn-block">
                    View on site
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
      {p && (
        <div className="text-right">
          <ActionButton action={deleteProduct} fields={{ id: p.id }} label="Delete product" confirm={`Delete "${p.name}"? This can't be undone.`} />
        </div>
      )}
    </>
  );
}
