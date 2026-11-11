import type { Metadata } from "next";
import BrowsePage from "@/components/catalogue/BrowsePage";

export const metadata: Metadata = { title: "On sale" };

export default async function OnSalePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <BrowsePage
      title="On sale"
      crumbs={[{ name: "On sale" }]}
      basePath="/catalogue/on-sale/"
      scope={{ onSaleOnly: true }}
      searchParams={await searchParams}
    />
  );
}
