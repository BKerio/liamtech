import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrowsePage from "@/components/catalogue/BrowsePage";
import { ancestorsOf, getCategoryTree } from "@/lib/catalogue";

type Props = { params: Promise<{ path: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function load(path: string[]) {
  const { byPath, byId } = await getCategoryTree();
  const node = byPath.get(path.join("/"));
  return node ? { node, chain: ancestorsOf(node, byId) } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await load((await params).path);
  return { title: c?.node.name ?? "Category" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const c = await load((await params).path);
  if (!c) notFound();
  return (
    <BrowsePage
      title={c.node.name}
      crumbs={c.chain.map((n) => ({ name: n.name, href: `/catalogue/category/${n.path}/` }))}
      basePath={`/catalogue/category/${c.node.path}/`}
      scope={{ categoryPath: c.node.path }}
      searchParams={await searchParams}
    />
  );
}
