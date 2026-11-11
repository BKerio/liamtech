import Link from "next/link";
import { Fragment } from "react";
import Breadcrumb, { type Crumb } from "@/components/Breadcrumb";
import VehicleForm from "@/components/forms/VehicleForm";
import { ProductWideCard } from "./ProductCard";
import FilterSidebar, { VehicleToggle } from "./FilterSidebar";
import SortForm from "./SortForm";
import Pagination from "./Pagination";
import {
  browse,
  getMakes,
  parseBrowseQuery,
  type BrowseScope,
  type CategoryFacet,
} from "@/lib/catalogue";

type SP = Record<string, string | string[] | undefined>;

/** Build a URL from the current query string with overrides (null removes a key). */
function makeHref(basePath: string, sp: SP, overrides: Record<string, string | string[] | null>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k in overrides || v === undefined) continue;
    (Array.isArray(v) ? v : [v]).forEach((x) => p.append(k, x));
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null) continue;
    (Array.isArray(v) ? v : [v]).forEach((x) => p.append(k, x));
  }
  const qs = p.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default async function BrowsePage({
  title,
  crumbs,
  basePath,
  scope,
  searchParams,
  showVehicleSearch = true,
  defaultSort = "popularity",
  categoryLinksAsQuery = false,
}: {
  title: string;
  crumbs: Crumb[];
  basePath: string;
  scope: BrowseScope;
  searchParams: SP;
  showVehicleSearch?: boolean;
  defaultSort?: string;
  /** search/manufacturer pages filter by ?category=<id> instead of linking to the category page */
  categoryLinksAsQuery?: boolean;
}) {
  const query = parseBrowseQuery(searchParams, defaultSort);
  const [result, makes] = await Promise.all([browse(scope, query), getMakes()]);
  const from = result.total ? (query.page - 1) * query.perPage + 1 : 0;
  const to = Math.min(result.total, query.page * query.perPage);

  // listing params that survive a category change (vehicle + search term)
  const keep: SP = {};
  for (const k of ["q", "make", "model", "year"]) if (searchParams[k]) keep[k] = searchParams[k];

  const categoryHref = (c: CategoryFacet) =>
    categoryLinksAsQuery
      ? makeHref(basePath, searchParams, { category: String(c.id), page: null })
      : makeHref(`/catalogue/category/${c.path}/`, keep, {});

  const toggleManufacturer = (name: string) => {
    const facet = `manufacturer:${name}`;
    const cur = query.manufacturers.map((m) => `manufacturer:${m}`);
    const next = cur.includes(facet) ? cur.filter((f) => f !== facet) : [...cur, facet];
    return makeHref(basePath, searchParams, { selected_facets: next.length ? next : null, page: null });
  };

  const renderFacet = (c: CategoryFacet, depth: number, isCurrentRoot: boolean): React.ReactNode => {
    const active = result.activeCategoryId === c.id;
    return (
      <Fragment key={c.id}>
        <Link
          href={categoryHref(c)}
          data-category_id={c.id}
          className={`list-group-item list-group-item-action filter-item${active ? " active filter-item-active" : ""}`}
        >
          <span className="filter-name">{c.name}</span>
          {!(isCurrentRoot && active) && <span className="badge badge-primary badge-pill filter-count">{c.count}</span>}
        </Link>
        {c.children.length > 0 && (
          <div className={`list-group list-group-flush filter-items${depth === 0 && !isCurrentRoot ? " filter-items--depth-1" : ""}`}>
            {c.children.map((ch) => renderFacet(ch, depth + 1, false))}
          </div>
        )}
      </Fragment>
    );
  };

  return (
    <div className="container">
      {showVehicleSearch && (
        <div className="browse-search">
          <h2 className="browse-search__title">Find the right parts for your car.</h2>
          <VehicleToggle>
            <div className="card-body">
              <VehicleForm
                makes={makes}
                variant="browse"
                action={basePath}
                initial={{ make: query.make, model: query.model, year: query.year }}
              />
            </div>
          </VehicleToggle>
        </div>
      )}

      <Breadcrumb items={crumbs} truncated={!showVehicleSearch} />

      <div id="messages"></div>
      <div className="row">
        <aside className="sidebar col-lg-3 ">
          <FilterSidebar>
            {result.categoryFacets.length > 0 && (
              <div className="card filter">
                <div className="card-header filter-header">
                  <span className="filter-header-text">Categories</span>
                </div>
                <div className="list-group list-group-flush filter-items filter-items--depth-0">
                  {result.categoryFacets.map((c) => renderFacet(c, 0, !!scope.categoryPath))}
                </div>
              </div>
            )}
            {result.manufacturerFacets.length > 0 && (
              <div className="card filter">
                <div className="card-header filter-header">
                  <span className="filter-header-text">Manufacturer</span>
                </div>
                <div className="list-group list-group-flush filter-items">
                  {result.manufacturerFacets.map((m) => {
                    const checked = query.manufacturers.includes(m.name);
                    return (
                      <Link
                        key={m.name}
                        className={`list-group-item list-group-item-action filter-item${checked ? " filter-item-active" : ""}`}
                        href={toggleManufacturer(m.name)}
                      >
                        <input className="filter-checkbox" type="checkbox" name={m.name} checked={checked} readOnly />
                        <span className="filter-name">{m.name}</span>
                        <span className="badge badge-primary badge-pill filter-count">{m.count}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="card filter">
              <div className="card-header filter-header">
                <span className="filter-header-text">Show Only</span>
              </div>
              <div className="list-group list-group-flush filter-items">
                {!scope.onSaleOnly && (
                  <Link
                    className={`list-group-item list-group-item-action filter-item ${query.onSale ? "filter-item-active" : ""}`}
                    href={makeHref(basePath, searchParams, { on_sale: query.onSale ? null : "True", page: null })}
                  >
                    <input className="filter-checkbox" type="checkbox" name="on_sale" checked={query.onSale} readOnly />
                    <span className="filter-name">On Sale</span>
                    <span className="badge badge-pill badge-primary filter-count">{result.onSaleCount}</span>
                  </Link>
                )}
                <Link
                  className={`list-group-item list-group-item-action filter-item ${query.inStock ? "filter-item-active" : ""}`}
                  href={makeHref(basePath, searchParams, { in_stock: query.inStock ? null : "True", page: null })}
                >
                  <input className="filter-checkbox" type="checkbox" name="in_stock" checked={query.inStock} readOnly />
                  <span className="filter-name">In Stock</span>
                  <span className="badge badge-pill badge-primary filter-count">{result.inStockCount}</span>
                </Link>
              </div>
            </div>
          </FilterSidebar>
        </aside>

        <div className="col-lg-9 ">
          <div className="content-header">
            <h1>{title}</h1>
          </div>
          <div className="content">
            <div id="content-inner">
              {result.total > 0 ? (
                <>
                  <div className="results-meta">
                    <div className="results-meta-count">
                      Showing <strong>{from}</strong> to <strong>{to}</strong> of <strong>{result.total}</strong> results.
                    </div>
                    <div className="results-meta-sort">
                      <SortForm sortBy={query.sortBy} perPage={query.perPage} />
                    </div>
                  </div>
                  <section className="products">
                    <div className="browse-list">
                      {result.products.map((p) => (
                        <div className="browse-list__item" key={p.id}>
                          <ProductWideCard product={p} />
                        </div>
                      ))}
                    </div>
                    <Pagination
                      page={query.page}
                      pages={result.pages}
                      href={(n) => makeHref(basePath, searchParams, { page: n === 1 ? null : String(n) })}
                    />
                  </section>
                </>
              ) : (
                <p className="nonefound">No products found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
