import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Breadcrumb from "@/components/Breadcrumb";
import OrderSummary from "@/components/OrderSummary";
import { getCurrentUser } from "@/lib/auth";

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Order ${(await params).number}` };
}

export default async function OrderPage(props: Props) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) redirect(`/accounts/login/?next=/accounts/orders/${params.number}/`);
  const order = await prisma.order.findFirst({
    where: { number: params.number, userId: user.id },
    include: { lines: true, store: true },
  });
  if (!order) notFound();
  return (
    <div className="container">
      <Breadcrumb items={[{ name: "Account", href: "/accounts/" }, { name: `Order ${order.number}` }]} />
      <div className="content-header">
        <h1>Order {order.number}</h1>
      </div>
      <div className="content">
        <div id="content-inner">
          <OrderSummary order={order} />
        </div>
      </div>
    </div>
  );
}
