"use client";

import { Children, useEffect, useState, type ReactNode } from "react";
import Icon from "@/components/Icon";

/** [minWidth, slidesToShow] pairs, largest first. */
type Breakpoints = [number, number][];

const PRODUCT_BREAKPOINTS: Breakpoints = [
  [1200, 4],
  [992, 3],
  [768, 2],
  [0, 1],
];
const LINK_BREAKPOINTS: Breakpoints = [
  [992, 4],
  [0, 1],
];

function useSlidesToShow(bps: Breakpoints) {
  const [n, setN] = useState(bps[0][1]);
  useEffect(() => {
    const calc = () => setN(bps.find(([w]) => window.innerWidth >= w)?.[1] ?? 1);
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [bps]);
  return n;
}

/**
 * Re-implementation of the slick carousel used on the original site, emitting slick's
 * markup/classes so the original stylesheet applies unchanged.
 */
export default function SlickCarousel({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "products" | "links";
}) {
  const items = Children.toArray(children);
  const show = useSlidesToShow(variant === "products" ? PRODUCT_BREAKPOINTS : LINK_BREAKPOINTS);
  const [index, setIndex] = useState(0);
  const max = Math.max(0, items.length - show);
  const scrollable = items.length > show;
  useEffect(() => setIndex((i) => Math.min(i, max)), [max]);

  const prefix = variant === "products" ? "product-list" : "featured-links";
  const itemClass =
    variant === "products"
      ? "product-item d-flex col-12 col-sm-6 col-md-4 col-xl-3"
      : "featured-links__item col-lg-3";

  const prev = () => setIndex((i) => (i <= 0 ? max : i - 1));
  const next = () => setIndex((i) => (i >= max ? 0 : i + 1));

  return (
    <>
      <div className={`${prefix} row slick-initialized slick-slider`}>
        <div className="slick-list">
          <div
            className="slick-track amx-slick-track"
            style={{ transform: `translate3d(-${(index * 100) / show}%, 0, 0)` }}
          >
            {items.map((child, i) => (
              <div
                key={i}
                className={`${itemClass} slick-slide${i >= index && i < index + show ? " slick-active" : ""}`}
                aria-hidden={!(i >= index && i < index + show)}
              >
                {child}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={`${prefix}__prev-arrow prev-arrow${scrollable ? "" : " slick-hidden"}`} onClick={prev}>
        <Icon name="chevron-left" />
      </div>
      <div className={`${prefix}__next-arrow next-arrow${scrollable ? "" : " slick-hidden"}`} onClick={next}>
        <Icon name="chevron-right" />
      </div>
    </>
  );
}
