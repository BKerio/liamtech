"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Wraps storefront pages in the shop header/footer; the /admin area gets its own layout. */
export default function ShopChrome({ header, footer, children }: { header: ReactNode; footer: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return (
    <div className="page">
      {header}
      <main className="page-main">{children}</main>
      {footer}
    </div>
  );
}
