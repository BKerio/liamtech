import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { getCategoryTree, type CategoryNode } from "@/lib/catalogue";
import { saveCategory, deleteCategory } from "@/app/admin/actions";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { ActionButton, AdminHeader, type SP } from "@/components/admin/ui";

export const metadata = { title: "Categories" };

function flatten(nodes: CategoryNode[], depth = 0): { node: CategoryNode; depth: number }[] {
  return nodes.flatMap((n) => [{ node: n, depth }, ...flatten(n.children, depth + 1)]);
}

export default async function AdminCategories({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const [{ roots }, counts] = await Promise.all([
    getCategoryTree(),
    prisma.product.groupBy({ by: ["categoryId"], _count: { _all: true } }),
  ]);
  const productCount = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  const rows = flatten(roots);
  const parentOptions = rows.filter((r) => r.depth < 2);

  return (
    <>
      <AdminHeader title="Categories" sp={await searchParams} />
      <div className="card mb-4">
        <div className="card-header bg-white">
          <strong>Add a category</strong>
        </div>
        <div className="card-body">
          <form action={saveCategory} className="form-row align-items-end">
            <div className="col-md-4 mb-2">
              <label className="small">Name</label>
              <input name="name" className="form-control form-control-sm" required />
            </div>
            <div className="col-md-3 mb-2">
              <label className="small">Slug (optional)</label>
              <input name="slug" className="form-control form-control-sm" placeholder="from name" />
            </div>
            <div className="col-md-3 mb-2">
              <label className="small">Parent</label>
              <select name="parentId" className="form-control form-control-sm">
                <option value="">— top level (menu) —</option>
                {parentOptions.map(({ node, depth }) => (
                  <option key={node.id} value={node.id}>
                    {"— ".repeat(depth)}
                    {node.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-1 mb-2">
              <label className="small">Order</label>
              <input name="position" type="number" className="form-control form-control-sm" defaultValue={0} />
            </div>
            <div className="col-md-1 mb-2">
              <ConfirmButton className="btn btn-sm btn-primary btn-block">Add</ConfirmButton>
            </div>
          </form>
          <small className="text-muted">Top-level categories appear in the main menu; their children appear in its drop-down.</small>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Parent</th>
                <th>Order</th>
                <th>Products</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ node, depth }) => {
                const formId = `cat-${node.id}`;
                const slug = node.path.split("/").pop();
                return (
                  <tr key={node.id} className={depth === 0 ? "table-light font-weight-bold" : ""}>
                    <td style={{ paddingLeft: `${0.75 + depth * 1.5}rem` }}>
                      <form id={formId} action={saveCategory}>
                        <input type="hidden" name="id" value={node.id} />
                      </form>
                      <input form={formId} name="name" defaultValue={node.name} className="form-control form-control-sm" required />
                    </td>
                    <td>
                      <input form={formId} name="slug" defaultValue={slug} className="form-control form-control-sm" />
                    </td>
                    <td>
                      <select form={formId} name="parentId" defaultValue={node.parentId ?? ""} className="form-control form-control-sm">
                        <option value="">— top level —</option>
                        {parentOptions
                          .filter((o) => o.node.id !== node.id)
                          .map((o) => (
                            <option key={o.node.id} value={o.node.id}>
                              {"— ".repeat(o.depth)}
                              {o.node.name}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td style={{ width: 80 }}>
                      <input form={formId} name="position" type="number" defaultValue={node.position} className="form-control form-control-sm" />
                    </td>
                    <td>
                      <Link href={`/admin/products/?category=${node.id}`}>{productCount.get(node.id) ?? 0}</Link>
                    </td>
                    <td className="text-nowrap text-right">
                      <button form={formId} className="btn btn-sm btn-outline-primary mr-1">
                        Save
                      </button>
                      <ActionButton action={deleteCategory} fields={{ id: node.id }} label="Delete" confirm={`Delete "${node.name}"?`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
