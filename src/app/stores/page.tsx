import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import Breadcrumb from "@/components/Breadcrumb";
import StoresList, { type StoreData } from "@/components/stores/StoresList";

export const metadata: Metadata = { title: "Our stores" };

export default async function StoresPage() {
  const stores = await prisma.store.findMany({ orderBy: [{ region: "asc" }, { position: "asc" }] });
  return (
    <div className="container">
      <Breadcrumb items={[{ name: "Our stores" }]} />
      <div id="messages"></div>
      <div className="content-header">
        <h1>Our stores</h1>
      </div>
      <div className="content">
        <div id="content-inner">
          <StoresList stores={stores.map((s) => ({ ...s, hours: s.hours as StoreData["hours"] }))} />
        </div>
      </div>
    </div>
  );
}
