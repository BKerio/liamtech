import Link from "next/link";
import type { ReactNode } from "react";
import ConfirmButton from "./ConfirmButton";

export type SP = Record<string, string | string[] | undefined>;
export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Page header with optional action buttons + the ?msg= / ?err= flash from server actions. */
export function AdminHeader({
  title,
  sp,
  actions,
  back,
}: {
  title: string;
  sp?: SP;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  const msg = sp ? one(sp.msg) : undefined;
  const err = sp ? one(sp.err) : undefined;
  return (
    <>
      {back && (
        <Link href={back.href} className="amx-admin__back">
          ← {back.label}
        </Link>
      )}
      <div className="amx-admin__header">
        <h1>{title}</h1>
        {actions && <div>{actions}</div>}
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-danger">{err}</div>}
    </>
  );
}

/** Small POST form with a single confirm-before-submit button (deletes etc.). */
export function ActionButton({
  action,
  fields,
  label,
  confirm,
  className = "btn btn-sm btn-outline-danger",
}: {
  action: (f: FormData) => Promise<void>;
  fields: Record<string, string | number>;
  label: string;
  confirm?: string;
  className?: string;
}) {
  return (
    <form action={action} className="d-inline">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <ConfirmButton className={className} confirm={confirm}>
        {label}
      </ConfirmButton>
    </form>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "completed" ? "success" : status === "processing" ? "info" : status === "cancelled" ? "secondary" : "warning";
  return <span className={`badge badge-${tone} text-capitalize`}>{status}</span>;
}

export function Pager({ page, pages, href }: { page: number; pages: number; href: (n: number) => string }) {
  if (pages <= 1) return null;
  return (
    <div className="d-flex align-items-center justify-content-between mt-3">
      <span className="text-muted small">
        Page {page} of {pages}
      </span>
      <div>
        {page > 1 && (
          <Link className="btn btn-sm btn-outline-secondary mr-2" href={href(page - 1)}>
            ← Previous
          </Link>
        )}
        {page < pages && (
          <Link className="btn btn-sm btn-outline-secondary" href={href(page + 1)}>
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}

export function Thumb({ src, size = 48 }: { src?: string | null; size?: number }) {
  return src ? (
    <img src={src} alt="" width={size} height={size} style={{ objectFit: "contain", background: "#fff", border: "1px solid #eee" }} />
  ) : (
    <span className="d-inline-block bg-light border" style={{ width: size, height: size }} />
  );
}
