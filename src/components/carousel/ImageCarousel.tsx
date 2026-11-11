"use client";

import { useEffect, useState } from "react";

type Slide = { image: string; href?: string | null; alt?: string };

/** Bootstrap 4 carousel (data-ride="carousel") equivalent. */
export default function ImageCarousel({ slides, interval = 5000 }: { slides: Slide[]; interval?: number }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % slides.length), interval);
    return () => clearInterval(t);
  }, [slides.length, interval]);

  if (!slides.length) return null;
  return (
    <div className="carousel slide">
      <ol className="carousel-indicators">
        {slides.map((_, i) => (
          <li key={i} className={i === active ? "active" : ""} onClick={() => setActive(i)} />
        ))}
      </ol>
      <div className="carousel-inner">
        {slides.map((s, i) => {
          const img = <img className="img-fluid" src={s.image} alt={s.alt ?? ""} />;
          return (
            <div key={i} className={`carousel-item${i === active ? " active" : ""}`}>
              {s.href ? <a href={s.href}>{img}</a> : img}
            </div>
          );
        })}
      </div>
    </div>
  );
}
