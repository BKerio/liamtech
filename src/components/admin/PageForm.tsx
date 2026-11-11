import type { Page } from "@prisma/client";
import { savePage, deletePage } from "@/app/admin/actions";
import ConfirmButton from "./ConfirmButton";
import { ActionButton } from "./ui";

export default function PageForm({ page }: { page?: Page }) {
  return (
    <>
      <form action={savePage}>
        {page && <input type="hidden" name="originalSlug" value={page.slug} />}
        <div className="card mb-3">
          <div className="card-body">
            <div className="form-row">
              <div className="form-group col-md-8">
                <label htmlFor="title">Title *</label>
                <input id="title" name="title" className="form-control" required defaultValue={page?.title} />
              </div>
              <div className="form-group col-md-4">
                <label htmlFor="slug">URL slug *</label>
                <div className="input-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text">/</span>
                  </div>
                  <input id="slug" name="slug" className="form-control" required defaultValue={page?.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
                  <div className="input-group-append">
                    <span className="input-group-text">/</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-group mb-0">
              <label htmlFor="body">Content (HTML)</label>
              <textarea id="body" name="body" rows={24} className="form-control code" defaultValue={page?.body} />
              <small className="form-text text-muted">
                Use simple HTML: &lt;p&gt;, &lt;b&gt;, &lt;i&gt;, &lt;a href=&quot;…&quot;&gt;, &lt;ul&gt;&lt;li&gt;, &lt;h2&gt;. Only trusted admins can edit this.
              </small>
            </div>
          </div>
        </div>
        <ConfirmButton className="btn btn-primary">{page ? "Save page" : "Create page"}</ConfirmButton>
        {page && (
          <a href={`/${page.slug}/`} target="_blank" rel="noreferrer" className="btn btn-link">
            View page
          </a>
        )}
      </form>
      {page && (
        <div className="text-right mt-3">
          <ActionButton action={deletePage} fields={{ slug: page.slug }} label="Delete page" confirm={`Delete /${page.slug}/? Links to it will 404.`} />
        </div>
      )}
    </>
  );
}
