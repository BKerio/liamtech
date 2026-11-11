"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

/**
 * Always start a page at the very top:
 * - on refresh: disable the browser's scroll restoration
 * - on client navigation (path or query change): Next only scrolls the new segment into view,
 *   which leaves the header/banner off-screen, so jump to 0,0 instead
 * Links to an anchor (/stores/#eldoret, #addreview) still scroll to that element.
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);

  useLayoutEffect(() => {
    const hash = window.location.hash.slice(1);
    const target = hash ? document.getElementById(decodeURIComponent(hash)) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, search]);

  return null;
}
