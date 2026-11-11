"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { SITE } from "@/lib/site";

export type MenuCategory = { path: string; name: string; children: MenuCategory[] };

const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 992px)").matches;

export default function HeaderMenu({ categories, basketCount }: { categories: MenuCategory[]; basketCount: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);

  // close everything on navigation
  useEffect(() => {
    setOpen(false);
    setOpenItem(null);
  }, [pathname]);

  // close dropdown on outside click
  useEffect(() => {
    if (!openItem) return;
    const onDoc = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".header-menu-mega")) setOpenItem(null);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [openItem]);

  return (
    <nav className="navbar navbar-expand-lg header-menu">
      <div className="header-menu-mobile">
        <Link href="/" className="logo-mobile">
          <img className="img-fluid header-logo" src="/static/img/logo.svg" alt={SITE.name} />
          <span className="sr-only">{SITE.name}</span>
        </Link>
        <div className="header-menu-mobile__actions">
          <ul className="nav">
            <div className="header-menu-basket">
              <Link className="nav-link header-basket-btn" href="/basket/">
                <Icon name="basket" />
              </Link>
              <span className="badge badge-pill header-basket-quantity">{basketCount || ""}</span>
            </div>
            <button
              className="nav-link btn btn-link header-menu-btn"
              type="button"
              aria-controls="navbar-menu"
              aria-expanded={open}
              aria-label="Toggle navigation"
              onClick={() => setOpen((o) => !o)}
            >
              <Icon name="menu" />
            </button>
          </ul>
        </div>
      </div>
      <div className={`collapse navbar-collapse${open ? " show" : ""}`} id="navbar-menu">
        <div className="container">
          <ul className="navbar-nav nav-fill w-100">
            {categories.map((cat) => {
              const active = pathname.startsWith(`/catalogue/category/${cat.path}/`);
              const shown = openItem === cat.path;
              return (
                <li
                  key={cat.path}
                  className={`nav-item dropdown header-menu-mega ${active ? "active" : ""}${shown ? " show" : ""}`}
                >
                  <Link
                    href={`/catalogue/category/${cat.path}/`}
                    title={cat.name}
                    className="nav-link dropdown-toggle"
                    aria-expanded={shown}
                    onClick={(e) => {
                      // Desktop: hover opens the menu (CSS), click navigates. Mobile: click toggles.
                      if (isDesktop()) return;
                      e.preventDefault();
                      setOpenItem(shown ? null : cat.path);
                    }}
                  >
                    {cat.name}
                  </Link>
                  <div className={`dropdown-menu${shown ? " show" : ""}`}>
                    {cat.children.map((sub) => (
                      <div className="header-menu-mega__subcat" key={sub.path}>
                        <Link href={`/catalogue/category/${sub.path}/`}>
                          <span className="header-menu-mega__subcat__title">{sub.name}</span>
                        </Link>
                        {sub.children.length > 0 && (
                          <ul className="list-unstyled">
                            {sub.children.map((g) => (
                              <li key={g.path}>
                                <Link href={`/catalogue/category/${g.path}/`}>{g.name}</Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
            <li className={`nav-item header-menu__on-sale${pathname.startsWith("/catalogue/on-sale/") ? " active" : ""}`}>
              <Link className="nav-link" href="/catalogue/on-sale/" title="On Sale">
                On sale
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
