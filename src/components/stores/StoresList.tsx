"use client";

import { useMemo, useState } from "react";
import { srcSet } from "@/lib/format";

export type StoreData = {
  id: number;
  slug: string;
  name: string;
  region: string;
  address: string[];
  phones: string[];
  email: string | null;
  hours: { day: string; time: string }[];
  lat: number | null;
  lng: number | null;
  image: string | null;
};

const tel = (p: string) => `+254${p.replace(/\D/g, "").replace(/^0/, "")}`;

function mapUrl(points: { lat: number; lng: number }[], focus?: { lat: number; lng: number }) {
  if (focus) {
    const d = 0.008;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${focus.lng - d},${focus.lat - d},${focus.lng + d},${focus.lat + d}&layer=mapnik&marker=${focus.lat},${focus.lng}`;
  }
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.3;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(...lngs) - pad},${Math.min(...lats) - pad},${Math.max(...lngs) + pad},${Math.max(...lats) + pad}&layer=mapnik`;
}

export default function StoresList({ stores }: { stores: StoreData[] }) {
  const [focus, setFocus] = useState<StoreData | null>(null);
  const [error, setError] = useState("");
  const points = useMemo(
    () => stores.filter((s) => s.lat != null && s.lng != null).map((s) => ({ lat: s.lat!, lng: s.lng! })),
    [stores],
  );
  const regions = Array.from(new Set(stores.map((s) => s.region)));

  const nearMe = () => {
    setError("");
    if (!navigator.geolocation) return setError("Geolocation is not supported by your browser.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = stores
          .filter((s) => s.lat != null)
          .sort((a, b) => Math.hypot(a.lat! - latitude, a.lng! - longitude) - Math.hypot(b.lat! - latitude, b.lng! - longitude))[0];
        if (nearest) setFocus(nearest);
      },
      () => setError("We could not determine your location."),
    );
  };

  return (
    <div id="our-stores">
      <section className="stores-map-section" style={{ position: "relative" }}>
        <div id="map" className="stores-map">
          {points.length > 0 && (
            <iframe
              title="Store locations"
              src={mapUrl(points, focus?.lat != null ? { lat: focus.lat, lng: focus.lng! } : undefined)}
              loading="lazy"
            />
          )}
        </div>
        <div id="map-error-message" role="alert">
          {error}
        </div>
        <button type="button" className="btn btn-light btn-sm mb-3" onClick={nearMe} title="Find stores near to me">
          Near to me
        </button>
      </section>

      {regions.map((region) => {
        const id = region.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return (
          <div key={region}>
            <h2 id={id}>{region}</h2>
            <section className="row store-group" data-name={region} id={`store-group-${id}`}>
              {stores
                .filter((s) => s.region === region)
                .map((s) => (
                  <div className="col-md-6 d-flex" key={s.id}>
                    <div id={s.slug} className={`card stores-store store d-flex w-100 ${focus?.id === s.id ? "active" : ""}`}>
                      {s.image && (
                        <img className="card-img-top img-fluid stores-store-img" src={s.image} srcSet={srcSet(s.image)} alt={`Photo of ${s.name}`} />
                      )}
                      <div className="card-body stores-store-body">
                        <h3 className="stores-store-name">{s.name}</h3>
                        <div className="row">
                          <section className="col-lg-6">
                            <address>
                              <p>
                                {s.address.map((line, i) => (
                                  <span key={i}>
                                    {line}
                                    {i < s.address.length - 1 && <br />}
                                  </span>
                                ))}
                              </p>
                            </address>
                            {s.phones.map((p) => (
                              <p className="mb-0" key={p}>
                                Tel: <a href={`tel:${tel(p)}`}>{p}</a>
                              </p>
                            ))}
                            {s.email && (
                              <p className="mb-0">
                                Email:{" "}
                                <a className="email" href={`mailto:${s.email}`}>
                                  {s.email}
                                </a>
                              </p>
                            )}
                          </section>
                          <section className="col-lg-6">
                            <h5>Opening times</h5>
                            {s.hours.map((h) => (
                              <div className="row" key={h.day}>
                                <div className="col-6">{h.day}</div>
                                <div className="col-6">
                                  <time>{h.time}</time>
                                </div>
                              </div>
                            ))}
                          </section>
                        </div>
                      </div>
                      <div className="card-footer stores-store-footer">
                        <a
                          className="show-on-map btn btn-primary"
                          href="#map"
                          onClick={(e) => {
                            e.preventDefault();
                            setFocus(s);
                            document.getElementById("map")?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                        >
                          Show on map
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
            </section>
          </div>
        );
      })}
    </div>
  );
}
