import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Breadcrumb from "@/components/Breadcrumb";
import OrderSummary from "@/components/OrderSummary";

export const metadata: Metadata = { title: "Order confirmation" };

export default async function ThankYouPage(props: { searchParams: Promise<{ order?: string; email?: string }> }) {
  const searchParams = await props.searchParams;
  if (!searchParams.order || !searchParams.email) notFound();
  // number + email together act as the lookup key so order details aren't guessable by number alone
  const order = await prisma.order.findFirst({
    where: { number: searchParams.order, email: searchParams.email },
    include: { lines: true, store: true },
  });
  if (!order) notFound();

  return (
    <div className="container">
      <Breadcrumb items={[{ name: "Order confirmation" }]} />
      <div className="content-header">
        <h1>Order {order.number}: confirmation</h1>
      </div>
      <div className="content">
        <div id="content-inner">
          <div className="alert alert-success">
            Thank you, {order.firstName}! Your order has been placed. A confirmation will be sent to{" "}
            <strong>{order.email}</strong> and our team will call you on <strong>{order.phone}</strong>.
          </div>
          <OrderSummary order={order} />
          <Link href="/" className="btn btn-primary">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
