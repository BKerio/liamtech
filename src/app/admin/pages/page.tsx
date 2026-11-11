import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AdminHeader, type SP } from "@/components/admin/ui";

export const metadata = { title: "Pages" };

export default async function AdminPages({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });
  return (
    <>
      <AdminHeader
        title="Pages"
        sp={await searchParams}
        actions={
          <Link href="/admin/pages/new/" className="btn btn-primary">
            + New page
          </Link>
        }
      />
      <div className="card">
        <table className="table mb-0">
          <thead>
            <tr>
              <th>Title</th>
              <th>URL</th>
              <th>Last updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.slug}>
                <td>
                  <Link href={`/admin/pages/${p.slug}/`}>{p.title}</Link>
                </td>
                <td>
                  <a href={`/${p.slug}/`} target="_blank" rel="noreferrer">
                    /{p.slug}/
                  </a>
                </td>
                <td className="small text-muted">{p.updatedAt.toLocaleString("en-GB")}</td>
                <td className="text-right">
                  <Link href={`/admin/pages/${p.slug}/`} className="btn btn-sm btn-outline-primary">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small text-muted mt-3">The footer links to /about/, /terms-and-conditions/, /privacy-policy/ and /delivery-pickup/.</p>
    </>
  );
}
