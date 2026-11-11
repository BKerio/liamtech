"use client";

import { useState, type ReactNode } from "react";

/** Mobile "Refine your search" collapse around the filter cards. */
export default function FilterSidebar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div id="filters" className={`collapse${open ? " show" : ""}`}>
        {children}
      </div>
      <div
        id="filters-btn"
        className="btn btn-primary btn-block js-filters-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="filters"
        role="button"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Hide filters" : "Refine your search"}
      </div>
      <ul id="filters-summary"></ul>
    </>
  );
}

/** Mobile "Select your vehicle" collapse around the vehicle form. */
export function VehicleToggle({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="d-lg-none btn btn-outline-primary btn-light btn-block mb-1" onClick={() => setOpen((o) => !o)}>
        Select your vehicle
      </button>
      <div className={`card d-lg-flex w-100 collapse${open ? " show" : ""}`} id="vehicle-form">
        {children}
      </div>
    </>
  );
}
