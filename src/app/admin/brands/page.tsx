import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { saveManufacturer, deleteManufacturer } from "@/app/admin/actions";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { ActionButton, AdminHeader, Thumb, type SP } from "@/components/admin/ui";

export const metadata = { title: "Brands" };

export default async function AdminBrands({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const brands = await prisma.manufacturer.findMany({
    orderBy: [{ featured: "desc" }, { position: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <>
      <AdminHeader title="Brands" sp={await searchParams} />
      <p className="text-muted small">“Featured” brands are shown in the “Our product brands” strip on the home page, in order.</p>
      <div className="card mb-4">
        <div className="card-header bg-white">
          <strong>Add a brand</strong>
        </div>
        <div className="card-body">
          <form action={saveManufacturer} className="form-row align-items-end">
            <div className="col-md-3 mb-2">
              <label className="small">Name</label>
              <input name="name" className="form-control form-control-sm" required />
            </div>
            <div className="col-md-4 mb-2">
              <label className="small">Logo</label>
              <input type="file" name="logo" accept="image/png,image/jpeg,image/webp,image/gif" className="form-control-file" />
            </div>
            <div className="col-md-2 mb-2">
              <div className="form-check">
                <input type="checkbox" name="featured" id="new-featured" className="form-check-input" />
                <label htmlFor="new-featured" className="form-check-label small">
                  Featured
                </label>
              </div>
            </div>
            <div className="col-md-1 mb-2">
              <label className="small">Order</label>
              <input name="position" type="number" defaultValue={0} className="form-control form-control-sm" />
            </div>
            <div className="col-md-2 mb-2">
              <ConfirmButton className="btn btn-sm btn-primary btn-block">Add brand</ConfirmButton>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Featured</th>
                <th>Order</th>
                <th>Products</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => {
                const f = `brand-${b.id}`;
                return (
                  <tr key={b.id}>
                    <td>
                      <Thumb src={b.logo} size={56} />
                      <form id={f} action={saveManufacturer}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="currentLogo" value={b.logo ?? ""} />
                      </form>
                      <input form={f} type="file" name="logo" accept="image/png,image/jpeg,image/webp,image/gif" className="form-control-file small mt-1" style={{ maxWidth: 190 }} />
                    </td>
                    <td>
                      <input form={f} name="name" defaultValue={b.name} className="form-control form-control-sm" required />
                    </td>
                    <td>
                      <input form={f} name="slug" defaultValue={b.slug} className="form-control form-control-sm" />
                    </td>
                    <td>
                      <input form={f} type="checkbox" name="featured" defaultChecked={b.featured} />
                    </td>
                    <td style={{ width: 80 }}>
                      <input form={f} name="position" type="number" defaultValue={b.position} className="form-control form-control-sm" />
                    </td>
                    <td>
                      <Link href={`/catalogue/manufacturer/${b.slug}/`} target="_blank">
                        {b._count.products}
                      </Link>
                    </td>
                    <td className="text-right text-nowrap">
                      <button form={f} className="btn btn-sm btn-outline-primary mr-1">
                        Save
                      </button>
                      <ActionButton action={deleteManufacturer} fields={{ id: b.id }} label="Delete" confirm={`Delete brand "${b.name}"?`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
