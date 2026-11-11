import Link from "next/link";

export type Crumb = { name: string; href?: string };

/** Matches the original: plain version, or "truncated" (mobile shows … then the last two). */
export default function Breadcrumb({ items, truncated = false }: { items: Crumb[]; truncated?: boolean }) {
  const all: Crumb[] = [{ name: "Home", href: "/" }, ...items];
  const keep = 2; // always-visible trailing crumbs on mobile
  return (
    <nav className={`page-breadcrumb${truncated ? " page-breadcrumb-truncated" : ""}`} aria-label="breadcrumb">
      <ol className="breadcrumb">
        {truncated && <li className="breadcrumb-item d-block d-md-none">&hellip;</li>}
        {all.map((c, i) => {
          const last = i === all.length - 1;
          const hideMobile = truncated && i < all.length - keep;
          const cls = `breadcrumb-item${last ? " active" : ""}${hideMobile ? " d-none d-md-block" : ""}`;
          return (
            <li key={i} className={cls}>
              {last || !c.href ? c.name : <Link href={c.href}>{c.name}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
