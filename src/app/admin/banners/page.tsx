import type { Banner } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { BANNER_PLACEMENTS, BANNER_PLACEMENT_LABELS } from "@/lib/admin-constants";
import { saveBanner, deleteBanner } from "@/app/admin/actions";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { ActionButton, AdminHeader, type SP } from "@/components/admin/ui";

export const metadata = { title: "Banners" };

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

function BannerForm({ b }: { b?: Banner }) {
  return (
    <form action={saveBanner}>
      {b && (
        <>
          <input type="hidden" name="id" value={b.id} />
          <input type="hidden" name="currentImage" value={b.image} />
          <input type="hidden" name="currentMobileImage" value={b.mobileImage ?? ""} />
        </>
      )}
      <div className="form-row">
        <div className="col-md-4 mb-2">
          {b && <img src={b.image} alt={b.alt} className="img-fluid border mb-2" style={{ maxHeight: 140 }} />}
          <label className="small d-block">{b ? "Replace image" : "Image *"}</label>
          <input type="file" name="image" accept={ACCEPT} className="form-control-file" required={!b} />
          <label className="small d-block mt-2">Mobile image (optional)</label>
          {b?.mobileImage && <img src={b.mobileImage} alt="" className="border mb-1" style={{ maxHeight: 60 }} />}
          <input type="file" name="mobileImage" accept={ACCEPT} className="form-control-file" />
          {b?.mobileImage && (
            <div className="form-check small">
              <input type="checkbox" name="removeMobile" id={`rm-${b.id}`} className="form-check-input" />
              <label htmlFor={`rm-${b.id}`} className="form-check-label">
                remove mobile image
              </label>
            </div>
          )}
        </div>
        <div className="col-md-8">
          <div className="form-row">
            <div className="col-md-6 mb-2">
              <label className="small">Placement</label>
              <select name="placement" defaultValue={b?.placement ?? "hero"} className="form-control form-control-sm">
                {BANNER_PLACEMENTS.map((p) => (
                  <option key={p} value={p}>
                    {BANNER_PLACEMENT_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6 mb-2">
              <label className="small">Link (optional)</label>
              <input name="href" defaultValue={b?.href ?? ""} placeholder="/catalogue/category/lighting/" className="form-control form-control-sm" />
            </div>
            <div className="col-md-6 mb-2">
              <label className="small">Alt text</label>
              <input name="alt" defaultValue={b?.alt ?? ""} className="form-control form-control-sm" />
            </div>
            <div className="col-md-6 mb-2">
              <label className="small">Caption (tiles only)</label>
              <input name="caption" defaultValue={b?.caption ?? ""} className="form-control form-control-sm" />
            </div>
            <div className="col-md-3 mb-2">
              <label className="small">Order</label>
              <input name="position" type="number" defaultValue={b?.position ?? 0} className="form-control form-control-sm" />
            </div>
            <div className="col-md-3 mb-2 d-flex align-items-end">
              <div className="form-check">
                <input type="checkbox" name="active" id={`active-${b?.id ?? "new"}`} defaultChecked={b ? b.active : true} className="form-check-input" />
                <label htmlFor={`active-${b?.id ?? "new"}`} className="form-check-label small">
                  Visible
                </label>
              </div>
            </div>
            <div className="col-md-6 mb-2 d-flex align-items-end justify-content-end">
              <ConfirmButton className="btn btn-sm btn-primary">{b ? "Save banner" : "Add banner"}</ConfirmButton>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default async function AdminBanners({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const banners = await prisma.banner.findMany({ orderBy: [{ placement: "asc" }, { position: "asc" }] });

  return (
    <>
      <AdminHeader title="Banners" sp={await searchParams} />
      <div className="card mb-4">
        <div className="card-header bg-white">
          <strong>Add a banner</strong>
        </div>
        <div className="card-body">
          <BannerForm />
        </div>
      </div>
      {BANNER_PLACEMENTS.map((pl) => {
        const list = banners.filter((b) => b.placement === pl);
        return (
          <div key={pl} className="mb-4">
            <h2 className="h5">
              {BANNER_PLACEMENT_LABELS[pl]} <span className="text-muted small">({list.length})</span>
            </h2>
            {list.length === 0 && <p className="text-muted small">None.</p>}
            {list.map((b) => (
              <div className={`card mb-2${b.active ? "" : " border-warning"}`} key={b.id}>
                <div className="card-body">
                  {!b.active && <span className="badge badge-warning mb-2">Hidden</span>}
                  <BannerForm b={b} />
                  <div className="text-right">
                    <ActionButton action={deleteBanner} fields={{ id: b.id }} label="Delete" confirm="Delete this banner?" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
