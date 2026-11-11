import type { Metadata } from "next";
import BrowsePage from "@/components/catalogue/BrowsePage";

export const metadata: Metadata = { title: "All products" };

export default async function CataloguePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <BrowsePage
      title="All products"
      crumbs={[{ name: "All products" }]}
      basePath="/catalogue/"
      scope={{}}
      searchParams={await searchParams}
    />
  );
}
