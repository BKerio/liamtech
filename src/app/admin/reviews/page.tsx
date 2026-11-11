import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { deleteReview, setReviewApproved } from "@/app/admin/actions";
import { ActionButton, AdminHeader, Pager, one, type SP } from "@/components/admin/ui";

export const metadata = { title: "Reviews" };
const PER_PAGE = 25;

export default async function AdminReviews({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(one(sp.page) ?? "1", 10) || 1);
  const [total, reviews] = await Promise.all([
    prisma.review.count(),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { product: { select: { name: true, slug: true } } },
    }),
  ]);
  return (
    <>
      <AdminHeader title={`Reviews (${total})`} sp={sp} />
      <p className="text-muted small">New reviews are published immediately. Hide or delete any that are not appropriate.</p>
      {reviews.length === 0 && <p className="text-muted">No reviews yet.</p>}
      {reviews.map((r) => (
        <div className={`card mb-3${r.approved ? "" : " border-warning"}`} key={r.id}>
          <div className="card-body">
            <div className="d-flex justify-content-between flex-wrap">
              <div>
                <span className="text-warning">{"★".repeat(r.score)}</span>
                <span className="text-muted">{"★".repeat(5 - r.score)}</span> <strong>{r.title}</strong>
                {!r.approved && <span className="badge badge-warning ml-2">Hidden</span>}
              </div>
              <span className="small text-muted">{r.createdAt.toLocaleString("en-GB")}</span>
            </div>
            <div className="small text-muted mb-2">
              {r.name} ({r.email}) on{" "}
              <Link href={`/catalogue/${r.product.slug}/`} target="_blank">
                {r.product.name}
              </Link>
            </div>
            <p style={{ whiteSpace: "pre-wrap" }}>{r.body}</p>
            <div className="text-right">
              <ActionButton
                action={setReviewApproved}
                fields={{ id: r.id, approved: r.approved ? "false" : "true" }}
                label={r.approved ? "Hide" : "Publish"}
                className="btn btn-sm btn-outline-secondary mr-2"
              />
              <ActionButton action={deleteReview} fields={{ id: r.id }} label="Delete" confirm="Delete this review?" />
            </div>
          </div>
        </div>
      ))}
      <Pager page={page} pages={Math.ceil(total / PER_PAGE)} href={(p) => `/admin/reviews/?page=${p}`} />
    </>
  );
}
