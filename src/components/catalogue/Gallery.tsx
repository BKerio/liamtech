"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { srcSet } from "@/lib/format";

/** Product image gallery with round thumbnail switcher (product_gallery_horizontally). */
export default function Gallery({ images, thumbs, alt }: { images: string[]; thumbs: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const many = images.length > 1;

  return (
    <section className="product-gallery">
      <div className="catalogue-gallery">
        <div className="catalogue-gallery-items">
          {images.map((src, i) => (
            <img
              key={src + i}
              className={`img-fluid catalogue-gallery-image${i === active ? " active" : ""}`}
              src={src}
              srcSet={srcSet(src)}
              alt={alt}
              loading={i === 0 ? undefined : "lazy"}
              onClick={() => setZoom(true)}
            />
          ))}
        </div>
        {many && (
          <div className="catalogue-gallery-thumbnails">
            <span
              className="catalogue-gallery-thumbnails-prev"
              onClick={() => setActive((a) => Math.max(0, a - 1))}
            >
              <Icon name="chevron-left" />
            </span>
            <div className="catalogue-gallery-thumbnails-switcher">
              <ul className="catalogue-gallery-thumbnails-switcher-items">
                {thumbs.map((src, i) => (
                  <li key={src + i} className={i === active ? "active" : ""}>
                    <a
                      href={images[i]}
                      onClick={(e) => {
                        e.preventDefault();
                        setActive(i);
                      }}
                    >
                      <img src={src} srcSet={srcSet(src)} alt="" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <span
              className="catalogue-gallery-thumbnails-next"
              onClick={() => setActive((a) => Math.min(images.length - 1, a + 1))}
            >
              <Icon name="chevron-right" />
            </span>
          </div>
        )}
      </div>
      {zoom && images[active] && (
        <div
          onClick={() => setZoom(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img src={images[active]} srcSet={srcSet(images[active])} alt={alt} style={{ maxWidth: "90vw", maxHeight: "90vh", background: "#fff" }} />
        </div>
      )}
    </section>
  );
}
