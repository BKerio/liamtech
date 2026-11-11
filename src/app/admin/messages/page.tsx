import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { deleteMessage } from "@/app/admin/actions";
import { ActionButton, AdminHeader, Pager, one, type SP } from "@/components/admin/ui";

export const metadata = { title: "Messages" };
const PER_PAGE = 25;

export default async function AdminMessages({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(one(sp.page) ?? "1", 10) || 1);
  const [total, messages] = await Promise.all([
    prisma.contactMessage.count(),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
  ]);
  const reply = (email: string) => `mailto:${email}?subject=${encodeURIComponent("Re: your enquiry")}`;
  return (
    <>
      <AdminHeader title={`Contact messages (${total})`} sp={sp} />
      {messages.length === 0 && <p className="text-muted">No messages yet. They arrive from the form on /contact/.</p>}
      {messages.map((m) => (
        <div className="card mb-3" key={m.id}>
          <div className="card-body">
            <div className="d-flex justify-content-between flex-wrap mb-2">
              <div>
                <strong>{m.name}</strong> · <a href={reply(m.email)}>{m.email}</a>
              </div>
              <span className="small text-muted">{m.createdAt.toLocaleString("en-GB")}</span>
            </div>
            <p className="mb-2" style={{ whiteSpace: "pre-wrap" }}>
              {m.body}
            </p>
            <div className="text-right">
              <a className="btn btn-sm btn-outline-primary mr-2" href={reply(m.email)}>
                Reply by email
              </a>
              <ActionButton action={deleteMessage} fields={{ id: m.id }} label="Delete" confirm="Delete this message?" />
            </div>
          </div>
        </div>
      ))}
      <Pager page={page} pages={Math.ceil(total / PER_PAGE)} href={(p) => `/admin/messages/?page=${p}`} />
    </>
  );
}
