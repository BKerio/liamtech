"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin/", label: "Dashboard", exact: true },
  { href: "/admin/orders/", label: "Orders" },
  { href: "/admin/products/", label: "Products" },
  { href: "/admin/categories/", label: "Categories" },
  { href: "/admin/brands/", label: "Brands" },
  { href: "/admin/banners/", label: "Banners" },
  { href: "/admin/home/", label: "Home sections" },
  { href: "/admin/pages/", label: "Pages" },
  { href: "/admin/stores/", label: "Stores" },
  { href: "/admin/messages/", label: "Messages" },
  { href: "/admin/reviews/", label: "Reviews" },
  { href: "/admin/users/", label: "Customers" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="amx-admin__nav">
      {ITEMS.map((i) => {
        const active = i.exact ? pathname === i.href || pathname === i.href.slice(0, -1) : pathname.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={active ? "active" : ""}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
