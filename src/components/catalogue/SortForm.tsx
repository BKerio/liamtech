"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function SortForm({ sortBy, perPage }: { sortBy: string; perPage: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = (key: string, value: string) => {
    const p = new URLSearchParams(params.toString());
    p.set(key, value);
    p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <form method="get" className="form-horizontal" onSubmit={(e) => e.preventDefault()}>
      <div className="form-group">
        <label htmlFor="id_sort_by" className="col-form-label">
          Sort by
        </label>
        <div className="">
          <select name="sort_by" className="form-control" id="id_sort_by" value={sortBy} onChange={(e) => set("sort_by", e.target.value)}>
            <option value="relevancy">Relevancy</option>
            <option value="popularity">Most popular</option>
            <option value="price-desc">Price high to low</option>
            <option value="price-asc">Price low to high</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="id_items_per_page" className="col-form-label">
          Items per page
        </label>
        <div className="">
          <select
            name="items_per_page"
            className="form-control"
            id="id_items_per_page"
            value={String(perPage)}
            onChange={(e) => set("items_per_page", e.target.value)}
          >
            <option value="20">20</option>
            <option value="40">40</option>
            <option value="80">80</option>
          </select>
        </div>
      </div>
    </form>
  );
}
