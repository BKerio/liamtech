import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import prisma from "./prisma";

export type CategoryNode = {
  id: number;
  path: string;
  name: string;
  parentId: number | null;
  position: number;
  children: CategoryNode[];
};

/** Whole category tree, loaded once per request. */
export const getCategoryTree = cache(async () => {
  const rows = await prisma.category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] });
  const byId = new Map<number, CategoryNode>();
  rows.forEach((r) => byId.set(r.id, { ...r, children: [] }));
  const roots: CategoryNode[] = [];
  byId.forEach((n) => {
    if (n.parentId && byId.has(n.parentId)) byId.get(n.parentId)!.children.push(n);
    else roots.push(n);
  });
  const byPath = new Map<string, CategoryNode>();
  byId.forEach((n) => byPath.set(n.path, n));
  return { roots, byId, byPath };
});

export function ancestorsOf(node: CategoryNode, byId: Map<number, CategoryNode>) {
  const chain: CategoryNode[] = [];
  let cur: CategoryNode | undefined = node;
  while (cur) {
    chain.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return chain;
}

export const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  sku: true,
  price: true,
  oldPrice: true,
  inStock: true,
  cardImage: true,
  manufacturer: { select: { name: true, logo: true } },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

// ───────────────────────────── browse / search ─────────────────────────────

export type BrowseScope = {
  /** Restrict to a category subtree */
  categoryPath?: string;
  manufacturerSlug?: string;
  onSaleOnly?: boolean;
  /** Free text search */
  q?: string;
};

export type BrowseQuery = {
  manufacturers: string[];
  onSale: boolean;
  inStock: boolean;
  sortBy: string;
  perPage: number;
  page: number;
  categoryId?: number;
  make?: number;
  model?: number;
  year?: number;
};

type SP = Record<string, string | string[] | undefined>;

export function parseBrowseQuery(sp: SP, defaultSort: string): BrowseQuery {
  const arr = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
  const one = (v: string | string[] | undefined) => arr(v)[0];
  const int = (v?: string) => {
    const n = v ? parseInt(v, 10) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };
  const manufacturers = arr(sp.selected_facets)
    .filter((f) => f.startsWith("manufacturer:"))
    .map((f) => f.slice("manufacturer:".length));
  const perPage = [20, 40, 80].includes(int(one(sp.items_per_page)) ?? 0) ? int(one(sp.items_per_page))! : 20;
  return {
    manufacturers,
    onSale: one(sp.on_sale) === "True",
    inStock: one(sp.in_stock) === "True",
    sortBy: one(sp.sort_by) || defaultSort,
    perPage,
    page: Math.max(1, int(one(sp.page)) ?? 1),
    categoryId: int(one(sp.category)),
    make: int(one(sp.make)),
    model: int(one(sp.model)),
    year: int(one(sp.year)),
  };
}

function categoryWhere(path: string): Prisma.ProductWhereInput {
  return { category: { OR: [{ path }, { path: { startsWith: `${path}/` } }] } };
}

function buildWhere(
  scope: BrowseScope,
  query: BrowseQuery,
  opts: { skipManufacturer?: boolean; skipOnSale?: boolean; skipInStock?: boolean; categoryPath?: string } = {},
): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];
  const catPath = opts.categoryPath ?? scope.categoryPath;
  if (catPath) and.push(categoryWhere(catPath));
  if (scope.manufacturerSlug) and.push({ manufacturer: { slug: scope.manufacturerSlug } });
  if (scope.onSaleOnly) and.push({ oldPrice: { not: null } });
  if (scope.q) {
    for (const word of scope.q.trim().split(/\s+/).filter(Boolean)) {
      and.push({
        OR: [
          { name: { contains: word, mode: "insensitive" } },
          { sku: { contains: word, mode: "insensitive" } },
          { manufacturer: { name: { contains: word, mode: "insensitive" } } },
          { category: { name: { contains: word, mode: "insensitive" } } },
        ],
      });
    }
  }
  if (!opts.skipManufacturer && query.manufacturers.length)
    and.push({ manufacturer: { name: { in: query.manufacturers } } });
  if (!opts.skipOnSale && query.onSale) and.push({ oldPrice: { not: null } });
  if (!opts.skipInStock && query.inStock) and.push({ inStock: true });
  if (query.model || query.make) {
    const vehicle: Prisma.ProductVehicleWhereInput = query.model
      ? { modelId: query.model }
      : { model: { makeId: query.make } };
    if (query.year) {
      vehicle.AND = [
        { OR: [{ yearFrom: null }, { yearFrom: { lte: query.year } }] },
        { OR: [{ yearTo: null }, { yearTo: { gte: query.year } }] },
      ];
    }
    and.push({ vehicles: { some: vehicle } });
  }
  return and.length ? { AND: and } : {};
}

