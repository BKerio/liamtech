import Link from "next/link";

/** Same shape as the original paginator: 1 2 3 … 238 Next */
export default function Pagination({ page, pages, href }: { page: number; pages: number; href: (n: number) => string }) {
  if (pages <= 1) return null;
  const nums = new Set<number>([1, pages]);
  for (let i = page - 1; i <= page + 2; i++) if (i >= 1 && i <= pages) nums.add(i);
  if (page <= 2) [2, 3].forEach((i) => i <= pages && nums.add(i));
  const sorted = Array.from(nums).sort((a, b) => a - b);

  const items: React.ReactNode[] = [];
  if (page > 1)
    items.push(
      <li className="page-item page-paginator-item" key="prev">
        <Link className="page-link page-paginator-link" href={href(page - 1)}>
          Previous
        </Link>
      </li>,
    );
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1)
      items.push(
        <li className="page-item page-paginator-item disabled" key={`gap${n}`}>
          <a className="page-link page-paginator-link">&hellip;</a>
        </li>,
      );
    items.push(
      <li className={`page-item page-paginator-item${n === page ? " active" : ""}`} key={n}>
        <Link className="page-link page-paginator-link" href={href(n)}>
          {n} {n === page && <span className="sr-only">(current)</span>}
        </Link>
      </li>,
    );
  });
  if (page < pages)
    items.push(
      <li className="page-item page-paginator-item" key="next">
        <Link className="page-link page-paginator-link" href={href(page + 1)}>
          Next
        </Link>
      </li>,
    );
  return <ul className="pagination page-paginator">{items}</ul>;
}
