import type { Store } from "@prisma/client";
import { saveStore, deleteStore } from "@/app/admin/actions";
import ConfirmButton from "./ConfirmButton";
import { ActionButton } from "./ui";

type Hours = { day: string; time: string }[];
const DEFAULT_HOURS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => `${d}: 08:00 - 17:00`).concat("Saturday: 08:00 - 15:00");

export default function StoreForm({ store }: { store?: Store }) {
  const s = store;
  const hours = s ? (s.hours as Hours).map((h) => `${h.day}: ${h.time}`) : DEFAULT_HOURS;
  return (
    <>
      <form action={saveStore}>
        {s && <input type="hidden" name="id" value={s.id} />}
        {s && <input type="hidden" name="currentImage" value={s.image ?? ""} />}
        <div className="row">
          <div className="col-lg-8">
            <div className="card mb-3">
              <div className="card-body">
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Branch name *</label>
                    <input name="name" className="form-control" required defaultValue={s?.name} />
                  </div>
                  <div className="form-group col-md-3">
                    <label>Town / region *</label>
                    <input name="region" className="form-control" required defaultValue={s?.region} placeholder="Nairobi" />
                  </div>
                  <div className="form-group col-md-3">
                    <label>Order</label>
                    <input name="position" type="number" className="form-control" defaultValue={s?.position ?? 0} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Address (one line each)</label>
                    <textarea name="address" rows={4} className="form-control" defaultValue={s?.address.join("\n")} />
                  </div>
                  <div className="form-group col-md-6">
                    <label>Phone numbers (one per line)</label>
                    <textarea name="phones" rows={4} className="form-control" defaultValue={s?.phones.join("\n")} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Email</label>
                    <input name="email" type="email" className="form-control" defaultValue={s?.email ?? ""} />
                  </div>
                  <div className="form-group col-md-6">
                    <label>Slug (anchor on /stores/)</label>
                    <input name="slug" className="form-control" defaultValue={s?.slug} placeholder="from name" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Opening times (one per line, “Day: hours”)</label>
                  <textarea name="hours" rows={7} className="form-control" defaultValue={hours.join("\n")} />
                </div>
                <div className="form-row mb-0">
                  <div className="form-group col-md-6 mb-0">
                    <label>Latitude</label>
                    <input name="lat" className="form-control" defaultValue={s?.lat ?? ""} placeholder="-1.2921" />
                  </div>
                  <div className="form-group col-md-6 mb-0">
                    <label>Longitude</label>
                    <input name="lng" className="form-control" defaultValue={s?.lng ?? ""} placeholder="36.8219" />
                    <small className="form-text text-muted">Used for “Show on map”. Copy them from Google Maps (right-click the pin).</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card mb-3">
              <div className="card-body">
                <label>Photo</label>
                {s?.image && <img src={s.image} alt="" className="img-fluid border mb-2" />}
                <input type="file" name="image" accept="image/png,image/jpeg,image/webp,image/gif" className="form-control-file mb-3" />
                <ConfirmButton className="btn btn-primary btn-block">{s ? "Save store" : "Create store"}</ConfirmButton>
              </div>
            </div>
          </div>
        </div>
      </form>
      {s && (
        <div className="text-right">
          <ActionButton action={deleteStore} fields={{ id: s.id }} label="Delete store" confirm={`Delete "${s.name}"? Past orders keep their details.`} />
        </div>
      )}
    </>
  );
}