function orderBy(sortBy: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sortBy) {
    case "price-desc":
      return [{ price: "desc" }, { id: "asc" }];
    case "price-asc":
      return [{ price: "asc" }, { id: "asc" }];
    case "popularity":
      return [{ inStock: "desc" }, { popularity: "desc" }, { id: "asc" }];
    default:
      return [{ inStock: "desc" }, { id: "asc" }];
  }
}

export type CategoryFacet = { id: number; path: string; name: string; count: number; children: CategoryFacet[] };

export async function browse(scope: BrowseScope, query: BrowseQuery) {
  const { roots, byId, byPath } = await getCategoryTree();

  // ?category=<id> narrows within the scope (used by search & manufacturer pages)
  const narrowed = query.categoryId ? byId.get(query.categoryId) : undefined;
  const effectiveScope: BrowseScope = narrowed ? { ...scope, categoryPath: narrowed.path } : scope;

  const where = buildWhere(effectiveScope, query);
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: orderBy(query.sortBy),
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      select: productCardSelect,
    }),
  ]);

  // Category facet counts — products grouped by leaf category, rolled up the tree.
  const grouped = await prisma.product.groupBy({
    by: ["categoryId"],
    where: buildWhere(scope, query),
    _count: { _all: true },
  });
  const direct = new Map<number, number>();
  grouped.forEach((g) => g.categoryId && direct.set(g.categoryId, g._count._all));
  const rolled = new Map<number, number>();
  const roll = (n: CategoryNode): number => {
    const c = (direct.get(n.id) ?? 0) + n.children.reduce((s, ch) => s + roll(ch), 0);
    rolled.set(n.id, c);
    return c;
  };
  roots.forEach(roll);
  const facet = (n: CategoryNode, depth: number): CategoryFacet => ({
    id: n.id,
    path: n.path,
    name: n.name,
    count: rolled.get(n.id) ?? 0,
    children: depth > 0 ? n.children.filter((c) => rolled.get(c.id)).map((c) => facet(c, depth - 1)) : [],
  });
  const current = scope.categoryPath ? byPath.get(scope.categoryPath) : undefined;
  const categoryFacets = current
    ? [facet(current, 1)]
    : roots.filter((r) => rolled.get(r.id)).map((r) => facet(r, 1));

  // Manufacturer facet (ignores its own selection so other options stay visible)
  const manGroups = await prisma.product.groupBy({
    by: ["manufacturerId"],
    where: buildWhere(effectiveScope, query, { skipManufacturer: true }),
    _count: { _all: true },
  });
  const manIds = manGroups.map((g) => g.manufacturerId).filter((x): x is number => !!x);
  const mans = await prisma.manufacturer.findMany({ where: { id: { in: manIds } } });
  const manufacturerFacets = manGroups
    .filter((g) => g.manufacturerId)
    .map((g) => ({ name: mans.find((m) => m.id === g.manufacturerId)!.name, count: g._count._all }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const [onSaleCount, inStockCount] = await Promise.all([
    prisma.product.count({
      where: { AND: [buildWhere(effectiveScope, query, { skipOnSale: true }), { oldPrice: { not: null } }] },
    }),
    prisma.product.count({
      where: { AND: [buildWhere(effectiveScope, query, { skipInStock: true }), { inStock: true }] },
    }),
  ]);

  return {
    total,
    products,
    pages: Math.max(1, Math.ceil(total / query.perPage)),
    categoryFacets,
    activeCategoryId: narrowed?.id ?? current?.id,
    manufacturerFacets,
    onSaleCount,
    inStockCount,
  };
}

export type BrowseResult = Awaited<ReturnType<typeof browse>>;

export const getMakes = cache(() =>
  prisma.make.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
);
