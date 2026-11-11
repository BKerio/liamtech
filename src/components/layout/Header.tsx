import Link from "next/link";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import Icon from "@/components/Icon";
import { getCategoryTree } from "@/lib/catalogue";
import { getBasket, basketTotals } from "@/lib/basket";
import { getCurrentUser } from "@/lib/auth";
import { SITE } from "@/lib/site";
import HeaderMenu, { type MenuCategory } from "./HeaderMenu";
import BasketDropdown, { type BasketSummary } from "./BasketDropdown";
import SearchBox from "./SearchBox";

export default async function Header() {
  const [{ roots }, basket, user, topBanners] = await Promise.all([
    getCategoryTree(),
    getBasket(),
    getCurrentUser(),
    prisma.banner.findMany({ where: { placement: "top", active: true }, orderBy: { position: "asc" } }),
  ]);
  const top = topBanners[0];

  const menu: MenuCategory[] = roots.map((r) => ({
    path: r.path,
    name: r.name,
    children: r.children.map((c) => ({
      path: c.path,
      name: c.name,
      children: c.children.map((g) => ({ path: g.path, name: g.name, children: [] })),
    })),
  }));

  const { count, total } = basketTotals(basket);
  const summary: BasketSummary = {
    count,
    total,
    lines: (basket?.lines ?? []).map((l) => ({
      id: l.id,
      slug: l.product.slug,
      name: l.product.name,
      quantity: l.quantity,
      price: l.product.price,
      image: l.product.cardImage,
    })),
  };

  return (
    <header className="page-header">
      {top && (
        <section className="top-banner block block-image m-0 ">
          <style>{`.top-bar-promo{background:#ffffff;display:block;width:100%;}`}</style>
          <a href={top.href ?? "/"} className="top-bar-promo">
            <img alt={top.alt} src={top.image} className="img-fluid d-none d-lg-block mx-auto" />
            <img alt={top.alt} src={top.mobileImage ?? top.image} className="img-fluid d-block d-lg-none mx-auto" />
          </a>
        </section>
      )}

      <div className="navbar navbar-expand-lg header-top-bar">
        <div className="container">
          <div className="header-extra-menu">
            <ul className="link-menu link-menu-top_bar">
              <li>
                <Link href="/">Customer Care: {SITE.phoneDisplay}</Link>
              </li>
              <li>
                <Link href="/stores/">Stores</Link>
              </li>
              <li>
                <Link href="/contact/">Contacts</Link>
              </li>
            </ul>
          </div>
          <ul className="nav header-account-menu">
            {user ? (
              <Link className="nav-link" id="account_link" href="/accounts/" title="Account">
                <Icon name="account" />
              </Link>
            ) : (
              <Link className="nav-link" id="login_link" href="/accounts/login/">
                <Icon name="account" />
              </Link>
            )}
          </ul>
        </div>
      </div>

      <div className="header-main">
        <div className="container">
          <div className="row">
            <div className="header-brand col-12 col-lg-3">
              <Link href="/">
                <img className="img-fluid header-logo" src="/static/img/logo.svg" alt={SITE.name} />
                <span className="sr-only">{SITE.name}</span>
              </Link>
            </div>
            <div className="header-search col-lg-8">
              <Suspense>
                <SearchBox />
              </Suspense>
            </div>
            <div className="header-basket col-lg-1 d-none d-lg-block text-right">
              <BasketDropdown basket={summary} />
            </div>
          </div>
        </div>
      </div>

      <HeaderMenu categories={menu} basketCount={count} />
    </header>
  );
}
