import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { logout } from "@/app/actions/account";
import { SITE } from "@/lib/site";
import AdminNav from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: { default: "Admin", template: `%s · Admin | ${SITE.shortName}` },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="amx-admin">
      <aside className="amx-admin__side">
        <Link href="/admin/" className="amx-admin__brand">
          <img src="/static/img/favicon.svg" alt="" width={32} height={32} />
          <span>
            {SITE.shortName}
            <small>Admin</small>
          </span>
        </Link>
        <AdminNav />
        <div className="amx-admin__user">
          <div className="text-truncate" title={user.email}>
            {user.email}
          </div>
          <div className="d-flex mt-2">
            <Link href="/" className="btn btn-sm btn-outline-light mr-2" target="_blank">
              View site
            </Link>
            <form action={logout}>
              <button className="btn btn-sm btn-outline-light">Log out</button>
            </form>
          </div>
        </div>
      </aside>
      <div className="amx-admin__main">{children}</div>
    </div>
  );
}
