import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { kes } from "@/lib/format";
import {
  saveHomeSection,
  deleteHomeSection,
  addHomeSectionItem,
  moveHomeSectionItem,
  removeHomeSectionItem,
} from "@/app/admin/actions";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { ActionButton, AdminHeader, Thumb, type SP } from "@/components/admin/ui";

export const metadata = { title: "Home sections" };

export default async function AdminHome({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sections = await prisma.homeSection.findMany({
    orderBy: { position: "asc" },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: { product: { select: { id: true, name: true, sku: true, price: true, cardImage: true, inStock: true } } },
      },
    },
  });

  return (
    <>
      <AdminHeader title="Home page sections" sp={await searchParams} />
      <p className="text-muted small">
        Each section is a product carousel on the home page (e.g. “BLACK NOVEMBER DEALS”). Banners and the brand strip are managed under{" "}
        <Link href="/admin/banners/">Banners</Link> and <Link href="/admin/brands/">Brands</Link>.
      </p>
      <div className="card mb-4">
        <div className="card-body">
          <form action={saveHomeSection} className="form-inline">
            <input name="title" className="form-control form-control-sm mr-2" placeholder="New section title" required style={{ minWidth: 260 }} />
            <input name="position" type="number" className="form-control form-control-sm mr-2" placeholder="Order" style={{ width: 90 }} defaultValue={sections.length} />
            <ConfirmButton className="btn btn-sm btn-primary">Add section</ConfirmButton>
          </form>
        </div>
      </div>

      {sections.map((s) => (
        <div className="card mb-4" key={s.id}>
          <div className="card-header bg-white d-flex flex-wrap align-items-center">
            <form action={saveHomeSection} className="form-inline flex-grow-1">
              <input type="hidden" name="id" value={s.id} />
              <input name="title" defaultValue={s.title} className="form-control form-control-sm mr-2 font-weight-bold" required style={{ minWidth: 260 }} />
              <label className="small mr-1">Order</label>
              <input name="position" type="number" defaultValue={s.position} className="form-control form-control-sm mr-2" style={{ width: 80 }} />
              <ConfirmButton className="btn btn-sm btn-outline-primary">Save</ConfirmButton>
            </form>
            <ActionButton action={deleteHomeSection} fields={{ id: s.id }} label="Delete section" confirm={`Delete section "${s.title}"? Products are not deleted.`} />
          </div>
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <tbody>
                {s.items.length === 0 && (
                  <tr>
                    <td className="text-muted text-center py-3">No products in this section yet.</td>
                  </tr>
                )}
                {s.items.map((it, i) => (
                  <tr key={it.id}>
                    <td style={{ width: 60 }}>
                      <Thumb src={it.product.cardImage} size={40} />
                    </td>
                    <td>
                      <Link href={`/admin/products/${it.product.id}/`}>{it.product.name}</Link>
                      <div className="small text-muted">
                        {it.product.sku} · {kes(it.product.price)}
                        {!it.product.inStock && <span className="badge badge-secondary ml-2">Out of stock</span>}
                      </div>
                    </td>
                    <td className="text-right text-nowrap">
                      <ActionButton action={moveHomeSectionItem} fields={{ id: it.id, dir: "up" }} label="↑" className="btn btn-sm btn-light" />
                      <ActionButton action={moveHomeSectionItem} fields={{ id: it.id, dir: "down" }} label="↓" className="btn btn-sm btn-light mr-2" />
                      {i >= 0 && <ActionButton action={removeHomeSectionItem} fields={{ id: it.id }} label="Remove" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-footer bg-white">
            <form action={addHomeSectionItem} className="form-inline">
              <input type="hidden" name="sectionId" value={s.id} />
              <input name="product" className="form-control form-control-sm mr-2" placeholder="Product SKU or slug" required style={{ minWidth: 260 }} />
              <ConfirmButton className="btn btn-sm btn-outline-primary">Add product</ConfirmButton>
            </form>
          </div>
        </div>
      ))}
    </>
  );
}
