"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { SITE } from "@/lib/site";

export default function WhatsappCta() {
  const [open, setOpen] = useState(false);
  return (
    <div className="contact-whatsapp-cta">
      <h4>
        <a
          href="#whatsapp-cta-detail"
          onClick={(e) => {
            e.preventDefault();
            setOpen((o) => !o);
          }}
        >
          <Icon name="whatsapp" />{" "}
          <span className="d-none d-md-inline">Enquire on Whatsapp</span>
        </a>
      </h4>
      <div id="whatsapp-cta-detail" className={`collapse bg-light${open ? " show" : ""}`}>
        WhatsApp{" "}
        <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer">
          {SITE.phoneDisplay.replace(" ", " ")}
        </a>{" "}
        for assistance. We&apos;re happy to help!
      </div>
    </div>
  );
}
