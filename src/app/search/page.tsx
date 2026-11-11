import type { Metadata } from "next";
import BrowsePage from "@/components/catalogue/BrowsePage";

type SP = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<SP> };

const term = (sp: SP) => (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").trim();

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = term(await searchParams);
  return { title: q ? `Products matching "${q}"` : "Search" };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = term(sp);
  return (
    <BrowsePage
      title={q ? `Products matching "${q}"` : "All products"}
      crumbs={[{ name: "Search", href: "/search/" }, ...(q ? [{ name: q }] : [])]}
      basePath="/search/"
      scope={{ q }}
      searchParams={sp}
      showVehicleSearch={false}
      defaultSort="relevancy"
      categoryLinksAsQuery
    />
  );
}
